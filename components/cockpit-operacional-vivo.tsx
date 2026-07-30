"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CockpitSignalStack,
  ReplayTimelineChart,
  VectorRadarChart,
  type HxDataPoint,
  type HxMarker,
  type HxPhaseRange,
  type HxTrack,
  type HxVectorAxis
} from "@/components/hx-command-visualizations";
import { HxSectionHeader, HxSurface } from "@/components/hx-design-system";
import { HX_CHART_COLORS as C } from "@/lib/humanexus-chart-theme";

type Registro = Record<string, unknown>;
type Fonte = Registro & {
  codigo?: string;
  nome?: string;
  estado?: string;
  ao_vivo?: boolean;
  historico?: boolean;
  valores?: Registro;
  metricas?: Registro;
  metricas_de_desempenho?: Registro[];
  series?: Record<string, Registro[]>;
};

type Props = {
  estado: Registro;
  ocupado: boolean;
  erro?: string;
  acaoPrincipal: string;
  rotuloDaAcao: string;
  acoesSecundarias: string[];
  rotuloDaSecundaria: (comando: string) => string;
  executarPrincipal: () => void;
  executarSecundaria: (comando: string) => void;
  registrar: (categoria: string, texto: string) => Promise<void> | void;
  abrirAnalitico: () => void;
};

const METRICAS_DE_DESEMPENHO_VISIVEIS = [
  "Foco e atenção",
  "Engajamento",
  "Interesse",
  "Excitação",
  "Estresse",
  "Relaxamento"
] as const;

function metricasDeDesempenhoVisiveis(fonte: Fonte) {
  return (Array.isArray(fonte.metricas_de_desempenho)
    ? fonte.metricas_de_desempenho
    : []).filter((item) =>
      METRICAS_DE_DESEMPENHO_VISIVEIS.includes(
        String(item.nome) as typeof METRICAS_DE_DESEMPENHO_VISIVEIS[number]
      )
    );
}

function objeto(valor: unknown): Registro {
  return valor && typeof valor === "object" && !Array.isArray(valor)
    ? valor as Registro
    : {};
}

function lista(valor: unknown): Registro[] {
  return Array.isArray(valor)
    ? valor.filter((item) => item && typeof item === "object") as Registro[]
    : [];
}

function texto(valor: unknown, padrao = "—") {
  return valor == null || valor === ""
    ? padrao
    : String(valor).replaceAll("_", " ");
}

function dataLegivel(valor: unknown) {
  if (!valor) return "Sem registro";
  const data = new Date(String(valor));
  if (Number.isNaN(data.getTime())) return texto(valor);
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium",
    timeZone: "America/Manaus"
  }).format(data);
}

function duracao(inicio: unknown, fim: unknown, agora: number) {
  const inicioMs = new Date(String(inicio ?? "")).getTime();
  if (!Number.isFinite(inicioMs)) return "00:00:00";
  const fimMs = fim ? new Date(String(fim)).getTime() : agora;
  const segundos = Math.max(0, Math.floor((fimMs - inicioMs) / 1000));
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  const s = segundos % 60;
  return [h, m, s].map((item) => String(item).padStart(2, "0")).join(":");
}

function percentual(valor: unknown) {
  if (valor == null || valor === "") return "—";
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return "—";
  return `${(numero <= 1 ? numero * 100 : numero).toFixed(0)}%`;
}

function referenciaDeBaseline(valor: unknown) {
  const baseline = objeto(valor);
  const referencia = objeto(baseline.referencia);
  const registro = objeto(baseline.registro);
  const fontes = Array.isArray(registro.fontes_disponiveis_json)
    ? registro.fontes_disponiveis_json.map(String)
    : [];
  const duracaoTotal = Number(registro.duracao_segundos);
  const minutos = Number.isFinite(duracaoTotal)
    ? Math.floor(duracaoTotal / 60)
    : null;
  const segundos = Number.isFinite(duracaoTotal)
    ? Math.round(duracaoTotal % 60)
    : null;
  return {
    estado: texto(
      referencia.estado ?? registro.estado,
      "SEM REFERÊNCIA DE BASELINE"
    ),
    realizadoEm: dataLegivel(registro.iniciado_em),
    duracao: minutos == null || segundos == null
      ? "Duração não registrada"
      : `${minutos} min ${segundos} s`,
    fontes: fontes.length
      ? fontes.map((item) => texto(item)).join(" · ")
      : "Fontes não registradas",
    cobertura: percentual(registro.cobertura),
    qualidade: texto(registro.prontidao, "Qualidade não registrada")
  };
}

function numero(valor: unknown, casas = 0) {
  if (valor == null || valor === "") return "—";
  const convertido = Number(valor);
  return Number.isFinite(convertido) ? convertido.toFixed(casas) : "—";
}

function LeituraNumerica({
  valor,
  casas = 0,
  sufixo = ""
}: {
  valor: unknown;
  casas?: number;
  sufixo?: string;
}) {
  const presente = valor != null && valor !== "";
  const alvo = presente ? Number(valor) : Number.NaN;
  const valido = Number.isFinite(alvo);
  const anterior = useRef(valido ? alvo : 0);
  const [exibido, setExibido] = useState<number | null>(valido ? alvo : null);

  useEffect(() => {
    if (!valido) {
      setExibido(null);
      return;
    }
    const origem = anterior.current;
    anterior.current = alvo;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setExibido(alvo);
      return;
    }
    const inicio = window.performance.now();
    let quadro = 0;
    const atualizar = (agora: number) => {
      const progresso = Math.min(1, (agora - inicio) / 620);
      const suavizado = 1 - Math.pow(1 - progresso, 3);
      setExibido(origem + (alvo - origem) * suavizado);
      if (progresso < 1) quadro = window.requestAnimationFrame(atualizar);
    };
    quadro = window.requestAnimationFrame(atualizar);
    return () => window.cancelAnimationFrame(quadro);
  }, [alvo, valido]);

  return <>{exibido == null ? "—" : exibido.toFixed(casas)}{sufixo}</>;
}

function valorNormalizado(valor: unknown): number | null {
  if (typeof valor === "string") {
    try {
      return valorNormalizado(JSON.parse(valor));
    } catch {
      return null;
    }
  }
  if (typeof valor === "number" && Number.isFinite(valor) && valor >= 0 && valor <= 1) {
    return valor;
  }
  const registro = objeto(valor);
  for (const chave of ["valor", "magnitude", "escore", "value"]) {
    const candidato = registro[chave];
    if (typeof candidato === "number" && Number.isFinite(candidato) && candidato >= 0 && candidato <= 1) {
      return candidato;
    }
  }
  return null;
}

function identificadorVetorial(definicao: Registro) {
  return String(definicao.id ?? definicao.identificador ?? "");
}

function codigoVetorial(definicao: Registro) {
  return texto(definicao.code ?? definicao.codigo, "VETOR");
}

function nomeVetorial(definicao: Registro) {
  return texto(definicao.name ?? definicao.nome, "Vetor regulatório");
}

function FonteEstado({ estado }: { estado: unknown }) {
  const codigo = String(estado ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replaceAll(" ", "-");
  return (
    <span className={`hx-live-state is-${codigo}`}>
      <i aria-hidden="true" />
      {texto(estado)}
    </span>
  );
}

function Sparkline({ pontos, cor }: { pontos: Registro[]; cor: string }) {
  const valores = pontos
    .map((item) => Number(item.valor))
    .filter(Number.isFinite)
    .slice(-48);
  if (valores.length < 2) {
    return <div className="hx-live-sparkline is-empty">Sem série suficiente</div>;
  }
  const minimo = Math.min(...valores);
  const maximo = Math.max(...valores);
  const amplitude = maximo - minimo || 1;
  const linha = valores.map((valor, indice) => {
    const x = indice * 100 / (valores.length - 1);
    const y = 31 - ((valor - minimo) / amplitude) * 26;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(" ");
  return (
    <svg className="hx-live-sparkline" viewBox="0 0 100 34" role="img" aria-label="Tendência técnica recente">
      <polyline points={linha} fill="none" stroke={cor} strokeWidth="1.8" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function pontosDaSerie(fonte: Fonte, serie: string, origem: string): HxDataPoint[] {
  return lista(fonte.series?.[serie]).flatMap((item) => {
    const tempo = new Date(String(item.timestamp ?? "")).getTime();
    const valor = Number(item.valor);
    if (!Number.isFinite(tempo) || !Number.isFinite(valor)) return [];
    return [{
      time: tempo,
      value: valor,
      label: texto(item.rotulo),
      phase: texto(item.momento, "SEM FASE"),
      source: origem,
      quality: Number(item.qualidade ?? 0),
      coverage: null,
      connection: fonte.ao_vivo ? "TRANSMITINDO" : "REPLAY HISTÓRICO",
      gap: false
    }];
  });
}

function trilhas(fontes: Fonte[]): HxTrack[] {
  const polar = fontes.find((item) => item.codigo === "POLAR_H10") ?? {};
  const epoc = fontes.find((item) => item.codigo === "EMOTIV_EPOC_X") ?? {};
  const desempenho = metricasDeDesempenhoVisiveis(epoc);
  const candidatas: HxTrack[] = [
    {
      id: "polar-hr",
      name: "Frequência cardíaca",
      unit: "bpm",
      color: C.gold,
      points: pontosDaSerie(polar, "hr", "Polar H10")
    },
    {
      id: "polar-rr",
      name: "Intervalos RR",
      unit: "ms",
      color: C.warmWhite,
      points: pontosDaSerie(polar, "rr", "Polar H10")
    },
    {
      id: "polar-rmssd",
      name: "RMSSD técnico recebido",
      unit: "ms",
      color: C.green,
      points: pontosDaSerie(polar, "rmssd", "Polar H10")
    },
    {
      id: "qualidade-sinal-eletroencefalografico",
      name: "Qualidade do sinal eletroencefalográfico",
      unit: "%",
      color: C.green,
      points: pontosDaSerie(epoc, "qualidade", "EPOC X"),
      min: 0,
      max: 100,
      area: true
    },
    ...desempenho.map((metrica, indice) => ({
      id: `desempenho-${texto(metrica.identificador_de_apresentacao, String(indice))}`,
      name: texto(metrica.nome),
      unit: "índice do equipamento",
      color: [C.gold, C.green, C.warmWhite, C.gold, C.red, C.green][indice % 6],
      points: lista(metrica.historico_da_fase).flatMap((item) => {
        const tempo = new Date(String(item.timestamp ?? "")).getTime();
        const valor = Number(item.valor);
        if (!Number.isFinite(tempo) || !Number.isFinite(valor)) return [];
        return [{
          time: tempo,
          value: valor,
          label: texto(metrica.nome),
          phase: texto(item.momento, "SEM FASE"),
          source: "Sistema EMOTIV",
          quality: Number(item.qualidade ?? 0),
          connection: epoc.ao_vivo ? "TRANSMITINDO" : "REPRODUÇÃO HISTÓRICA",
          gap: false
        } as HxDataPoint];
      }),
      min: 0,
      max: 1
    }))
  ];
  return candidatas.filter((item) => item.points.length);
}

function FontePolar({ fonte }: { fonte: Fonte }) {
  const valores = objeto(fonte.valores);
  const metricas = objeto(fonte.metricas);
  return (
    <article className="hx-live-source-card" data-source="polar">
      <header><div><small>POLAR H10</small><strong>Sinal cardiovascular</strong></div><FonteEstado estado={fonte.estado} /></header>
      <div className="hx-live-source-values">
        <span><small>Frequência cardíaca</small><b>{numero(valores.hr_bpm)} bpm</b></span>
        <span><small>RMSSD</small><b>{numero(valores.rmssd_tecnico_ms, 1)} ms</b></span>
        <span><small>Qualidade</small><b>{percentual(metricas.qualidade)}</b></span>
        <span><small>Bateria</small><b>{percentual(valores.bateria_percentual)}</b></span>
      </div>
      <Sparkline pontos={lista(fonte.series?.hr)} cor={C.gold} />
      <footer>
        <span>Último pacote {dataLegivel(metricas.ultimo_pacote)}</span>
        <span>Latência {numero(metricas.latencia_ms, 1)} ms · perdas {numero(metricas.perdas)}</span>
      </footer>
    </article>
  );
}

function FonteEpoc({ fonte }: { fonte: Fonte }) {
  const valores = objeto(fonte.valores);
  const metricas = objeto(fonte.metricas);
  const desempenho = metricasDeDesempenhoVisiveis(fonte);
  return (
    <article className="hx-live-source-card hx-live-source-card--epoc" data-source="epoc-x">
      <header><div><small>EPOC X</small><strong>Desempenho e qualidade</strong></div><FonteEstado estado={fonte.estado} /></header>
      <div className="hx-live-source-values">
        <span><small>Qualidade do sinal</small><b>{percentual(valores.qualidade_global)}</b></span>
        <span><small>Contato adequado</small><b>{numero(valores.canais_adequados)}/{numero(valores.canais_total)} canais</b></span>
        <span><small>Bateria</small><b>{percentual(valores.bateria_percentual)}</b></span>
        <span><small>Último dado</small><b>{dataLegivel(metricas.ultimo_pacote)}</b></span>
      </div>
      <Sparkline pontos={lista(fonte.series?.qualidade)} cor={C.green} />
      {desempenho.length ? (
        <div className="hx-live-performance-grid">
          {desempenho.map((metrica) => (
            <span key={texto(metrica.nome)}>
              <small>{texto(metrica.nome)}</small>
              <b>{percentual(metrica.valor_atual)}</b>
              <em>{texto(metrica.tendencia)} · {texto(metrica.estado_da_aquisicao)}</em>
            </span>
          ))}
        </div>
      ) : null}
      <footer>
        <span>Latência {numero(metricas.latencia_ms, 1)} ms · perdas {numero(metricas.perdas)}</span>
        <span>Métricas fornecidas pelo equipamento · sem interpretação HUMANEXUS automática</span>
      </footer>
    </article>
  );
}

export function CockpitOperacionalVivo({
  estado,
  ocupado,
  erro,
  acaoPrincipal,
  rotuloDaAcao,
  acoesSecundarias,
  rotuloDaSecundaria,
  executarPrincipal,
  executarSecundaria,
  registrar,
  abrirAnalitico
}: Props) {
  const [agora, setAgora] = useState(Date.now());
  const [categoria, setCategoria] = useState("EVENTO");
  const [registro, setRegistro] = useState("");
  const cockpit = objeto(estado.cockpit_operacional);
  const sessao = objeto(cockpit.sessao);
  const contextoSessao = objeto(estado.sessao);
  const estadoOperacional = objeto(estado.estado_operacional);
  const tipoDaSessao = String(
    objeto(contextoSessao.detalhes_operacionais).tipo_de_sessao
    ?? estadoOperacional.tipo_de_sessao
    ?? "PRE_TREINO_POS"
  );
  const sessaoBaseline = tipoDaSessao === "BASELINE";
  const participante = objeto(estado.participante);
  const organizacao = objeto(estado.organizacao);
  const profissionais = lista(objeto(estado.contextos).profissionais);
  const profissional = profissionais[0] ?? {};
  const ctr = objeto(estado.ctr_individual);
  const thx = objeto(estado.thx_individual);
  const execucao = objeto(estado.execucao);
  const fontes = lista(cockpit.fontes) as Fonte[];
  const replay = objeto(cockpit.replay);
  const indicadores = lista(cockpit.indicadores_contratados);
  const alertas = lista(cockpit.alertas_acionaveis);
  const eventos = lista(estado.eventos);
  const replayCompleto = objeto(estado.replay);
  const itensReplay = lista(replayCompleto.itens);
  const fases = objeto(sessao.estados_das_fases);
  const modoHistorico = cockpit.modo === "REPLAY_HISTORICO";
  const modoAguardando = cockpit.modo === "MODO_OPERACIONAL_AGUARDANDO_CONEXAO";
  const sessaoFinalizada = contextoSessao.estado === "FINALIZADA";
  const graficos = useMemo(() => trilhas(fontes), [fontes]);
  const baseline = referenciaDeBaseline(objeto(estado.gravacao).baseline);
  const ciencia = objeto(estado.ciencia);
  const leituraCientifica = objeto(cockpit.leitura_cientifica);
  const iirh = objeto(leituraCientifica.iirh);
  const zona = objeto(leituraCientifica.zona);
  const resultante = objeto(leituraCientifica.resultante);
  const trajetoria = objeto(leituraCientifica.trajetoria);
  const coberturaVetorial = objeto(leituraCientifica.cobertura_vetorial);
  const definicoesVetoriais = lista(ciencia.vetores);
  const estadosVetoriais = lista(leituraCientifica.vetores);
  const estadosVetoriaisPorDefinicao = new Map(
    estadosVetoriais.map((item) => [String(item.definicao ?? ""), item])
  );
  const radarVetorial: HxVectorAxis[] = definicoesVetoriais.map((definicao) => {
    const identificador = identificadorVetorial(definicao);
    const estadoVetorial = estadosVetoriaisPorDefinicao.get(identificador);
    return {
      code: codigoVetorial(definicao),
      name: nomeVetorial(definicao),
      value: valorNormalizado(estadoVetorial?.magnitude)
    };
  });
  const radarCompleto = radarVetorial.length === 10
    && radarVetorial.every((item) => item.value != null);
  const iirhCalculado = iirh.estado === "CALCULADO"
    && typeof iirh.valor === "number";
  const resultanteCalculada = resultante.estado === "CALCULADO"
    && typeof resultante.valor === "number";
  const zonaCalculada = iirhCalculado && Boolean(zona.nome ?? zona.codigo);
  const trajetoriaCalculada = trajetoria.valor != null;
  const leituraCientificaVisivel = iirhCalculado
    || zonaCalculada
    || resultanteCalculada
    || trajetoriaCalculada
    || radarCompleto;
  const diagnosticosCientificos = [
    ["VETORES", coberturaVetorial],
    ["IIRH", objeto(iirh.cobertura_cientifica)],
    ["ZONA OPERACIONAL", objeto(zona.cobertura_cientifica)],
    ["RESULTANTE REGULATÓRIA", objeto(resultante.cobertura_cientifica)],
    ["TRAJETÓRIA REGULATÓRIA", objeto(trajetoria.cobertura_cientifica)]
  ] as const;

  useEffect(() => {
    const id = window.setInterval(() => setAgora(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const faixas: HxPhaseRange[] = (["PRE", "TREINO", "POS"] as const).flatMap((fase) => {
    const relacionados = eventos.filter((item) => item.momento === fase);
    const inicio = relacionados.find((item) => item.tipo === "INICIO");
    const fim = [...relacionados].reverse().find((item) => item.tipo === "ENCERRAMENTO");
    const start = new Date(String(inicio?.ocorrido_em ?? "")).getTime();
    const end = new Date(String(fim?.ocorrido_em ?? "")).getTime();
    if (!Number.isFinite(start)) return [];
    return [{
      name: fase === "PRE" ? "PRÉ" : fase === "POS" ? "PÓS" : "TREINO",
      start,
      end: Number.isFinite(end) ? end : agora
    }];
  });
  const marcadores: HxMarker[] = eventos.flatMap((item) => {
    const time = new Date(String(item.ocorrido_em ?? "")).getTime();
    if (!Number.isFinite(time)) return [];
    const dados = objeto(item.dados_json);
    const tipo = texto(dados.tipo ?? item.tipo);
    return [{
      time,
      label: tipo,
      kind: String(tipo).includes("INTERVEN") ? "intervention" : "event",
      phase: texto(item.momento)
    }];
  });
  const timelineItems = itensReplay.flatMap((item) => {
    const time = new Date(String(item.timestamp_original ?? "")).getTime();
    if (!Number.isFinite(time)) return [];
    return [{
      time,
      track: texto(item.modalidade, "EVENTO"),
      label: texto(objeto(item.dados_de_inspecao_json).tipo, "REGISTRO"),
      source: texto(item.origem, "NÚCLEO HUMANEXUS")
    }];
  });
  const trilhasVisiveis = [...new Set(timelineItems.map((item) => item.track))];
  const polar = fontes.find((item) => item.codigo === "POLAR_H10") ?? {};
  const eeg = fontes.find((item) => item.codigo === "EMOTIV_EPOC_X") ?? {};
  const fase = sessaoBaseline
    ? `BASELINE · ${baseline.estado}`
    : sessao.fase_atual
    ? texto(sessao.fase_atual)
    : sessaoFinalizada
      ? "SESSÃO ENCERRADA"
      : "SEM FASE ATIVA";
  const faseAtual = String(sessao.fase_atual ?? "");
  const passosDoFluxo = (
    sessaoBaseline ? ["BASELINE"] : ["PRE", "TREINO", "POS"]
  ).map((codigo) => {
    const estadoDoPasso = codigo === "BASELINE"
      ? texto(contextoSessao.estado)
      : texto(fases[codigo], "AGUARDANDO");
    return {
      codigo,
      rotulo: codigo === "PRE" ? "PRÉ" : codigo === "POS" ? "PÓS" : codigo,
      estado: estadoDoPasso,
      atual: sessaoBaseline
        ? !sessaoFinalizada
        : faseAtual === codigo,
      concluido: /CONCLUID|ENCERRAD|FINALIZAD/i.test(estadoDoPasso)
    };
  });
  const respostaObservada = objeto(execucao.resposta_observada_json);
  const resumoDaResposta = respostaObservada.descricao
    ?? respostaObservada.resposta
    ?? respostaObservada.resultado
    ?? (
      typeof execucao.resposta_observada_json === "string"
      && !String(execucao.resposta_observada_json).trim().startsWith("{")
        ? execucao.resposta_observada_json
        : null
    );
  const sensoresAguardando = [
    ["Polar H10", polar],
    ["EPOC X", eeg]
  ].filter(([, fonte]) => !["CONECTADO", "CAPTURANDO"].includes(
    String((fonte as Fonte).estado ?? "").toUpperCase().replaceAll("_", " ")
  )).map(([nome]) => nome);
  const orientacaoDeConexao = sensoresAguardando.length
    ? `Conecte ${sensoresAguardando.join(" e ")} para iniciar a leitura real. O Centro de Comando permanece pronto sem fabricar dados.`
    : "Fontes autorizadas conectadas. A leitura permanece condicionada à qualidade real dos sinais recebidos.";

  const enviarRegistro = async () => {
    if (!registro.trim()) return;
    await registrar(categoria, registro.trim());
    setRegistro("");
  };

  return (
    <section className="hx-live-cockpit" data-cockpit-mode={cockpit.modo}>
      <header className="hx-live-cockpit__masthead">
        <div className="hx-live-masthead-rail" aria-hidden="true"><i /><i /><i /></div>
        <div>
          <span className="hx-live-eyebrow">
            {modoHistorico
              ? "MODO OPERACIONAL — REPLAY HISTÓRICO"
              : modoAguardando
                ? "MODO OPERACIONAL — AGUARDANDO CONEXÃO"
                : "MODO OPERACIONAL AO VIVO"}
          </span>
          <h1>{texto(participante.nome ?? participante.referencia_externa, "Participante")}</h1>
          <p>
            Sessão {texto(contextoSessao.identificador)} · {
              sessaoBaseline
                ? "Baseline"
                : `THX ${texto(thx.codigo)} · ${texto(execucao.estado)}`
            }
          </p>
        </div>
        <div className="hx-live-mode-actions">
          <span className={modoHistorico ? "is-history" : modoAguardando ? "is-waiting" : "is-live"}>
            {modoHistorico
              ? "REPLAY HISTÓRICO"
              : modoAguardando
                ? "AGUARDANDO CONEXÃO"
                : "TELEMETRIA AO VIVO"}
          </span>
          <button type="button" onClick={abrirAnalitico}>Abrir Inspeção TIRH</button>
        </div>
      </header>

      {modoHistorico && !leituraCientificaVisivel ? (
        <div className="hx-live-historical-warning" role="status">
          <strong>REPRODUÇÃO HISTÓRICA DE SESSÃO CIENTIFICAMENTE INCOMPLETA</strong>
          <span>Somente dados técnicos, eventos e registros realmente preservados são apresentados neste modo.</span>
        </div>
      ) : null}

      <section className="hx-live-context-strip" aria-label="Contexto autorizado da sessão">
        <div><small>ORGANIZAÇÃO</small><strong>{texto(organizacao.nome)}</strong></div>
        <div><small>PROFISSIONAL</small><strong>{texto(profissional.nome)}</strong></div>
        <div><small>TIPO DA SESSÃO</small><strong>{sessaoBaseline ? "BASELINE" : "PRÉ → TREINO → PÓS"}</strong></div>
        <div><small>{sessaoBaseline ? "FLUXO" : "CTR / PROTOCOLO"}</small><strong>{sessaoBaseline ? "INDEPENDENTE" : `${texto(ctr.codigo)} · ${texto(thx.codigo)}`}</strong></div>
      </section>

      <section className="hx-live-hud" aria-label="HUD operacional fixo">
        <div><small>ÍNDICE DE INTELIGÊNCIA REGULATÓRIA HUMANA</small><strong>{iirhCalculado ? `${numero(iirh.valor, 1)} ${texto(iirh.unidade, "")}` : "NÃO CALCULÁVEL"}</strong><span>{iirhCalculado ? "Resultado canônico" : texto(iirh.motivo, "Evidência insuficiente")}</span></div>
        <div><small>ZONA OPERACIONAL</small><strong>{zonaCalculada ? texto(zona.nome ?? zona.codigo) : "NÃO CLASSIFICÁVEL"}</strong><span>{zonaCalculada ? "Classificação canônica" : texto(zona.motivo, "IIRH oficial indisponível")}</span></div>
        <div><small>THX</small><strong>{texto(thx.codigo)}</strong><span>{texto(execucao.estado)}</span></div>
        <div><small>FASE</small><strong>{fase}</strong><span>{texto(fases[String(sessao.fase_atual ?? "")], texto(contextoSessao.estado))}</span></div>
        <div><small>TEMPO</small><strong>{duracao(sessao.tempo_total_inicio, sessao.tempo_total_fim, agora)}</strong><span>Sessão</span></div>
        <div><small>FREQUÊNCIA CARDÍACA</small><strong><LeituraNumerica valor={objeto(polar.valores).hr_bpm} sufixo=" bpm" /></strong><span>{modoHistorico ? "Dado histórico" : texto(polar.estado)}</span></div>
        <div><small>RMSSD</small><strong><LeituraNumerica valor={objeto(polar.valores).rmssd_tecnico_ms} casas={1} sufixo=" ms" /></strong><span>{modoHistorico ? "Técnico histórico" : texto(polar.estado)}</span></div>
        <div><small>ESTADO DO EEG</small><strong>{texto(eeg.estado)}</strong><span>Qualidade {percentual(objeto(eeg.valores).qualidade_global)}</span></div>
        <div><small>ESTADO DO POLAR</small><strong>{texto(polar.estado)}</strong><span>Última sequência {numero(objeto(polar.metricas).ultima_sequencia)}</span></div>
      </section>

      <section className="hx-live-operation-focus" aria-label="Comando e progressão da sessão">
        <div className="hx-live-operation-flow">
          <small>FLUXO OPERACIONAL</small>
          <div>
            {passosDoFluxo.map((passo) => (
              <span
                className={[
                  passo.atual ? "is-current" : "",
                  passo.concluido ? "is-complete" : ""
                ].filter(Boolean).join(" ")}
                key={passo.codigo}
              >
                <b>{passo.rotulo}</b>
                <em>{passo.estado}</em>
              </span>
            ))}
          </div>
        </div>
        <div className="hx-live-operation-action">
          <small>COMANDO PRINCIPAL</small>
          {acaoPrincipal ? (
            <button
              className={`hx-live-command__primary ${
                acaoPrincipal.startsWith("ENCERRAR_") || acaoPrincipal === "CONCLUIR_SESSAO"
                  ? "is-critical"
                  : ""
              }`}
              type="button"
              onClick={executarPrincipal}
              disabled={ocupado}
            >
              {rotuloDaAcao}
            </button>
          ) : (
            <strong className="hx-live-command__done">
              Sessão sem ação pendente
            </strong>
          )}
        </div>
      </section>

      <div className="hx-live-command-center">
        {radarVetorial.length ? (
          <HxSurface as="section" className="hx-live-vector-stage">
            <HxSectionHeader
              eyebrow="VETORES VIVOS · MATRIZ VETORIAL"
              title="Dez vetores oficiais"
            />
            <VectorRadarChart vectors={radarVetorial} />
            <div className="hx-live-vector-list" aria-label="Estado dos dez vetores oficiais">
              {radarVetorial.map((vetor) => {
                const definicao = definicoesVetoriais.find(
                  (item) => codigoVetorial(item) === vetor.code
                );
                const estadoVetorial = estadosVetoriaisPorDefinicao.get(
                  identificadorVetorial(definicao ?? {})
                );
                return (
                  <div className={vetor.value == null ? "is-missing" : "has-value"} key={vetor.code}>
                    <div>
                      <span><b>{vetor.code}</b>{vetor.name}</span>
                      <strong>
                        {vetor.value == null
                          ? texto(
                              estadoVetorial?.estado,
                              "AGUARDANDO EVIDÊNCIA"
                            )
                          : `${(vetor.value * 100).toFixed(1)}%`}
                      </strong>
                    </div>
                    <span className="hx-live-vector-meter" aria-hidden="true">
                      {vetor.value == null
                        ? <em />
                        : <i style={{ width: `${vetor.value * 100}%` }} />}
                    </span>
                  </div>
                );
              })}
            </div>
          </HxSurface>
        ) : null}

        <HxSurface
          as="section"
          className="hx-live-graphs"
          data-signal-state={modoHistorico ? "HISTORICO" : modoAguardando ? "AGUARDANDO" : "ATIVO"}
        >
          <HxSectionHeader
            eyebrow={modoHistorico ? "DADOS PRESERVADOS" : modoAguardando ? "AGUARDANDO FONTES" : "ATIVIDADE AO VIVO"}
            title="Leitura temporal da sessão"
            aside={<span>{modoHistorico ? "Dados físicos históricos · sem transmissão atual" : modoAguardando ? "Nenhum dado é simulado enquanto os sensores não conectam" : "Atualização contínua sem recarregar a página"}</span>}
          />
          <div className="hx-live-temporal-rail" aria-label={sessaoBaseline ? "Linha temporal do Baseline" : "Linha temporal PRÉ TREINO PÓS"}>
            {passosDoFluxo.map((passo) => (
              <span
                className={[
                  passo.atual ? "is-current" : "",
                  passo.concluido ? "is-complete" : ""
                ].filter(Boolean).join(" ")}
                key={passo.codigo}
              >
                <i aria-hidden="true" />
                <b>{passo.rotulo}</b>
                <em>{passo.estado}</em>
              </span>
            ))}
          </div>
          {graficos.length
            ? (
              <CockpitSignalStack
                tracks={graficos}
                markers={marcadores}
                phases={faixas}
                showTechnicalLegend={false}
              />
            )
            : (
              <div className="hx-live-temporal-wait" role="status">
                <div className="hx-live-temporal-pulse" aria-hidden="true"><i /><i /><i /></div>
                <div>
                  <strong>AGUARDANDO EVIDÊNCIA REAL</strong>
                  <p>{orientacaoDeConexao}</p>
                </div>
              </div>
            )}
          {timelineItems.length ? (
            <div className="hx-live-replay-inline">
              <ReplayTimelineChart
                items={timelineItems}
                phases={faixas}
                markers={marcadores}
                cursorPercent={100}
                interval={[0, 100]}
                zoom={1}
                visibleTracks={trilhasVisiveis}
              />
            </div>
          ) : null}
          <footer className="hx-live-temporal-footer">
            <span>{sessaoBaseline
              ? "Baseline como modalidade independente"
              : "Ciclo independente de Baseline obrigatório"}</span>
            <span>{eventos.length} evento(s) preservado(s)</span>
            <span>Último registro {dataLegivel(replay.ultimo_evento)}</span>
          </footer>
        </HxSurface>
      </div>

      <section className="hx-live-regulatory-readout" aria-label="Resultante e trajetória regulatórias">
        <article>
          <small>RESULTANTE REGULATÓRIA</small>
          <strong>{resultanteCalculada
            ? `${numero(resultante.valor, 2)} ${texto(resultante.unidade, "")}`
            : "NÃO CALCULÁVEL"}</strong>
          <span>{resultanteCalculada
            ? "Configuração integrada oficialmente registrada"
            : texto(resultante.motivo, "Evidência humana insuficiente")}</span>
        </article>
        <article>
          <small>TRAJETÓRIA REGULATÓRIA</small>
          <strong>{trajetoriaCalculada ? texto(trajetoria.valor) : "NÃO INFERÍVEL"}</strong>
          <span>{trajetoriaCalculada
            ? "Estados sucessivos comparáveis"
            : "Um ponto isolado não produz trajetória"}</span>
        </article>
      </section>

      <details
        className="hx-live-scientific-coverage"
      >
        <summary>
          <span>
            <small>COBERTURA CIENTÍFICA</small>
            <strong>Ver requisitos por indicador</strong>
          </span>
          <em>Detalhe sob demanda · critérios oficiais do núcleo</em>
        </summary>
        <div>
          {diagnosticosCientificos.map(([rotulo, diagnostico]) => {
            const evidencias = lista(diagnostico.evidencias_recebidas);
            const fontesValidas = Array.isArray(diagnostico.fontes_validas)
              ? diagnostico.fontes_validas.map(String)
              : [];
            const requisitos = lista(diagnostico.requisitos_pendentes);
            return (
              <article key={rotulo}>
                <small>{rotulo}</small>
                <strong>{texto(
                  diagnostico.motivo_objetivo,
                  "Aguardando diagnóstico do núcleo"
                )}</strong>
                <dl>
                  <div>
                    <dt>Evidências recebidas</dt>
                    <dd>{evidencias.length
                      ? evidencias.map((item) => (
                          `${texto(item.fonte)}: ${numero(item.amostras_validas)} válida(s)`
                        )).join(" · ")
                      : "Nenhuma evidência registrada"}</dd>
                  </div>
                  <div>
                    <dt>Fontes válidas</dt>
                    <dd>{fontesValidas.join(" · ") || "Nenhuma"}</dd>
                  </div>
                  <div>
                    <dt>Janela acumulada</dt>
                    <dd>{diagnostico.janela_acumulada_segundos == null
                      ? "Ainda não iniciada"
                      : `${numero(diagnostico.janela_acumulada_segundos, 1)} s`}</dd>
                  </div>
                  <div>
                    <dt>Requisito restante</dt>
                    <dd>{requisitos.length
                      ? requisitos.map((item) => texto(
                          item.requisito,
                          "Requisito oficial pendente"
                        )).join(" · ")
                      : "Nenhum requisito pendente informado"}</dd>
                  </div>
                </dl>
              </article>
            );
          })}
        </div>
      </details>

      <details className="hx-live-technical-drawer">
        <summary>
          <span>FONTES TÉCNICAS E INTEGRIDADE</span>
          <strong>{texto(replay.estado, "REPLAY SINCRONIZANDO")} · {orientacaoDeConexao}</strong>
        </summary>
        <section className="hx-live-sources">
          <FontePolar fonte={polar} />
          <FonteEpoc fonte={eeg} />
          <article className="hx-live-source-card">
            <header><div><small>MÍDIA</small><strong>{texto(replay.midia, "SEM GRAVAÇÃO")}</strong></div><FonteEstado estado="SINCRONIZADA" /></header>
            <div className="hx-live-source-values">
              <span><small>Áudio/vídeo</small><b>{texto(replay.midia, "SEM GRAVAÇÃO")}</b></span>
              <span><small>Replay</small><b>{texto(replay.estado)}</b></span>
              <span><small>Armazenamento</small><b>PRIVADO</b></span>
              <span><small>Ausência de mídia</small><b>NÃO É FALHA</b></span>
            </div>
            <footer><span>Último evento {dataLegivel(replay.ultimo_evento)}</span><span>Fontes {Array.isArray(replay.fontes_sincronizadas) ? replay.fontes_sincronizadas.length : 0}</span></footer>
          </article>
          <article className="hx-live-source-card">
            <header><div><small>SIMULADOR OU TAREFA</small><strong>NÃO APLICÁVEL</strong></div><FonteEstado estado="NÃO SELECIONADO" /></header>
            <div className="hx-live-source-values">
              <span><small>Selecionado</small><b>NÃO</b></span>
              <span><small>Conectado</small><b>NÃO</b></span>
              <span><small>Telemetria</small><b>NÃO APLICÁVEL</b></span>
              <span><small>Eventos</small><b>{eventos.length}</b></span>
            </div>
            <footer><span>Nenhuma fonte artificial foi criada.</span></footer>
          </article>
        </section>
      </details>

      {indicadores.length ? (
        <section className="hx-live-indicators">
          <header><small>INDICADORES CONTRATADOS</small><strong>Aquisição e elegibilidade</strong></header>
          <div>
            {indicadores.map((item) => (
              <article key={texto(item.identificador ?? item.codigo)}>
                <small>{texto(item.nome ?? item.codigo)}</small>
                <strong>{texto(item.estado, "PREPARANDO")}</strong>
                <span>{item.validado_profissionalmente ? "VALIDADO PROFISSIONALMENTE" : "Monitoramento de requisitos ativo"}</span>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {alertas.length ? (
        <section className="hx-live-alerts">
          {alertas.map((alerta, indice) => (
            <article key={`${texto(alerta.titulo)}-${indice}`}>
              <small>{texto(alerta.titulo, "ALERTA OPERACIONAL")}</small>
              <strong>{texto(alerta.o_que_ocorreu)}</strong>
              <span>Indicador afetado: {texto(alerta.indicador_afetado ?? alerta.afetado)}</span>
              <span>Fase válida: {alerta.fase_continua_valida === false || alerta.sessao_pode_continuar === false ? "NÃO" : "VERIFICAR"}</span>
              <b>Ação: {texto(alerta.acao)}</b>
            </article>
          ))}
        </section>
      ) : null}

      <section className="hx-live-conduction" aria-label="Condução profissional da sessão">
        <div className="hx-live-intervention">
          <header><small>{sessaoBaseline ? "CONDUÇÃO DO BASELINE" : "INTERVENÇÃO SELECIONADA · EM APLICAÇÃO"}</small><strong>{sessaoBaseline ? "Referência regulatória independente" : texto(thx.nome, "Treinamento selecionado")}</strong></header>
          <div>
            <span><small>CRITÉRIO REGULATÓRIO</small><b>{sessaoBaseline ? "Modalidade independente" : texto(ctr.nome, "Critério preservado no contexto")}</b></span>
            <span><small>ESTADO DA APLICAÇÃO</small><b>{texto(execucao.estado, texto(contextoSessao.estado))}</b></span>
            <span><small>RESPOSTA OBSERVADA</small><b>{texto(resumoDaResposta, "AGUARDANDO REGISTRO PROFISSIONAL")}</b></span>
          </div>
        </div>

        <aside className="hx-live-command hx-live-command--secondary">
          <small>AÇÕES SECUNDÁRIAS PERMITIDAS</small>
          <div>
            {acoesSecundarias.map((comando) => (
              <button
                className={comando.startsWith("ENCERRAR_") || comando === "CONCLUIR_SESSAO" ? "is-critical" : ""}
                key={comando}
                type="button"
                onClick={() => executarSecundaria(comando)}
                disabled={ocupado}
              >
                {rotuloDaSecundaria(comando)}
              </button>
            ))}
          </div>
          <span>A ação principal permanece em foco acima. Comandos complementares são fornecidos exclusivamente pelo estado operacional do backend.</span>
        </aside>

        <div className="hx-live-register">
          <header><small>REGISTRO PROFISSIONAL RÁPIDO</small><strong>Contexto preenchido automaticamente</strong></header>
          <div>
            <select value={categoria} onChange={(evento) => setCategoria(evento.target.value)} disabled={sessaoFinalizada}>
              <option value="EVENTO">Evento</option>
              <option value="INTERVENCAO">Intervenção</option>
              <option value="RESPOSTA">Resposta</option>
              <option value="OBSERVACAO">Observação curta</option>
              <option value="DECISAO_PROFISSIONAL">Decisão profissional</option>
            </select>
            <input
              value={registro}
              onChange={(evento) => setRegistro(evento.target.value)}
              onKeyDown={(evento) => {
                if ((evento.metaKey || evento.ctrlKey) && evento.key === "Enter") void enviarRegistro();
              }}
              placeholder={sessaoFinalizada ? "Sessão finalizada — consulta somente" : "Registrar sem repetir participante, fase ou protocolo"}
              maxLength={500}
              disabled={sessaoFinalizada}
            />
            <button type="button" onClick={() => void enviarRegistro()} disabled={sessaoFinalizada || ocupado || !registro.trim()}>Registrar</button>
          </div>
          <span>Atalho: ⌘/Ctrl + Enter · organização, participante, sessão, fase, horário, THX, fontes e cobertura vêm do núcleo.</span>
        </div>

        <div className="hx-live-events">
          <header><small>EVENTOS RECENTES</small><strong>{eventos.length} preservados</strong></header>
          <ol>
            {[...eventos].reverse().slice(0, 8).map((item) => (
              <li key={texto(item.identificador)}>
                <span>{texto(item.momento)}</span>
                <b>{texto(objeto(item.dados_json).tipo ?? item.tipo)}</b>
                <small>{dataLegivel(item.ocorrido_em)}</small>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {erro ? <p className="hx-module__error">{erro}</p> : null}
    </section>
  );
}
