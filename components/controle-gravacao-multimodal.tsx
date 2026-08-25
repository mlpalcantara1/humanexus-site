"use client";

import QRCode from "qrcode";
import { useEffect, useRef, useState } from "react";

import { formatarPercentualCanonico } from "@/lib/percentual-canonico";
import { portuguesVisivel } from "@/lib/portugues-visivel";

type Registro = Record<string, unknown>;
type Fonte = {
  codigo: string;
  nome: string;
  selecionada: boolean;
  disponivel: boolean;
  estado: string;
  bloqueia_sessao: false;
  ultima_recepcao?: string | null;
  homologacao_fisica_pendente?: boolean;
};
type Prontidao = {
  estado: string;
  pode_iniciar_baseline: boolean;
  bloqueios_essenciais: string[];
  fontes: Fonte[];
  fontes_selecionadas: string[];
  fontes_disponiveis: string[];
  fontes_indisponiveis: string[];
  cobertura: number;
  nivel_de_cobertura: "COMPLETA" | "PARCIAL" | "MINIMA";
  modo_de_midia: Modo;
  modalidades_de_midia_permitidas: Modo[];
  politica_de_retencao: string;
  estimativa_de_armazenamento: {
    duracao_planejada_minutos: number;
    audio_mb_estimados: number;
    video_mb_estimados: number;
    total_mb_estimados: number;
    natureza: string;
  };
  produtos_limitados: string[];
  replay: {
    modalidade: string;
    replay_tecnico_disponivel: boolean;
    midia_obrigatoria: false;
  };
  cortex: {
    fluxos_disponiveis: string[];
    fluxo_eeg_bruto: string;
    classificacao: string;
    contorno_de_licenca: false;
  };
  dados_artificiais_criados: false;
  fontes_opcionais_nao_bloqueiam_sessao: true;
};
type Painel = {
  versao: string;
  sessao: {
    identificador: string;
    identificador_da_organizacao: string;
    identificador_do_participante: string;
    estado: string;
  };
  contexto: {
    organizacao: { identificador: string; nome?: string };
    participante: { identificador: string; referencia_externa?: string };
    profissional: { identificador: string; nome?: string };
    sessao: {
      identificador: string;
      estado: string;
      versao_cientifica: string;
      finalidade?: string;
    };
    anamnese: Registro;
    formulacao: Registro | null;
    ctr: Registro;
    thx: Registro;
    consentimentos: string[];
    longitudinal: Registro;
    vinculo_cruzado_detectado: false;
  };
  prontidao: Prontidao;
  sequencias: Record<string, {
    quantidade: number;
    ultima_sequencia: number;
    proxima_sequencia: number;
    ultimo_timestamp_normalizado?: string;
    renumeracao_executada: false;
  }>;
  preparacao: Registro | null;
  baseline: {
    registro: Registro | null;
    snapshot_canonico?: Registro | null;
    dispensa: Registro | null;
    iniciado_automaticamente: false;
    fluxo_cientifico: string[];
    referencia_separada_das_fases_cientificas: true;
    referencia: {
      estado: string;
      decisao: Registro | null;
      decisao_derivada_do_baseline_preexistente: boolean;
      pode_iniciar_pre: boolean;
      opcoes: TipoReferenciaBaseline[];
      baselines_anteriores: Registro[];
    };
  };
  estacao: Registro | null;
  configuracoes: Registro[];
  dispositivos: Registro[];
  segmentos: Registro[];
  eventos: Registro[];
  diagnostico: Registro;
};
type Modo = "NENHUM" | "AUDIO" | "VIDEO" | "AUDIO_E_VIDEO";
type TipoReferenciaBaseline =
  | ""
  | "REALIZAR_NOVO_BASELINE"
  | "UTILIZAR_BASELINE_ANTERIOR"
  | "DISPENSAR_BASELINE_NESTA_SESSAO"
  | "PROSSEGUIR_SEM_REFERENCIA_DE_BASELINE";

const FASES_DE_CAPTURA = ["BASELINE", "PRE", "TREINO", "POS"] as const;
const ROTULOS_DA_REFERENCIA_BASELINE: Record<
  Exclude<TipoReferenciaBaseline, "">,
  string
> = {
  REALIZAR_NOVO_BASELINE: "REALIZAR NOVA REFERÊNCIA INICIAL",
  UTILIZAR_BASELINE_ANTERIOR: "UTILIZAR REFERÊNCIA INICIAL ANTERIOR",
  DISPENSAR_BASELINE_NESTA_SESSAO: "DISPENSAR REFERÊNCIA INICIAL NESTA SESSÃO",
  PROSSEGUIR_SEM_REFERENCIA_DE_BASELINE:
    "PROSSEGUIR SEM REFERÊNCIA INICIAL"
};
const FONTES_PADRAO: string[] = [];
const ROTULOS_DOS_MODOS: Record<Modo, string> = {
  NENHUM: "SEM GRAVAÇÃO",
  AUDIO: "SOMENTE ÁUDIO",
  VIDEO: "SOMENTE VÍDEO",
  AUDIO_E_VIDEO: "ÁUDIO E VÍDEO"
};
const ROTULOS_DAS_FONTES: Record<string, string> = {
  ANAMNESE_REGULATORIA: "Anamnese Regulatória",
  ANAMNESE_REGULATORIA_ESTRUTURADA: "Anamnese Regulatória",
  POLAR_H10: "Polar H10",
  EPOC_X: "EPOC X",
  EMOTIV_EPOC_X: "EPOC X",
  OUTRO_EEG_HOMOLOGADO: "Outro EEG homologado",
  IPHONE_INTEGRADO: "iPhone integrado ao Mac",
  CAMERA_MAC: "Câmera do Mac",
  MICROFONE_MAC: "Microfone do Mac",
  CAMERA_IPHONE: "Câmera do iPhone",
  MICROFONE_IPHONE: "Microfone do iPhone",
  SIMULADOR: "Simulador",
  ESTIMULO_PADRONIZADO: "Estímulo padronizado",
  AUDIO: "Áudio",
  VIDEO: "Vídeo",
  EVENTOS_PROFISSIONAIS: "Eventos profissionais",
  REGISTROS_PROFISSIONAIS: "Somente registros profissionais",
  SNAPSHOTS: "Registros congelados",
  TELEMETRIA_TAREFA: "Telemetria de tarefa",
  REPLAY: "Reprodução histórica"
};
const CHAVES_VISUAIS_DAS_FONTES: Record<string, string> = {
  ANAMNESE_REGULATORIA_ESTRUTURADA: "ANAMNESE_REGULATORIA",
  EMOTIV_EPOC_X: "EPOC_X"
};
const FONTES_CONTEXTUAIS_NAO_CONFIGURAVEIS = new Set([
  "ANAMNESE_REGULATORIA",
  "ANAMNESE_REGULATORIA_ESTRUTURADA"
]);
const ROTULOS_DA_RETENCAO: Record<string, string> = {
  NAO_ARMAZENAR: "Não armazenar mídia",
  DURANTE_A_SESSAO: "Somente durante a sessão",
  ATE_VALIDACAO_DO_RELATORIO: "Até validação do relatório",
  PRAZO_DEFINIDO: "Por prazo definido",
  PRESERVACAO_MANUAL: "Preservar manualmente",
  PESQUISA_AUTORIZADA: "Preservar para pesquisa autorizada"
};

function csrf() {
  return document.cookie
    .split("; ")
    .find((item) => item.startsWith("humanexus_csrf="))
    ?.split("=")[1] ?? "";
}

function fontesUnicasParaSelecao(
  prontidao: Prontidao | undefined,
  selecionadas: string[]
) {
  const porChaveVisual = new Map<
    string,
    { codigo: string; rotulo: string; fonte?: Fonte; pontuacao: number }
  >();

  for (const [codigo, rotulo] of Object.entries(ROTULOS_DAS_FONTES)) {
    if (FONTES_CONTEXTUAIS_NAO_CONFIGURAVEIS.has(codigo)) continue;
    const chaveVisual = CHAVES_VISUAIS_DAS_FONTES[codigo] ?? codigo;
    const fonte = prontidao?.fontes.find((item) => item.codigo === codigo);
    const pontuacao =
      (selecionadas.includes(codigo) ? 8 : 0)
      + (fonte ? 4 : 0)
      + (fonte?.disponivel ? 2 : 0)
      + (codigo === chaveVisual ? 1 : 0);
    const atual = porChaveVisual.get(chaveVisual);
    if (!atual || pontuacao > atual.pontuacao) {
      porChaveVisual.set(chaveVisual, { codigo, rotulo, fonte, pontuacao });
    }
  }

  return [...porChaveVisual.values()];
}

function proximoModoSemFonte(modo: Modo, fonte: string): Modo {
  if (fonte === "AUDIO") {
    if (modo === "AUDIO_E_VIDEO") return "VIDEO";
    if (modo === "AUDIO") return "NENHUM";
  }
  if (fonte === "VIDEO") {
    if (modo === "AUDIO_E_VIDEO") return "AUDIO";
    if (modo === "VIDEO") return "NENHUM";
  }
  return modo;
}

export function ControleGravacaoMultimodal({ sessao }: { sessao: string }) {
  const [painel, setPainel] = useState<Painel | null>(null);
  const [modo, setModo] = useState<Modo>("NENHUM");
  const [fontes, setFontes] = useState<string[]>(FONTES_PADRAO);
  const [retencao, setRetencao] = useState("NAO_ARMAZENAR");
  const [prazo, setPrazo] = useState(30);
  const [camera, setCamera] = useState("IPHONE_PREFERENCIAL");
  const [microfone, setMicrofone] = useState("IPHONE_PREFERENCIAL");
  const [cameraContingencia, setCameraContingencia] = useState("MAC");
  const [microfoneContingencia, setMicrofoneContingencia] = useState("MAC");
  const [link, setLink] = useState("");
  const [codigo, setCodigo] = useState("");
  const [qr, setQr] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [ocupado, setOcupado] = useState("");
  const [preparacaoOperacional, setPreparacaoOperacional] =
    useState<Registro | null>(null);
  const [tipoReferenciaBaseline, setTipoReferenciaBaseline] =
    useState<TipoReferenciaBaseline>("");
  const [baselineAnterior, setBaselineAnterior] = useState("");
  const [justificativaDaReferencia, setJustificativaDaReferencia] =
    useState("");
  const hidratado = useRef("");
  const painelDeFontes = useRef<HTMLDivElement>(null);

  async function carregar() {
    const resposta = await fetch(
      `/api/plataforma/gravacao-multimodal?sessao=${encodeURIComponent(sessao)}`,
      { cache: "no-store" }
    );
    const dados = await resposta.json();
    if (!resposta.ok) {
      throw new Error(dados?.erro?.mensagem ?? "Preparação indisponível.");
    }
    const recebido = dados as Painel;
    setPainel(recebido);
    if (hidratado.current !== sessao) {
      hidratado.current = sessao;
      const baseline = recebido.configuracoes.find(
        (item) => String(item.fase) === "BASELINE"
      );
      const modoPersistido = String(
        baseline?.modo ?? recebido.prontidao?.modo_de_midia ?? "NENHUM"
      ) as Modo;
      setModo(modoPersistido);
      setFontes(
        recebido.prontidao?.fontes_selecionadas?.length
          ? recebido.prontidao.fontes_selecionadas
          : FONTES_PADRAO
      );
      setRetencao(
        String(
          recebido.prontidao?.politica_de_retencao
          ?? (modoPersistido === "NENHUM"
            ? "NAO_ARMAZENAR"
            : "ATE_VALIDACAO_DO_RELATORIO")
        )
      );
      setPreparacaoOperacional(
        recebido.preparacao
          ? { preparacao: recebido.preparacao }
          : null
      );
      const decisaoBaseline = recebido.baseline?.referencia?.decisao;
      setTipoReferenciaBaseline(
        String(decisaoBaseline?.tipo ?? "") as TipoReferenciaBaseline
      );
      setBaselineAnterior(
        String(
          decisaoBaseline?.identificador_do_baseline_de_referencia ?? ""
        )
      );
      setJustificativaDaReferencia(
        String(decisaoBaseline?.justificativa_profissional ?? "")
      );
    }
  }

  useEffect(() => {
    void carregar().catch((erro) => setMensagem(erro.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessao]);

  useEffect(() => {
    const atualizarPeloComandoOperacional = (evento: Event) => {
      const detalhe = (evento as CustomEvent<{ sessao?: string }>).detail;
      if (detalhe?.sessao && detalhe.sessao !== sessao) return;
      void carregar().catch((erro) => setMensagem(erro.message));
    };
    window.addEventListener(
      "humanexus:operacao-atualizada",
      atualizarPeloComandoOperacional
    );
    return () => {
      window.removeEventListener(
        "humanexus:operacao-atualizada",
        atualizarPeloComandoOperacional
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessao]);

  async function executar(acao: string, dados: Registro) {
    const resposta = await fetch("/api/plataforma/gravacao-multimodal", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-humanexus-csrf": csrf()
      },
      body: JSON.stringify({ acao, sessao, dados })
    });
    const corpo = await resposta.json();
    if (!resposta.ok) {
      throw new Error(corpo?.erro?.mensagem ?? "Operação recusada.");
    }
    await carregar();
    return corpo as Registro;
  }

  async function configurar(
    modoEscolhido: Modo = modo,
    fontesEscolhidas: string[] = fontes
  ): Promise<boolean> {
    setOcupado("configuracao");
    try {
      const fontesSemMidia = fontesEscolhidas.filter(
        (item) => !["AUDIO", "VIDEO"].includes(item)
      );
      await executar("configurar", {
        fases: Object.fromEntries(
          FASES_DE_CAPTURA.map((fase) => [
            fase,
            {
              modo: modoEscolhido,
              fontes: fontesSemMidia,
              camera,
              microfone,
              camera_de_contingencia: cameraContingencia,
              microfone_de_contingencia: microfoneContingencia,
              qualidade: "ADAPTATIVA",
              orientacao: "AUTOMATICA",
              finalidade: modoEscolhido === "NENHUM"
                ? "REPLAY_TECNICO_SEM_MIDIA"
                : "REGISTRO_AUDIO_VIDEO_REPLAY_DA_SESSAO",
              retencao: {
                politica: modoEscolhido === "NENHUM"
                  ? "NAO_ARMAZENAR"
                  : retencao,
                prazo_em_dias: retencao === "PRAZO_DEFINIDO" ? prazo : null,
                preservar_somente_trechos_marcados:
                  modoEscolhido.includes("VIDEO"),
                transcricao_autorizada: false,
                excluir_audio_apos_transcricao: false
              }
            }
          ])
        )
      });
      setModo(modoEscolhido);
      setFontes(fontesEscolhidas);
      if (modoEscolhido === "NENHUM") setRetencao("NAO_ARMAZENAR");
      setMensagem(
        `${ROTULOS_DOS_MODOS[modoEscolhido]} aplicado ao registro da referência inicial e às fases PRÉ, TREINO e PÓS.`
      );
      return true;
    } catch (erro) {
      setMensagem(
        erro instanceof Error ? erro.message : "Falha de configuração."
      );
      return false;
    } finally {
      setOcupado("");
    }
  }

  async function criarDispositivo() {
    setOcupado("dispositivo");
    try {
      const corpo = await executar("dispositivo", {
        validade_minutos: 120,
        usos_permitidos: 40
      });
      const bruto = String(corpo.token_de_entrega_unica ?? "");
      const endereco =
        `${window.location.origin}/captura-sessao?token=${encodeURIComponent(bruto)}`;
      setLink(endereco);
      setCodigo(String(corpo.codigo_de_entrega_unica ?? ""));
      setQr(await QRCode.toDataURL(endereco, {
        width: 260,
        margin: 1,
        color: { dark: "#071116", light: "#F3EFE2" }
      }));
      setMensagem(
        "Acesso de mídia exibido uma única vez. O dispositivo não recebe o portal profissional."
      );
    } catch (erro) {
      setMensagem(
        erro instanceof Error ? erro.message : "Falha ao criar dispositivo."
      );
    } finally {
      setOcupado("");
    }
  }

  async function continuarSemFonte(codigoDaFonte: string) {
    const fontesRestantes = fontes.filter((item) => item !== codigoDaFonte);
    const modoRestante = proximoModoSemFonte(modo, codigoDaFonte);
    await configurar(modoRestante, fontesRestantes);
  }

  async function voltarParaSemGravacao() {
    await configurar(
      "NENHUM",
      fontes.filter((item) => !["AUDIO", "VIDEO"].includes(item))
    );
  }

  async function prepararSessao() {
    setOcupado("preparacao");
    try {
      if (configuracaoDivergente) {
        const configurada = await configurar();
        if (!configurada) return;
        setOcupado("preparacao");
      }
      const resultado = await executar("preparar", {});
      setPreparacaoOperacional(resultado);
      setMensagem(
        "Sessão preparada. A referência inicial permanece aguardando comando profissional."
      );
    } catch (erro) {
      setMensagem(
        erro instanceof Error ? erro.message : "Preparação recusada."
      );
    } finally {
      setOcupado("");
    }
  }

  async function definirReferenciaBaseline() {
    if (!tipoReferenciaBaseline) {
      setMensagem("Escolha uma opção de referência inicial.");
      return;
    }
    if (
      tipoReferenciaBaseline === "UTILIZAR_BASELINE_ANTERIOR"
      && !baselineAnterior
    ) {
      setMensagem("Selecione uma referência inicial anterior compatível.");
      return;
    }
    if (
      [
        "UTILIZAR_BASELINE_ANTERIOR",
        "DISPENSAR_BASELINE_NESTA_SESSAO"
      ].includes(tipoReferenciaBaseline)
      && justificativaDaReferencia.trim().length < 12
    ) {
      setMensagem(
        "Registre uma justificativa profissional com ao menos 12 caracteres."
      );
      return;
    }
    setOcupado("referencia-baseline");
    try {
      await executar("referenciaBaseline", {
        tipo: tipoReferenciaBaseline,
        identificador_do_baseline: baselineAnterior || null,
        justificativa: justificativaDaReferencia.trim()
      });
      setMensagem(
        `${ROTULOS_DA_REFERENCIA_BASELINE[
          tipoReferenciaBaseline as Exclude<TipoReferenciaBaseline, "">
        ]} — decisão profissional auditada.`
      );
      window.dispatchEvent(new CustomEvent("humanexus:baseline-atualizado"));
    } catch (erro) {
      setMensagem(
        erro instanceof Error
          ? erro.message
          : "Referência inicial não registrada."
      );
    } finally {
      setOcupado("");
    }
  }

  async function iniciarBaseline() {
    setOcupado("baseline");
    try {
      await executar("baseline", {});
      setMensagem(
        "Referência inicial iniciada por decisão profissional com a cobertura real disponível."
      );
      window.dispatchEvent(new CustomEvent("humanexus:baseline-atualizado"));
    } catch (erro) {
      setMensagem(
        erro instanceof Error ? erro.message : "Referência inicial não iniciada."
      );
    } finally {
      setOcupado("");
    }
  }

  async function pausarBaseline() {
    setOcupado("pausar-baseline");
    try {
      await executar("pausarBaseline", {});
      setMensagem("Referência inicial pausada com auditoria e dados preservados.");
      window.dispatchEvent(new CustomEvent("humanexus:baseline-atualizado"));
    } catch (erro) {
      setMensagem(
        erro instanceof Error ? erro.message : "Referência inicial não pausada."
      );
    } finally {
      setOcupado("");
    }
  }

  async function retomarBaseline() {
    setOcupado("retomar-baseline");
    try {
      await executar("retomarBaseline", {});
      setMensagem("Referência inicial retomada sem reiniciar sequências.");
      window.dispatchEvent(new CustomEvent("humanexus:baseline-atualizado"));
    } catch (erro) {
      setMensagem(
        erro instanceof Error ? erro.message : "Referência inicial não retomada."
      );
    } finally {
      setOcupado("");
    }
  }

  async function finalizarBaseline() {
    setOcupado("finalizar-baseline");
    try {
      await executar("finalizarBaseline", {});
      setMensagem(
        "Referência inicial encerrada e preservada. A sessão está pronta para iniciar o PRÉ."
      );
      window.dispatchEvent(new CustomEvent("humanexus:baseline-atualizado"));
    } catch (erro) {
      setMensagem(
        erro instanceof Error ? erro.message : "Referência inicial não finalizada."
      );
    } finally {
      setOcupado("");
    }
  }

  function alternarFonte(codigoDaFonte: string, ativa: boolean) {
    setFontes((atuais) => ativa
      ? [...new Set([...atuais, codigoDaFonte])]
      : atuais.filter((item) => item !== codigoDaFonte)
    );
  }

  const prontidao = painel?.prontidao;
  const configuracaoDivergente =
    !painel?.configuracoes.length
    || modo !== prontidao?.modo_de_midia
    || fontes.slice().sort().join("|")
      !== (prontidao?.fontes_selecionadas ?? []).slice().sort().join("|");
  const modoComMidia = modo !== "NENHUM";
  const sessaoPreparada = Boolean(
    preparacaoOperacional || painel?.preparacao
  );
  const servicosPreparados = Array.isArray(
    preparacaoOperacional?.servicos
  )
    ? preparacaoOperacional.servicos as Registro[]
    : [];
  const baselineAtual = painel?.baseline.registro;
  const snapshotBasalCanonico = painel?.baseline.snapshot_canonico ?? null;
  const coberturaBasalCanonica = snapshotBasalCanonico?.cobertura;
  const fontesBasaisCanonicas = Array.isArray(snapshotBasalCanonico?.fontes)
    ? snapshotBasalCanonico.fontes.map((item) => {
      const codigo = typeof item === "string"
        ? item
        : String((item as Registro).codigo ?? (item as Registro).nome ?? "");
      return ROTULOS_DAS_FONTES[codigo]
        ?? portuguesVisivel(codigo.replaceAll("_", " "));
    }).filter(Boolean)
    : [];
  const estadoDoBaseline = String(baselineAtual?.estado ?? "");
  const decisaoPersistida = painel?.baseline.referencia.decisao;
  const tipoPersistido = String(decisaoPersistida?.tipo ?? "");
  const podeIniciarNovoBaseline =
    tipoPersistido === "REALIZAR_NOVO_BASELINE"
    && !baselineAtual;
  const referenciaJaDefinida = Boolean(decisaoPersistida);
  const fontesIndisponiveis = prontidao?.fontes_indisponiveis ?? [];
  const fontesParaSelecao = fontesUnicasParaSelecao(prontidao, fontes);
  const aguardandoHardware = Boolean(
    sessaoPreparada
    && fontesIndisponiveis.length
    && fontesIndisponiveis.every((codigoDaFonte) => {
      const estado = prontidao?.fontes.find(
        (fonte) => fonte.codigo === codigoDaFonte
      )?.estado;
      return [
        "AGUARDANDO_FONTE_OPCIONAL",
        "DISPOSITIVO FÍSICO AUSENTE — HOMOLOGAÇÃO PENDENTE"
      ].includes(String(estado ?? ""));
    })
  );

  return (
    <section
      id="preparar-sessao"
      className="hx-media-control"
      aria-label="Preparar sessão"
    >
      <header className="hx-media-control__header">
        <div>
          <small>PREPARAR SESSÃO · {painel?.versao ?? "CARREGANDO"}</small>
          <h3>Fontes independentes, cobertura degradável e mídia opcional</h3>
          <p>
            Uma fonte opcional indisponível limita somente os produtos que
            dependem dela. Nenhum dado ausente é fabricado.
          </p>
        </div>
        <span className={`hx-readiness hx-readiness--${
          prontidao?.estado.includes("BLOQUEADO") ? "blocked"
          : prontidao?.nivel_de_cobertura?.toLowerCase() ?? "loading"
        }`}>
          {portuguesVisivel(prontidao?.estado ?? "DETECTANDO FONTES")}
        </span>
      </header>

      <section className="hx-session-context">
        <div>
          <small>Organização</small>
          <strong>{painel?.contexto.organizacao.nome ?? "—"}</strong>
          <span>{painel?.contexto.organizacao.identificador ?? "—"}</span>
        </div>
        <div>
          <small>Participante</small>
          <strong>
            {painel?.contexto.participante.referencia_externa ?? "—"}
          </strong>
          <span>{painel?.contexto.participante.identificador ?? "—"}</span>
        </div>
        <div>
          <small>Sessão</small>
          <strong>{painel?.contexto.sessao.finalidade ?? "—"}</strong>
          <span>{painel?.sessao.identificador ?? sessao}</span>
        </div>
        <div>
          <small>Profissional</small>
          <strong>{painel?.contexto.profissional.nome ?? "—"}</strong>
          <span>{painel?.contexto.profissional.identificador ?? "—"}</span>
        </div>
      </section>

      <section className="hx-preparation-chain" aria-label="Contexto recuperado">
        <span>
          Anamnese
          <b>{String(painel?.contexto.anamnese.estado ?? "NÃO LOCALIZADA")}</b>
        </span>
        <span>
          Formulação
          <b>{String(painel?.contexto.formulacao?.estado ?? "NÃO VINCULADA")}</b>
        </span>
        <span>
          CTR
          <b>{String(painel?.contexto.ctr.codigo ?? "NÃO VINCULADO")}</b>
        </span>
        <span>
          THX
          <b>{String(painel?.contexto.thx.codigo ?? "NÃO VINCULADO")}</b>
        </span>
        <span>
          Versão científica
          <b>{painel?.contexto.sessao.versao_cientifica ?? "—"}</b>
        </span>
      </section>

      <div className="hx-media-control__grid">
        <article className="hx-preparation-card">
          <small>CAPTURA DE MÍDIA</small>
          <h4>{ROTULOS_DOS_MODOS[modo]}</h4>
          <div className="hx-mode-options">
            {(Object.keys(ROTULOS_DOS_MODOS) as Modo[]).map((item) => (
              <label className={modo === item ? "is-selected" : ""} key={item}>
                <input
                  type="radio"
                  name={`modo-${sessao}`}
                  value={item}
                  checked={modo === item}
                  disabled={
                    item !== "NENHUM"
                    && !prontidao?.modalidades_de_midia_permitidas?.includes(item)
                  }
                  onChange={() => setModo(item)}
                />
                <span>{ROTULOS_DOS_MODOS[item]}</span>
                {item !== "NENHUM"
                  && !prontidao?.modalidades_de_midia_permitidas?.includes(item)
                  ? <em>NÃO AUTORIZADO</em>
                  : null}
              </label>
            ))}
          </div>
          <p>
            Câmera e microfone nunca são ativados automaticamente. O padrão é
            SEM GRAVAÇÃO.
          </p>
        </article>

        <article className="hx-preparation-card" ref={painelDeFontes}>
          <small>FONTES DA SESSÃO</small>
          <h4>Seleção profissional</h4>
          <div className="hx-source-options">
            {fontesParaSelecao.map(({ codigo: codigoDaFonte, rotulo, fonte }) => {
              const controladaPeloModo = ["AUDIO", "VIDEO"].includes(codigoDaFonte);
              const selecionada = controladaPeloModo
                ? codigoDaFonte === "AUDIO"
                  ? modo.includes("AUDIO")
                  : modo.includes("VIDEO")
                : fontes.includes(codigoDaFonte);
              return (
                <label key={codigoDaFonte}>
                  <input
                    type="checkbox"
                    checked={selecionada}
                    disabled={controladaPeloModo}
                    onChange={(evento) =>
                      alternarFonte(codigoDaFonte, evento.target.checked)}
                  />
                  <span>{rotulo}</span>
                  <em className={fonte?.disponivel ? "is-available" : "is-waiting"}>
                    {fonte?.disponivel
                      ? "DISPONÍVEL"
                      : selecionada
                        ? fonte?.estado ?? "AGUARDANDO FONTE OPCIONAL"
                        : "NÃO SELECIONADA"}
                  </em>
                </label>
              );
            })}
          </div>
        </article>

        <article className="hx-preparation-card">
          <small>DISPOSITIVOS DE MÍDIA</small>
          <h4>Preferência e contingência</h4>
          <label>Câmera preferencial
            <select value={camera} onChange={(evento) => setCamera(evento.target.value)}>
              <option value="IPHONE_PREFERENCIAL">iPhone</option>
              <option value="MAC">Mac</option>
              <option value="AUTOMATICA">Escolher no dispositivo</option>
            </select>
          </label>
          <label>Câmera de contingência
            <select value={cameraContingencia} onChange={(evento) => setCameraContingencia(evento.target.value)}>
              <option value="MAC">Mac</option>
              <option value="IPHONE">iPhone</option>
              <option value="NENHUMA">Nenhuma</option>
            </select>
          </label>
          <label>Microfone preferencial
            <select value={microfone} onChange={(evento) => setMicrofone(evento.target.value)}>
              <option value="IPHONE_PREFERENCIAL">iPhone</option>
              <option value="MAC">Mac</option>
              <option value="AUTOMATICO">Escolher no dispositivo</option>
            </select>
          </label>
          <label>Microfone de contingência
            <select value={microfoneContingencia} onChange={(evento) => setMicrofoneContingencia(evento.target.value)}>
              <option value="MAC">Mac</option>
              <option value="IPHONE">iPhone</option>
              <option value="NENHUM">Nenhum</option>
            </select>
          </label>
          <p>Nunca há troca silenciosa entre iPhone e Mac.</p>
        </article>

        <article className="hx-preparation-card">
          <small>ARMAZENAMENTO SUSTENTÁVEL</small>
          <h4>{ROTULOS_DA_RETENCAO[retencao] ?? retencao}</h4>
          <label>Política
            <select
              value={modo === "NENHUM" ? "NAO_ARMAZENAR" : retencao}
              disabled={modo === "NENHUM"}
              onChange={(evento) => setRetencao(evento.target.value)}
            >
              {Object.entries(ROTULOS_DA_RETENCAO).map(([valor, rotulo]) => (
                <option value={valor} key={valor}>{rotulo}</option>
              ))}
            </select>
          </label>
          {retencao === "PRAZO_DEFINIDO" && modoComMidia ? (
            <label>Prazo em dias
              <input
                type="number"
                min="1"
                max="3650"
                value={prazo}
                onChange={(evento) => setPrazo(Number(evento.target.value))}
              />
            </label>
          ) : null}
          <dl className="hx-storage-estimate">
            <div><dt>Duração</dt><dd>{prontidao?.estimativa_de_armazenamento.duracao_planejada_minutos ?? 0} min</dd></div>
            <div><dt>Áudio</dt><dd>{prontidao?.estimativa_de_armazenamento.audio_mb_estimados ?? 0} MB</dd></div>
            <div><dt>Vídeo</dt><dd>{prontidao?.estimativa_de_armazenamento.video_mb_estimados ?? 0} MB</dd></div>
            <div><dt>Estimativa total</dt><dd>{prontidao?.estimativa_de_armazenamento.total_mb_estimados ?? 0} MB</dd></div>
          </dl>
        </article>
      </div>

      <section className="hx-coverage-board">
        <header>
          <div><small>COBERTURA SELECIONADA</small><strong>{prontidao?.fontes_selecionadas.map((item) => ROTULOS_DAS_FONTES[item] ?? portuguesVisivel(item)).join(" · ") || "REGISTRO OPERACIONAL MÍNIMO"}</strong></div>
          <div><small>COBERTURA DISPONÍVEL</small><strong>{prontidao?.fontes_disponiveis.map((item) => ROTULOS_DAS_FONTES[item] ?? portuguesVisivel(item)).join(" · ") || "REGISTRO OPERACIONAL MÍNIMO"}</strong></div>
          <div><small>NÍVEL</small><strong>{prontidao ? `${Math.round(prontidao.cobertura * 100)}% · ${prontidao.nivel_de_cobertura}` : "—"}</strong></div>
        </header>
        <div className="hx-coverage-board__columns">
          <div>
            <small>FONTES INDISPONÍVEIS</small>
            {prontidao?.fontes_indisponiveis.length
              ? prontidao.fontes_indisponiveis.map((item) => (
                <span key={item}>{ROTULOS_DAS_FONTES[item] ?? item}</span>
              ))
              : <strong>NENHUMA ENTRE AS SELECIONADAS</strong>}
          </div>
          <div>
            <small>PRODUTOS QUE PODERÃO SER LIMITADOS</small>
            {prontidao?.produtos_limitados.map((item) => (
              <span key={item}>{portuguesVisivel(item.replaceAll("_", " "))}</span>
            ))}
          </div>
          <div>
            <small>EPOC X / LICENÇA</small>
            <strong>{prontidao?.cortex.fluxos_disponiveis.length ? "QUALIDADE E MÉTRICAS AUTORIZADAS DISPONÍVEIS" : "SEM TRANSMISSÃO ATIVA"}</strong>
            <span>
              Sinal eletroencefalográfico bruto não fornecido pela licença atual
              {" · "}{prontidao?.cortex.classificacao ?? "LIMITAÇÃO DA LICENÇA"}
            </span>
          </div>
        </div>
      </section>

      <section className="hx-operational-readiness">
        <header>
          <div>
            <small>PRONTIDÃO OPERACIONAL</small>
            <strong>
              {sessaoPreparada
                ? "CONTEXTO E SERVIÇOS VERIFICADOS"
                : "AGUARDANDO PREPARAR SESSÃO"}
            </strong>
          </div>
          <div>
            <small>FLUXO CIENTÍFICO PADRÃO</small>
            <strong>
              {painel?.baseline.fluxo_cientifico.map((item) => portuguesVisivel(item)).join(" → ")
                ?? "PRE → TREINO → POS"}
            </strong>
            <span>A referência inicial é operacional, separada e opcional.</span>
          </div>
        </header>
        <div className="hx-operational-readiness__body">
          <div>
            <small>CONTINUIDADE DAS SEQUÊNCIAS</small>
            {Object.entries(painel?.sequencias ?? {}).length ? (
              Object.entries(painel?.sequencias ?? {}).map(([fonte, dados]) => (
                <span key={fonte}>
                  <b>{portuguesVisivel(fonte.replaceAll("_", " "))}</b>
                  última {dados.ultima_sequencia.toLocaleString("pt-BR")}
                  {" · "}próxima {dados.proxima_sequencia.toLocaleString("pt-BR")}
                </span>
              ))
            ) : (
              <span>Nenhuma sequência anterior nesta sessão.</span>
            )}
          </div>
          <div>
            <small>SERVIÇOS NECESSÁRIOS</small>
            {servicosPreparados.length ? (
              servicosPreparados.map((servico) => (
                <span key={String(servico.identificador)}>
                  <b>{portuguesVisivel(String(servico.codigo).replaceAll("_", " "))}</b>
                  {portuguesVisivel(String(servico.estado))}
                </span>
              ))
            ) : (
              <span>Serão verificados somente após PREPARAR SESSÃO.</span>
            )}
          </div>
          <div>
            <small>ESTADO FINAL</small>
            <strong>
              {prontidao?.pode_iniciar_baseline && sessaoPreparada
                ? "PRONTO PARA INICIAR"
                : prontidao?.bloqueios_essenciais.join(" · ")
                  || "PREPARAÇÃO PROFISSIONAL PENDENTE"}
            </strong>
            <span>
              A referência inicial nunca é iniciada automaticamente. Nenhuma ausência é
              preenchida com zero.
            </span>
          </div>
        </div>
      </section>

      <section
        className="hx-baseline-reference"
        id="referencia-baseline"
        aria-label="Referência inicial"
      >
        <header>
          <div>
            <small>REFERÊNCIA INICIAL</small>
            <h4>{portuguesVisivel(painel?.baseline.referencia.estado ?? "AGUARDANDO")}</h4>
          </div>
          <span>SEPARADA DE PRÉ → TREINO → PÓS</span>
        </header>

        {baselineAtual ? (
          <div className="hx-baseline-reference__current">
            <div>
              <small>Estado</small>
              <strong>{estadoDoBaseline}</strong>
            </div>
            <div>
              <small>Início</small>
              <strong>
                {baselineAtual.iniciado_em
                  ? new Date(String(baselineAtual.iniciado_em))
                    .toLocaleString("pt-BR")
                  : "—"}
              </strong>
            </div>
            <div>
              <small>Encerramento</small>
              <strong>
                {baselineAtual.finalizado_em
                  ? new Date(String(baselineAtual.finalizado_em))
                    .toLocaleString("pt-BR")
                  : "EM ANDAMENTO"}
              </strong>
            </div>
            <div>
              <small>Cobertura</small>
              <strong>
                {formatarPercentualCanonico(
                  coberturaBasalCanonica ?? baselineAtual.cobertura ?? 0
                )}
              </strong>
              {snapshotBasalCanonico ? <span>Registro basal imutável</span> : null}
            </div>
            <div>
              <small>Duração</small>
              <strong>
                {Math.round(Number(baselineAtual.duracao_segundos ?? 0))} s
              </strong>
            </div>
            <div>
              <small>Fontes reais</small>
              <strong>
                {fontesBasaisCanonicas.length
                  ? fontesBasaisCanonicas.join(" · ")
                  : Array.isArray(baselineAtual.fontes_disponiveis_json)
                  ? baselineAtual.fontes_disponiveis_json.join(" · ")
                  : String(baselineAtual.fontes_disponiveis_json ?? "—")}
              </strong>
            </div>
            {snapshotBasalCanonico ? (
              <div>
                <small>Registro canônico congelado</small>
                <strong>{String(snapshotBasalCanonico.identificador ?? "—")}</strong>
                <span>{new Date(String(snapshotBasalCanonico.timestamp ?? "")).toLocaleString("pt-BR")} · qualidade {Math.round(Number(snapshotBasalCanonico.qualidade ?? 0) * 100)}% · confiança {Math.round(Number(snapshotBasalCanonico.confianca ?? 0) * 100)}%</span>
              </div>
            ) : null}
            <div>
              <small>Mídia</small>
              <strong>{ROTULOS_DOS_MODOS[modo]}</strong>
            </div>
          </div>
        ) : (
          <>
            <p>
              Nenhuma opção é selecionada automaticamente. A decisão pertence
              ao profissional autorizado.
            </p>
            <div className="hx-baseline-reference__options">
              {(
                Object.keys(ROTULOS_DA_REFERENCIA_BASELINE) as Exclude<
                  TipoReferenciaBaseline,
                  ""
                >[]
              ).map((tipo) => (
                <label
                  className={tipoReferenciaBaseline === tipo
                    ? "is-selected"
                    : ""}
                  key={tipo}
                >
                  <input
                    type="radio"
                    name={`referencia-baseline-${sessao}`}
                    value={tipo}
                    checked={tipoReferenciaBaseline === tipo}
                    onChange={() => {
                      setTipoReferenciaBaseline(tipo);
                      if (tipo !== "UTILIZAR_BASELINE_ANTERIOR") {
                        setBaselineAnterior("");
                      }
                    }}
                  />
                  <span>{ROTULOS_DA_REFERENCIA_BASELINE[tipo]}</span>
                </label>
              ))}
            </div>

            {tipoReferenciaBaseline === "UTILIZAR_BASELINE_ANTERIOR" ? (
              <label>
                Referência inicial anterior do mesmo participante
                <select
                  value={baselineAnterior}
                  onChange={(evento) =>
                    setBaselineAnterior(evento.target.value)}
                >
                  <option value="">Selecione conscientemente</option>
                  {painel?.baseline.referencia.baselines_anteriores.map(
                    (item) => (
                      <option
                        value={String(item.identificador)}
                        key={String(item.identificador)}
                      >
                        {item.data
                          ? new Date(String(item.data)).toLocaleString("pt-BR")
                          : "Data não registrada"}
                        {" · "}{String(item.contexto ?? "Contexto preservado")}
                        {" · cobertura "}
                        {Math.round(Number(item.cobertura ?? 0) * 100)}%
                      </option>
                    )
                  )}
                </select>
              </label>
            ) : null}

            {[
              "UTILIZAR_BASELINE_ANTERIOR",
              "DISPENSAR_BASELINE_NESTA_SESSAO"
            ].includes(tipoReferenciaBaseline) ? (
              <label>
                Justificativa profissional
                <textarea
                  value={justificativaDaReferencia}
                  onChange={(evento) =>
                    setJustificativaDaReferencia(evento.target.value)}
                  placeholder="Registre a compatibilidade ou o fundamento da decisão."
                />
              </label>
            ) : null}

            <button
              className="hx-op-button hx-op-button--gold"
              onClick={() => void definirReferenciaBaseline()}
              disabled={ocupado !== "" || !tipoReferenciaBaseline}
            >
              {referenciaJaDefinida
                ? "ATUALIZAR DECISÃO SOBRE A REFERÊNCIA INICIAL"
                : "REGISTRAR DECISÃO SOBRE A REFERÊNCIA INICIAL"}
            </button>
          </>
        )}
      </section>

      <div className="hx-preparation-actions">
        <button
          className="hx-op-button hx-op-button--gold"
          onClick={() => void prepararSessao()}
          disabled={ocupado !== ""}
        >
          PREPARAR SESSÃO
        </button>
        <button
          className="hx-op-button hx-op-button--gold"
          onClick={() => void iniciarBaseline()}
          disabled={
            ocupado !== ""
            || !prontidao?.pode_iniciar_baseline
            || configuracaoDivergente
            || !sessaoPreparada
            || !podeIniciarNovoBaseline
            || Boolean(painel?.baseline.dispensa)
            || Boolean(painel?.baseline.registro)
          }
        >
          INICIAR REFERÊNCIA INICIAL
        </button>
        <button
          className="hx-op-button"
          onClick={() => void pausarBaseline()}
          disabled={ocupado !== "" || estadoDoBaseline !== "INICIADO"}
        >
          PAUSAR REFERÊNCIA INICIAL
        </button>
        <button
          className="hx-op-button"
          onClick={() => void retomarBaseline()}
          disabled={ocupado !== "" || estadoDoBaseline !== "PAUSADO"}
        >
          RETOMAR REFERÊNCIA INICIAL
        </button>
        <button
          className="hx-op-button hx-op-button--gold"
          onClick={() => void finalizarBaseline()}
          disabled={
            ocupado !== ""
            || !["INICIADO", "PAUSADO"].includes(
              String(painel?.baseline.registro?.estado ?? "")
            )
          }
        >
          ENCERRAR REFERÊNCIA INICIAL
        </button>
        <button
          className="hx-op-button"
          onClick={() => void carregar().then(() =>
            setMensagem("Reconexão verificada sem interromper as demais fontes.")
          )}
          disabled={ocupado !== ""}
        >
                  AGUARDAR RECONEXÃO CONTROLADA
        </button>
        <button
          className="hx-op-button"
          onClick={() => painelDeFontes.current?.scrollIntoView({
            behavior: "smooth",
            block: "center"
          })}
        >
          ALTERAR FONTES
        </button>
        <button
          className="hx-op-button"
          onClick={() => void voltarParaSemGravacao()}
          disabled={ocupado !== "" || modo === "NENHUM"}
        >
          VOLTAR PARA SEM GRAVAÇÃO
        </button>
        <button
          className="hx-op-button"
          onClick={() => setMensagem(
            "Preparação cancelada sem cancelar, reiniciar ou alterar a sessão."
          )}
        >
          CANCELAR
        </button>
      </div>

      {aguardandoHardware ? (
        <div className="hx-recovery-actions">
          <strong>AGUARDANDO EQUIPAMENTO</strong>
          <span>
            As fontes foram vinculadas à sessão e a estação permanece preparada.
            Nenhuma ausência é tratada como falha ou evidência atual.
          </span>
        </div>
      ) : prontidao?.fontes_indisponiveis.length ? (
        <div className="hx-recovery-actions">
          <strong>FALHA TÉCNICA RECUPERÁVEL</strong>
          <button onClick={() => void carregar()}>TENTAR NOVAMENTE</button>
          {prontidao.fontes_indisponiveis.map((item) => (
            <button key={item} onClick={() => void continuarSemFonte(item)}>
              CONTINUAR SEM {ROTULOS_DAS_FONTES[item]?.toUpperCase() ?? item}
            </button>
          ))}
          <button onClick={() => void prepararSessao()}>
            CONTINUAR COM COBERTURA PARCIAL
          </button>
          <button onClick={() => painelDeFontes.current?.scrollIntoView({
            behavior: "smooth",
            block: "center"
          })}>
            TROCAR DISPOSITIVO
          </button>
        </div>
      ) : null}

      <details className="hx-media-device-access">
        <summary>Captura em dispositivo separado — somente quando houver mídia</summary>
        <div>
          <button
            className="hx-op-button"
            onClick={() => void criarDispositivo()}
            disabled={ocupado !== "" || !modoComMidia || configuracaoDivergente}
          >
            Gerar acesso limitado de mídia
          </button>
          <p>
            SEM GRAVAÇÃO não cria token, não pede câmera e não pede microfone.
          </p>
        </div>
        {link ? (
          <div className="hx-media-control__invite">
            {qr ? <img src={qr} alt="Código QR do dispositivo de captura" /> : null}
            <div>
              <small>ENTREGA ÚNICA</small>
              <strong>{codigo}</strong>
              <input readOnly value={link} />
              <button onClick={() => void navigator.clipboard.writeText(link)}>
                Copiar ligação
              </button>
            </div>
          </div>
        ) : null}
      </details>

      <div className="hx-media-control__states">
        {(painel?.dispositivos ?? []).map((item) => (
          <span key={String(item.identificador)}>
            {String(item.estado)} · {String(item.identificador)}
          </span>
        ))}
      </div>
      <p className="hx-media-control__message" role="status">{portuguesVisivel(mensagem)}</p>
    </section>
  );
}
