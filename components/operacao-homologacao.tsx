"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ModuloDaPlataforma } from "@/components/modulo-integrado";
import {
  CockpitSignalStack,
  EmptySignalState,
  LongitudinalEvolutionChart,
  PhaseComparisonChart,
  ReplayTimelineChart,
  TelemetryCommandChart,
  type HxDataPoint,
  type HxMarker,
  type HxPhaseRange,
  type HxTrack
} from "@/components/hx-command-visualizations";
import { HX_CHART_COLORS as C } from "@/lib/humanexus-chart-theme";
import { ControleGravacaoMultimodal } from "@/components/controle-gravacao-multimodal";
import { CockpitOperacionalVivo } from "@/components/cockpit-operacional-vivo";
import { HxSectionHeader } from "@/components/hx-design-system";
import {
  atrasoDoPollingCanonico,
  chaveDoContextoVivo,
  podeAplicarRespostaCanonica
} from "@/lib/cockpit-live-coordination";
import { publicarEstadoDoNucleo } from "@/lib/client-request";
import { criarPayloadDoComandoPrincipal } from "@/lib/cockpit-operational-command";
import { formatarPercentualCanonico } from "@/lib/percentual-canonico";
import { estadoOperacionalTerminal } from "@/lib/cockpit-terminal-eligibility";

type Registro = Record<string, unknown>;
type OpcoesDeCarregamento = {
  signal?: AbortSignal;
  identificadorDaConsulta?: number;
};
type Estado = {
  carregamento_progressivo?: boolean;
  usuario: Registro;
  organizacao: Registro;
  participante: Registro;
  sessao: Registro;
  estado_operacional: Registro;
  cockpit_operacional: Registro;
  contrato_cientifico: Registro;
  fases: Registro[];
  ctr_individual: (Registro & { criterios?: Registro[] }) | null;
  thx_individual: Registro | null;
  execucao: Registro | null;
  ciclo: Registro | null;
  eventos: Registro[];
  conectores: Registro[];
  historicos_conectores: { identificador: unknown; eventos: Registro[] }[];
  fontes: Registro[];
  telemetria: Registro[];
  eventos_tecnicos: Registro[];
  linhas: Registro[];
  replay: (Registro & { linha?: Registro; itens?: Registro[] }) | null;
  configuracao_cortex: Registro;
  gravacao: {
    baseline?: {
      registro?: Registro | null;
      fluxo_cientifico?: string[];
      referencia?: {
        estado?: string;
        pode_iniciar_pre?: boolean;
      };
    };
    configuracoes: Registro[];
    dispositivos: Registro[];
    segmentos: Registro[];
    eventos: Registro[];
    diagnostico: Registro;
  };
  rastreabilidade: Registro | null;
  relatorios: Registro[];
  formulacoes: Registro[];
  longitudinal: Registro;
  movel: { perfil: Registro; comandos: Registro[] };
  ciencia: {
    postulados: Registro;
    macrocampos: Registro[];
    vetores: Registro[];
    versao: Registro;
  };
  leitura_regulatoria: {
    evidencias: Registro[];
    estados_vetoriais: Registro[];
    configuracoes: Registro[];
    avaliacoes: Registro[];
    decisoes: Registro[];
    trajetorias: Registro[];
    arr: Registro[];
    rro: Registro[];
    anamneses: Registro[];
    evidencias_anamnese: Registro[];
    evidencias_anamnese_no_escopo: Registro[];
    formulacoes_no_escopo: Registro[];
  };
  contextos: {
    organizacoes: Registro[];
    participantes: Registro[];
    sessoes: Registro[];
    profissionais: Registro[];
    selecao: {
      identificador_da_organizacao: string;
      identificador_do_participante: string;
      identificador_da_sessao: string;
      identificador_do_profissional: string;
    };
  };
};

type ContextoParaSelecao = {
  organizacoes: Registro[];
  organizacao: Registro | null;
  participantes: Registro[];
  sessoes: Registro[];
};

const ABORTAR_POR_SINCRONIZACAO_INTEGRAL =
  "HUMANEXUS_SINCRONIZACAO_INTEGRAL";
const ABORTAR_POR_NOVO_CARREGAMENTO =
  "HUMANEXUS_NOVO_CARREGAMENTO_INTEGRAL";
const FASES = ["PRE", "TREINO", "POS"] as const;
type VisaoCockpit =
  | "visao-geral"
  | "evidencias"
  | "constituicao"
  | "matriz-vetorial"
  | "resultante"
  | "trajetoria"
  | "pre-treino-pos"
  | "rotas-regulatorias"
  | "ctr-thx"
  | "formulacao"
  | "longitudinal"
  | "replay"
  | "relatorio"
  | "coletivo"
  | "tecnico";

const VISOES_COCKPIT: { codigo: string; id: VisaoCockpit; nome: string }[] = [
  { codigo: "01", id: "visao-geral", nome: "Visão Geral" },
  { codigo: "02", id: "evidencias", nome: "Evidências" },
  { codigo: "03", id: "constituicao", nome: "Constituição Operacional da TIRH" },
  { codigo: "04", id: "matriz-vetorial", nome: "Matriz Vetorial Viva" },
  { codigo: "05", id: "resultante", nome: "Resultante" },
  { codigo: "06", id: "trajetoria", nome: "Trajetória" },
  { codigo: "07", id: "pre-treino-pos", nome: "PRÉ / TREINO / PÓS" },
  { codigo: "08", id: "rotas-regulatorias", nome: "Rotas Regulatórias" },
  { codigo: "09", id: "ctr-thx", nome: "CTR e THX" },
  { codigo: "10", id: "formulacao", nome: "Formulação" },
  { codigo: "11", id: "longitudinal", nome: "Longitudinal" },
  { codigo: "12", id: "replay", nome: "Replay" },
  { codigo: "13", id: "relatorio", nome: "Relatório" },
  { codigo: "14", id: "coletivo", nome: "Modo Coletivo" },
  { codigo: "15", id: "tecnico", nome: "Técnico" }
];

function csrf() {
  return document.cookie.split("; ").find((item) => item.startsWith("humanexus_csrf="))?.split("=")[1] ?? "";
}

function texto(valor: unknown, padrao = "INDISPONÍVEL") {
  return valor == null || valor === "" ? padrao : String(valor).replaceAll("_", " ");
}

function objeto(valor: unknown): Registro {
  if (valor && typeof valor === "object" && !Array.isArray(valor)) return valor as Registro;
  if (typeof valor === "string") {
    try {
      const item = JSON.parse(valor);
      return item && typeof item === "object" && !Array.isArray(item) ? item : {};
    } catch {
      return {};
    }
  }
  return {};
}

function mesclarAtualizacaoIncremental(
  anterior: unknown,
  alteracao: unknown
): unknown {
  if (alteracao === undefined) return anterior;
  if (
    alteracao === null
    || Array.isArray(alteracao)
    || typeof alteracao !== "object"
  ) {
    return alteracao;
  }
  const base = anterior && typeof anterior === "object" && !Array.isArray(anterior)
    ? anterior as Registro
    : {};
  return Object.fromEntries(
    Array.from(
      new Set([...Object.keys(base), ...Object.keys(alteracao as Registro)])
    ).map((chave) => [
        chave,
        Object.prototype.hasOwnProperty.call(alteracao, chave)
          ? mesclarAtualizacaoIncremental(
              base[chave],
              (alteracao as Registro)[chave]
            )
          : base[chave]
      ])
  );
}

function lista(valor: unknown): unknown[] {
  if (Array.isArray(valor)) return valor;
  if (typeof valor !== "string" || !valor) return [];
  try {
    const convertido = JSON.parse(valor);
    return Array.isArray(convertido) ? convertido : [];
  } catch {
    return [];
  }
}

function instante(valor: unknown) {
  const numero = new Date(String(valor ?? "")).getTime();
  return Number.isFinite(numero) ? numero : 0;
}

function dataLegivel(valor: unknown) {
  if (!valor) return "Não registrado";
  const data = new Date(String(valor));
  return Number.isNaN(data.getTime())
    ? texto(valor)
    : new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "medium",
        timeZone: "America/Manaus"
      }).format(data);
}

function RelatorioCanonico({ relatorio }: { relatorio?: Registro }) {
  const secoes = lista(relatorio?.secoes).map(objeto);
  if (!secoes.length) {
    return (
      <EmptySignalState
        title="CONTEÚDO DO RELATÓRIO"
        reason="O relatório nominal desta sessão ainda não está disponível."
      />
    );
  }
  return (
    <section className="hx-report-canonical" aria-label="Conteúdo nominal do relatório">
      {secoes.map((secao, indice) => (
        <article key={texto(secao.codigo, `secao-${indice}`)}>
          <small>{texto(secao.codigo, "SEÇÃO DO RELATÓRIO")}</small>
          <h3>{texto(secao.titulo, "Registro da sessão")}</h3>
          <ul>
            {lista(secao.itens).map((item, itemIndice) => (
              <li key={`${indice}-${itemIndice}`}>{texto(item, "Sem informação registrada.")}</li>
            ))}
          </ul>
        </article>
      ))}
    </section>
  );
}

const BANDAS_ANI_LONGITUDINAIS = [
  { codigo: "theta", nome: "Theta", cor: C.gold },
  { codigo: "alpha", nome: "Alpha", cor: C.warmWhite },
  { codigo: "beta_baixa", nome: "Beta baixa", cor: C.cyan },
  { codigo: "beta_alta", nome: "Beta alta", cor: C.amber },
  { codigo: "gamma", nome: "Gamma", cor: C.red }
] as const;

function EvolucaoDaAssinaturaNeuroregulatoria({ longitudinal }: { longitudinal: Registro }) {
  const atual = objeto(longitudinal.atual ?? longitudinal.projecao_atual ?? longitudinal);
  const sinais = objeto(atual.sinais_longitudinais);
  const evolucao = objeto(sinais.evolucao_da_assinatura_neuroregulatoria);
  const observacoes = lista(evolucao.observacoes).map(objeto);
  const trilhas: HxTrack[] = BANDAS_ANI_LONGITUDINAIS.map((definicao) => ({
    id: `ani-longitudinal-${definicao.codigo}`,
    name: definicao.nome,
    unit: "µV²/Hz",
    color: definicao.cor,
    points: observacoes.flatMap((observacao) => {
      const time = instante(observacao.timestamp);
      if (!time) return [];
      const banda = lista(observacao.bandas)
        .map(objeto)
        .find((item) => String(item.codigo) === definicao.codigo);
      return [{
        time,
        value: typeof banda?.valor_observado === "number"
          ? banda.valor_observado
          : null,
        label: texto(observacao.fase, "Sessão"),
        source: "ANI-TIRH · EMOTIV Cortex pow",
        gap: banda?.valor_observado == null
      }];
    }),
    emptyReason: "Não há observações comparáveis desta banda no histórico autorizado."
  }));
  const possuiValores = trilhas.some((trilha) =>
    trilha.points.some((ponto) => ponto.value != null)
  );
  return (
    <section className="hx-cockpit-panel hx-ani-longitudinal">
      <HxSectionHeader
        eyebrow="ANI-TIRH v0.1 · EXPERIMENTAL — EM VALIDAÇÃO LONGITUDINAL"
        title="Evolução da Assinatura Neuroregulatória"
        description="Comparação intraindividual por sessão e fase. Associação temporal não implica causalidade; ausência permanece ausência."
        aside={<span>{texto(evolucao.estado, "EVIDÊNCIA TEMPORAL AINDA INSUFICIENTE")}</span>}
      />
      {possuiValores ? (
        <CockpitSignalStack
          tracks={trilhas}
          markers={[]}
          phases={[]}
          showTechnicalLegend={false}
          primaryDataLabel="Observação ANI-TIRH"
        />
      ) : (
        <EmptySignalState
          title="ASSINATURA NEUROREGULATÓRIA"
          status="EVIDÊNCIA TEMPORAL AINDA INSUFICIENTE"
          reason="Ainda não existem observações neurodinâmicas intraindividuais comparáveis suficientes. Nenhum valor é estimado ou preenchido."
        />
      )}
    </section>
  );
}

function faseAtual(estado: Estado | null) {
  const canonico = objeto(estado?.estado_operacional);
  if (canonico.fase_cientifica_atual) {
    return texto(canonico.fase_cientifica_atual);
  }
  if (estadoOperacionalTerminal(canonico.estado_da_sessao)) {
    return "NENHUMA FASE ATIVA";
  }
  return "NENHUMA FASE ATIVA";
}

function comandoPermitido(estado: Estado, comando: string) {
  const canonico = objeto(estado.estado_operacional);
  const permitidas = Array.isArray(canonico.acoes_operacionais_permitidas)
    ? canonico.acoes_operacionais_permitidas.map(String)
    : [];
  if (permitidas.length) return permitidas.includes(comando);
  const secundarias = Array.isArray(canonico.acoes_secundarias_permitidas)
    ? canonico.acoes_secundarias_permitidas.map(String)
    : [];
  return canonico.proxima_acao_principal === comando
    || secundarias.includes(comando);
}

const ROTULOS_DOS_COMANDOS: Record<string, string> = {
  PREPARAR_SESSAO: "Preparar sessão",
  DEFINIR_REFERENCIA_BASELINE: "Definir referência de baseline",
  INICIAR_BASELINE: "Iniciar Baseline",
  PAUSAR_BASELINE: "Pausar Baseline",
  RETOMAR_BASELINE: "Retomar Baseline",
  ENCERRAR_BASELINE: "Encerrar Baseline",
  INICIAR_PRE: "Iniciar PRÉ",
  PAUSAR_PRE: "Pausar PRÉ",
  RETOMAR_PRE: "Retomar PRÉ",
  ENCERRAR_PRE: "Encerrar PRÉ",
  INICIAR_TREINO: "Iniciar TREINO",
  PAUSAR_TREINO: "Pausar TREINO",
  RETOMAR_TREINO: "Retomar TREINO",
  ENCERRAR_TREINO: "Encerrar TREINO",
  INICIAR_POS: "Iniciar PÓS",
  PAUSAR_POS: "Pausar PÓS",
  RETOMAR_POS: "Retomar PÓS",
  ENCERRAR_POS: "Encerrar PÓS",
  CONCLUIR_SESSAO: "Concluir sessão",
  RECUPERAR_ESTACAO: "Recuperar estação",
  ENCERRAR_TECNICAMENTE_POR_INCIDENTE:
    "Encerrar tecnicamente por incidente",
  REGISTRAR_EVENTO: "Registrar evento",
  REGISTRAR_INTERVENCAO: "Registrar intervenção",
  ABRIR_REPLAY: "Abrir Replay",
  GERAR_RELATORIO: "Gerar relatório"
};

function rotuloDoComandoCentral(comando: string) {
  if (comando === "PREPARAR_SESSAO") return "PREPARAR SESSÃO";
  if (
    comando.startsWith("INICIAR_")
    || comando.startsWith("PAUSAR_")
    || comando.startsWith("RETOMAR_")
    || comando.startsWith("ENCERRAR_")
  ) {
    return (ROTULOS_DOS_COMANDOS[comando] ?? texto(comando)).toUpperCase();
  }
  if (comando === "CONCLUIR_SESSAO") {
    return "ENCERRAR SESSÃO";
  }
  return ROTULOS_DOS_COMANDOS[comando] ?? texto(comando);
}

function Botao({
  onClick,
  children,
  disabled = false,
  forte = false
}: {
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  forte?: boolean;
}) {
  return (
    <button
      className={forte ? "hx-op-button hx-op-button--gold" : "hx-op-button"}
      type="button"
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

function Metadado({
  rotulo,
  valor,
  situacao,
  fonte
}: {
  rotulo: string;
  valor: string;
  situacao: string;
  fonte: string;
}) {
  return <div className="hx-hud-cell"><small>{rotulo}</small><strong>{valor}</strong><span>{situacao}</span><em>{fonte}</em></div>;
}

function AvisoTecnico({ estado }: { estado?: Estado }) {
  const fontes = Array.isArray(estado?.cockpit_operacional?.fontes)
    ? estado?.cockpit_operacional?.fontes as Registro[]
    : [];
  const possuiDadosFisicos = fontes.some(
    (fonte) => Number(objeto(fonte.metricas).amostras ?? 0) > 0
  );
  return (
    <div className="hx-op-hud__warning">
      <span>
        {possuiDadosFisicos
          ? "Sinais físicos atuais permanecem vinculados à sessão e separados da interpretação profissional."
          : "Sem leitura física atual. Indicadores sem evidência permanecem sem valor."}
      </span>
      <b>
        {possuiDadosFisicos
          ? "FONTE REAL · FRESCOR CANÔNICO"
          : "SEM LEITURA ATUAL"}
      </b>
    </div>
  );
}

function telemetriaOrdenada(telemetria: Registro[]) {
  return [...telemetria].sort((a, b) => {
    const tempo = instante(a.timestamp_de_origem) - instante(b.timestamp_de_origem);
    return tempo || Number(a.sequencia) - Number(b.sequencia);
  });
}

function pontoTecnico(item: Registro, valor: number | null, rotulo: string): HxDataPoint {
  const dispositivo = String(item.tipo_de_dispositivo ?? "");
  return {
    time: instante(item.timestamp_de_origem),
    value: valor,
    label: rotulo,
    phase: texto(item.momento, "DADO TÉCNICO"),
    source: dispositivo.includes("EMOTIV")
      ? "EPOC X"
      : dispositivo.includes("POLAR")
        ? "Polar H10"
        : "Ponte de telemetria",
    quality: Number(item.qualidade ?? 0),
    coverage: null,
    connection: Number(item.perda_detectada ?? 0) > 0
      ? "PERDA DETECTADA"
      : Boolean(item.fora_de_ordem)
        ? "FORA DE ORDEM"
        : "RECEBIDO",
    gap: Number(item.perda_detectada ?? 0) > 0,
    event: Boolean(item.fora_de_ordem) ? "PACOTE FORA DE ORDEM" : undefined
  };
}

function pontosTelemetria(telemetria: Registro[], campo: "latencia_ms" | "buffer") {
  return telemetriaOrdenada(telemetria).map((item) => {
    const valor = campo === "buffer"
      ? Number(objeto(objeto(item.dado_normalizado_json).valor).buffer)
      : Number(item.latencia_ms);
    return pontoTecnico(
      item,
      Number.isFinite(valor) ? valor : null,
      `Seq. ${texto(item.sequencia)} · ${dataLegivel(item.timestamp_de_origem)}`
    );
  });
}

function pontosFrequencia(telemetria: Registro[]) {
  const itens = telemetriaOrdenada(telemetria);
  return itens.map((item, indice) => {
    if (!indice) return pontoTecnico(item, null, `Seq. ${texto(item.sequencia)} · início da janela`);
    const atual = instante(item.timestamp_de_origem);
    const anterior = instante(itens[indice - 1].timestamp_de_origem);
    return pontoTecnico(
      item,
      atual > anterior ? 1000 / (atual - anterior) : null,
      `Seq. ${texto(item.sequencia)} · frequência observada`
    );
  });
}

function momentos(estado: Estado) {
  return Array.isArray(estado.ciclo?.momentos) ? estado.ciclo.momentos as Registro[] : [];
}

function marcadoresDaSessao(estado: Estado): HxMarker[] {
  const eventos: HxMarker[] = estado.eventos.flatMap((evento) => {
    const time = instante(evento.ocorrido_em);
    if (!time) return [];
    const detalhe = objeto(evento.dados_json ?? evento.dados);
    const intervencao = Boolean(detalhe.intervencao) || String(detalhe.tipo ?? "").includes("INTERVENCAO");
    return [{
      time,
      label: intervencao ? "INTERVENÇÃO PROFISSIONAL" : texto(evento.tipo),
      kind: intervencao ? "intervention" : "event",
      phase: texto(evento.momento)
    }];
  });
  const conectores: HxMarker[] = estado.historicos_conectores.flatMap((historico) =>
    historico.eventos.flatMap((evento) => {
      const time = instante(evento.ocorrido_em ?? evento.criado_em);
      const destino = String(evento.estado_destino ?? evento.estado ?? "");
      if (!time || !["ERRO", "RECONECTANDO", "TRANSMITINDO"].includes(destino)) return [];
      return [{
        time,
        label: destino === "ERRO" ? "DESCONEXÃO" : destino === "RECONECTANDO" ? "RECONEXÃO" : "CONEXÃO RESTABELECIDA",
        kind: destino === "ERRO" ? "disconnect" : "reconnect"
      }];
    })
  );
  return [...eventos, ...conectores].sort((a, b) => a.time - b.time);
}

function faixasDasFases(estado: Estado): HxPhaseRange[] {
  const registros = momentos(estado);
  return FASES.flatMap((fase) => {
    const inicioEvento = estado.eventos.find((item) => item.momento === fase && item.tipo === "INICIO");
    const fimEvento = [...estado.eventos].reverse().find((item) => item.momento === fase && item.tipo === "ENCERRAMENTO");
    const snapshot = registros.find((item) => item.momento === fase);
    const start = instante(inicioEvento?.ocorrido_em ?? snapshot?.inicio_da_janela ?? snapshot?.coletado_em);
    const end = instante(fimEvento?.ocorrido_em ?? snapshot?.fim_da_janela ?? snapshot?.coletado_em);
    if (!start && !end) return [];
    const inicio = start || Math.max(0, end - 60_000);
    const fim = Math.max(inicio + 1_000, end || inicio + 60_000);
    return [{ name: fase === "PRE" ? "PRÉ" : fase === "POS" ? "PÓS" : "TREINO", start: inicio, end: fim }];
  });
}

function trilhasDoCockpit(estado: Estado): HxTrack[] {
  const registros = momentos(estado);
  const qualidade = registros.map((item) => ({
    time: instante(item.coletado_em),
    value: Number(item.confiabilidade ?? 0) * 100,
    phase: texto(item.momento),
    source: "Snapshot independente do núcleo",
    quality: Number(item.confiabilidade ?? 0),
    coverage: Number(item.cobertura ?? 0),
    connection: "PRESERVADO",
    label: dataLegivel(item.coletado_em)
  }));
  const cobertura = registros.map((item) => ({
    time: instante(item.coletado_em),
    value: Number(item.cobertura ?? 0) * 100,
    phase: texto(item.momento),
    source: "Snapshot independente do núcleo",
    quality: Number(item.confiabilidade ?? 0),
    coverage: Number(item.cobertura ?? 0),
    connection: "PRESERVADO",
    label: dataLegivel(item.coletado_em)
  }));
  return [
    {
      id: "hr",
      name: "HR",
      unit: "bpm",
      color: C.gold,
      points: [],
      emptyReason: "Polar ou sensor cardíaco humano não conectado."
    },
    {
      id: "rmssd",
      name: "RMSSD",
      unit: "ms",
      color: C.cyan,
      points: [],
      emptyReason: "Nenhuma série humana de variabilidade foi recebida."
    },
    {
      id: "eeg",
      name: "EEG autorizado",
      unit: "µV",
      color: C.green,
      points: [],
      emptyReason: "Headset EEG humano não conectado."
    },
    {
      id: "quality",
      name: "Qualidade",
      unit: "%",
      color: C.green,
      points: qualidade,
      min: 0,
      max: 100,
      area: true
    },
    {
      id: "coverage",
      name: "Cobertura",
      unit: "%",
      color: C.cyan,
      points: cobertura,
      min: 0,
      max: 100,
      area: true
    },
    {
      id: "telemetry",
      name: "Telemetria técnica",
      unit: "ms",
      color: C.gold,
      points: pontosTelemetria(estado.telemetria, "latencia_ms"),
      technical: true
    }
  ];
}

function fasesComparaveis(estado: Estado) {
  return FASES.map((fase) => {
    const item = momentos(estado).find((registro) => registro.momento === fase);
    const inicio = instante(item?.inicio_da_janela);
    const fim = instante(item?.fim_da_janela);
    const sensores = lista(item?.sensores_utilizados_json ?? item?.sensores_utilizados)
      .map((sensor) => texto(objeto(sensor).identificador))
      .filter((sensor) => sensor !== "INDISPONÍVEL");
    const ausencias = lista(item?.ausencias_json ?? item?.ausencias).map((ausencia) => texto(ausencia));
    return {
      name: (fase === "PRE" ? "PRÉ" : fase === "POS" ? "PÓS" : "TREINO") as "PRÉ" | "TREINO" | "PÓS",
      time: instante(item?.coletado_em),
      quality: item ? Number(item.confiabilidade ?? 0) * 100 : null,
      coverage: item ? Number(item.cobertura ?? 0) * 100 : null,
      durationSeconds: inicio && fim ? Math.max(0, Math.round((fim - inicio) / 1000)) : null,
      sources: sensores,
      gaps: ausencias
    };
  });
}

function Rastreabilidade({ estado }: { estado: Estado }) {
  const cadeiaCientifica = objeto(
    objeto(estado.cockpit_operacional).cadeia_cientifica
  );
  const cadeia = Object.keys(cadeiaCientifica).length
    ? cadeiaCientifica
    : objeto(estado.rastreabilidade?.cadeia);
  const valorRastreavel = (valor: unknown) => {
    const item = objeto(valor);
    if (Object.keys(item).length) {
      return item.estado ?? item.codigo ?? item.identificador ?? item.nome;
    }
    return valor;
  };
  const itens: [string, unknown][] = [
    ["ARR", valorRastreavel(cadeia.arr)],
    ["RRO", valorRastreavel(cadeia.rro)],
    ["NRA", valorRastreavel(cadeia.nra)],
    ["CTR individual", estado.ctr_individual?.codigo ?? estado.ctr_individual?.identificador],
    ["THX individual", estado.thx_individual?.identificador],
    ["Execução", estado.execucao?.identificador],
    ["PRÉ / TREINO / PÓS", momentos(estado).length === 3 ? "3 snapshots preservados" : null],
    ["Eventos", `${estado.eventos.length} preservados`],
    ["Replay", estado.replay?.linha?.identificador],
    ["Formulação", estado.formulacoes.at(-1)?.identificador],
    ["Longitudinal", Array.isArray(estado.longitudinal?.historico) && (estado.longitudinal.historico as unknown[]).length ? "Disponível" : null],
    ["Relatório", estado.relatorios.at(-1)?.identificador]
  ];
  return (
    <section className="hx-trace">
      <p>RASTREABILIDADE DA SESSÃO</p>
      <div>
        {itens.map(([nome, valor]) => (
          <article key={nome} className={valor ? "is-present" : "is-missing"}>
            <small>{nome}</small>
            <strong>{valor ? texto(valor) : "SEM REGISTRO NESTA SESSÃO"}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}

function Hud({ estado }: { estado: Estado }) {
  const fase = faseAtual(estado);
  const contrato = objeto(estado.contrato_cientifico);
  const indicadores = Array.isArray(contrato.indicadores)
    ? contrato.indicadores as Registro[]
    : [];
  return (
    <section className="hx-op-hud">
      <div className="hx-op-hud__grid">
        {indicadores.map((indicador) => {
          const valor = objeto(indicador.valor);
          return (
            <Metadado
              key={texto(indicador.identificador ?? indicador.codigo)}
              rotulo={texto(indicador.nome ?? indicador.codigo)}
              valor={valor.valor == null
                ? texto(indicador.estado, "PREPARANDO")
                : texto(valor.valor)}
              situacao={texto(
                indicador.validado_profissionalmente
                  ? "VALIDADO PROFISSIONALMENTE"
                  : indicador.estado
              )}
              fonte={`Contrato científico ${texto(contrato.versao_do_catalogo)}`}
            />
          );
        })}
        {!indicadores.length ? (
          <Metadado
            rotulo="CONTRATO CIENTÍFICO"
            valor="NÃO GERADO"
            situacao="NENHUM INDICADOR PROMETIDO"
            fonte="A sessão histórica permanece cientificamente incompleta"
          />
        ) : null}
        <Metadado rotulo="THX" valor={texto(estado.thx_individual?.codigo)} situacao={texto(estado.execucao?.estado)} fonte="Execução individual" />
        <Metadado rotulo="FASE" valor={fase} situacao={texto(estado.sessao.estado)} fonte="Eventos da sessão" />
        <Metadado rotulo="TEMPO" valor={estado.execucao?.iniciado_em ? dataLegivel(estado.execucao.iniciado_em) : "NÃO INICIADO"} situacao="HORÁRIO LOCAL" fonte="Auditoria UTC preservada" />
      </div>
    </section>
  );
}

function Contexto({ estado }: { estado: Estado }) {
  return (
    <section className="hx-op-context">
      <div><small>ORGANIZAÇÃO</small><strong>{texto(estado.organizacao.nome)}</strong></div>
      <div><small>PARTICIPANTE</small><strong>{texto(estado.participante.nome ?? estado.participante.referencia_externa)}</strong></div>
      <div><small>SESSÃO</small><strong>{texto(estado.sessao.estado)}</strong><span>{dataLegivel(estado.sessao.finalizado_em ?? estado.sessao.iniciado_em)}</span></div>
      <div><small>CTR INDIVIDUAL</small><strong>{texto(estado.ctr_individual?.codigo ?? estado.ctr_individual?.identificador)}</strong><span>{texto(estado.ctr_individual?.nome)} · {texto(estado.ctr_individual?.situacao)}</span></div>
      <div><small>THX INDIVIDUAL</small><strong>{texto(estado.thx_individual?.codigo)}</strong><span>{texto(estado.execucao?.estado)}</span></div>
    </section>
  );
}

function Identificacao({ estado }: { estado: Estado }) {
  return (
    <section className="hx-identification">
      <article>
        <p>CTR INDIVIDUAL EXISTENTE</p>
        <h3>{texto(estado.ctr_individual?.codigo)} · {texto(estado.ctr_individual?.nome)}</h3>
        <dl>
          <div><dt>Situação</dt><dd>{texto(estado.ctr_individual?.situacao)}</dd></div>
          <div><dt>Origem do vínculo</dt><dd>{texto(estado.ctr_individual?.origem_do_vinculo)}</dd></div>
          <div><dt>Condição de validação</dt><dd>{texto(estado.ctr_individual?.condicao_de_validacao)}</dd></div>
        </dl>
        <ul>
          {estado.ctr_individual?.criterios?.map((item) => (
            <li key={String(item.codigo)}><b>{texto(item.codigo)}</b><span>{texto(item.nome)}</span></li>
          ))}
        </ul>
      </article>
      <article>
        <p>THX INDIVIDUAL VINCULADO</p>
        <h3>{texto(estado.thx_individual?.codigo)} · {texto(estado.thx_individual?.nome)}</h3>
        <dl>
          <div><dt>Situação</dt><dd>{texto(estado.execucao?.estado)}</dd></div>
          <div><dt>CTR vinculado</dt><dd>{texto(estado.thx_individual?.ctr_vinculado)}</dd></div>
          <div><dt>Profissional</dt><dd>{texto(estado.thx_individual?.profissional_que_autorizou)}</dd></div>
        </dl>
        <p className="hx-identification__restriction">
          {estado.thx_individual?.executavel_como_protocolo_humano
            ? "PROTOCOLO AUTORIZADO PARA CONDUÇÃO PROFISSIONAL"
            : "VÍNCULO DOCUMENTAL · NÃO EXECUTÁVEL COMO PROTOCOLO HUMANO REAL"}
        </p>
      </article>
    </section>
  );
}

function valorDoRegistro(registro: Registro | undefined, ...chaves: string[]) {
  if (!registro) return null;
  for (const chave of chaves) {
    const valor = registro[chave];
    if (valor != null && valor !== "") return valor;
  }
  return null;
}

function nomeDoPostulado(registro: Registro) {
  const valor = String(registro.postulado ?? registro.nome ?? registro.codigo ?? "");
  const normalizado = valor.toUpperCase().replaceAll(" ", "_");
  const nomes: Record<string, string> = {
    DINAMICA_REGULATORIA: "Postulado da Dinâmica Regulatória",
    MULTIVETORIALIDADE: "Postulado da Multivetorialidade",
    INTEGRACAO_REGULATORIA: "Postulado da Integração Regulatória",
    RESULTANTE_REGULATORIA: "Postulado da Resultante Regulatória",
    TRAJETORIA_REGULATORIA: "Postulado da Trajetória Regulatória",
    MENSURABILIDADE_PARCIAL: "Postulado da Mensurabilidade Parcial",
    ADAPTACAO: "Postulado da Adaptação"
  };
  return nomes[normalizado] ?? texto(valor);
}

function codigoDoMacrocampo(registro: Registro) {
  return texto(valorDoRegistro(registro, "code", "codigo"), "");
}

function nomeDoMacrocampo(registro: Registro) {
  const codigo = codigoDoMacrocampo(registro);
  const nomesOficiais: Record<string, string> = {
    MCH: "Campo Humano",
    MCT: "Campo da Tarefa",
    MCE: "Campo Estruturante",
    MCN: "Campo Neuroregulatório"
  };
  return nomesOficiais[codigo] ?? texto(valorDoRegistro(registro, "name", "nome"));
}

function codigoDoVetor(registro: Registro) {
  return texto(valorDoRegistro(registro, "code", "codigo"), "");
}

function nomeDoVetor(registro: Registro) {
  return texto(valorDoRegistro(registro, "name", "nome"));
}

function leituraCientificaDaInspecao(estado: Estado) {
  return objeto(objeto(estado.cockpit_operacional).leitura_cientifica);
}

function configuracaoBasalDaInspecao(estado: Estado) {
  const configuracao = objeto(
    leituraCientificaDaInspecao(estado).configuracao_regulatoria_basal
  );
  return String(configuracao.identificador_da_sessao ?? "")
    === String(estado.sessao.identificador ?? "")
    ? configuracao
    : {};
}

function vetoresCanonicosDaInspecao(estado: Estado) {
  const leitura = leituraCientificaDaInspecao(estado);
  const configuracaoBasal = configuracaoBasalDaInspecao(estado);
  const fase = String(
    objeto(estado.estado_operacional).fase_cientifica_atual ?? ""
  );
  const vetoresBasais = lista(configuracaoBasal.vetores) as Registro[];
  const vetoresAtuais = lista(leitura.vetores) as Registro[];
  return !fase && vetoresBasais.length ? vetoresBasais : vetoresAtuais;
}

function estadoDoVetor(estado: Estado, definicao: Registro) {
  const identificador = valorDoRegistro(definicao, "id", "identificador");
  const codigo = codigoDoVetor(definicao);
  return vetoresCanonicosDaInspecao(estado).find((item): item is Registro =>
    [
      item.definicao,
      item.codigo,
      item.identificador_da_definicao_vetorial,
      item.identificador_do_vetor,
      item.codigo_do_vetor
    ].some((valor) => valor === identificador || valor === codigo)
  ) ?? estado.leitura_regulatoria.estados_vetoriais.find((item): item is Registro =>
    [
      item.identificador_da_definicao_vetorial,
      item.identificador_do_vetor,
      item.codigo_do_vetor,
      item.codigo
    ].some((valor) => valor === identificador || valor === codigo)
  );
}

function valorVetorial(valor: unknown, indisponivel: string) {
  if (valor == null || valor === "") return indisponivel;
  if (typeof valor === "object") {
    const registro = objeto(valor);
    const interno = valorDoRegistro(registro, "valor", "dominio_funcional", "descricao_funcional", "estado");
    return interno == null ? indisponivel : texto(interno);
  }
  return texto(valor);
}

function ContextoPersistente({ estado, visao }: { estado: Estado; visao: VisaoCockpit }) {
  const finalizada = estadoOperacionalTerminal(estado.sessao.estado);
  const detalhes = objeto(estado.sessao.detalhes_operacionais);
  const tipoDaSessao = String(
    detalhes.tipo_de_sessao
    ?? objeto(estado.estado_operacional).tipo_de_sessao
    ?? "PRE_TREINO_POS"
  );
  const profissional = estado.contextos.profissionais.find(
    (item) => String(item.identificador)
      === estado.contextos.selecao.identificador_do_profissional
  );
  return (
    <>
      <section className="hx-cockpit-context" aria-label="Contexto preservado do Cockpit">
        <div><small>Participante</small><strong>{texto(estado.participante.nome ?? estado.participante.referencia_externa)}</strong></div>
        <div><small>Organização</small><strong>{texto(estado.organizacao.nome)}</strong></div>
        <div><small>Profissional</small><strong>{texto(profissional?.nome)}</strong></div>
        <div><small>Sessão</small><strong>{texto(estado.sessao.nome_operacional, "Sessão sem nome legado")}</strong></div>
        <div><small>Estado da sessão</small><strong>{texto(detalhes.estado_operacional ?? estado.sessao.estado)}</strong></div>
        <div><small>Tipo da sessão</small><strong>{tipoDaSessao === "BASELINE" ? "Baseline" : "PRÉ → TREINO → PÓS"}</strong></div>
        <div><small>Finalidade</small><strong>{texto(detalhes.finalidade)}</strong></div>
        <div><small>CTR / THX</small><strong>{texto(estado.ctr_individual?.codigo ?? estado.ctr_individual?.identificador)} · {texto(estado.thx_individual?.codigo)}</strong></div>
        <div><small>Fase atual</small><strong>{faseAtual(estado)}</strong></div>
        <div><small>Próxima ação</small><strong>{texto(objeto(estado.estado_operacional).proxima_acao_principal, "SEM AÇÃO PENDENTE")}</strong></div>
        {visao !== "visao-geral" ? (
          <>
            <div><small>Versão científica</small><strong>{texto(valorDoRegistro(estado.ciencia.versao, "code", "codigo"))}</strong></div>
            <div><small>Visão interna</small><strong>{VISOES_COCKPIT.find((item) => item.id === visao)?.nome}</strong></div>
          </>
        ) : null}
      </section>
      {finalizada ? (
        <section className="hx-session-final">
          <strong>SESSÃO FINALIZADA</strong>
          <span>{tipoDaSessao === "BASELINE"
            ? "Baseline preservado · dados congelados · Replay disponível"
            : "PRÉ preservado · TREINO preservado · PÓS preservado · snapshots congelados · Replay disponível · relatório disponível"}</span>
        </section>
      ) : null}
    </>
  );
}

function SeletorDeContexto({
  estado,
  ocupado,
  selecionar
}: {
  estado: Estado;
  ocupado: boolean;
  selecionar: (
    campo: "organizacao" | "participante" | "sessao",
    identificador: string
  ) => void;
}) {
  const selecao = estado.contextos.selecao;
  return (
    <section className="hx-context-selector" aria-label="Seleção do contexto operacional">
      <header>
        <div>
          <small>CONTEXTO OPERACIONAL ÚNICO</small>
          <strong>Organização → participante → sessão</strong>
        </div>
        <span>{ocupado ? "ATUALIZANDO CONTEXTO" : "CONTEXTO PRESERVADO NAS 15 VISÕES"}</span>
      </header>
      <div>
        <label>
          Organização
          <select
            value={selecao.identificador_da_organizacao}
            disabled={ocupado || estado.contextos.organizacoes.length < 2}
            onChange={(evento) => selecionar("organizacao", evento.target.value)}
          >
            {estado.contextos.organizacoes.map((item) => (
              <option key={String(item.identificador)} value={String(item.identificador)}>
                {texto(item.nome)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Participante
          <select
            value={selecao.identificador_do_participante}
            disabled={ocupado}
            onChange={(evento) => selecionar("participante", evento.target.value)}
          >
            {estado.contextos.participantes.map((item) => (
              <option key={String(item.identificador)} value={String(item.identificador)}>
                {texto(item.rotulo ?? item.referencia_externa)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Sessão
          <select
            value={selecao.identificador_da_sessao}
            disabled={ocupado}
            onChange={(evento) => selecionar("sessao", evento.target.value)}
          >
            {estado.contextos.sessoes.map((item) => (
              <option key={String(item.identificador)} value={String(item.identificador)}>
                {texto(item.nome_operacional, "Sessão sem nome legado")} · {texto(item.estado)} · {dataLegivel(item.iniciado_em ?? item.criado_em)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Profissional
          <select value={selecao.identificador_do_profissional} disabled>
            {estado.contextos.profissionais.map((item) => (
              <option key={String(item.identificador)} value={String(item.identificador)}>
                {texto(item.nome)} · {texto(item.perfil)}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}

function NavegacaoInterna({
  visao,
  selecionar
}: {
  visao: VisaoCockpit;
  selecionar: (visao: VisaoCockpit) => void;
}) {
  return (
    <nav className="hx-cockpit-tabs" aria-label="Visões internas do Cockpit Vivo">
      {VISOES_COCKPIT.map((item) => (
        <button
          className={visao === item.id ? "is-active" : ""}
          type="button"
          aria-current={visao === item.id ? "page" : undefined}
          onClick={() => selecionar(item.id)}
          key={item.id}
        >
          <span>{item.codigo}</span>{item.nome}
        </button>
      ))}
    </nav>
  );
}

function TituloDaVisao({ kicker, titulo, descricao }: { kicker: string; titulo: string; descricao: string }) {
  return (
    <HxSectionHeader
      className="hx-cockpit-view-title"
      eyebrow={kicker}
      title={titulo}
      description={descricao}
    />
  );
}

function ReferenciaBaselineResumo({ estado }: { estado: Estado }) {
  const referencia = estado.gravacao?.baseline?.referencia;
  const registro = estado.gravacao?.baseline?.registro;
  return (
    <div className="hx-limit-consolidated">
      <strong>REFERÊNCIA DE BASELINE · REGISTRO OPERACIONAL SEPARADO</strong>
      <span>
        {texto(referencia?.estado, "AGUARDANDO DECISÃO PROFISSIONAL")}
        {registro?.finalizado_em
          ? ` · encerrado em ${dataLegivel(registro.finalizado_em)}`
          : ""}
        {" · "}fluxo científico padrão: PRÉ → TREINO → PÓS.
      </span>
    </div>
  );
}

function EvidenciasDoCockpit({ estado }: { estado: Estado }) {
  const evidencias = estado.leitura_regulatoria.evidencias;
  const leituraCientifica = leituraCientificaDaInspecao(estado);
  const configuracaoBasal = objeto(
    leituraCientifica.configuracao_regulatoria_basal
  );
  const cadeiaCientifica = objeto(
    objeto(estado.cockpit_operacional).cadeia_cientifica
  );
  const evidenciasDoMotor = objeto(cadeiaCientifica.evidencias);
  const evidenciasAceitas = lista(evidenciasDoMotor.aceitas);
  const iirh = objeto(leituraCientifica.iirh);
  return (
    <section className="hx-cockpit-panel">
      <TituloDaVisao
        kicker="EVIDÊNCIAS E LIMITAÇÕES"
        titulo="O que sustenta — e o que impede — a leitura."
        descricao="Evidência, indicador e vetor permanecem ontologicamente distintos."
      />
      <div className="hx-evidence-table" role="table" aria-label="Evidências da sessão">
        <div className="hx-evidence-table__head" role="row">
          {["Origem", "Tipo", "Macrocampo", "Fase", "Cobertura", "Confiabilidade", "Integridade"].map((item) => <span role="columnheader" key={item}>{item}</span>)}
        </div>
        {evidencias.length ? evidencias.map((evidencia, indice) => (
          <div role="row" key={String(evidencia.identificador ?? indice)}>
            <span>{texto(valorDoRegistro(evidencia, "origem", "metodo_de_obtencao"))}</span>
            <span>{texto(valorDoRegistro(evidencia, "tipo", "natureza"), "TÉCNICA")}</span>
            <span>{texto(valorDoRegistro(evidencia, "macrocampo", "codigo_do_macrocampo"))}</span>
            <span>{texto(valorDoRegistro(evidencia, "fase", "identificador_da_fase"))}</span>
            <span>{typeof evidencia.cobertura === "number" ? `${Math.round(evidencia.cobertura * 100)}%` : "NÃO INFORMADA"}</span>
            <span>{typeof evidencia.qualidade === "number" ? `${Math.round(evidencia.qualidade * 100)}%` : "NÃO INFORMADA"}</span>
            <span>{texto(valorDoRegistro(evidencia, "integridade", "estado_de_validade"), "PRESERVADA")}</span>
          </div>
        )) : <div className="hx-evidence-table__empty">Nenhum registro independente foi vinculado à coleção documental desta sessão.</div>}
      </div>
      <div className="hx-limit-consolidated">
        <strong>EVIDÊNCIA RECONHECIDA PELO MOTOR REGULATÓRIO</strong>
        <span>{evidenciasAceitas.length
          ? `${evidenciasAceitas.length} evidência(s) admissível(is) sustentam a leitura canônica atual.`
          : texto(
              objeto(configuracaoBasal.anamnese).estado,
              "Não há evidência admissível suficiente para uma leitura científica."
            )}</span>
      </div>
      <details className="hx-technical-details">
        <summary>Governança científica, suficiência e proveniência</summary>
        <pre>{JSON.stringify({
          elegibilidade_temporal: leituraCientifica.elegibilidade_temporal_da_zona,
          iirh: leituraCientifica.iirh,
          zona: leituraCientifica.zona,
          resultante: leituraCientifica.resultante,
          trajetoria: leituraCientifica.trajetoria,
          configuracao_regulatoria_basal: configuracaoBasal,
          rastreabilidade_do_motor: leituraCientifica.rastreabilidade_do_motor
        }, null, 2)}</pre>
      </details>
      <div className="hx-limit-consolidated">
        <strong>LIMITAÇÃO CONSOLIDADA</strong>
        <span>{iirh.estado === "CALCULADO"
          ? "O IIRH e os vetores presentes foram calculados pelo núcleo com as evidências admissíveis. Ausências, Zona e trajetória conservam seus próprios limites científicos."
          : "Os dados disponíveis ainda não são suficientes para produzir uma leitura científica integral; nenhuma ausência foi convertida em zero."}</span>
      </div>
      {estado.leitura_regulatoria.anamneses.length ? (
        <details className="hx-technical-details"><summary>Anamnese Regulatória autorizada como fonte de evidência</summary><pre>{JSON.stringify(estado.leitura_regulatoria.anamneses, null, 2)}</pre></details>
      ) : null}
      {estado.leitura_regulatoria.evidencias_anamnese?.length ? (
        <section className="hx-anamnese-evidence">
          <header><small>FONTE NARRATIVA E CONTEXTUAL</small><strong>Respostas aceitas por decisão profissional</strong></header>
          {estado.leitura_regulatoria.evidencias_anamnese.map((evidencia, indice) => (
            <article key={String(evidencia.identificador ?? indice)}>
              <div><small>Modalidade</small><strong>{texto(evidencia.modalidade)}</strong></div>
              <div><small>Qualidade</small><strong>{texto(evidencia.qualidade)}</strong></div>
              <div><small>Estado</small><strong>{texto(evidencia.estado)}</strong></div>
              <div><small>Limitação</small><strong>{texto(evidencia.limitacao, "Resposta isolada não produz vetor")}</strong></div>
              <details><summary>Abrir resposta original preservada</summary><pre>{JSON.stringify(evidencia.resposta_original_json, null, 2)}</pre></details>
            </article>
          ))}
        </section>
      ) : null}
      {estado.leitura_regulatoria.evidencias_anamnese_no_escopo?.length ? (
        <section className="hx-anamnese-evidence">
          <header>
            <small>ESCOPO PROFISSIONAL · FORA DA SESSÃO SELECIONADA</small>
            <strong>Evidências narrativas aceitas aguardando vínculo contextual</strong>
            <span>Visíveis para revisão, mas não incorporadas à sessão técnica atual e sem produzir cálculo.</span>
          </header>
          {estado.leitura_regulatoria.evidencias_anamnese_no_escopo.map((evidencia, indice) => (
            <article key={String(evidencia.identificador ?? indice)}>
              <div><small>Modalidade</small><strong>{texto(evidencia.modalidade)}</strong></div>
              <div><small>Qualidade</small><strong>{texto(evidencia.qualidade)}</strong></div>
              <div><small>Estado</small><strong>{texto(evidencia.estado)}</strong></div>
              <div><small>Cálculo</small><strong>{evidencia.gera_calculo ? "BLOQUEIO VIOLADO" : "NÃO GERA CÁLCULO"}</strong></div>
              <details><summary>Abrir resposta original preservada</summary><pre>{JSON.stringify(evidencia.resposta_original_json, null, 2)}</pre></details>
            </article>
          ))}
        </section>
      ) : null}
    </section>
  );
}

function ConstituicaoOperacional({ estado }: { estado: Estado }) {
  const regras = Array.isArray(estado.ciencia.postulados.regras) ? estado.ciencia.postulados.regras as Registro[] : [];
  const eventos = estado.eventos.length;
  const vetores = estado.ciencia.vetores.length;
  const leituraCientifica = leituraCientificaDaInspecao(estado);
  const configuracaoBasal = configuracaoBasalDaInspecao(estado);
  const vetoresCanonicos = vetoresCanonicosDaInspecao(estado);
  const vetoresCalculaveis = vetoresCanonicos.filter(
    (item) => valorVetorial(item.magnitude, "") !== ""
  ).length;
  const iirh = objeto(leituraCientifica.iirh);
  const zona = objeto(leituraCientifica.zona);
  const resultante = objeto(leituraCientifica.resultante);
  const cadeiaCientifica = objeto(
    objeto(estado.cockpit_operacional).cadeia_cientifica
  );
  const evidencias = lista(objeto(cadeiaCientifica.evidencias).aceitas).length;
  const cobertura = resultante.cobertura ?? iirh.cobertura;
  const coberturaLegivel = formatarPercentualCanonico(cobertura);
  const operacionalizacao = [
    `${eventos} evento(s) e ${momentos(estado).length} registro(s) temporal(is); a configuração basal atual permanece separada da trajetória.`,
    `${vetores} definições versionadas e ${vetoresCalculaveis} vetor(es) calculável(is) no contexto atual.`,
    `${evidencias} evidência(s) permanecem vinculadas a origem, contexto e cobertura.`,
    `Resultante ${texto(resultante.estado, "não calculável").toLocaleLowerCase("pt-BR")} preservada sem completar vetores ausentes.`,
    "A Trajetória exige estados sucessivos comparáveis; um ponto isolado não gera trajetória.",
    "Ausências e limites inferenciais são declarados sem conversão em zero.",
    "A reorganização depende de contexto e decisão profissional rastreável."
  ];
  const estados = [
    Object.keys(configuracaoBasal).length
      ? "ATIVO · configuração basal canônica"
      : "ATIVO · sem configuração basal admissível",
    `ATIVO · ${vetoresCalculaveis}/${vetores || 10} vetores calculáveis`,
    evidencias ? "ATIVO · evidências admissíveis reconhecidas" : "ATIVO · evidência admissível ausente",
    `ATIVO · ${texto(resultante.estado, "não calculável")}`,
    "ATIVO · trajetória ainda não inferível",
    "ATIVO · mensurabilidade parcial declarada",
    zona.codigo || zona.nome
      ? `ATIVO · Zona ${texto(zona.codigo ?? zona.nome)}`
      : "ATIVO · Zona não classificável"
  ];
  return (
    <section className="hx-cockpit-panel">
      <TituloDaVisao
        kicker="CONSTITUIÇÃO OPERACIONAL DA TIRH"
        titulo="Postulados aplicados como governança da sessão."
        descricao="Não são cartões decorativos: cada fundamento controla uma decisão ou bloqueio observável."
      />
      <div className="hx-constitution-list">
        {regras.map((regra, indice) => (
          <article key={String(regra.codigo ?? indice)}>
            <span>{String(indice + 1).padStart(2, "0")}</span>
            <div><small>Postulado</small><strong>{nomeDoPostulado(regra)}</strong></div>
            <div><small>Função na sessão</small><strong>{operacionalizacao[indice] ?? texto(regra.descricao)}</strong></div>
            <div><small>Cobertura / confiabilidade</small><strong>{coberturaLegivel === "—" ? "Sem cobertura mensurável" : `${coberturaLegivel} · leitura parcial`}</strong></div>
            <div><small>Estado e limitação</small><strong>{estados[indice]}</strong></div>
            <details><summary>Rastreabilidade</summary><p>{texto(regra.limite_inferencial)}</p><small>{texto(regra.referencia_no_livro)}</small></details>
          </article>
        ))}
      </div>
    </section>
  );
}

function MatrizVetorial({
  estado,
  selecionado,
  selecionar,
  resumida = false
}: {
  estado: Estado;
  selecionado: string | null;
  selecionar: (codigo: string) => void;
  resumida?: boolean;
}) {
  const macrocampos = estado.ciencia.macrocampos;
  const vetores = estado.ciencia.vetores;
  const limite = resumida ? 5 : vetores.length;
  const definicaoSelecionada = vetores.find((item) => codigoDoVetor(item) === selecionado);
  const estadoSelecionado = definicaoSelecionada ? estadoDoVetor(estado, definicaoSelecionada) : undefined;
  return (
    <section className="hx-cockpit-panel hx-vector-matrix">
      <TituloDaVisao
        kicker="MATRIZ VETORIAL VIVA"
        titulo="Forças regulatórias organizadas nos quatro campos oficiais."
        descricao="Ausência de evidência não é zero; nenhuma propriedade humana é preenchida pela Telemetria Bridge."
      />
      <div className="hx-fields-strip">
        {macrocampos.map((campo) => {
          const codigo = codigoDoMacrocampo(campo);
          return <article key={codigo}><small>{codigo}</small><strong>{nomeDoMacrocampo(campo)}</strong><span>{vetores.filter((vetor) => texto(valorDoRegistro(vetor, "macrofield_code", "codigo_do_macrocampo"), "") === codigo).length} vetor(es)</span></article>;
        })}
      </div>
      <div className="hx-vector-table" role="table" aria-label="Matriz Vetorial Viva">
        <div className="hx-vector-table__head" role="row">
          {["Vetor", "Campo", "Força funcional", "Magnitude", "Direção", "Sentido", "Interação", "Estado"].map((item) => <span role="columnheader" key={item}>{item}</span>)}
        </div>
        {vetores.slice(0, limite).map((definicao) => {
          const estadoVetorial = estadoDoVetor(estado, definicao);
          const codigo = codigoDoVetor(definicao);
          return (
            <button role="row" type="button" onClick={() => selecionar(codigo)} key={codigo}>
              <span><b>{codigo}</b>{nomeDoVetor(definicao)}</span>
              <span>{texto(valorDoRegistro(definicao, "macrofield_code", "codigo_do_macrocampo"))}</span>
              <span>{valorVetorial(valorDoRegistro(estadoVetorial ?? {}, "forca_funcional"), "FORÇA RELATIVA NÃO CALCULÁVEL")}</span>
              <span>{valorVetorial(valorDoRegistro(estadoVetorial ?? {}, "magnitude", "magnitude_json"), "NÃO CALCULÁVEL")}</span>
              <span>{valorVetorial(valorDoRegistro(estadoVetorial ?? {}, "direcao", "direcao_json"), "DOMÍNIO NÃO DETERMINADO")}</span>
              <span>{valorVetorial(valorDoRegistro(estadoVetorial ?? {}, "sentido", "sentido_funcional"), "NÃO CALCULÁVEL")}</span>
              <span>{valorVetorial(valorDoRegistro(estadoVetorial ?? {}, "interacao", "interacoes_json", "interdependencias_json"), "NÃO DETERMINADA")}</span>
              <span>{estadoVetorial ? texto(valorDoRegistro(estadoVetorial, "estado", "estado_processamento")) : "NÃO OBSERVADO"}</span>
            </button>
          );
        })}
      </div>
      {resumida && vetores.length > limite ? <p className="hx-matrix-note">A visão completa contém os {vetores.length} vetores oficiais carregados do núcleo.</p> : null}
      {definicaoSelecionada ? (
        <aside className="hx-vector-inspector" aria-label={`Detalhe do vetor ${codigoDoVetor(definicaoSelecionada)}`}>
          <header><div><small>DETALHE DO VETOR</small><h3>{codigoDoVetor(definicaoSelecionada)} · {nomeDoVetor(definicaoSelecionada)}</h3></div><span>{estadoSelecionado ? "ESTADO DISPONÍVEL" : "SEM EVIDÊNCIA ADMISSÍVEL"}</span></header>
          <p>{texto(valorDoRegistro(definicaoSelecionada, "description", "descricao"))}</p>
          <dl>
            <div><dt>Campo</dt><dd>{texto(valorDoRegistro(definicaoSelecionada, "macrofield_code", "codigo_do_macrocampo"))}</dd></div>
            <div><dt>Magnitude</dt><dd>{valorVetorial(valorDoRegistro(estadoSelecionado ?? {}, "magnitude", "magnitude_json"), "NÃO CALCULÁVEL")}</dd></div>
            <div><dt>Direção</dt><dd>{valorVetorial(valorDoRegistro(estadoSelecionado ?? {}, "direcao", "direcao_json"), "DOMÍNIO NÃO DETERMINADO")}</dd></div>
            <div><dt>Sentido</dt><dd>{valorVetorial(valorDoRegistro(estadoSelecionado ?? {}, "sentido", "sentido_funcional"), "NÃO CALCULÁVEL")}</dd></div>
            <div><dt>Interações</dt><dd>{valorVetorial(valorDoRegistro(estadoSelecionado ?? {}, "interacao", "interacoes_json"), "NÃO DETERMINADAS")}</dd></div>
            <div><dt>Evidências</dt><dd>{estadoSelecionado ? texto(valorDoRegistro(estadoSelecionado, "evidencias", "evidencias_ids")) : "EVIDÊNCIA HUMANA AUSENTE"}</dd></div>
            <div><dt>Cobertura</dt><dd>{estadoSelecionado && typeof estadoSelecionado.cobertura === "number" ? `${Math.round(estadoSelecionado.cobertura * 100)}%` : "NÃO CALCULÁVEL"}</dd></div>
            <div><dt>Confiabilidade</dt><dd>{estadoSelecionado && typeof estadoSelecionado.confiabilidade === "number" ? `${Math.round(estadoSelecionado.confiabilidade * 100)}%` : "NÃO CALCULÁVEL"}</dd></div>
            <div><dt>Trajetória</dt><dd>NÃO INFERÍVEL A PARTIR DE UM ÚNICO PONTO</dd></div>
            <div><dt>Decisão profissional</dt><dd>NENHUMA DECISÃO AUTOMÁTICA</dd></div>
          </dl>
          <details><summary>Fontes, eventos, indicadores, CTRs, THXs, limitações e histórico</summary><pre>{JSON.stringify({ definicao: definicaoSelecionada, estado: estadoSelecionado ?? null }, null, 2)}</pre></details>
        </aside>
      ) : null}
    </section>
  );
}

function ResultanteRegulatoria({ estado, resumida = false }: { estado: Estado; resumida?: boolean }) {
  const leituraCientifica = leituraCientificaDaInspecao(estado);
  const resultadoCanonico = objeto(leituraCientifica.resultante);
  const configuracao = estado.leitura_regulatoria.configuracoes.at(-1);
  const avaliacao = estado.leitura_regulatoria.avaliacoes.at(-1);
  const resultado = Object.keys(resultadoCanonico).length
    ? resultadoCanonico
    : configuracao ?? avaliacao;
  const iirh = objeto(leituraCientifica.iirh);
  const zona = objeto(leituraCientifica.zona);
  const motivo = objeto(resultado?.por_que_este_resultado).resumo
    ?? resultado?.justificativa
    ?? resultado?.motivo;
  return (
    <section className="hx-cockpit-panel hx-resultant">
      <TituloDaVisao
        kicker="RESULTANTE REGULATÓRIA"
        titulo={resultado ? "Composição vetorial rastreável." : "Aguardando evidência operacional"}
        descricao="A Resultante é a síntese funcional da configuração vetorial; não é IIRH nem Zona."
      />
      <div className="hx-resultant__core">
        <div><small>Estado</small><strong>{resultado ? texto(valorDoRegistro(resultado, "estado", "estado_processamento")) : "EVIDÊNCIA INSUFICIENTE"}</strong></div>
        <div><small>Magnitude global</small><strong>{valorVetorial(valorDoRegistro(resultado ?? {}, "magnitude_global", "valor"), "NÃO CALCULÁVEL")}</strong></div>
        <div><small>Direção funcional</small><strong>{valorVetorial(valorDoRegistro(resultado ?? {}, "direcao_funcional", "direcao_predominante", "direcao"), "NÃO DETERMINÁVEL")}</strong></div>
        <div><small>Sentido contextual</small><strong>{valorVetorial(valorDoRegistro(resultado ?? {}, "sentido_contextual", "sentido_predominante", "sentido"), "NÃO DETERMINÁVEL")}</strong></div>
        <div><small>Cobertura global</small><strong>{formatarPercentualCanonico(resultado?.cobertura)}</strong></div>
        <div><small>Confiabilidade global</small><strong>{formatarPercentualCanonico(resultado?.confianca ?? resultado?.confiabilidade)}</strong></div>
        <div><small>IIRH</small><strong>{iirh.estado === "CALCULADO" && typeof iirh.valor === "number" ? `${iirh.valor} · ${texto(iirh.unidade, "0-100")}` : "NÃO CALCULÁVEL"}</strong></div>
        <div><small>Zona Operacional</small><strong>{texto(zona.codigo ?? zona.nome, "NÃO CLASSIFICÁVEL")}</strong></div>
        <div><small>Versão científica</small><strong>{texto(valorDoRegistro(resultado ?? {}, "versao_cientifica", "versao_da_biblioteca", "versao_do_motor", "versao_algoritmo"), "PRESERVADA NO NÚCLEO")}</strong></div>
      </div>
      <div className="hx-limit-consolidated"><strong>MOTIVO CONSOLIDADO</strong><span>{texto(motivo, resultado ? "Consulte vetores contribuintes, tensões e compensações na rastreabilidade." : "As evidências disponíveis não são suficientes para compor a Resultante.")}</span></div>
      {!resumida && resultado ? <details className="hx-technical-details"><summary>Vetores contribuintes, preservados, comprometidos, tensões e compensações</summary><pre>{JSON.stringify(resultado, null, 2)}</pre></details> : null}
    </section>
  );
}

function TrajetoriaRegulatoria({ estado, resumida = false }: { estado: Estado; resumida?: boolean }) {
  const trajetorias = estado.leitura_regulatoria.trajetorias;
  const atual = trajetorias.at(-1);
  return (
    <section className="hx-cockpit-panel hx-trajectory">
      <TituloDaVisao
        kicker="TRAJETÓRIA REGULATÓRIA"
        titulo={atual ? "Leitura temporal preservada pelo núcleo." : "TRAJETÓRIA NÃO INFERÍVEL"}
        descricao="Nenhuma trajetória é inferida a partir de um único ponto ou de sessões incompatíveis."
      />
      <div className="hx-trajectory__states">
        {["Estado inicial", "Estados sucessivos", "Estabilidade", "Oscilação", "Recuperação", "Ruptura", "Direção temporal", "Mudanças de versão"].map((rotulo) => (
          <article key={rotulo}><small>{rotulo}</small><strong>{atual ? valorVetorial(valorDoRegistro(atual, rotulo.toLowerCase().replaceAll(" ", "_")), "NÃO INFORMADO") : "NÃO OBSERVADO"}</strong></article>
        ))}
      </div>
      <div className="hx-limit-consolidated"><strong>LIMITE TEMPORAL</strong><span>{atual ? "Eventos, intervenções, lacunas e transições permanecem vinculados ao registro longitudinal." : "Não existem dois ou mais estados regulatórios humanos, válidos e comparáveis nesta sessão técnica."}</span></div>
      {!resumida && atual ? <details className="hx-technical-details"><summary>Resultantes sucessivas, transições de Zona, eventos e intervenções</summary><pre>{JSON.stringify(atual, null, 2)}</pre></details> : null}
    </section>
  );
}

function RotasRegulatorias({ estado }: { estado: Estado }) {
  const cadeiaCientifica = objeto(
    objeto(estado.cockpit_operacional).cadeia_cientifica
  );
  const cadeia = Object.keys(cadeiaCientifica).length
    ? cadeiaCientifica
    : objeto(estado.rastreabilidade?.cadeia);
  const itens = [
    ["ARR", estado.leitura_regulatoria.arr.at(-1) ?? cadeia.arr],
    ["Reorganização da Rota Operacional — RRO", estado.leitura_regulatoria.rro.at(-1) ?? cadeia.rro],
    ["Nova Rota Adaptativa — NRA", cadeia.nra]
  ] as [string, unknown][];
  return (
    <section className="hx-cockpit-panel">
      <TituloDaVisao kicker="ROTAS REGULATÓRIAS" titulo="ARR → RRO → NRA sob validação profissional." descricao="Hipótese, reorganização operacional e nova rota adaptativa permanecem separadas e auditáveis." />
      <div className="hx-route-grid">
        {itens.map(([nome, valor]) => {
          const registro = objeto(valor);
          const localizado = Object.keys(registro).length > 0;
          return <article key={nome}><small>{nome}</small><strong>{localizado ? texto(registro.estado, "REGISTRO LOCALIZADO") : "NÃO CONFIRMADA"}</strong><span>{localizado ? texto(registro.motivo, "Evidências e histórico disponíveis na rastreabilidade.") : "Não há evidência admissível vinculada a esta sessão para confirmar a rota."}</span>{localizado ? <details><summary>Inspecionar</summary><pre>{JSON.stringify(registro, null, 2)}</pre></details> : null}</article>;
        })}
      </div>
    </section>
  );
}

function FormulacaoRegulatoria({ estado }: { estado: Estado }) {
  const formulacao = estado.formulacoes.at(-1);
  const formulacoesNoEscopo = estado.leitura_regulatoria.formulacoes_no_escopo ?? [];
  return (
    <section className="hx-cockpit-panel">
      <TituloDaVisao kicker="FORMULAÇÃO REGULATÓRIA" titulo={formulacao ? "Formulação profissional versionada." : formulacoesNoEscopo.length ? "Formulações profissionais aguardando vínculo com a sessão." : "Nenhuma Formulação Regulatória disponível."} descricao="Dado, interpretação, hipótese e decisão profissional permanecem separados." />
      <div className="hx-formulation-grid">
        {["Dado", "Interpretação", "Hipótese", "Decisão profissional"].map((item) => <article key={item}><small>{item}</small><strong>{formulacao ? valorVetorial(valorDoRegistro(formulacao, item.toLowerCase().replaceAll(" ", "_")), "NÃO INFORMADO") : "NÃO REGISTRADA"}</strong></article>)}
      </div>
      <Rastreabilidade estado={estado} />
      {formulacao ? <details className="hx-technical-details"><summary>Autoria, versão, justificativa, evidências, vetores, Resultante, Trajetória e histórico</summary><pre>{JSON.stringify(formulacao, null, 2)}</pre></details> : null}
      {!formulacao && formulacoesNoEscopo.length ? <section className="hx-anamnese-evidence">
        <header><small>ESCOPO PROFISSIONAL · FORA DA SESSÃO SELECIONADA</small><strong>Citações rastreáveis disponíveis</strong><span>Não são incorporadas à sessão técnica até existir vínculo contextual explícito.</span></header>
        {formulacoesNoEscopo.map((item, indice) => <article key={String(item.identificador ?? indice)}>
          <div><small>Estado</small><strong>{texto(item.estado)}</strong></div>
          <div><small>Revisão</small><strong>{texto(item.numero_da_revisao)}</strong></div>
          <div><small>Participante</small><strong>{texto(item.identificador_do_participante)}</strong></div>
          <div><small>Origem</small><strong>ANAMNESE REGULATÓRIA</strong></div>
          <details><summary>Referências e limites preservados</summary><pre>{JSON.stringify({ referencias: objeto(item.referencias_de_origem_json), limites: lista(item.limites_de_interpretacao_json) }, null, 2)}</pre></details>
        </article>)}
      </section> : null}
    </section>
  );
}

function EstruturaInicialDoCockpit() {
  return (
    <section
      className="hx-live-loading-shell"
      aria-label="Preparando Centro de Comando HUMANEXUS"
      aria-busy="true"
    >
      <header>
        <div><small>CENTRO DE COMANDO HUMANEXUS</small><strong>Preparando contexto protegido</strong></div>
        <span>CONEXÃO SEGURA EM ANDAMENTO</span>
      </header>
      <div className="hx-live-loading-hud" aria-hidden="true">
        {Array.from({ length: 9 }, (_, indice) => <i key={indice} />)}
      </div>
      <div className="hx-live-loading-command">
        <div><small>LEITURA REGULATÓRIA</small><span /></div>
        <div><small>COMANDO OPERACIONAL</small><span /></div>
      </div>
      <p>Carregando sessão, evidências e permissões sem bloquear a estrutura principal.</p>
    </section>
  );
}

function SelecaoInicialDoCockpit({
  contexto,
  selecao,
  ocupado,
  selecionarOrganizacao,
  selecionar,
  abrir
}: {
  contexto: ContextoParaSelecao;
  selecao: Record<string, string>;
  ocupado: boolean;
  selecionarOrganizacao: (identificador: string) => void;
  selecionar: (campo: "participante" | "sessao", identificador: string) => void;
  abrir: () => void;
}) {
  const sessoes = contexto.sessoes.filter(
    (item) => String(item.identificador_do_participante ?? "")
      === selecao.participante
  );
  return (
    <section className="hx-context-selector" aria-label="Selecionar contexto do Cockpit Vivo">
      <header>
        <div>
          <small>ENTRADA DO COCKPIT VIVO</small>
          <strong>Selecione o contexto operacional</strong>
        </div>
        <span>NENHUM CONTEXTO ANTERIOR SERÁ REUTILIZADO</span>
      </header>
      <div>
        <label>Organização<select
          value={selecao.organizacao}
          disabled={ocupado}
          onChange={(evento) => selecionarOrganizacao(evento.target.value)}
        ><option value="">Selecione</option>{contexto.organizacoes.map((item) => (
          <option key={String(item.identificador)} value={String(item.identificador)}>{texto(item.nome)}</option>
        ))}</select></label>
        <label>Participante<select
          value={selecao.participante}
          disabled={ocupado || !selecao.organizacao}
          onChange={(evento) => selecionar("participante", evento.target.value)}
        ><option value="">Selecione</option>{contexto.participantes.map((item) => (
          <option key={String(item.identificador)} value={String(item.identificador)}>{texto(item.rotulo ?? item.referencia_externa)}</option>
        ))}</select></label>
        <label>Sessão existente<select
          value={selecao.sessao}
          disabled={ocupado || !selecao.participante}
          onChange={(evento) => selecionar("sessao", evento.target.value)}
        ><option value="">Selecione</option>{sessoes.map((item) => (
          <option key={String(item.identificador)} value={String(item.identificador)}>{texto(item.nome_operacional, "Sessão sem nome legado")} · {texto(item.estado)} · {dataLegivel(item.criado_em)}</option>
        ))}</select></label>
      </div>
      <button
        type="button"
        disabled={ocupado || !selecao.organizacao || !selecao.participante || !selecao.sessao}
        onClick={abrir}
      >ABRIR COCKPIT VIVO</button>
    </section>
  );
}

export function OperacaoHomologacao({ modulo }: { modulo: ModuloDaPlataforma }) {
  const [estado, setEstado] = useState<Estado | null>(null);
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState("");
  const [cursor, setCursor] = useState(0);
  const [tocando, setTocando] = useState(false);
  const [velocidade, setVelocidade] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [intervalo, setIntervalo] = useState<[number, number]>([0, 100]);
  const [trilhas, setTrilhas] = useState<Record<string, boolean>>({});
  const [visao, setVisao] = useState<VisaoCockpit>("visao-geral");
  const [vetorSelecionado, setVetorSelecionado] = useState<string | null>(null);
  const [painelTecnico, setPainelTecnico] = useState("fontes");
  const [selecaoInicial, setSelecaoInicial] = useState<Record<string, string>>({});
  const [contextoParaSelecao, setContextoParaSelecao] =
    useState<ContextoParaSelecao | null>(null);
  const [selecaoPendente, setSelecaoPendente] =
    useState<Record<string, string>>({
      organizacao: "",
      participante: "",
      sessao: ""
    });
  const contextoAtual = useRef("");
  const contextoDoPolling = useRef<Record<string, string>>({});
  const atualizacaoEmAndamento = useRef<{
    identificador: number;
    controlador: AbortController;
  } | null>(null);
  const carregamentoIntegralEmAndamento = useRef<AbortController | null>(null);
  const sequenciaDoPolling = useRef(0);
  const ultimaConsultaAplicada = useRef(0);
  const componenteMontado = useRef(false);
  const ocupadoAtual = useRef("");
  const autenticacaoExpiradaAtual = useRef(false);
  const versaoDoCockpit = useRef("");
  const estadoOperacionalDoPolling = useRef("");
  const [autenticacaoExpirada, setAutenticacaoExpirada] = useState(false);
  const [cortexClientId, setCortexClientId] = useState("");
  const [cortexClientSecret, setCortexClientSecret] = useState("");

  useEffect(() => {
    componenteMontado.current = true;
    return () => {
      componenteMontado.current = false;
      atualizacaoEmAndamento.current?.controlador.abort();
      atualizacaoEmAndamento.current = null;
      carregamentoIntegralEmAndamento.current?.abort();
      carregamentoIntegralEmAndamento.current = null;
    };
  }, []);

  useEffect(() => {
    ocupadoAtual.current = ocupado;
  }, [ocupado]);

  useEffect(() => {
    const parametros = new URLSearchParams(window.location.search);
    const solicitada = parametros.get("visao") as VisaoCockpit | null;
    if (solicitada && VISOES_COCKPIT.some((item) => item.id === solicitada)) setVisao(solicitada);
    if (parametros.get("painel")) setPainelTecnico(parametros.get("painel") as string);
    const selecao = {
      organizacao: parametros.get("organizacao") ?? "",
      participante: parametros.get("participante") ?? "",
      sessao: parametros.get("sessao") ?? ""
    };
    setSelecaoInicial(selecao);
    contextoDoPolling.current = selecao;
    if (!selecao.organizacao || !selecao.participante || !selecao.sessao) {
      void carregarOpcoesDeContexto(selecao.organizacao)
        .catch((causa) => setErro(causa.message));
      return;
    }
    void (async () => {
      const contexto = await carregar(selecao, false, true);
      await carregar(contexto);
    })().catch((causa) => setErro(causa.message));
  }, []);

  const selecionarVisao = (destino: VisaoCockpit) => {
    setVisao(destino);
    const url = new URL(window.location.href);
    url.pathname = "/plataforma/cockpit-vivo";
    url.searchParams.set("visao", destino);
    if (destino !== "tecnico") url.searchParams.delete("painel");
    window.history.replaceState(window.history.state, "", url);
  };

  const carregar = async (
    selecao: Record<string, string> = contextoDoPolling.current,
    leve = false,
    inicial = false,
    opcoes: OpcoesDeCarregamento = {}
  ) => {
    const contextoExplicito = {
      organizacao: String(selecao.organizacao ?? ""),
      participante: String(selecao.participante ?? ""),
      sessao: String(selecao.sessao ?? "")
    };
    if (
      leve
      && (!contextoExplicito.organizacao
        || !contextoExplicito.participante
        || !contextoExplicito.sessao)
    ) {
      throw new Error(
        "O polling exige organização, participante e sessão explícitos."
      );
    }
    if (
      !leve
      && contextoExplicito.organizacao
      && contextoExplicito.participante
      && contextoExplicito.sessao
    ) {
      contextoDoPolling.current = contextoExplicito;
    }
    const chaveSolicitada = chaveDoContextoVivo(contextoExplicito);
    const parametros = new URLSearchParams({ modulo });
    const visaoSolicitada = new URLSearchParams(
      window.location.search
    ).get("visao");
    if (visaoSolicitada) parametros.set("visao", visaoSolicitada);
    if (
      new URLSearchParams(window.location.search).get("medir_latencia") === "1"
    ) {
      parametros.set("medir_latencia", "1");
    }
    if (leve) {
      parametros.set("leve", "1");
      parametros.set("_t", String(Date.now()));
      if (versaoDoCockpit.current) {
        parametros.set("versao", versaoDoCockpit.current);
      }
    }
    if (inicial) parametros.set("inicial", "1");
    for (const campo of ["organizacao", "participante", "sessao"]) {
      if (contextoExplicito[campo as keyof typeof contextoExplicito]) {
        parametros.set(
          campo,
          contextoExplicito[campo as keyof typeof contextoExplicito]
        );
      }
    }
    const controlador = !opcoes.signal ? new AbortController() : null;
    const signal = opcoes.signal ?? controlador?.signal;
    if (!leve && controlador) {
      carregamentoIntegralEmAndamento.current?.abort(
        ABORTAR_POR_NOVO_CARREGAMENTO
      );
      carregamentoIntegralEmAndamento.current = controlador;
      atualizacaoEmAndamento.current?.controlador.abort(
        ABORTAR_POR_SINCRONIZACAO_INTEGRAL
      );
    }
    const limiteDaAtualizacao = leve && controlador
      ? window.setTimeout(() => controlador.abort(), 12_000)
      : null;
    let resposta: Response;
    let dados: Estado & {
      atualizacao_parcial?: boolean;
      sem_alteracao?: boolean;
      modo_da_atualizacao?: "SNAPSHOT" | "DELTA" | "SEM_ALTERACAO";
      versao_do_cockpit?: string;
      revisao_do_cockpit?: number;
      escopo_da_revisao_do_cockpit?: "INSTANCIA_LOCAL_NAO_ORDENAVEL";
      sequencias_do_cockpit?: Record<string, number>;
      geracoes_do_cockpit?: Record<string, string>;
      erro?: { mensagem?: string };
    };
    try {
      resposta = await fetch(
        `/api/operacao-homologacao${parametros.size ? `?${parametros}` : ""}`,
        {
          cache: "no-store",
          signal
        }
      );
      dados = await resposta.json();
      publicarEstadoDoNucleo(
        resposta.ok
          ? "conectado"
          : navigator.onLine
            ? "reconectando"
            : "offline"
      );
    } catch (causa) {
      if (
        !leve
        && signal?.aborted
        && signal?.reason === ABORTAR_POR_NOVO_CARREGAMENTO
      ) {
        return contextoExplicito;
      }
      if (
        leve
        && causa instanceof DOMException
        && causa.name === "AbortError"
      ) {
        publicarEstadoDoNucleo(
          navigator.onLine ? "reconectando" : "offline"
        );
        throw new Error(
          "Atualização do Cockpit expirou; nova tentativa automática em andamento."
        );
      }
      publicarEstadoDoNucleo(
        navigator.onLine ? "reconectando" : "offline"
      );
      throw causa;
    } finally {
      if (limiteDaAtualizacao !== null) {
        window.clearTimeout(limiteDaAtualizacao);
      }
      if (
        !leve
        && controlador
        && carregamentoIntegralEmAndamento.current === controlador
      ) {
        carregamentoIntegralEmAndamento.current = null;
      }
    }
    const mensagemDaFalha = dados?.erro?.mensagem
      ?? "Consulta operacional indisponível.";
    if (!resposta.ok) {
      if (
        leve
        && resposta.status === 403
        && /sessão ausente/i.test(mensagemDaFalha)
      ) {
        autenticacaoExpiradaAtual.current = true;
        if (componenteMontado.current) setAutenticacaoExpirada(true);
      }
      throw new Error(mensagemDaFalha);
    }
    const contextoEsperado = contextoDoPolling.current;
    if (!podeAplicarRespostaCanonica({
      contextoEsperado: {
        organizacao: String(contextoEsperado.organizacao ?? ""),
        participante: String(contextoEsperado.participante ?? ""),
        sessao: String(contextoEsperado.sessao ?? "")
      },
      contextoRecebido: contextoExplicito,
      cancelada: Boolean(signal?.aborted),
      componenteMontado: componenteMontado.current,
      consultaSolicitada: opcoes.identificadorDaConsulta,
      ultimaConsultaAplicada: ultimaConsultaAplicada.current
    })) {
      return contextoExplicito;
    }
    if (Number.isFinite(opcoes.identificadorDaConsulta)) {
      ultimaConsultaAplicada.current = Number(opcoes.identificadorDaConsulta);
    } else if (!leve) {
      ultimaConsultaAplicada.current = 0;
    }
    autenticacaoExpiradaAtual.current = false;
    setAutenticacaoExpirada(false);
    setErro("");
    if (dados.atualizacao_parcial) {
      if (
        contextoAtual.current
        && chaveSolicitada
        && contextoAtual.current !== chaveSolicitada
      ) {
        return selecao;
      }
      if (dados.versao_do_cockpit) {
        versaoDoCockpit.current = dados.versao_do_cockpit;
      }
      const pollingConfirmadoEm = new Date().toISOString();
      if (dados.sem_alteracao) {
        setEstado((atual) => atual ? {
          ...atual,
          cockpit_operacional: {
            ...objeto(atual.cockpit_operacional),
            polling_confirmado_em: pollingConfirmadoEm,
            versao_canonica_do_polling: versaoDoCockpit.current,
            revisao_local_da_projecao: dados.revisao_do_cockpit,
            escopo_da_revisao: dados.escopo_da_revisao_do_cockpit
          }
        } : atual);
        return contextoExplicito;
      }
      const estadoRecebido = String(
        objeto(dados.estado_operacional).estado_da_sessao ?? ""
      ).toUpperCase();
      if (estadoRecebido) {
        estadoOperacionalDoPolling.current = estadoRecebido;
      }
      setEstado((atual) => {
        if (!atual) return atual;
        const estadoOperacional = mesclarAtualizacaoIncremental(
          atual.estado_operacional,
          dados.estado_operacional
        ) as Registro;
        estadoOperacionalDoPolling.current = String(
          estadoOperacional.estado_da_sessao ?? ""
        ).toUpperCase();
        const cockpitOperacional = mesclarAtualizacaoIncremental(
          atual.cockpit_operacional,
          dados.cockpit_operacional
        ) as Registro;
        return {
          ...atual,
          estado_operacional: estadoOperacional,
          cockpit_operacional: {
            ...cockpitOperacional,
            polling_confirmado_em: pollingConfirmadoEm,
            versao_canonica_do_polling: versaoDoCockpit.current,
            revisao_local_da_projecao: dados.revisao_do_cockpit,
            escopo_da_revisao: dados.escopo_da_revisao_do_cockpit,
            sequencias_canonicas: dados.sequencias_do_cockpit,
            geracoes_canonicas: dados.geracoes_do_cockpit
          }
        };
      });
      return contextoExplicito;
    }
    const pollingConfirmadoEm = new Date().toISOString();
    setEstado({
      ...dados,
      cockpit_operacional: {
        ...objeto(dados.cockpit_operacional),
        polling_confirmado_em: pollingConfirmadoEm,
        versao_canonica_do_polling: dados.versao_do_cockpit ?? "",
        revisao_local_da_projecao: dados.revisao_do_cockpit,
        escopo_da_revisao: dados.escopo_da_revisao_do_cockpit,
        sequencias_canonicas: dados.sequencias_do_cockpit,
        geracoes_canonicas: dados.geracoes_do_cockpit
      }
    });
    versaoDoCockpit.current = "";
    estadoOperacionalDoPolling.current = String(
      objeto(dados.estado_operacional).estado_da_sessao ?? ""
    ).toUpperCase();
    const atual = {
      organizacao: String(dados.contextos.selecao.identificador_da_organizacao),
      participante: String(dados.contextos.selecao.identificador_do_participante),
      sessao: String(dados.contextos.selecao.identificador_da_sessao)
    };
    contextoAtual.current = [
      atual.organizacao,
      atual.participante,
      atual.sessao
    ].join(":");
    contextoDoPolling.current = atual;
    setSelecaoInicial(atual);
    const url = new URL(window.location.href);
    url.searchParams.set("organizacao", atual.organizacao);
    url.searchParams.set("participante", atual.participante);
    url.searchParams.set("sessao", atual.sessao);
    window.history.replaceState(window.history.state, "", url);
    return atual;
  };

  const carregarOpcoesDeContexto = async (
    organizacao = "",
    participante = ""
  ) => {
    setOcupado("contexto");
    setErro("");
    try {
      const parametros = new URLSearchParams({ modulo: "sessoes" });
      if (organizacao) parametros.set("organizacao", organizacao);
      const resposta = await fetch(
        `/api/gestao-operacional?${parametros}`,
        { cache: "no-store" }
      );
      const corpo = await resposta.json();
      if (!resposta.ok) {
        throw new Error(
          corpo?.erro?.mensagem ?? "Contexto operacional indisponível."
        );
      }
      const contexto = corpo as ContextoParaSelecao;
      const organizacaoAtual = String(
        contexto.organizacao?.identificador ?? organizacao ?? ""
      );
      setContextoParaSelecao(contexto);
      setSelecaoPendente({
        organizacao: organizacaoAtual,
        participante: contexto.participantes.some(
          (item) => String(item.identificador) === participante
        ) ? participante : "",
        sessao: ""
      });
    } finally {
      setOcupado("");
    }
  };

  const abrirContextoSelecionado = async () => {
    setOcupado("contexto");
    setErro("");
    try {
      versaoDoCockpit.current = "";
      const contexto = await carregar(selecaoPendente, false, true);
      await carregar(contexto);
      setContextoParaSelecao(null);
    } catch (causa) {
      setErro(causa instanceof Error ? causa.message : "Contexto recusado.");
    } finally {
      setOcupado("");
    }
  };

  useEffect(() => {
    const atualizarBaseline = () => {
      void carregar().catch((causa) => {
        setErro(
          causa instanceof Error
            ? causa.message
            : "Não foi possível atualizar o estado do baseline."
        );
      });
    };
    window.addEventListener(
      "humanexus:baseline-atualizado",
      atualizarBaseline
    );
    return () => {
      window.removeEventListener(
        "humanexus:baseline-atualizado",
        atualizarBaseline
      );
    };
  }, [selecaoInicial]);

  useEffect(() => {
    if (
      !estado
      || estadoOperacionalTerminal(estado.sessao.estado)
      || !selecaoInicial.organizacao
      || !selecaoInicial.participante
      || !selecaoInicial.sessao
    ) {
      return;
    }

    contextoDoPolling.current = {
      organizacao: selecaoInicial.organizacao,
      participante: selecaoInicial.participante,
      sessao: selecaoInicial.sessao
    };
    let encerrado = false;
    let temporizador: number | null = null;
    let limiteDaRequisicao: number | null = null;
    let falhasConsecutivas = 0;

    const limparTemporizador = () => {
      if (temporizador !== null) window.clearTimeout(temporizador);
      temporizador = null;
    };
    const agendar = (atraso: number) => {
      if (
        encerrado
        || autenticacaoExpiradaAtual.current
        || ["FINALIZADA", "ENCERRADA"].includes(
          estadoOperacionalDoPolling.current
        )
      ) return;
      limparTemporizador();
      temporizador = window.setTimeout(executar, atraso);
    };
    const concluir = (identificador: number, proximoAtraso: number) => {
      if (
        atualizacaoEmAndamento.current?.identificador
        !== identificador
      ) return;
      if (limiteDaRequisicao !== null) {
        window.clearTimeout(limiteDaRequisicao);
        limiteDaRequisicao = null;
      }
      atualizacaoEmAndamento.current = null;
      agendar(proximoAtraso);
    };
    const executar = () => {
      temporizador = null;
      if (encerrado || autenticacaoExpiradaAtual.current) return;
      const contexto = { ...contextoDoPolling.current };
      if (!contexto.organizacao || !contexto.participante || !contexto.sessao) {
        setErro("O Cockpit preservou a tela, mas não iniciará polling sem sessão explícita.");
        return;
      }
      if (
        ocupadoAtual.current
        || carregamentoIntegralEmAndamento.current
        || atualizacaoEmAndamento.current
      ) {
        agendar(500);
        return;
      }
      const identificador = ++sequenciaDoPolling.current;
      const controlador = new AbortController();
      atualizacaoEmAndamento.current = { identificador, controlador };
      limiteDaRequisicao = window.setTimeout(() => {
        if (
          atualizacaoEmAndamento.current?.identificador
          !== identificador
        ) return;
        controlador.abort();
        atualizacaoEmAndamento.current = null;
        limiteDaRequisicao = null;
        agendar(250);
      }, 12_000);
      let proximoAtraso = atrasoDoPollingCanonico(
        estadoOperacionalDoPolling.current
      );
      void carregar(contexto, true, false, {
        signal: controlador.signal,
        identificadorDaConsulta: identificador
      })
        .then(() => {
          falhasConsecutivas = 0;
          proximoAtraso = atrasoDoPollingCanonico(
            estadoOperacionalDoPolling.current
          );
        })
        .catch((causa) => {
          if (
            controlador.signal.aborted
            && controlador.signal.reason
              === ABORTAR_POR_SINCRONIZACAO_INTEGRAL
          ) {
            falhasConsecutivas = 0;
            proximoAtraso = 250;
            return;
          }
          falhasConsecutivas += 1;
          proximoAtraso = atrasoDoPollingCanonico(
            estadoOperacionalDoPolling.current,
            falhasConsecutivas
          );
          if (autenticacaoExpiradaAtual.current) {
            setErro(
              "Sessão administrativa expirada. Autentique-se novamente; o contexto explícito deste Cockpit foi preservado."
            );
            return;
          }
          setErro(
            causa instanceof Error
              ? causa.message
              : "Não foi possível atualizar a telemetria operacional."
          );
        })
        .finally(() => {
          concluir(identificador, proximoAtraso);
        });
    };
    const retomarAposAutenticacaoOuFoco = () => {
      if (document.visibilityState !== "visible") return;
      autenticacaoExpiradaAtual.current = false;
      setAutenticacaoExpirada(false);
      limparTemporizador();
      agendar(0);
    };

    window.addEventListener("focus", retomarAposAutenticacaoOuFoco);
    document.addEventListener(
      "visibilitychange",
      retomarAposAutenticacaoOuFoco
    );
    agendar(250);
    return () => {
      encerrado = true;
      limparTemporizador();
      if (limiteDaRequisicao !== null) {
        window.clearTimeout(limiteDaRequisicao);
      }
      atualizacaoEmAndamento.current?.controlador.abort();
      atualizacaoEmAndamento.current = null;
      window.removeEventListener("focus", retomarAposAutenticacaoOuFoco);
      document.removeEventListener(
        "visibilitychange",
        retomarAposAutenticacaoOuFoco
      );
      const parametros = new URLSearchParams({
        organizacao: selecaoInicial.organizacao,
        participante: selecaoInicial.participante,
        sessao: selecaoInicial.sessao
      });
      void fetch(`/api/operacao-homologacao?${parametros}`, {
        method: "DELETE",
        cache: "no-store",
        keepalive: true
      }).catch(() => undefined);
    };
  }, [
    estado?.sessao.estado,
    selecaoInicial.organizacao,
    selecaoInicial.participante,
    selecaoInicial.sessao
  ]);

  const selecionarContexto = async (
    campo: "organizacao" | "participante" | "sessao",
    identificador: string
  ) => {
    const atual = estado?.contextos.selecao;
    if (campo === "organizacao" || campo === "participante") {
      const organizacao = campo === "organizacao"
        ? identificador
        : String(atual?.identificador_da_organizacao ?? "");
      const participante = campo === "participante" ? identificador : "";
      versaoDoCockpit.current = "";
      setEstado(null);
      await carregarOpcoesDeContexto(organizacao, participante);
      return;
    }
    const proxima: Record<string, string> = {
      organizacao: String(atual?.identificador_da_organizacao ?? ""),
      participante: String(atual?.identificador_do_participante ?? ""),
      sessao: String(atual?.identificador_da_sessao ?? "")
    };
    proxima[campo] = identificador;
    setOcupado("contexto");
    setErro("");
    try {
      versaoDoCockpit.current = "";
      await carregar(proxima);
      const url = new URL(window.location.href);
      for (const chave of ["organizacao", "participante", "sessao"]) {
        if (proxima[chave]) url.searchParams.set(chave, proxima[chave]);
        else url.searchParams.delete(chave);
      }
      window.history.replaceState(window.history.state, "", url);
    } catch (causa) {
      setErro(causa instanceof Error ? causa.message : "Contexto recusado.");
    } finally {
      setOcupado("");
    }
  };

  useEffect(() => {
    if (!tocando) return;
    const id = window.setInterval(
      () => setCursor((atual) => atual >= intervalo[1] ? intervalo[0] : Math.min(intervalo[1], atual + velocidade)),
      500
    );
    return () => window.clearInterval(id);
  }, [tocando, velocidade, intervalo]);

  const enviar = async (acao: string, dados: Record<string, unknown> = {}) => {
    setOcupado(acao);
    setErro("");
    try {
      const parametros = new URLSearchParams(window.location.search);
      const selecaoDaUrl = {
        organizacao: parametros.get("organizacao"),
        participante: parametros.get("participante"),
        sessao: parametros.get("sessao")
      };
      const resposta = await fetch("/api/operacao-homologacao", {
        method: "POST",
        headers: { "content-type": "application/json", "x-humanexus-csrf": csrf() },
        body: JSON.stringify({
          acao,
          identificador_da_organizacao:
            selecaoDaUrl.organizacao
            ?? estado?.contextos.selecao.identificador_da_organizacao,
          identificador_do_participante:
            selecaoDaUrl.participante
            ?? estado?.contextos.selecao.identificador_do_participante,
          identificador_da_sessao:
            selecaoDaUrl.sessao
            ?? estado?.contextos.selecao.identificador_da_sessao,
          ...dados
        })
      });
      const retorno = await resposta.json();
      if (!resposta.ok) throw new Error(retorno?.erro?.mensagem ?? "Comando recusado.");
      setEstado(retorno);
      if (["acao-principal", "acao-operacional"].includes(acao)) {
        window.dispatchEvent(new CustomEvent(
          "humanexus:operacao-atualizada",
          {
            detail: {
              sessao: String(
                retorno.contextos?.selecao?.identificador_da_sessao
                ?? selecaoDaUrl.sessao
                ?? ""
              )
            }
          }
        ));
      }
      if (retorno.carregamento_progressivo) {
        void carregar({
          organizacao: String(
            retorno.contextos?.selecao?.identificador_da_organizacao ?? ""
          ),
          participante: String(
            retorno.contextos?.selecao?.identificador_do_participante ?? ""
          ),
          sessao: String(
            retorno.contextos?.selecao?.identificador_da_sessao ?? ""
          )
        }).catch((causa) => {
          setErro(
            causa instanceof Error
              ? causa.message
              : "Não foi possível completar a atualização operacional."
          );
        });
      }
    } catch (causa) {
      setErro(causa instanceof Error ? causa.message : "Comando recusado.");
    } finally {
      setOcupado("");
    }
  };

  const novaChaveDeTentativa = () => crypto.randomUUID();

  const comandos = useMemo(() => ({
    principal: (comando: string) => enviar(
      "acao-principal",
      criarPayloadDoComandoPrincipal(comando, novaChaveDeTentativa())
    ),
    operacional: (comando: string, justificativa?: string) =>
      enviar("acao-operacional", {
        comando,
        justificativa,
        chave_de_idempotencia: novaChaveDeTentativa()
      }),
    evento: () => enviar("evento", { momento: "TREINO" }),
    intervencao: () => enviar("intervencao"),
    atualizar: () => {
      void carregar().catch((causa) => {
        setErro(
          causa instanceof Error
            ? causa.message
            : "Não foi possível atualizar a leitura operacional."
        );
      });
    },
    comparar: () => enviar("comparar"),
    registro: (categoria: string, textoDoRegistro: string) =>
      enviar("registro-profissional", {
        categoria,
        texto: textoDoRegistro
      }),
    evidenciaProfissional: (payload: Registro) =>
      enviar("evidencia-profissional", { payload }),
    replay: () => enviar("replay"),
    exportarReplay: () => enviar("exportar-replay", { inicio_percentual: intervalo[0], fim_percentual: intervalo[1] }),
    longitudinal: () => enviar("consolidar-longitudinal"),
    entregas: () => enviar("materializar-entregas"),
    relatorio: () => enviar("relatorio")
  }), [intervalo]);

  const configurarCortex = async () => {
    const clientId = cortexClientId.trim();
    const clientSecret = cortexClientSecret.trim();
    if (!clientId || !clientSecret) {
      setErro("Informe o identificador e o segredo do cliente Cortex no formulário local protegido.");
      return;
    }
    setCortexClientId("");
    setCortexClientSecret("");
    await enviar("configurar-cortex", {
      client_id: clientId,
      client_secret: clientSecret
    });
  };

  if (contextoParaSelecao && !estado) return <>
    {erro ? <p className="hx-module__error">{erro}</p> : null}
    <SelecaoInicialDoCockpit
      contexto={contextoParaSelecao}
      selecao={selecaoPendente}
      ocupado={ocupado !== ""}
      selecionarOrganizacao={(identificador) => {
        void carregarOpcoesDeContexto(identificador)
          .catch((causa) => setErro(causa.message));
      }}
      selecionar={(campo, identificador) => setSelecaoPendente((atual) => ({
        ...atual,
        [campo]: identificador,
        ...(campo === "participante" ? { sessao: "" } : {})
      }))}
      abrir={() => void abrirContextoSelecionado()}
    />
  </>;
  if (erro && !estado) return <p className="hx-module__error">{erro}</p>;
  if (!estado) return modulo === "cockpit-vivo"
    ? <EstruturaInicialDoCockpit />
    : <p className="hx-module__loading">Carregando a sessão técnica preservada…</p>;

  const marcadores = marcadoresDaSessao(estado);
  const faixas = faixasDasFases(estado);
  const frequencia = pontosFrequencia(estado.telemetria);
  const latencia = pontosTelemetria(estado.telemetria, "latencia_ms");
  const buffer = pontosTelemetria(estado.telemetria, "buffer");
  const ultimoPacote = telemetriaOrdenada(estado.telemetria).at(-1);
  const perdas = estado.telemetria.reduce((total, item) => total + Number(item.perda_detectada ?? 0), 0);
  const foraDeOrdem = estado.telemetria.filter((item) => Boolean(item.fora_de_ordem)).length;
  const duplicados = estado.eventos_tecnicos.filter((item) => item.tipo === "DUPLICIDADE_REJEITADA").length;
  const seletorContexto = (
    <SeletorDeContexto
      estado={estado}
      ocupado={ocupado !== ""}
      selecionar={(campo, identificador) => void selecionarContexto(campo, identificador)}
    />
  );
  const parametrosDoContexto = new URLSearchParams({
    organizacao: estado.contextos.selecao.identificador_da_organizacao,
    participante: estado.contextos.selecao.identificador_do_participante,
    sessao: estado.contextos.selecao.identificador_da_sessao
  });
  const pdfHref = `/api/operacao-homologacao/pdf?${parametrosDoContexto}`;
  const pode = (comando: string) => comandoPermitido(estado, comando);
  const fluxoOperacional = objeto(estado.estado_operacional);
  const contratoCientifico = objeto(estado.contrato_cientifico);
  const prontidaoCientifica = objeto(contratoCientifico.prontidao);
  const barreirasCientificas = Array.isArray(prontidaoCientifica.bloqueios)
    ? prontidaoCientifica.bloqueios as Registro[]
    : [];
  const integridadeOperacional = objeto(fluxoOperacional.integridade);
  const inconsistenciasDoFluxo = Array.isArray(
    integridadeOperacional.inconsistencias
  )
    ? integridadeOperacional.inconsistencias as Registro[]
    : [];
  const acaoPrincipal = String(
    fluxoOperacional.proxima_acao_principal ?? ""
  ).trim().toUpperCase().replace(/\s+/g, "_");
  const podeConduzirOperacao = Array.isArray(estado.usuario.permissoes)
    && estado.usuario.permissoes.map(String).includes("conduzir_sessao");
  const acoesSecundarias = Array.isArray(
    fluxoOperacional.acoes_secundarias_permitidas
  )
    ? fluxoOperacional.acoes_secundarias_permitidas.map(String)
    : [];
  const controlesOperacionais = objeto(
    fluxoOperacional.controles_operacionais
  );
  const executarPrincipal = () => {
    if (acaoPrincipal === "PREPARAR_SESSAO") {
      window.location.assign(`/plataforma/sessoes?${parametrosDoContexto}`);
      return;
    }
    if (acaoPrincipal === "DEFINIR_REFERENCIA_BASELINE") {
      document
        .getElementById("referencia-baseline")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (acaoPrincipal === "ENCERRAR_TECNICAMENTE_POR_INCIDENTE") {
      const justificativa = window.prompt(
        "Descreva o incidente operacional. Os dados serão preservados e a sessão não será declarada cientificamente completa."
      );
      if (!justificativa?.trim()) return;
      void comandos.operacional(acaoPrincipal, justificativa.trim());
      return;
    }
    if (
      (acaoPrincipal.startsWith("ENCERRAR_") || acaoPrincipal === "CONCLUIR_SESSAO")
      && !window.confirm(
        `Confirmar ${(
          ROTULOS_DOS_COMANDOS[acaoPrincipal] ?? texto(acaoPrincipal)
        ).toLocaleLowerCase("pt-BR")}? Os registros já recebidos serão preservados.`
      )
    ) return;
    void comandos.principal(acaoPrincipal);
  };
  const executarSecundaria = (comando: string) => {
    if (comando === "RECUPERAR_ESTACAO") {
      const justificativa = window.prompt(
        "Informe o motivo da recuperação segura da estação. A sessão e os dados científicos não serão alterados."
      );
      if (!justificativa?.trim()) return;
      return void comandos.operacional(comando, justificativa.trim());
    }
    if (
      (comando.startsWith("ENCERRAR_") || comando === "CONCLUIR_SESSAO")
      && !window.confirm(
        `Confirmar ${(
          ROTULOS_DOS_COMANDOS[comando] ?? texto(comando)
        ).toLocaleLowerCase("pt-BR")}? Os registros já recebidos serão preservados.`
      )
    ) return;
    if (comando === "REGISTRAR_EVENTO") return void comandos.evento();
    if (comando === "REGISTRAR_INTERVENCAO") {
      return void comandos.intervencao();
    }
    if (comando === "ABRIR_REPLAY") {
      return selecionarVisao("replay");
    }
    if (comando === "GERAR_RELATORIO") return void comandos.relatorio();
    void comandos.operacional(comando);
  };

  const controles = (
    <section className="hx-op-controls">
      <div className="hx-op-controls__head"><p>COMANDO CONTEXTUAL</p><span>Estado único do backend, sessão httpOnly, CSRF e rastreabilidade do núcleo.</span></div>
      <div className="hx-limit-consolidated">
        <strong>ENCERRAMENTO OPERACIONAL ≠ COMPLETUDE CIENTÍFICA</strong>
        <span>
          {texto(
            fluxoOperacional.completude_cientifica,
            "CIENTIFICAMENTE INCOMPLETA"
          )}
          {inconsistenciasDoFluxo.length
            ? ` · ${inconsistenciasDoFluxo
                .map((item) => texto(item.codigo))
                .join(" · ")}`
            : ""}
        </span>
      </div>
      <div className="hx-scientific-contract">
        <div>
          <p>CONTRATO DE ENTREGA CIENTÍFICA DA SESSÃO</p>
          <strong>{texto(
            prontidaoCientifica.mensagem,
            "NÃO PRONTO — CONTRATO CIENTÍFICO AUSENTE"
          )}</strong>
        </div>
        {Array.isArray(contratoCientifico.indicadores)
          && (contratoCientifico.indicadores as Registro[]).length ? (
          <ul>
            {(contratoCientifico.indicadores as Registro[]).map((item) => (
              <li key={texto(item.identificador ?? item.codigo)}>
                <b>{texto(item.nome ?? item.codigo)}</b>
                <span>{texto(item.estado)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <span>
            Nenhum indicador foi prometido para esta sessão histórica.
          </span>
        )}
        {barreirasCientificas.length ? (
          <ol>
            {barreirasCientificas.map((item, indice) => (
              <li key={`${texto(item.indicador)}-${indice}`}>
                <b>NÃO PRONTO — {texto(item.indicador)}</b>
                <span>REQUISITO: {texto(item.requisito)}</span>
                <span>AÇÃO: {texto(item.acao)}</span>
              </li>
            ))}
          </ol>
        ) : null}
      </div>
      <div className="hx-op-controls__primary">
        {acaoPrincipal ? (
          <Botao forte onClick={executarPrincipal} disabled={ocupado !== "" || !podeConduzirOperacao}>
            {ROTULOS_DOS_COMANDOS[acaoPrincipal] ?? texto(acaoPrincipal)}
          </Botao>
        ) : (
          <strong>SESSÃO SEM AÇÃO OPERACIONAL PENDENTE</strong>
        )}
        {fluxoOperacional.motivo_de_bloqueio ? (
          <span>
            {texto(fluxoOperacional.motivo_de_bloqueio)}
          </span>
        ) : null}
        {!podeConduzirOperacao ? (
          <span>Consulta administrativa ativa. A condução da sessão permanece exclusiva do profissional responsável.</span>
        ) : null}
      </div>
      {acoesSecundarias.length ? (
        <div className="hx-op-controls__secondary">
          {acoesSecundarias.map((comando) => (
            <Botao
              key={comando}
              onClick={() => executarSecundaria(comando)}
              disabled={ocupado !== "" || !pode(comando) || (
                !podeConduzirOperacao && comando !== "ABRIR_REPLAY"
              )}
            >
              {ROTULOS_DOS_COMANDOS[comando] ?? texto(comando)}
            </Botao>
          ))}
        </div>
      ) : null}
    </section>
  );

  const eventos = (
    <section className="hx-op-log">
      <div><p>EVENTOS E MARCADORES</p><strong>{estado.eventos.length} registro(s) preservado(s)</strong></div>
      <ol>
        {estado.eventos.length
          ? estado.eventos.map((evento) => (
              <li key={String(evento.identificador)}>
                <span>{texto(evento.momento)}</span>
                <b>{texto(evento.tipo)}</b>
                <small>{dataLegivel(evento.ocorrido_em)}</small>
              </li>
            ))
          : <li><b>Nenhum evento registrado.</b></li>}
      </ol>
    </section>
  );

  const telemetria = (
    <section className="hx-telemetry">
      <div className="hx-telemetry__heading">
        <div><p>TELEMETRIA BRIDGE</p><h2>Métricas técnicas preservadas e separadas de evidência humana.</h2></div>
        <div className="hx-health-indicator"><span className={ultimoPacote?.hash_do_dado_bruto ? "is-ok" : "is-blocked"} /><small>INTEGRIDADE</small><strong>{ultimoPacote?.hash_do_dado_bruto ? "PRESERVADA" : "SEM PACOTES"}</strong></div>
      </div>
      <div className="hx-telemetry__grid">
        {[
          ["FONTE", estado.fontes.length ? "ATIVA" : "INDISPONÍVEL"],
          ["EQUIPAMENTO", String(ultimoPacote?.tipo_de_dispositivo ?? "").includes("EMOTIV") ? "EPOC X" : String(ultimoPacote?.tipo_de_dispositivo ?? "").includes("POLAR") ? "POLAR H10" : "SEM PACOTES"],
          ["SEQUÊNCIA", texto(ultimoPacote?.sequencia)],
          ["ORIGEM", dataLegivel(ultimoPacote?.timestamp_de_origem)],
          ["RECEBIMENTO", dataLegivel(ultimoPacote?.timestamp_de_recebimento)],
          ["FREQUÊNCIA", frequencia.at(-1)?.value != null ? `${frequencia.at(-1)?.value?.toFixed(2)} Hz` : "INDISPONÍVEL"],
          ["LATÊNCIA", ultimoPacote ? `${Number(ultimoPacote.latencia_ms).toFixed(2)} ms` : "INDISPONÍVEL"],
          ["PERDA", `${perdas} pacote(s)`],
          ["DUPLICADOS", `${duplicados} rejeitado(s)`],
          ["FORA DE ORDEM", `${foraDeOrdem} pacote(s)`],
          ["BUFFER", texto(objeto(objeto(ultimoPacote?.dado_normalizado_json).valor).buffer)],
          ["INTEGRIDADE", ultimoPacote?.hash_do_dado_bruto ? "PRESERVADA" : "SEM PACOTES"]
        ].map(([rotulo, valor]) => (
          <div key={rotulo}><small>{rotulo}</small><strong>{valor}</strong><span>DADO TÉCNICO PRESERVADO</span></div>
        ))}
      </div>
      <TelemetryCommandChart
        frequency={frequencia}
        latency={latencia}
        buffer={buffer}
        markers={marcadores.filter((marcador) => ["disconnect", "reconnect"].includes(marcador.kind))}
      />
    </section>
  );

  const conectoresTecnicos = (
    <section className="hx-technical-stack">
      {estado.configuracao_cortex?.permitido ? (
        <form
          className="hx-cortex-config"
          onSubmit={(evento) => {
            evento.preventDefault();
            void configurarCortex();
          }}
        >
          <header>
            <div>
              <small>CONFIGURAÇÃO LOCAL PROTEGIDA · ADMINISTRADOR PROPRIETÁRIO</small>
              <strong>Cortex / EMOTIV EPOC X</strong>
              <span>
                {estado.configuracao_cortex.configurado
                  ? "CREDENCIAL CONFIGURADA NO RUNTIME LOCAL"
                  : "CREDENCIAL CORTEX AINDA NÃO CONFIGURADA"}
              </span>
            </div>
            <p>Os valores são enviados ao backend local autenticado, armazenados fora do Git com permissão privada e nunca retornam ao navegador.</p>
          </header>
          <div className="hx-cortex-config__fields">
            <label>
              <span>Identificador do cliente Cortex</span>
              <input
                type="password"
                value={cortexClientId}
                onChange={(evento) => setCortexClientId(evento.target.value)}
                autoComplete="off"
                spellCheck={false}
              />
            </label>
            <label>
              <span>Segredo do cliente Cortex</span>
              <input
                type="password"
                value={cortexClientSecret}
                onChange={(evento) => setCortexClientSecret(evento.target.value)}
                autoComplete="new-password"
                spellCheck={false}
              />
            </label>
            <button
              className="hx-op-button hx-op-button--gold"
              type="submit"
              disabled={ocupado !== "" || !cortexClientId.trim() || !cortexClientSecret.trim()}
            >
              {estado.configuracao_cortex.configurado ? "Substituir configuração local" : "Salvar no runtime local"}
            </button>
          </div>
        </form>
      ) : null}
      {estado.conectores.length === 0 ? (
        <EmptySignalState
          title="EPOC X E POLAR H10"
          status="AGUARDANDO_HOMOLOGACAO_FISICA"
          reason="O caminho de software permanece disponível, mas nenhum hardware real está fisicamente conectado. Nenhum sinal, evidência humana ou resultado científico foi produzido."
        />
      ) : estado.conectores.map((conector) => {
        const historico = estado.historicos_conectores.find((item) => item.identificador === conector.identificador)?.eventos ?? [];
        const emotiv = String(conector.nome_da_fonte ?? "").includes("EMOTIV");
        return (
          <article className="hx-connector" key={String(conector.identificador)}>
            <div><p>{texto(conector.nome_da_fonte)}</p><strong>{texto(conector.estado)}</strong><span>{texto(conector.modo)}</span></div>
            <div>
              <dl>
                <div>
                  <dt>SDK / LICENÇA</dt>
                  <dd>
                    {emotiv
                      ? estado.configuracao_cortex.configurado
                        ? "CORTEX CONFIGURADO · SEGREDO NÃO EXPOSTO"
                        : "CORTEX AGUARDANDO CONFIGURAÇÃO LOCAL"
                      : "BLE NATIVO · LICENÇA EXTERNA NÃO APLICÁVEL"}
                  </dd>
                </div>
                <div><dt>FIRMWARE</dt><dd>{texto(conector.firmware)}</dd></div>
                <div><dt>QUALIDADE</dt><dd>{texto(conector.confiabilidade)}</dd></div>
                <div><dt>LATÊNCIA</dt><dd>{texto(conector.latencia_ms)}</dd></div>
              </dl>
              <div className="hx-connector-timeline">
                {historico.length ? historico.map((item, indice) => (
                  <span className={`is-${String(item.estado_destino ?? item.estado).toLowerCase()}`} key={`${texto(item.ocorrido_em ?? item.criado_em)}-${indice}`}>
                    <i />{texto(item.estado_destino ?? item.estado)}<small>{dataLegivel(item.ocorrido_em ?? item.criado_em)}</small>
                  </span>
                )) : <EmptySignalState title="HISTÓRICO DE CONEXÃO" reason="Nenhuma transição foi registrada." />}
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );

  const visaoPreTreinoPos = (
    <section className="hx-cockpit-panel">
      <TituloDaVisao kicker="PRÉ / TREINO / PÓS" titulo="Fases independentes, comparáveis somente sob governança." descricao="Preparação, comandos, snapshots, fontes, eventos e comparação permanecem no contexto da sessão." />
      <ReferenciaBaselineResumo estado={estado} />
      {controles}
      <PhaseComparisonChart phases={fasesComparaveis(estado)} markers={marcadores.filter((item) => item.phase === "TREINO")} />
      <div className="hx-phase-vector-grid">
        {estado.ciencia.vetores.map((vetor) => (
          <article key={codigoDoVetor(vetor)}>
            <small>{codigoDoVetor(vetor)} · {nomeDoVetor(vetor)}</small>
            <strong>COMPARAÇÃO INDISPONÍVEL</strong>
            <span>PRÉ, TREINO e PÓS não possuem estado vetorial humano válido. Magnitude, direção, sentido, interação e contribuição não são preenchidos.</span>
          </article>
        ))}
      </div>
      <p className="hx-comparison-limit">Somente aumento observado, redução observada, estabilidade observada, reorganização observada ou comparação indisponível podem ser apresentados. Nenhuma melhora, piora ou causalidade é inferida.</p>
      {eventos}
    </section>
  );

  const referenciaBaseline = estado.gravacao?.baseline?.referencia;
  const pontosLongitudinais = lista(estado.longitudinal?.pontos_regulatorios)
    .map(objeto)
    .map((item) => ({
      time: instante(item.instante ?? item.criado_em),
      value: typeof item.iirh === "number" && item.iirh_valido !== false ? item.iirh : null,
      label: texto(
        item.nome_operacional
        ?? (item.identificador_da_sessao === estado.sessao.identificador
          ? estado.sessao.nome_operacional
          : null),
        "Sessão histórica"
      ),
      source: "Longitudinal oficial · IIRH persistido",
      quality: typeof item.confiabilidade === "number" ? item.confiabilidade : null,
      coverage: typeof item.cobertura === "number" ? item.cobertura : null,
      phase: texto(item.zona),
      zone: texto(item.zona),
      ctr: texto(item.ctr),
      thx: texto(item.thx),
      version: texto(item.versao_cientifica),
      gap: item.comparavel === false
    }));
  const visaoLongitudinal = (
    <section className="hx-cockpit-panel">
      <TituloDaVisao kicker="LONGITUDINAL" titulo="Histórico do participante sem recálculo silencioso." descricao="Sessões, ciclos, versões, lacunas e comparabilidade metodológica permanecem preservados." />
      <div className="hx-report-operation"><div><strong>{texto(estado.longitudinal?.estado_da_evidencia, "EVIDÊNCIA LONGITUDINAL")}</strong><span>A trajetória descritiva existe desde o Baseline; tendência madura continua submetida à elegibilidade temporal.</span></div><Botao onClick={comandos.longitudinal} disabled={ocupado !== ""}>Consolidar versão longitudinal</Botao></div>
      <LongitudinalEvolutionChart points={pontosLongitudinais} />
      <EvolucaoDaAssinaturaNeuroregulatoria longitudinal={estado.longitudinal} />
      <ReferenciaBaselineResumo estado={estado} />
      <Rastreabilidade estado={estado} />
    </section>
  );

  const itensReplay = Array.isArray(estado.replay?.itens) ? estado.replay.itens as Registro[] : [];
  const midiasPersistidas = (estado.gravacao?.segmentos ?? []).filter(
    (item) => item.estado === "PERSISTIDO" && item.reproducao_autorizada
  );
  const itensDaLinhaCientifica = itensReplay.flatMap((item) => {
    const time = instante(item.timestamp_original);
    if (!time) return [];
    const detalhes = objeto(item.dados_de_inspecao_json);
    return [{
      time,
      track: texto(item.modalidade),
      label: texto(detalhes.tipo, "REGISTRO"),
      event: texto(detalhes.tipo, ""),
      source: texto(item.origem, "NÚCLEO OFICIAL")
    }];
  });
  const registroBaseline = estado.gravacao?.baseline?.registro;
  const itensDoBaseline = registroBaseline?.iniciado_em
    ? [
        {
          time: instante(registroBaseline.iniciado_em),
          track: "REFERÊNCIA DE BASELINE",
          label: "BASELINE INICIADO",
          event: "BASELINE_INICIADO",
          source: "REGISTRO OPERACIONAL SEPARADO"
        },
        ...(registroBaseline.finalizado_em
          ? [{
              time: instante(registroBaseline.finalizado_em),
              track: "REFERÊNCIA DE BASELINE",
              label: "BASELINE ENCERRADO",
              event: "BASELINE_ENCERRADO",
              source: "REGISTRO OPERACIONAL SEPARADO"
            }]
          : [])
      ]
    : [];
  const itensDaLinha = [...itensDaLinhaCientifica, ...itensDoBaseline];
  const modalidadesReplay = [...new Set(itensDaLinha.map((item) => item.track))];
  const trilhasVisiveis = modalidadesReplay.filter((item) => trilhas[item] !== false);
  const replayDisponivel = itensDaLinha.length > 0;
  const visaoReplay = (
    <section className="hx-cockpit-panel">
      <TituloDaVisao kicker="REPLAY" titulo="Linha multimodal da sessão ativa." descricao="Participante, CTR, THX, fases, eventos, fontes e contexto permanecem sincronizados." />
      <div className="hx-limit-consolidated">
        <strong>FLUXO CIENTÍFICO · PRÉ → TREINO → PÓS</strong>
        <span>
          {texto(referenciaBaseline?.estado, "SESSÃO SEM REFERÊNCIA DE BASELINE")}
          {" · "}baseline exibido em trilha operacional própria, fora das fases científicas.
        </span>
      </div>
      <section className="hx-replay hx-replay--operational">
        <div className="hx-replay__toolbar">
          <div><p>REPLAY MULTIMODAL SINCRONIZADO</p><strong>{texto(estado.replay?.linha?.identificador, "LINHA NÃO GERADA")}</strong></div>
          <div><Botao onClick={comandos.replay} disabled={ocupado !== ""}>Atualizar linha</Botao><Botao forte onClick={comandos.exportarReplay} disabled={ocupado !== "" || !itensReplay.length}>Exportar intervalo</Botao></div>
        </div>
        <div className="hx-replay-controls">
          <Botao onClick={() => setTocando(true)} disabled={!replayDisponivel}>Reproduzir</Botao>
          <Botao onClick={() => setTocando(false)} disabled={!replayDisponivel || !tocando}>Pausar</Botao>
          <Botao onClick={() => setCursor((valor) => Math.max(intervalo[0], valor - 5))} disabled={!replayDisponivel}>Retroceder</Botao>
          <Botao onClick={() => setCursor((valor) => Math.min(intervalo[1], valor + 5))} disabled={!replayDisponivel}>Avançar</Botao>
          <label>Velocidade<select disabled={!replayDisponivel} value={velocidade} onChange={(evento) => setVelocidade(Number(evento.target.value))}><option value=".5">0,5×</option><option value="1">1×</option><option value="2">2×</option><option value="4">4×</option></select></label>
          <label>Zoom<input disabled={!replayDisponivel} type="range" min="1" max="6" step=".25" value={zoom} onChange={(evento) => setZoom(Number(evento.target.value))} /></label>
        </div>
        <div className="hx-replay-interval">
          <label>Início do intervalo<input disabled={!replayDisponivel} type="range" min="0" max="100" value={intervalo[0]} onChange={(evento) => setIntervalo([Math.min(Number(evento.target.value), intervalo[1] - 1), intervalo[1]])} /></label>
          <label>Fim do intervalo<input disabled={!replayDisponivel} type="range" min="0" max="100" value={intervalo[1]} onChange={(evento) => setIntervalo([intervalo[0], Math.max(Number(evento.target.value), intervalo[0] + 1)])} /></label>
          <span>Cursor {cursor.toFixed(0)}% · intervalo {intervalo[0]}–{intervalo[1]}%</span>
        </div>
        <div className="hx-replay-filters">
          {modalidadesReplay.map((item) => <label key={item}><input disabled={!replayDisponivel} type="checkbox" checked={trilhas[item] !== false} onChange={(evento) => setTrilhas((atual) => ({ ...atual, [item]: evento.target.checked }))} />{item}</label>)}
          {!modalidadesReplay.includes("VETOR") ? <span>Vetores · não registrados nesta sessão</span> : null}
          {!modalidadesReplay.includes("RESULTANTE") ? <span>Resultante · não registrada nesta sessão</span> : null}
        </div>
        {!replayDisponivel ? (
          <p className="hx-module__notice">
            Nenhum conteúdo válido disponível nesta sessão. Os comandos de
            reprodução permanecem indisponíveis até existir uma linha auditável.
          </p>
        ) : null}
        <ReplayTimelineChart items={itensDaLinha} phases={faixas} markers={marcadores} cursorPercent={cursor} interval={intervalo} zoom={zoom} visibleTracks={trilhasVisiveis} />
        {midiasPersistidas.length ? <div className="hx-replay-media">
          {midiasPersistidas.map((item) => (
            <article key={String(item.identificador)}>
              <small>{texto(item.fase)} · {texto(item.modalidade)}</small>
              {item.modalidade === "VIDEO"
                ? <video controls playsInline preload="metadata" src={`/api/plataforma/midias/${encodeURIComponent(String(item.identificador))}`} />
                : <audio controls preload="metadata" src={`/api/plataforma/midias/${encodeURIComponent(String(item.identificador))}`} />}
              <span>{texto(item.estado)} · integridade {item.integridade_confirmada ? "confirmada" : "não confirmada"}</span>
            </article>
          ))}
        </div> : <EmptySignalState title="ÁUDIO E VÍDEO" reason="Nenhum segmento de mídia persistido e autorizado nesta sessão." />}
        <div className="hx-replay-inspection"><small>INSPEÇÃO ATUAL</small><strong>{itensReplay.length} itens íntegros · {estado.linhas.length} versão(ões) preservada(s)</strong><span>Desconexões, reconexões, intervenções, lacunas e eventos permanecem visíveis.</span></div>
      </section>
      {eventos}
    </section>
  );

  const visaoRelatorio = (
    <section className="hx-cockpit-panel hx-report-view">
      <TituloDaVisao kicker="RELATÓRIO" titulo="Documento gerado a partir do contexto já carregado." descricao="Sessão, evidências, vetores, Resultante, Trajetória, fases, decisões e limitações permanecem vinculados." />
      <ReferenciaBaselineResumo estado={estado} />
      <section className="hx-report-operation">
        <div><p>RELATÓRIO E PDF GOVERNADOS</p><h2>{estado.relatorios.length ? texto(estado.relatorios.at(-1)?.titulo) : "Nenhum relatório gerado"}</h2><span>{estado.relatorios.length ? `${estado.relatorios.length} versão(ões) preservada(s) · ${dataLegivel(estado.relatorios.at(-1)?.criado_em)}` : "A geração exige a sessão concluída."}</span></div>
        <div><Botao onClick={comandos.entregas} disabled={ocupado !== "" || !estadoOperacionalTerminal(estado.sessao.estado)}>Materializar entregas finais</Botao><Botao forte onClick={comandos.relatorio} disabled={ocupado !== "" || !estadoOperacionalTerminal(estado.sessao.estado)}>Gerar relatório</Botao>{estado.relatorios.length ? <><a className="hx-op-button" href={pdfHref} download>Baixar PDF A4 claro</a><a className="hx-op-button" href={`${pdfHref}&modo=impressao`} target="_blank" rel="noopener noreferrer">Abrir para impressão</a></> : null}</div>
      </section>
      <RelatorioCanonico relatorio={estado.relatorios.at(-1)} />
      <div className="hx-report-charts" data-humanexus-report>
        <PhaseComparisonChart phases={fasesComparaveis(estado)} markers={marcadores.filter((item) => item.phase === "TREINO")} />
      </div>
      <Rastreabilidade estado={estado} />
    </section>
  );

  const visaoColetiva = (
    <section className="hx-cockpit-panel">
      <TituloDaVisao kicker="MODO COLETIVO DO COCKPIT" titulo="Alternância Individual / Coletivo preservando privacidade." descricao="Organização, equipe, período, finalidade, cobertura e amostra elegível são obrigatórios." />
      <div className="hx-mode-switch">
        <button type="button" onClick={() => selecionarVisao("visao-geral")}>Cockpit Individual</button>
        <button type="button" className="is-active" aria-current="page">Cockpit Coletivo</button>
      </div>
      <EmptySignalState title="COBERTURA E AMOSTRA COLETIVA" status="AMOSTRA NÃO ELEGÍVEL" reason="A sessão atual é técnica e individual. Não há equipe autorizada, finalidade coletiva, anonimização ou amostra elegível." />
    </section>
  );

  const visaoTecnica = (
    <section className="hx-cockpit-panel">
      <TituloDaVisao kicker="TÉCNICO" titulo="Infraestrutura recolhível e subordinada à leitura científica." descricao="Somente falhas que comprometam qualidade, cobertura ou conexão recebem destaque na sessão." />
      <ReferenciaBaselineResumo estado={estado} />
      <div className="hx-technical-tabs">
        {[
          ["fontes", "Fontes"],
          ["conectores", "Conectores"],
          ["telemetria", "Telemetria"],
          ["midia", "Mídia"],
          ["movel", "Móvel"]
        ].map(([item, rotulo]) => <button className={painelTecnico === item ? "is-active" : ""} type="button" onClick={() => setPainelTecnico(item)} key={item}>{rotulo}</button>)}
      </div>
      {painelTecnico === "fontes" ? (
        <div className="hx-source-health">
          <article><small>Fontes</small><strong>{estado.fontes.length ? "DISPONÍVEIS" : "INDISPONÍVEIS"}</strong><span>{estado.fontes.length} registro(s)</span></article>
          <article><small>Conexão</small><strong>{estado.conectores.some((item) => item.estado === "TRANSMITINDO") ? "ATIVA" : "NÃO ATIVA"}</strong><span>Reconexões preservadas no histórico</span></article>
          <article><small>Qualidade / cobertura</small><strong>TÉCNICA</strong><span>Não equivale a qualidade de evidência humana</span></article>
        </div>
      ) : null}
      {painelTecnico === "conectores" ? conectoresTecnicos : null}
      {painelTecnico === "telemetria" ? telemetria : null}
      {painelTecnico === "midia" ? (
        <ControleGravacaoMultimodal sessao={String(estado.sessao.identificador)} />
      ) : null}
      {painelTecnico === "movel" ? (
        <section className="hx-mobile-console">
          <div><p>ACESSO MÓVEL AUTENTICADO</p><h2>{texto(estado.usuario.nome)}</h2><span>Sessão única por cookie httpOnly · perfil {texto(estado.usuario.perfil)}</span></div>
          <div className="hx-mobile-console__status">
            <article><small>Participante</small><strong>{texto(estado.participante.nome ?? estado.participante.referencia_externa)}</strong></article>
            <article><small>Fase / tempo</small><strong>{faseAtual(estado)} · {dataLegivel(estado.execucao?.iniciado_em)}</strong></article>
            <article><small>Conectores</small><strong>{estado.conectores.filter((item) => item.estado === "TRANSMITINDO").length}/{estado.conectores.length} transmitindo</strong></article>
            <article><small>Alertas</small><strong>{perdas + foraDeOrdem} técnico(s)</strong></article>
            <article><small>Eventos</small><strong>{estado.eventos.length} sincronizados</strong></article>
            <article><small>Retomada de rede</small><strong>{estado.historicos_conectores.some((item) => item.eventos.length > 2) ? "DEMONSTRADA" : "NÃO DEMONSTRADA"}</strong></article>
          </div>
        </section>
      ) : null}
      <details className="hx-technical-details">
        <summary>Inspeção técnica protegida</summary>
        <div className="hx-source-health">
          <article><small>Frequência</small><strong>{frequencia.at(-1)?.value != null ? `${frequencia.at(-1)?.value?.toFixed(2)} Hz` : "SEM LEITURA"}</strong><span>Janela técnica observada</span></article>
          <article><small>Latência</small><strong>{ultimoPacote ? `${Number(ultimoPacote.latencia_ms).toFixed(2)} ms` : "SEM LEITURA"}</strong><span>Último dado recebido</span></article>
          <article><small>Integridade</small><strong>{ultimoPacote?.hash_do_dado_bruto ? "PRESERVADA" : "SEM PACOTES"}</strong><span>{perdas} perda(s) · {duplicados} duplicado(s) · {foraDeOrdem} fora de ordem</span></article>
        </div>
      </details>
    </section>
  );

  let conteudoDaVisao: React.ReactNode;
  if (visao === "evidencias") conteudoDaVisao = <EvidenciasDoCockpit estado={estado} />;
  else if (visao === "constituicao") conteudoDaVisao = <ConstituicaoOperacional estado={estado} />;
  else if (visao === "matriz-vetorial") conteudoDaVisao = <MatrizVetorial estado={estado} selecionado={vetorSelecionado} selecionar={setVetorSelecionado} />;
  else if (visao === "resultante") conteudoDaVisao = <ResultanteRegulatoria estado={estado} />;
  else if (visao === "trajetoria") conteudoDaVisao = <TrajetoriaRegulatoria estado={estado} />;
  else if (visao === "pre-treino-pos") conteudoDaVisao = visaoPreTreinoPos;
  else if (visao === "rotas-regulatorias") conteudoDaVisao = <RotasRegulatorias estado={estado} />;
  else if (visao === "ctr-thx") conteudoDaVisao = <section className="hx-cockpit-panel"><TituloDaVisao kicker="CTR E THX" titulo="Critério individual e protocolo autorizado no mesmo contexto." descricao="Código, nome e estado da execução permanecem separados do catálogo." /><Identificacao estado={estado} /><Rastreabilidade estado={estado} /></section>;
  else if (visao === "formulacao") conteudoDaVisao = <FormulacaoRegulatoria estado={estado} />;
  else if (visao === "longitudinal") conteudoDaVisao = visaoLongitudinal;
  else if (visao === "replay") conteudoDaVisao = visaoReplay;
  else if (visao === "relatorio") conteudoDaVisao = visaoRelatorio;
  else if (visao === "coletivo") conteudoDaVisao = visaoColetiva;
  else if (visao === "tecnico") conteudoDaVisao = visaoTecnica;
  else conteudoDaVisao = (
    <CockpitOperacionalVivo
      estado={estado as unknown as Registro}
      ocupado={ocupado !== ""}
      erro={erro}
      acaoPrincipal={acaoPrincipal}
      rotuloDaAcao={rotuloDoComandoCentral(acaoPrincipal)}
      acoesSecundarias={acoesSecundarias}
      controlesOperacionais={controlesOperacionais}
      rotuloDaSecundaria={rotuloDoComandoCentral}
      executarPrincipal={executarPrincipal}
      executarSecundaria={executarSecundaria}
      registrar={(categoria, textoDoRegistro) =>
        comandos.registro(categoria, textoDoRegistro)}
      registrarEvidenciaProfissional={(payload) =>
        comandos.evidenciaProfissional(payload)}
      abrirAnalitico={() => selecionarVisao("evidencias")}
      permitirOperacao={podeConduzirOperacao}
    />
  );
  const controleDeBaseline = [
    "PREPARAR_SESSAO",
    "DEFINIR_REFERENCIA_BASELINE",
    "INICIAR_BASELINE",
    "PAUSAR_BASELINE",
    "RETOMAR_BASELINE",
    "ENCERRAR_BASELINE"
  ].includes(acaoPrincipal) ? (
    <ControleGravacaoMultimodal
      sessao={String(estado.sessao.identificador)}
    />
  ) : null;

  if (modulo === "cockpit-vivo") {
    const operacional = visao === "visao-geral";
    return (
      <div className="hx-operacao hx-cockpit-workspace">
        <div className="hx-cockpit-mode-switch" aria-label="Modo do Cockpit">
          <button
            className={operacional ? "is-active" : ""}
            type="button"
            onClick={() => selecionarVisao("visao-geral")}
          >
            <small>EXECUÇÃO</small>
            <strong>Modo operacional ao vivo</strong>
          </button>
          <button
            className={!operacional ? "is-active" : ""}
            type="button"
            onClick={() => selecionarVisao("evidencias")}
          >
            <small>ANÁLISE</small>
            <strong>Inspeção TIRH</strong>
          </button>
        </div>
        {operacional ? (
          <details className="hx-live-context-picker">
            <summary>Alterar organização, participante ou sessão</summary>
            {seletorContexto}
          </details>
        ) : (
          <>
            {seletorContexto}
            <ContextoPersistente estado={estado} visao={visao} />
            <AvisoTecnico estado={estado} />
            <NavegacaoInterna visao={visao} selecionar={selecionarVisao} />
          </>
        )}
        {autenticacaoExpirada ? (
          <aside className="hx-module__error" role="status" aria-live="polite">
            Sessão administrativa expirada. O contexto explícito do Cockpit
            permanece nesta tela. {" "}
            <a href="/entrar" target="_blank" rel="noreferrer">
              Autenticar novamente
            </a>
            {" "}e retornar a esta aba para retomar o polling.
          </aside>
        ) : null}
        <main className="hx-cockpit-view" data-cockpit-view={visao}>
          {conteudoDaVisao}
          {operacional && acaoPrincipal !== "PREPARAR_SESSAO"
            ? controleDeBaseline
            : null}
        </main>
        {!operacional && erro ? <p className="hx-module__error">{erro}</p> : null}
      </div>
    );
  }

  if (modulo === "conectores") {
    return (
      <div className="hx-operacao">
        {seletorContexto}
        <HxSectionHeader
          className="hx-op-title"
          eyebrow="CONECTORES / OPERAÇÃO TÉCNICA"
          title="Histórico real de conexão, desconexão e retomada do ambiente isolado."
        />
        <AvisoTecnico />
        {conectoresTecnicos}
      </div>
    );
  }

  if (modulo === "telemetria") return <div className="hx-operacao">{seletorContexto}<Hud estado={estado} />{telemetria}</div>;

  if (modulo === "pre-treino-pos") {
    return (
      <div className="hx-operacao">
        {seletorContexto}
        <Contexto estado={estado} />
        {controles}
        {controleDeBaseline}
        <PhaseComparisonChart phases={fasesComparaveis(estado)} markers={marcadores.filter((item) => item.phase === "TREINO")} />
        <p className="hx-comparison-limit">Diferenças são exibidas apenas como aumento, redução, estabilidade observada ou comparação indisponível. Nenhuma causalidade é inferida.</p>
        {eventos}
      </div>
    );
  }

  if (modulo === "replay") {
    const itens = Array.isArray(estado.replay?.itens) ? estado.replay.itens as Registro[] : [];
    const timelineItems = itens.flatMap((item) => {
      const time = instante(item.timestamp_original);
      if (!time) return [];
      const detalhes = objeto(item.dados_de_inspecao_json);
      return [{
        time,
        track: texto(item.modalidade),
        label: texto(detalhes.tipo, "REGISTRO"),
        event: texto(detalhes.tipo, ""),
        source: texto(item.origem, "NÚCLEO OFICIAL")
      }];
    });
    const modalidades = [...new Set(timelineItems.map((item) => item.track))];
    const visiveis = modalidades.filter((item) => trilhas[item] !== false);
    return (
      <div className="hx-operacao">
        {seletorContexto}
        <Contexto estado={estado} />
        <section className="hx-replay hx-replay--operational">
          <AvisoTecnico />
          <div className="hx-replay__toolbar">
            <div><p>REPLAY MULTIMODAL SINCRONIZADO</p><strong>{texto(estado.replay?.linha?.identificador, "LINHA NÃO GERADA")}</strong></div>
            <div><Botao onClick={comandos.replay} disabled={ocupado !== ""}>Atualizar linha</Botao><Botao forte onClick={comandos.exportarReplay} disabled={ocupado !== "" || !itens.length}>Exportar intervalo</Botao></div>
          </div>
          <div className="hx-replay-controls">
            <Botao onClick={() => setTocando(true)} disabled={!itens.length}>Reproduzir</Botao>
            <Botao onClick={() => setTocando(false)} disabled={!itens.length || !tocando}>Pausar</Botao>
            <Botao onClick={() => setCursor((valor) => Math.max(intervalo[0], valor - 5))} disabled={!itens.length}>Retroceder</Botao>
            <Botao onClick={() => setCursor((valor) => Math.min(intervalo[1], valor + 5))} disabled={!itens.length}>Avançar</Botao>
            <label>Velocidade<select disabled={!itens.length} value={velocidade} onChange={(evento) => setVelocidade(Number(evento.target.value))}><option value=".5">0,5×</option><option value="1">1×</option><option value="2">2×</option><option value="4">4×</option></select></label>
            <label>Zoom<input disabled={!itens.length} type="range" min="1" max="6" step=".25" value={zoom} onChange={(evento) => setZoom(Number(evento.target.value))} /></label>
          </div>
          <div className="hx-replay-interval">
            <label>Início do intervalo<input disabled={!itens.length} type="range" min="0" max="100" value={intervalo[0]} onChange={(evento) => setIntervalo([Math.min(Number(evento.target.value), intervalo[1] - 1), intervalo[1]])} /></label>
            <label>Fim do intervalo<input disabled={!itens.length} type="range" min="0" max="100" value={intervalo[1]} onChange={(evento) => setIntervalo([intervalo[0], Math.max(Number(evento.target.value), intervalo[0] + 1)])} /></label>
            <span>Cursor {cursor.toFixed(0)}% · intervalo {intervalo[0]}–{intervalo[1]}%</span>
          </div>
          <div className="hx-replay-filters">
            {modalidades.map((item) => (
              <label key={item}><input disabled={!itens.length} type="checkbox" checked={trilhas[item] !== false} onChange={(evento) => setTrilhas((atual) => ({ ...atual, [item]: evento.target.checked }))} />{item}</label>
            ))}
          </div>
          {!itens.length ? (
            <p className="hx-module__notice">
              Nenhum conteúdo válido disponível nesta sessão. Os comandos de
              reprodução permanecem indisponíveis até existir uma linha auditável.
            </p>
          ) : null}
          <ReplayTimelineChart
            items={timelineItems}
            phases={faixas}
            markers={marcadores}
            cursorPercent={cursor}
            interval={intervalo}
            zoom={zoom}
            visibleTracks={visiveis}
          />
          <div className="hx-replay-inspection">
            <small>INSPEÇÃO ATUAL</small>
            <strong>{itens.length} itens íntegros · {estado.linhas.length} versão(ões) preservada(s)</strong>
            <span>Desconexões, reconexões, intervenções, lacunas e eventos permanecem visíveis nas trilhas correspondentes.</span>
          </div>
        </section>
        {eventos}
      </div>
    );
  }

  if (modulo === "movel") {
    return (
      <div className="hx-operacao hx-mobile-operation">
        {seletorContexto}
        <AvisoTecnico />
        <Contexto estado={estado} />
        <section className="hx-mobile-console">
          <div><p>ACESSO MÓVEL AUTENTICADO</p><h2>{texto(estado.usuario.nome)}</h2><span>Sessão única por cookie httpOnly · perfil {texto(estado.usuario.perfil)}</span></div>
          <div className="hx-mobile-console__status">
            <article><small>Participante</small><strong>{texto(estado.participante.nome ?? estado.participante.referencia_externa)}</strong></article>
            <article><small>Fase / tempo</small><strong>{faseAtual(estado)} · {dataLegivel(estado.execucao?.iniciado_em)}</strong></article>
            <article><small>Conectores</small><strong>{estado.conectores.filter((item) => item.estado === "TRANSMITINDO").length}/{estado.conectores.length} transmitindo</strong></article>
            <article><small>Alertas</small><strong>{perdas + foraDeOrdem} técnico(s)</strong></article>
            <article><small>Eventos</small><strong>{estado.eventos.length} sincronizados</strong></article>
            <article><small>Retomada de rede</small><strong>{estado.historicos_conectores.some((item) => item.eventos.length > 2) ? "DEMONSTRADA" : "NÃO DEMONSTRADA"}</strong></article>
          </div>
          <div className="hx-mobile-console__commands">
            <Botao onClick={comandos.evento} disabled={ocupado !== "" || estadoOperacionalTerminal(estado.sessao.estado)}>Registrar evento permitido</Botao>
            <Botao onClick={comandos.atualizar} disabled={ocupado !== ""}>Atualizar leitura</Botao>
            <span>{estado.movel.comandos.length} comando(s) móvel(is) auditado(s)</span>
          </div>
        </section>
      </div>
    );
  }

  if (modulo === "relatorios") {
    return (
      <div className="hx-operacao hx-report-view">
        {seletorContexto}
        <AvisoTecnico />
        <Contexto estado={estado} />
        <section className="hx-report-operation">
          <div><p>RELATÓRIO E PDF GOVERNADOS</p><h2>{estado.relatorios.length ? texto(estado.relatorios.at(-1)?.titulo) : "Nenhum relatório gerado"}</h2><span>{estado.relatorios.length ? `${estado.relatorios.length} versão(ões) preservada(s) · ${dataLegivel(estado.relatorios.at(-1)?.criado_em)}` : "A geração exige a sessão concluída."}</span></div>
          <div><Botao onClick={comandos.entregas} disabled={ocupado !== "" || !estadoOperacionalTerminal(estado.sessao.estado)}>Materializar entregas finais</Botao><Botao forte onClick={comandos.relatorio} disabled={ocupado !== "" || !estadoOperacionalTerminal(estado.sessao.estado)}>Gerar relatório</Botao>{estado.relatorios.length ? <><a className="hx-op-button" href={pdfHref} download>Baixar PDF A4 claro</a><a className="hx-op-button" href={`${pdfHref}&modo=impressao`} target="_blank" rel="noopener noreferrer">Abrir para impressão</a></> : null}</div>
        </section>
        <RelatorioCanonico relatorio={estado.relatorios.at(-1)} />
        <div className="hx-report-charts" data-humanexus-report>
          <PhaseComparisonChart phases={fasesComparaveis(estado)} markers={marcadores.filter((item) => item.phase === "TREINO")} />
          <TelemetryCommandChart frequency={frequencia} latency={latencia} buffer={buffer} markers={marcadores.filter((item) => ["disconnect", "reconnect"].includes(item.kind))} />
        </div>
        <Rastreabilidade estado={estado} />
      </div>
    );
  }

  if (modulo === "longitudinal") {
    const pontosRegulatorios = lista(estado.longitudinal?.pontos_regulatorios).map(objeto);
    const pontos = pontosRegulatorios.map((item) => ({
      time: instante(item.instante ?? item.criado_em),
      value: typeof item.iirh === "number" && item.iirh_valido !== false ? item.iirh : null,
      label: texto(
        item.nome_operacional
        ?? (item.identificador_da_sessao === estado.sessao.identificador
          ? estado.sessao.nome_operacional
          : null),
        "Sessão histórica"
      ),
      source: "Longitudinal oficial",
      quality: typeof item.confiabilidade === "number" ? item.confiabilidade : null,
      coverage: typeof item.cobertura === "number" ? item.cobertura : null,
      phase: texto(item.zona),
      zone: texto(item.zona),
      ctr: texto(item.ctr),
      thx: texto(item.thx),
      version: texto(item.versao_cientifica),
      gap: item.comparavel === false
    }));
    return (
      <div className="hx-operacao">
        {seletorContexto}
        <AvisoTecnico />
        <HxSectionHeader
          className="hx-op-title"
          eyebrow="LONGITUDINAL"
          title="Comparabilidade metodológica protegida."
          description="Filtros por período, contexto, tarefa e versão científica são aplicados sem ligar sessões incompatíveis."
        />
        <LongitudinalEvolutionChart points={pontos} />
        <EvolucaoDaAssinaturaNeuroregulatoria longitudinal={estado.longitudinal} />
        <Rastreabilidade estado={estado} />
      </div>
    );
  }

  if (modulo === "indicador-coletivo") {
    return (
      <div className="hx-operacao">
        {seletorContexto}
        <AvisoTecnico />
        <HxSectionHeader
          className="hx-op-title"
          eyebrow="INDICADOR COLETIVO"
          title="Governança coletiva sem extrapolação individual."
        />
        <EmptySignalState
          title="COORDENAÇÃO · COMUNICAÇÃO · CONSCIÊNCIA COMPARTILHADA · RECUPERAÇÃO COLETIVA"
          status="AMOSTRA NÃO ELEGÍVEL"
          reason="A sessão atual é técnica e individual. Não há grupo autorizado, anonimização, cobertura coletiva ou comparabilidade temporal suficientes."
        />
      </div>
    );
  }

  if (modulo === "painel") {
    return (
      <div className="hx-operacao">
        {seletorContexto}
        <Hud estado={estado} />
        <CockpitSignalStack tracks={trilhasDoCockpit(estado)} markers={marcadores} phases={faixas} />
        <Rastreabilidade estado={estado} />
      </div>
    );
  }

  return (
    <div className="hx-operacao">
      {seletorContexto}
      <Hud estado={estado} />
      <Contexto estado={estado} />
      <Identificacao estado={estado} />
      {controles}
      {controleDeBaseline}
      <CockpitSignalStack tracks={trilhasDoCockpit(estado)} markers={marcadores} phases={faixas} />
      {telemetria}
      {eventos}
      <Rastreabilidade estado={estado} />
      {erro ? <p className="hx-module__error">{erro}</p> : null}
    </div>
  );
}
