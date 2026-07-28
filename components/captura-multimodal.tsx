"use client";

import { useEffect, useRef, useState } from "react";

type Registro = Record<string, unknown>;
type Configuracao = {
  fase: string;
  modo: "NENHUM" | "AUDIO" | "VIDEO" | "AUDIO_E_VIDEO";
  qualidade: string;
  orientacao: string;
  estado: string;
};
type Contexto = {
  versao: string;
  sessao: string | null;
  estado: string;
  configuracoes: Configuracao[];
  captura_revogada: boolean;
  evento_operacional?: {
    momento: string;
    tipo: string;
    ocorrido_em: string;
    sequencia: number;
  } | null;
  sem_acesso_ao_portal_profissional: boolean;
};
type ItemLocal = {
  id: string;
  blob: Blob;
  fase: string;
  modalidade: "AUDIO" | "VIDEO";
  sequencia: number;
  inicio: string;
  duracao: number;
  relogio: number;
};

const BANCO = "humanexus-captura-multimodal";
const ARMAZENAMENTO = "segmentos";

function abrirBanco() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const pedido = indexedDB.open(BANCO, 1);
    pedido.onupgradeneeded = () => {
      if (!pedido.result.objectStoreNames.contains(ARMAZENAMENTO)) {
        pedido.result.createObjectStore(ARMAZENAMENTO, { keyPath: "id" });
      }
    };
    pedido.onsuccess = () => resolve(pedido.result);
    pedido.onerror = () => reject(pedido.error);
  });
}

async function salvarLocal(item: ItemLocal) {
  const banco = await abrirBanco();
  await new Promise<void>((resolve, reject) => {
    const transacao = banco.transaction(ARMAZENAMENTO, "readwrite");
    transacao.objectStore(ARMAZENAMENTO).put(item);
    transacao.oncomplete = () => resolve();
    transacao.onerror = () => reject(transacao.error);
  });
  banco.close();
}

async function listarLocais() {
  const banco = await abrirBanco();
  const itens = await new Promise<ItemLocal[]>((resolve, reject) => {
    const pedido = banco
      .transaction(ARMAZENAMENTO, "readonly")
      .objectStore(ARMAZENAMENTO)
      .getAll();
    pedido.onsuccess = () => resolve(pedido.result as ItemLocal[]);
    pedido.onerror = () => reject(pedido.error);
  });
  banco.close();
  return itens;
}

async function removerLocal(id: string) {
  const banco = await abrirBanco();
  await new Promise<void>((resolve, reject) => {
    const transacao = banco.transaction(ARMAZENAMENTO, "readwrite");
    transacao.objectStore(ARMAZENAMENTO).delete(id);
    transacao.oncomplete = () => resolve();
    transacao.onerror = () => reject(transacao.error);
  });
  banco.close();
}

async function sha256(blob: Blob) {
  const resumo = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
  return Array.from(new Uint8Array(resumo))
    .map((item) => item.toString(16).padStart(2, "0"))
    .join("");
}

async function base64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => resolve(String(leitor.result).split(",", 2)[1] ?? "");
    leitor.onerror = () => reject(leitor.error);
    leitor.readAsDataURL(blob);
  });
}

function descricaoErro(erro: unknown) {
  if (erro instanceof DOMException && erro.name === "NotAllowedError") {
    return "Permissão de câmera ou microfone recusada no navegador.";
  }
  if (erro instanceof DOMException && erro.name === "NotFoundError") {
    return "Câmera ou microfone compatível não localizado.";
  }
  return erro instanceof Error ? erro.message : "Falha técnica de captura.";
}

export function CapturaMultimodal({ token }: { token: string }) {
  const [contexto, setContexto] = useState<Contexto | null>(null);
  const [fase, setFase] = useState("");
  const [modoEfetivo, setModoEfetivo] =
    useState<Configuracao["modo"]>("NENHUM");
  const [estado, setEstado] = useState("NÃO_CONFIGURADO");
  const [mensagem, setMensagem] = useState("Validando acesso limitado…");
  const [dispositivos, setDispositivos] = useState<MediaDeviceInfo[]>([]);
  const [camera, setCamera] = useState("");
  const [microfone, setMicrofone] = useState("");
  const [nivel, setNivel] = useState(0);
  const [pendentes, setPendentes] = useState(0);
  const [duracao, setDuracao] = useState(0);
  const video = useRef<HTMLVideoElement>(null);
  const fluxo = useRef<MediaStream | null>(null);
  const gravadores = useRef<MediaRecorder[]>([]);
  const partes = useRef<Map<MediaRecorder, BlobPart[]>>(new Map());
  const inicio = useRef(0);
  const sequencia = useRef(0);
  const medidor = useRef<number | null>(null);
  const contextoAtual = useRef<Contexto | null>(null);
  const faseAtual = useRef("");
  const estadoAtual = useRef("NÃO_CONFIGURADO");
  const finalizacaoAutomatica = useRef(false);

  async function api(corpo: Registro) {
    const resposta = await fetch("/api/captura-sessao", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-humanexus-capture-token": token
      },
      body: JSON.stringify(corpo),
      cache: "no-store"
    });
    const dados = await resposta.json();
    if (!resposta.ok) {
      throw new Error(dados?.erro?.mensagem ?? "Operação de captura recusada.");
    }
    return dados as Registro;
  }

  async function evento(novoEstado: string, tipo: string, extra: Registro = {}) {
    const contextoVigente = contextoAtual.current;
    const faseVigente = faseAtual.current;
    await api({
      acao: "EVENTO",
      estado: novoEstado,
      tipo,
      fase: faseVigente,
      modalidade: contextoVigente?.configuracoes.find(
        (item) => item.fase === faseVigente
      )?.modo,
      timestamp_de_origem: new Date().toISOString(),
      relogio_monotonico_ms: performance.now(),
      sistema_operacional: navigator.platform,
      navegador: navigator.userAgent.slice(0, 160),
      orientacao: screen.orientation?.type ?? "NAO_INFORMADA",
      camera,
      microfone,
      capacidades: {
        media_recorder: typeof MediaRecorder !== "undefined",
        indexed_db: typeof indexedDB !== "undefined",
        orientacao: Boolean(screen.orientation)
      },
      ...extra
    });
    estadoAtual.current = novoEstado;
    setEstado(novoEstado);
  }

  useEffect(() => {
    let ativo = true;
    api({ acao: "CONSULTAR" })
      .then(async (dados) => {
        if (!ativo) return;
        const recebido = dados as unknown as Contexto;
        contextoAtual.current = recebido;
        setContexto(recebido);
        const primeira = recebido.configuracoes.find((item) => item.modo !== "NENHUM");
        faseAtual.current = primeira?.fase ?? "";
        setModoEfetivo(primeira?.modo ?? "NENHUM");
        estadoAtual.current = recebido.estado;
        setFase(primeira?.fase ?? "");
        setEstado(recebido.estado);
        setMensagem(
          primeira
            ? "Acesso validado. Autorize os dispositivos para iniciar."
            : "Nenhuma fase está configurada para gravação."
        );
        const fila = await listarLocais();
        if (ativo) setPendentes(fila.length);
      })
      .catch((erro) => setMensagem(descricaoErro(erro)));
    const sincronizar = () => void sincronizarPendentes();
    window.addEventListener("online", sincronizar);
    return () => {
      ativo = false;
      window.removeEventListener("online", sincronizar);
      fluxo.current?.getTracks().forEach((trilha) => trilha.stop());
      if (medidor.current) cancelAnimationFrame(medidor.current);
    };
    // O token é de entrega limitada e permanece apenas na memória do componente.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    let ativo = true;
    const monitorar = async () => {
      try {
        const recebido = await api({ acao: "CONSULTAR" }) as unknown as Contexto;
        if (!ativo) return;
        if (recebido.captura_revogada) {
          gravadores.current.forEach((gravador) => {
            if (gravador.state !== "inactive") gravador.stop();
          });
          fluxo.current?.getTracks().forEach((trilha) => trilha.stop());
          estadoAtual.current = "DESCARTADO";
          setEstado("DESCARTADO");
          setMensagem(
            "Captura revogada pelo profissional. Segmentos locais já fechados foram preservados e não serão enviados."
          );
          return;
        }
        contextoAtual.current = recebido;
        setContexto(recebido);
        const eventoOperacional = recebido.evento_operacional;
        const faseVigente = faseAtual.current;
        const emGravacao = ["GRAVANDO", "PAUSADO"].includes(estadoAtual.current);
        const encerrouFase =
          eventoOperacional?.momento === faseVigente &&
          ["ENCERRAMENTO", "INTERRUPCAO", "INVALIDACAO"].includes(
            eventoOperacional.tipo
          );
        if (emGravacao && encerrouFase && !finalizacaoAutomatica.current) {
          finalizacaoAutomatica.current = true;
          setMensagem(
            `A fase ${faseVigente} foi encerrada no Cockpit. Finalizando e preservando os segmentos automaticamente…`
          );
          await finalizar();
          finalizacaoAutomatica.current = false;
        }
      } catch (erro) {
        if (ativo && ["GRAVANDO", "PAUSADO"].includes(estadoAtual.current)) {
          setMensagem(
            `Monitoramento operacional temporariamente indisponível. A gravação local permanece preservada. ${descricaoErro(erro)}`
          );
        }
      }
    };
    const temporizador = window.setInterval(() => void monitorar(), 2_500);
    return () => {
      ativo = false;
      window.clearInterval(temporizador);
    };
    // O monitor usa referências para reagir ao estado atual sem reiniciar a captura.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (!inicio.current || !["GRAVANDO", "PAUSADO"].includes(estado)) return;
    const temporizador = window.setInterval(
      () => setDuracao(Math.max(0, Date.now() - inicio.current)),
      250
    );
    return () => window.clearInterval(temporizador);
  }, [estado]);

  async function preparar(modoSolicitado?: Configuracao["modo"]) {
    if (!contexto || !fase) return;
    const configuracao = contexto.configuracoes.find((item) => item.fase === fase);
    if (!configuracao || configuracao.modo === "NENHUM") return;
    const modalidade = modoSolicitado ?? modoEfetivo ?? configuracao.modo;
    if (modalidade === "NENHUM") return;
    const trilhasAdquiridas: MediaStreamTrack[] = [];
    try {
      await evento("AGUARDANDO_PERMISSÃO", "SOLICITACAO_DE_PERMISSAO", {
        modalidade
      });
      const audio = modalidade.includes("AUDIO");
      const imagem = modalidade.includes("VIDEO");
      if (audio) {
        try {
          const fluxoDeAudio = await navigator.mediaDevices.getUserMedia({
            audio: { deviceId: microfone ? { exact: microfone } : undefined },
            video: false
          });
          trilhasAdquiridas.push(...fluxoDeAudio.getAudioTracks());
        } catch (erro) {
          throw new Error(`MICROFONE — ${descricaoErro(erro)}`);
        }
      }
      if (imagem) {
        try {
          const fluxoDeVideo = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
              deviceId: camera ? { exact: camera } : undefined,
              facingMode: camera ? undefined : "user",
              width: { ideal: 1280 },
              height: { ideal: 720 }
            }
          });
          trilhasAdquiridas.push(...fluxoDeVideo.getVideoTracks());
        } catch (erro) {
          throw new Error(`CÂMERA — ${descricaoErro(erro)}`);
        }
      }
      const media = new MediaStream(trilhasAdquiridas);
      fluxo.current?.getTracks().forEach((trilha) => trilha.stop());
      fluxo.current = media;
      if (video.current) video.current.srcObject = media;
      const encontrados = await navigator.mediaDevices.enumerateDevices();
      setDispositivos(encontrados);
      iniciarMedidor(media);
      setModoEfetivo(modalidade);
      await evento("DISPOSITIVO_AUTORIZADO", "DISPOSITIVO_AUTORIZADO", {
        modalidade,
        permissao_camera: imagem,
        permissao_microfone: audio
      });
      await evento("PRONTO", "PERMISSOES_CONFIRMADAS", {
        modalidade,
        permissao_camera: imagem,
        permissao_microfone: audio
      });
      setMensagem("Dispositivos prontos. A mídia ainda não está sendo gravada.");
    } catch (erro) {
      trilhasAdquiridas.forEach((trilha) => trilha.stop());
      setMensagem(descricaoErro(erro));
      try {
        await evento(
          "FALHA_TÉCNICA_RECUPERÁVEL",
          "PERMISSAO_OU_DISPOSITIVO_INDISPONIVEL",
          {
          modalidade,
          motivo: descricaoErro(erro)
          }
        );
      } catch {
        // A falha original permanece visível sem mascaramento.
      }
    }
  }

  async function continuarSemAudio() {
    setMensagem("Áudio desativado. Tentando continuar somente com vídeo.");
    setModoEfetivo("VIDEO");
    await preparar("VIDEO");
  }

  async function continuarSemVideo() {
    setMensagem("Vídeo desativado. Tentando continuar somente com áudio.");
    setModoEfetivo("AUDIO");
    await preparar("AUDIO");
  }

  async function continuarSemMidia() {
    fluxo.current?.getTracks().forEach((trilha) => trilha.stop());
    setModoEfetivo("NENHUM");
    await evento("DESCARTADO", "CONTINUAR_SEM_MIDIA", {
      modalidade: "NENHUM",
      motivo:
        "Fonte de mídia opcional desativada; sessão profissional permanece operacional."
    });
    setMensagem(
      "Mídia opcional desativada. A sessão pode continuar com sensores, eventos e cobertura disponível."
    );
  }

  async function trocarDispositivo() {
    try {
      const encontrados = await navigator.mediaDevices.enumerateDevices();
      setDispositivos(encontrados);
      setMensagem(
        "Lista de dispositivos atualizada. Selecione outra câmera ou outro microfone e tente novamente."
      );
    } catch (erro) {
      setMensagem(descricaoErro(erro));
    }
  }

  function iniciarMedidor(media: MediaStream) {
    const trilha = media.getAudioTracks()[0];
    if (!trilha) {
      setNivel(0);
      return;
    }
    const audio = new AudioContext();
    const analisador = audio.createAnalyser();
    analisador.fftSize = 256;
    audio.createMediaStreamSource(new MediaStream([trilha])).connect(analisador);
    const dados = new Uint8Array(analisador.frequencyBinCount);
    const medir = () => {
      analisador.getByteFrequencyData(dados);
      setNivel(Math.round(dados.reduce((a, b) => a + b, 0) / dados.length));
      medidor.current = requestAnimationFrame(medir);
    };
    medir();
  }

  async function iniciar() {
    const media = fluxo.current;
    const configuracao = contexto?.configuracoes.find((item) => item.fase === fase);
    if (!media || !configuracao) return;
    partes.current.clear();
    gravadores.current = [];
    const criar = (trilhas: MediaStreamTrack[], mimePreferido: string) => {
      if (!trilhas.length) return;
      const mime = MediaRecorder.isTypeSupported(mimePreferido)
        ? mimePreferido
        : "";
      const gravador = new MediaRecorder(
        new MediaStream(trilhas),
        mime ? { mimeType: mime } : undefined
      );
      partes.current.set(gravador, []);
      gravador.ondataavailable = (eventoDeDados) => {
        if (eventoDeDados.data.size) partes.current.get(gravador)?.push(eventoDeDados.data);
      };
      gravador.onstop = () => void preservarGravador(gravador);
      gravador.start(5_000);
      gravadores.current.push(gravador);
    };
    criar(media.getAudioTracks(), "audio/webm;codecs=opus");
    criar(media.getVideoTracks(), "video/webm;codecs=vp8");
    inicio.current = Date.now();
    setDuracao(0);
    await evento("GRAVANDO", "INICIO_DA_GRAVACAO");
    setMensagem("Gravação real em andamento. Segmentos permanecem protegidos.");
  }

  async function preservarGravador(gravador: MediaRecorder) {
    const partesDoGravador = partes.current.get(gravador) ?? [];
    if (!partesDoGravador.length) return;
    const tipo = gravador.mimeType.startsWith("audio") ? "AUDIO" : "VIDEO";
    const blob = new Blob(partesDoGravador, {
      type: gravador.mimeType || (tipo === "AUDIO" ? "audio/webm" : "video/webm")
    });
    const item: ItemLocal = {
      id: crypto.randomUUID(),
      blob,
      fase: faseAtual.current,
      modalidade: tipo,
      sequencia: ++sequencia.current,
      inicio: new Date(inicio.current).toISOString(),
      duracao: Math.max(1, Date.now() - inicio.current),
      relogio: performance.now()
    };
    await salvarLocal(item);
    setPendentes((valor) => valor + 1);
  }

  async function pausar() {
    gravadores.current.forEach((item) => item.state === "recording" && item.pause());
    await evento("PAUSADO", "PAUSA_DA_GRAVACAO");
  }

  async function retomar() {
    gravadores.current.forEach((item) => item.state === "paused" && item.resume());
    await evento("GRAVANDO", "RETOMADA_DA_GRAVACAO");
  }

  async function finalizar() {
    await evento("FINALIZANDO", "FINALIZACAO_DA_GRAVACAO");
    const encerramentos = gravadores.current.map(
      (gravador) => new Promise<void>((resolve) => {
        gravador.addEventListener("stop", () => resolve(), { once: true });
        gravador.stop();
      })
    );
    await Promise.all(encerramentos);
    await evento("ARMAZENADO_LOCALMENTE", "SEGMENTOS_PRESERVADOS_NO_DISPOSITIVO");
    await evento("SINCRONIZAÇÃO_PENDENTE", "FILA_DE_SINCRONIZACAO");
    await sincronizarPendentes();
  }

  async function sincronizarPendentes() {
    if (!navigator.onLine) {
      setMensagem("Sem rede. Segmentos preservados no IndexedDB e sincronização pendente.");
      return;
    }
    const itens = await listarLocais();
    if (!itens.length) return;
    try {
      await evento("ENVIANDO", "SINCRONIZACAO_INICIADA");
    } catch {
      // O envio idempotente continua quando o backend já registra ENVIANDO.
    }
    for (const item of itens) {
      const resumo = await sha256(item.blob);
      const resposta = await api({
        acao: "SEGMENTO",
        fase: item.fase,
        mime_type: item.blob.type.split(";", 1)[0],
        tamanho_em_bytes: item.blob.size,
        duracao_ms: item.duracao,
        sequencia: item.sequencia,
        timestamp_de_origem: item.inicio,
        timestamp_de_captura: new Date().toISOString(),
        relogio_monotonico_ms: item.relogio,
        timestamp_normalizado: item.inicio,
        drift_ms: performance.timeOrigin + item.relogio - new Date(item.inicio).getTime(),
        latencia_ms: Date.now() - new Date(item.inicio).getTime(),
        perdas: [],
        interrupcoes: [],
        sha256: resumo,
        conteudo_base64: await base64(item.blob),
        orientacao: screen.orientation?.type ?? "NAO_INFORMADA",
        camera,
        microfone,
        codec: item.blob.type
      });
      if (resposta.estado === "PERSISTIDO") {
        await removerLocal(item.id);
      }
    }
    const restantes = await listarLocais();
    setPendentes(restantes.length);
    if (!restantes.length) {
      await evento("PERSISTIDO", "SINCRONIZACAO_CONFIRMADA");
      setMensagem("Mídia persistida com integridade confirmada.");
    }
  }

  const cameras = dispositivos.filter((item) => item.kind === "videoinput");
  const microfones = dispositivos.filter((item) => item.kind === "audioinput");
  const configuracao = contexto?.configuracoes.find((item) => item.fase === fase);
  const falhaRecuperavel = [
    "FALHA",
    "FALHA_TÉCNICA_RECUPERÁVEL"
  ].includes(estado);

  return (
    <main className="hx-capture">
      <header>
        <small>HUMANEXUS · CAPTURA MULTIMODAL LIMITADA</small>
        <h1>Gravação sincronizada da sessão</h1>
        <p>Este dispositivo não possui acesso ao portal profissional.</p>
      </header>
      <section className="hx-capture__status">
        <div><small>SESSÃO</small><strong>{contexto?.sessao ?? "—"}</strong></div>
        <div><small>FASE</small><strong>{fase || "—"}</strong></div>
        <div><small>ESTADO</small><strong>{estado}</strong></div>
        <div><small>DURAÇÃO</small><strong>{(duracao / 1000).toFixed(1)} s</strong></div>
        <div><small>FILA LOCAL</small><strong>{pendentes}</strong></div>
        <div><small>REDE</small><strong>{typeof navigator === "undefined" ? "—" : navigator.onLine ? "ONLINE" : "OFFLINE"}</strong></div>
      </section>
      <section className="hx-capture__preview">
        <video ref={video} autoPlay muted playsInline />
        <div className="hx-capture__meter" aria-label={`Nível do microfone ${nivel}`}>
          <i style={{ width: `${Math.min(100, nivel)}%` }} />
        </div>
      </section>
      <section className="hx-capture__controls">
        <label>Fase<select value={fase} onChange={(eventoDeSelecao) => {
          faseAtual.current = eventoDeSelecao.target.value;
          setFase(eventoDeSelecao.target.value);
          setModoEfetivo(
            contexto?.configuracoes.find(
              (item) => item.fase === eventoDeSelecao.target.value
            )?.modo ?? "NENHUM"
          );
        }} disabled={estado === "GRAVANDO"}>
          {contexto?.configuracoes.filter((item) => item.modo !== "NENHUM").map((item) => <option key={item.fase}>{item.fase}</option>)}
        </select></label>
        <label>Câmera<select value={camera} onChange={(eventoDeSelecao) => setCamera(eventoDeSelecao.target.value)}>
          <option value="">Automática</option>
          {cameras.map((item) => <option key={item.deviceId} value={item.deviceId}>{item.label || "Câmera autorizada"}</option>)}
        </select></label>
        <label>Microfone<select value={microfone} onChange={(eventoDeSelecao) => setMicrofone(eventoDeSelecao.target.value)}>
          <option value="">Automático</option>
          {microfones.map((item) => <option key={item.deviceId} value={item.deviceId}>{item.label || "Microfone autorizado"}</option>)}
        </select></label>
        <div>
          <button onClick={() => void preparar()} disabled={!configuracao || estado === "GRAVANDO"}>Autorizar dispositivos</button>
          <button onClick={() => void iniciar()} disabled={estado !== "PRONTO"}>Iniciar</button>
          <button onClick={() => void pausar()} disabled={estado !== "GRAVANDO"}>Pausar</button>
          <button onClick={() => void retomar()} disabled={estado !== "PAUSADO"}>Retomar</button>
          <button onClick={() => void finalizar()} disabled={!["GRAVANDO", "PAUSADO"].includes(estado)}>Finalizar</button>
          <button onClick={() => void sincronizarPendentes()} disabled={!pendentes}>Sincronizar fila</button>
        </div>
      </section>
      {falhaRecuperavel ? (
        <section className="hx-capture__recovery" aria-label="Ações de recuperação">
          <strong>FALHA TÉCNICA RECUPERÁVEL</strong>
          <button onClick={() => void preparar(modoEfetivo)}>
            TENTAR NOVAMENTE
          </button>
          {configuracao?.modo === "AUDIO_E_VIDEO" ? (
            <button onClick={() => void continuarSemAudio()}>
              CONTINUAR SEM ÁUDIO
            </button>
          ) : null}
          {configuracao?.modo === "AUDIO_E_VIDEO" ? (
            <button onClick={() => void continuarSemVideo()}>
              CONTINUAR SEM VÍDEO
            </button>
          ) : null}
          <button onClick={() => void continuarSemMidia()}>
            CONTINUAR SEM MÍDIA
          </button>
          <button onClick={() => void trocarDispositivo()}>
            TROCAR DISPOSITIVO
          </button>
        </section>
      ) : null}
      <p className="hx-capture__message" role="status">{mensagem}</p>
      <details>
        <summary>Limitações reais do dispositivo</summary>
        <p>Em iPhone e iPad, o navegador pode suspender a câmera ao bloquear a tela, alternar de aplicativo ou trocar a orientação. Cada segmento já fechado permanece preservado; nenhuma lacuna é preenchida silenciosamente.</p>
      </details>
    </main>
  );
}
