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
import { fonteDuranteSincronizacao } from "@/lib/cockpit-live-coordination";
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
  janela_de_qualidade?: Registro;
  series?: Record<string, Registro[]>;
  ultima_leitura_registrada?: Registro;
  projecao_em_verificacao?: boolean;
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
  permitirOperacao: boolean;
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
  if (fonte.ao_vivo !== true) return [];
  return metricasDeDesempenhoDaFonte(fonte);
}

function metricasDeDesempenhoDaFonte(fonte: Fonte) {
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

function estadoDoIndicador(valor: unknown) {
  const codigo = String(valor ?? "").toUpperCase();
  return ({
    PREPARANDO: "Aguardando requisitos oficiais",
    QUALIDADE_ADEQUADA: "Fontes preparadas",
    PRONTO_COM_RESSALVA_EEG: "Fontes preparadas com ressalva de EEG",
    PRONTO_PARA_VALIDACAO: "Resultado aguardando validação profissional",
    ENTREGAVEL: "Resultado validado e entregável"
  } as Record<string, string>)[codigo] ?? texto(valor, "Aguardando requisitos oficiais");
}

function fontesDoIndicador(valor: unknown) {
  return Array.isArray(valor) && valor.length
    ? valor.map((item) => texto(item)).join(" · ")
    : "Nenhuma";
}

function itensExplicaveis(valor: unknown) {
  if (!Array.isArray(valor)) return [];
  return valor.map((item) => {
    if (item && typeof item === "object") {
      const registro = item as Registro;
      return texto(
        registro.codigo
        ?? registro.componente
        ?? registro.definicao
        ?? registro.identificador
        ?? registro.motivo,
        "Registro rastreável"
      );
    }
    return texto(item);
  });
}

function referenciaCientificaLegivel(valor: unknown) {
  if (Array.isArray(valor)) {
    return valor.map((item) => texto(item)).filter(Boolean).join(" · ");
  }
  const referencia = objeto(valor);
  if (Object.keys(referencia).length) {
    return [
      referencia.versao,
      referencia.arquivo,
      referencia.funcao,
      referencia.linhas,
      referencia.base_operacional_humanexus_12
    ].map((item) => texto(item, "")).filter(Boolean).join(" · ");
  }
  return texto(valor, "");
}

function PorQueEsteResultado({
  valor,
  fallback
}: {
  valor: unknown;
  fallback: string;
}) {
  const explicacao = objeto(valor);
  const utilizadas = itensExplicaveis(
    explicacao.evidencias_utilizadas
    ?? explicacao.evidencias_basais_aceitas
    ?? explicacao.componentes_utilizados
    ?? explicacao.vetores_contribuintes
  );
  const ausentes = itensExplicaveis(
    explicacao.evidencias_ausentes
    ?? explicacao.evidencias_basais_rejeitadas
    ?? explicacao.componentes_ausentes
    ?? explicacao.vetores_ausentes
    ?? explicacao.codigos_ausentes
    ?? explicacao.precondicoes_nao_atendidas
  );
  const familias = Array.isArray(explicacao.familias_independentes)
    ? explicacao.familias_independentes.map(String)
    : [];
  const limitacoes = Array.isArray(explicacao.limitacoes)
    ? explicacao.limitacoes.map(String)
    : [];
  const regra = objeto(explicacao.regra);
  return (
    <details className="hx-live-vector-trace hx-why-result">
      <summary>Por que este resultado?</summary>
      <dl>
        <div><dt>Estado científico</dt><dd>{texto(
          explicacao.estado_de_apresentacao,
          "NÃO CALCULÁVEL"
        )}</dd></div>
        <div><dt>Fundamento</dt><dd>{texto(
          explicacao.resumo ?? explicacao.motivo,
          fallback
        )}</dd></div>
        <div><dt>Evidências ou componentes utilizados</dt><dd>{
          utilizadas.join(" · ") || "Nenhum"
        }</dd></div>
        <div><dt>Requisitos ainda ausentes</dt><dd>{
          ausentes.join(" · ") || "Nenhum"
        }</dd></div>
        {Object.keys(regra).length ? (
          <div><dt>Regra rastreável</dt><dd>{[
            texto(regra.versao, ""),
            texto(regra.arquivo, ""),
            texto(regra.funcao, ""),
            texto(regra.linhas, "")
          ].filter(Boolean).join(" · ")}</dd></div>
        ) : null}
        {familias.length ? (
          <div><dt>Famílias independentes</dt><dd>{familias.join(" · ")}</dd></div>
        ) : null}
        {limitacoes.length ? (
          <div><dt>Limitações científicas</dt><dd>{limitacoes.map((item) => texto(item)).join(" · ")}</dd></div>
        ) : null}
        <div><dt>Ausência</dt><dd>Preservada como nula; zero e fallback são proibidos.</dd></div>
      </dl>
    </details>
  );
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
  const tinhaLeituraAtual = useRef(valido);
  const [exibido, setExibido] = useState<number | null>(valido ? alvo : null);

  useEffect(() => {
    if (!valido) {
      anterior.current = 0;
      tinhaLeituraAtual.current = false;
      setExibido(null);
      return;
    }
    if (!tinhaLeituraAtual.current) {
      tinhaLeituraAtual.current = true;
      anterior.current = alvo;
      setExibido(alvo);
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

  if (!valido || exibido == null) return <>Sem leitura atual</>;
  return <>{exibido.toFixed(casas)}{sufixo}</>;
}

function valorNormalizado(valor: unknown): number | null {
  if (typeof valor === "string") {
    try {
      return valorNormalizado(JSON.parse(valor));
    } catch {
      return null;
    }
  }
  if (typeof valor === "number" && Number.isFinite(valor) && valor >= 0 && valor <= 100) {
    return valor <= 1 ? valor : valor / 100;
  }
  const registro = objeto(valor);
  for (const chave of ["valor", "magnitude", "escore", "value"]) {
    const candidato = registro[chave];
    if (typeof candidato === "number" && Number.isFinite(candidato) && candidato >= 0 && candidato <= 100) {
      return candidato <= 1 ? candidato : candidato / 100;
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
  if (fonte.ao_vivo !== true) return [];
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
  const aoVivo = fonte.ao_vivo === true;
  const emVerificacao = fonte.projecao_em_verificacao === true;
  const valores = aoVivo || emVerificacao ? objeto(fonte.valores) : {};
  const metricas = aoVivo || emVerificacao ? objeto(fonte.metricas) : {};
  const ultimaRegistrada = objeto(fonte.ultima_leitura_registrada);
  const valoresRegistrados = objeto(ultimaRegistrada.valores);
  return (
    <article className="hx-live-source-card" data-source="polar">
      <header><div><small>POLAR H10</small><strong>Sinal cardiovascular</strong></div><FonteEstado estado={fonte.estado} /></header>
      <div className="hx-live-source-values">
        <span><small>Frequência cardíaca</small><b>{aoVivo || emVerificacao ? `${numero(valores.hr_bpm)} bpm` : "Sem leitura atual"}</b></span>
        <span><small>RMSSD</small><b>{aoVivo || emVerificacao ? `${numero(valores.rmssd_tecnico_ms, 1)} ms` : "Sem leitura atual"}</b></span>
        <span><small>Qualidade</small><b>{aoVivo || emVerificacao ? percentual(metricas.qualidade) : "Sem leitura atual"}</b></span>
        <span><small>Bateria</small><b>{aoVivo || emVerificacao ? percentual(valores.bateria_percentual) : "Sem leitura atual"}</b></span>
      </div>
      {emVerificacao ? (
        <div className="hx-live-source-advisory" role="status">
          <strong>ÚLTIMA PROJEÇÃO CANÔNICA — VALIDADE EM VERIFICAÇÃO</strong>
          <span>Os números permanecem visíveis para continuidade operacional, mas não são tratados como leitura atual nem alimentam cálculos científicos.</span>
        </div>
      ) : null}
      <Sparkline pontos={aoVivo ? lista(fonte.series?.hr) : []} cor={C.gold} />
      <footer>
        <span>{aoVivo ? `Pacote atual ${dataLegivel(metricas.ultimo_pacote)}` : "Sem pacote atual"}</span>
        <span>{aoVivo ? `Latência ${numero(metricas.latencia_ms, 1)} ms · perdas ${numero(metricas.perdas)}` : "Fonte sem transmissão atual"}</span>
      </footer>
      {!aoVivo && ultimaRegistrada.timestamp ? (
        <details className="hx-live-recorded-reading">
          <summary>Última leitura registrada</summary>
          <span>{dataLegivel(ultimaRegistrada.timestamp)} · FC {numero(valoresRegistrados.hr_bpm)} bpm · RMSSD {numero(valoresRegistrados.rmssd_tecnico_ms, 1)} ms</span>
        </details>
      ) : null}
    </article>
  );
}

function FonteEpoc({ fonte }: { fonte: Fonte }) {
  const aoVivo = fonte.ao_vivo === true;
  const emVerificacao = fonte.projecao_em_verificacao === true;
  const valores = aoVivo || emVerificacao ? objeto(fonte.valores) : {};
  const metricas = aoVivo || emVerificacao ? objeto(fonte.metricas) : {};
  const janela = aoVivo || emVerificacao ? objeto(fonte.janela_de_qualidade) : {};
  const desempenho = metricasDeDesempenhoDaFonte(fonte);
  const desempenhoPorNome = new Map(
    desempenho.map((metrica) => [String(metrica.nome ?? ""), metrica])
  );
  const ultimaRegistrada = objeto(fonte.ultima_leitura_registrada);
  const valoresRegistrados = objeto(ultimaRegistrada.valores);
  return (
    <article className="hx-live-source-card hx-live-source-card--epoc" data-source="epoc-x">
      <header><div><small>EPOC X</small><strong>Desempenho e qualidade</strong></div><FonteEstado estado={fonte.estado} /></header>
      <div className="hx-live-source-values">
        <span><small>Qualidade atual do sinal EEG</small><b>{aoVivo || emVerificacao ? percentual(valores.qualidade_global) : "Sem leitura atual"}</b></span>
        <span><small>Mediana da qualidade EEG</small><b>{aoVivo || emVerificacao ? percentual(valores.qualidade_mediana_da_janela) : "Sem leitura atual"}</b></span>
        <span><small>Confiança do EEG</small><b>{aoVivo || emVerificacao ? texto(valores.nivel_de_confianca_eeg) : "Indisponível"}</b></span>
        <span><small>Sequência atual</small><b>{aoVivo || emVerificacao ? numero(metricas.ultima_sequencia) : "Sem leitura atual"}</b></span>
      </div>
      {emVerificacao ? (
        <div className="hx-live-source-advisory" role="status">
          <strong>ÚLTIMA PROJEÇÃO CANÔNICA — VALIDADE EM VERIFICAÇÃO</strong>
          <span>Qualidade e neurotelemetria permanecem identificadas como não atuais até a próxima confirmação do núcleo.</span>
        </div>
      ) : null}
      {aoVivo && janela.estado_da_qualidade === "QUALIDADE_MUITO_DEGRADADA" ? (
        <div className="hx-live-source-advisory" role="status">
          <strong>QUALIDADE MUITO DEGRADADA</strong>
          <span>EEG com confiança reduzida ou não admissível. A sessão e as demais fontes continuam normalmente.</span>
        </div>
      ) : null}
      <Sparkline pontos={aoVivo ? lista(fonte.series?.qualidade) : []} cor={C.green} />
      <div className="hx-live-performance-heading">
        <small>NEUROTELEMETRIA REGULATÓRIA · STREAM MET CORTEX</small>
        <span>Separada da qualidade do sinal EEG · sem estimativa e sem derivação por qualidade.</span>
      </div>
      <div className="hx-live-performance-grid">
        {METRICAS_DE_DESEMPENHO_VISIVEIS.map((nome) => {
          const metrica = desempenhoPorNome.get(nome);
          const leituraAtual = aoVivo && metrica?.valor_atual != null;
          return (
            <span key={nome}>
              <small>{nome}</small>
              <b>{leituraAtual ? percentual(metrica?.valor_atual) : "SEM LEITURA ATUAL"}</b>
              <em>{leituraAtual
                ? `${texto(metrica?.tendencia)} · ${texto(metrica?.estado_da_aquisicao)} · ATUAL · ${dataLegivel(metrica?.ultima_atualizacao)}`
                : emVerificacao && metrica?.valor_atual != null
                  ? `Última projeção ${percentual(metrica.valor_atual)} · validade em verificação`
                  : "Stream MET real sem valor canônico atual"}</em>
            </span>
          );
        })}
      </div>
      {!aoVivo && ultimaRegistrada.timestamp ? (
        <details className="hx-live-recorded-reading">
          <summary>Última leitura registrada</summary>
          <span>{dataLegivel(ultimaRegistrada.timestamp)} · qualidade {percentual(valoresRegistrados.qualidade_global)}</span>
        </details>
      ) : null}
      <footer>
        <span>{aoVivo ? `Latência ${numero(metricas.latencia_ms, 1)} ms · perdas ${numero(metricas.perdas)}` : "Sem pacote atual"}</span>
        <span>{aoVivo ? "Métricas fornecidas pelo equipamento · sem interpretação HUMANEXUS automática" : "Fonte sem transmissão atual"}</span>
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
  abrirAnalitico,
  permitirOperacao
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
  const atualizadoEm = new Date(String(
    cockpit.polling_confirmado_em ?? cockpit.atualizado_em ?? ""
  )).getTime();
  const limiteDaProjecaoMs = (
    Number(cockpit.limite_de_recencia_segundos ?? 15) + 5
  ) * 1000;
  const projecaoOperacionalAtual = Number.isFinite(atualizadoEm)
    && agora >= atualizadoEm
    && agora - atualizadoEm <= limiteDaProjecaoMs;
  const fontesRecebidas = lista(cockpit.fontes) as Fonte[];
  const fontes = projecaoOperacionalAtual
    ? fontesRecebidas
    : fontesRecebidas.map(fonteDuranteSincronizacao);
  const replay = objeto(cockpit.replay);
  const indicadores = lista(cockpit.indicadores_contratados);
  const alertas = lista(cockpit.alertas_acionaveis);
  const eventos = lista(estado.eventos);
  const replayCompleto = objeto(estado.replay);
  const itensReplay = lista(replayCompleto.itens);
  const fases = objeto(sessao.estados_das_fases);
  const modoHistorico = cockpit.modo === "REPLAY_HISTORICO";
  const modoSincronizando = !projecaoOperacionalAtual && !modoHistorico;
  const modoAguardando =
    cockpit.modo === "MODO_OPERACIONAL_AGUARDANDO_CONEXAO";
  const leituraAoVivo = projecaoOperacionalAtual
    && cockpit.ao_vivo === true
    && !modoHistorico;
  const sessaoFinalizada = contextoSessao.estado === "FINALIZADA";
  const graficos = useMemo(
    () => trilhas(fontes.filter((fonte) => fonte.ao_vivo === true)),
    [fontes]
  );
  const baselineBruto = objeto(objeto(estado.gravacao).baseline);
  const referenciaBaselineCanonica = objeto(
    estadoOperacional.referencia_de_baseline
  );
  const registroBaselineCanonico = objeto(
    referenciaBaselineCanonica.baseline
  );
  const registroBaselineDaGravacao = objeto(baselineBruto.registro);
  const registroBaseline = Object.keys(registroBaselineCanonico).length > 0
    ? registroBaselineCanonico
    : registroBaselineDaGravacao;
  const baseline = referenciaDeBaseline(baselineBruto);
  const inicioDoCronometro = sessaoBaseline
    ? registroBaseline.iniciado_em
    : sessao.tempo_total_inicio;
  const fimDoCronometro = sessaoBaseline
    ? registroBaseline.finalizado_em
    : sessao.tempo_total_fim;
  const estadoDoBaseline = registroBaseline.estado === "INICIADO"
    ? "EM EXECUÇÃO"
    : texto(registroBaseline.estado, texto(contextoSessao.estado));
  const ciencia = objeto(estado.ciencia);
  const leituraCientifica = objeto(cockpit.leitura_cientifica);
  const iirh = objeto(leituraCientifica.iirh);
  const zona = objeto(leituraCientifica.zona);
  const resultante = objeto(leituraCientifica.resultante);
  const trajetoria = objeto(leituraCientifica.trajetoria);
  const configuracaoBasal = objeto(
    leituraCientifica.configuracao_regulatoria_basal
  );
  const anamneseBasal = objeto(configuracaoBasal.anamnese);
  const vetoresBasais = lista(configuracaoBasal.vetores);
  const vetoresBasaisPorCodigo = new Map(
    vetoresBasais.map((item) => [String(item.codigo ?? ""), item])
  );
  const snapshotBasal = objeto(configuracaoBasal.snapshot_basal);
  const vetoresDoSnapshot = Object.entries(objeto(snapshotBasal.vetores));
  const iirhDoSnapshot = objeto(snapshotBasal.iirh);
  const zonaDoSnapshot = objeto(snapshotBasal.zona);
  const resultanteDoSnapshot = objeto(snapshotBasal.resultante);
  const motivosNulosDoSnapshot = objeto(snapshotBasal.motivos_dos_nulos);
  const identificadorDaSessao = texto(
    contextoSessao.identificador ?? sessao.identificador,
    ""
  );
  const faseCientificaAtual = String(sessao.fase_atual ?? "");
  const configuracaoBasalCanonica = (sessaoBaseline || (
    !sessaoFinalizada && !faseCientificaAtual
  ))
    && projecaoOperacionalAtual
    && !modoHistorico
    && texto(configuracaoBasal.identificador_da_sessao, "") === identificadorDaSessao;
  const coberturaVetorial = objeto(leituraCientifica.cobertura_vetorial);
  const definicoesVetoriais = lista(ciencia.vetores);
  const estadosVetoriais = lista(leituraCientifica.vetores);
  const estadosVetoriaisPorDefinicao = new Map(
    estadosVetoriais.map((item) => [String(item.definicao ?? ""), item])
  );
  const radarVetorial: HxVectorAxis[] = definicoesVetoriais.map((definicao) => {
    const identificador = identificadorVetorial(definicao);
    const codigo = codigoVetorial(definicao);
    const estadoVetorial = estadosVetoriaisPorDefinicao.get(identificador)
      ?? estadosVetoriaisPorDefinicao.get(codigo);
    const vetorBasal = vetoresBasaisPorCodigo.get(codigo);
    return {
      code: codigo,
      name: nomeVetorial(definicao),
      value: leituraAoVivo ? valorNormalizado(estadoVetorial?.magnitude)
        : configuracaoBasalCanonica
          ? valorNormalizado(vetorBasal?.magnitude)
          : null
    };
  });
  const radarCompleto = radarVetorial.length === 10
    && radarVetorial.every((item) => item.value != null);
  const cienciaAtualAdmissivel = leituraAoVivo || configuracaoBasalCanonica;
  const iirhCalculado = cienciaAtualAdmissivel && iirh.estado === "CALCULADO"
    && typeof iirh.valor === "number";
  const resultanteCalculada = cienciaAtualAdmissivel
    && (resultante.estado === "CALCULAVEL" || resultante.estado === "CONFLITANTE")
    && typeof resultante.valor === "number";
  const seloDaResultante = texto(
    resultante.selo,
    "HIPÓTESE OPERACIONAL v0.1 — EM VALIDAÇÃO EMPÍRICA"
  );
  const vetoresContribuintesDaResultante = Array.isArray(resultante.vetores_contribuintes)
    ? resultante.vetores_contribuintes.map(String)
    : [];
  const vetoresAusentesDaResultante = Array.isArray(resultante.vetores_ausentes)
    ? resultante.vetores_ausentes.map(String)
    : [];
  const macrocamposCobertosDaResultante = Array.isArray(resultante.macrocampos_cobertos)
    ? resultante.macrocampos_cobertos.map(String)
    : [];
  const macrocamposAusentesDaResultante = Array.isArray(resultante.macrocampos_ausentes)
    ? resultante.macrocampos_ausentes.map(String)
    : [];
  const incertezasDaResultante = Array.isArray(resultante.incertezas)
    ? resultante.incertezas.map(String)
    : [];
  const zonaCalculada = cienciaAtualAdmissivel
    && iirhCalculado
    && Boolean(zona.nome ?? zona.codigo);
  const trajetoriaCalculada = leituraAoVivo && trajetoria.valor != null;
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
  const cadeiaCientifica = objeto(cockpit.cadeia_cientifica);
  const arrCadeia = objeto(cadeiaCientifica.arr);
  const rroCadeia = objeto(cadeiaCientifica.rro);
  const nraCadeia = objeto(cadeiaCientifica.nra);
  const thxCadeia = objeto(cadeiaCientifica.thx);
  const thxAerCadeia = objeto(cadeiaCientifica.thx_aer);
  const ctrCadeia = objeto(cadeiaCientifica.ctr);
  const validacaoCadeia = objeto(cadeiaCientifica.validacao_profissional);
  const intervencaoCadeia = objeto(cadeiaCientifica.intervencao);
  const anamneseCadeia = objeto(cadeiaCientifica.anamnese_e_contexto);
  const evidenciasCadeia = objeto(cadeiaCientifica.evidencias);
  const vetoresCadeia = objeto(cadeiaCientifica.vetores);
  const iirhCadeia = objeto(cadeiaCientifica.iirh);
  const zonaCadeia = objeto(cadeiaCientifica.zona);
  const gatilhosCadeia = objeto(cadeiaCientifica.gatilhos);
  const rotasCadeia = objeto(cadeiaCientifica.rotas_regulatorias);
  const rotaDominanteCadeia = objeto(cadeiaCientifica.rota_dominante);
  const cicloCadeia = objeto(cadeiaCientifica.pre_treino_pos);
  const ganhosCadeia = objeto(cadeiaCientifica.resposta_e_ganhos);
  const longitudinalCadeia = objeto(cadeiaCientifica.longitudinal);
  const relatoriosCadeia = objeto(cadeiaCientifica.relatorios);
  const etapasDaCadeia = [
    {
      codigo: "01",
      nome: "Fontes atuais · Polar H10, EPOC X e indicadores primários",
      estado: fontes.some((fonte) => fonte.ao_vivo === true)
        ? "EVIDÊNCIA AO VIVO"
        : modoSincronizando
          ? "SINCRONIZANDO COM O NÚCLEO"
        : "AGUARDANDO FONTES REAIS",
      motivo: fontes.some((fonte) => fonte.ao_vivo === true)
        ? "Amostras atuais da sessão explícita."
        : modoSincronizando
          ? "O portal aguarda a projeção canônica; não inferiu desconexão das fontes."
        : "Nenhuma fonte possui amostra real dentro da janela de atualidade."
    },
    {
      codigo: "02",
      nome: "Cockpit Vivo e contexto canônico",
      estado: modoSincronizando ? "SINCRONIZANDO" : "ATUALIZADO",
      motivo: modoSincronizando
        ? "Aguardando projeção canônica; nenhum estado local substitui o núcleo."
        : "Projeção da sessão, organização, participante e fase explícitos."
    },
    {
      codigo: "03",
      nome: "Anamnese e contexto",
      estado: texto(anamneseCadeia.estado, "CONTEXTO PARCIAL"),
      motivo: texto(anamneseCadeia.motivo, "Contexto humano admissível ainda parcial.")
    },
    {
      codigo: "04",
      nome: "Evidências admissíveis",
      estado: texto(evidenciasCadeia.estado, "EVIDÊNCIA ESTRUTURADA AUSENTE"),
      motivo: texto(evidenciasCadeia.motivo, "Somente evidência rastreável pode alimentar o motor.")
    },
    {
      codigo: "05",
      nome: "Vetores oficiais · dez vetores e radar",
      estado: `${Number(vetoresCadeia.calculaveis ?? radarVetorial.filter((item) => item.value != null).length)}/10 calculáveis`,
      motivo: texto(vetoresCadeia.motivo, "Ausência permanece ausência; VEV não é inferido.")
    },
    {
      codigo: "06",
      nome: "Resultante Regulatória",
      estado: texto(resultante.estado, "NAO DEFINIDA"),
      motivo: texto(
        resultante.justificativa ?? resultante.motivo,
        "Fórmula autoral de composição ainda não operacionalizada."
      )
    },
    {
      codigo: "07",
      nome: "IIRH",
      estado: texto(iirhCadeia.estado, "NAO CALCULAVEL"),
      motivo: texto(
        objeto(iirhCadeia.por_que_este_resultado).resumo,
        "Exige amplitude e cobertura humana suficientes."
      )
    },
    {
      codigo: "08",
      nome: "Zona Operacional",
      estado: texto(zonaCadeia.estado, "NAO CALCULAVEL"),
      motivo: texto(
        objeto(zonaCadeia.por_que_este_resultado).resumo ?? zonaCadeia.motivo,
        "A Zona depende de IIRH admissível e precondições multifonte."
      )
    },
    {
      codigo: "09",
      nome: "Gatilhos regulatórios",
      estado: texto(gatilhosCadeia.estado, "SEM GATILHOS ADMISSÍVEIS"),
      motivo: texto(gatilhosCadeia.motivo, "Nenhum gatilho foi inferido automaticamente.")
    },
    {
      codigo: "10",
      nome: "Rotas regulatórias possíveis",
      estado: texto(rotasCadeia.estado, "NAO CALCULAVEL"),
      motivo: texto(rotasCadeia.motivo, "Sem rota documental admissível.")
    },
    {
      codigo: "11",
      nome: "Rota dominante",
      estado: texto(rotaDominanteCadeia.estado, "NAO CALCULAVEL"),
      motivo: texto(rotaDominanteCadeia.motivo, "Nenhuma rota dominante é escolhida automaticamente.")
    },
    {
      codigo: "12",
      nome: "ARR",
      estado: texto(arrCadeia.estado, "NAO CALCULAVEL"),
      motivo: texto(arrCadeia.motivo, "Hipótese Tipo B ainda indisponível.")
    },
    {
      codigo: "13",
      nome: "Reorganização da Rota Operacional — RRO",
      estado: texto(rroCadeia.estado, "NAO CALCULAVEL"),
      motivo: texto(rroCadeia.motivo, "Operacionalização autoral ainda ausente.")
    },
    {
      codigo: "14",
      nome: "Nova Rota Adaptativa — NRA",
      estado: texto(nraCadeia.estado, "NAO CALCULAVEL"),
      motivo: texto(nraCadeia.motivo, "NRA ainda não vinculada à sessão.")
    },
    {
      codigo: "15",
      nome: "CTR",
      estado: texto(ctrCadeia.estado, "SEM SUGESTAO"),
      motivo: `${lista(ctrCadeia.sugestoes).length} sugestão(ões) · ${numero(ctrCadeia.total_disponivel)} disponível(is)`
    },
    {
      codigo: "16",
      nome: "THX",
      estado: texto(thxCadeia.estado, "NAO AVALIAVEL"),
      motivo: `${lista(thxCadeia.protocolos).length} sugestão(ões) documental(is) · catálogo ${numero(thxCadeia.total_no_catalogo_oficial)}`
    },
    {
      codigo: "17",
      nome: "THX-AER",
      estado: texto(thxAerCadeia.estado, "NAO AVALIAVEL"),
      motivo: `${lista(thxAerCadeia.protocolos).length} sugestão(ões) documental(is) · catálogo ${numero(thxAerCadeia.total_no_catalogo_oficial)}`
    },
    {
      codigo: "18",
      nome: "Validação profissional",
      estado: texto(validacaoCadeia.estado, "PENDENTE"),
      motivo: validacaoCadeia.decisao_automatica === false
        ? "Aceitar, rejeitar, substituir e justificar permanecem atos profissionais."
        : "Decisão profissional não confirmada pelo núcleo."
    },
    {
      codigo: "19",
      nome: "PRÉ → TREINO → PÓS · Intervenção",
      estado: texto(intervencaoCadeia.estado, "NAO INICIADA"),
      motivo: texto(
        cicloCadeia.motivo ?? intervencaoCadeia.motivo,
        "Cada fase exige fronteira própria e protocolo validado profissionalmente."
      )
    },
    {
      codigo: "20",
      nome: "Resposta e ganhos regulatórios",
      estado: texto(ganhosCadeia.estado, "NAO CALCULAVEL"),
      motivo: texto(ganhosCadeia.motivo, "Variação isolada não é ganho regulatório.")
    },
    {
      codigo: "21",
      nome: "Longitudinal e VEV",
      estado: texto(objeto(longitudinalCadeia.trajetoria).estado ?? trajetoria.estado, "NAO INFERIVEL"),
      motivo: texto(
        objeto(longitudinalCadeia.por_que_este_resultado).resumo,
        "Trajetória exige estados comparáveis; VEV permanece não definido."
      )
    },
    {
      codigo: "22",
      nome: "Relatório rastreável",
      estado: texto(relatoriosCadeia.estado, "NAO GERADO"),
      motivo: texto(relatoriosCadeia.motivo, "Nenhum relatório da sessão foi gerado.")
    }
  ];
  const detalhesDaEtapa: Record<string, unknown> = {
    "01": fontes.map((fonte) => ({
      codigo: fonte.codigo,
      estado: fonte.estado,
      ao_vivo: fonte.ao_vivo,
      sequencia: objeto(fonte.metricas).sequencia,
      timestamp: objeto(fonte.metricas).ultima_amostra_em
    })),
    "02": {
      organizacao: organizacao.identificador,
      participante: participante.identificador,
      sessao: sessao.identificador,
      fase: sessao.fase_atual,
      atualizado_em: cockpit.atualizado_em
    },
    "03": anamneseCadeia,
    "04": evidenciasCadeia,
    "05": { resumo: vetoresCadeia, vetores: estadosVetoriais },
    "06": resultante,
    "07": iirhCadeia,
    "08": zonaCadeia,
    "09": gatilhosCadeia,
    "10": rotasCadeia,
    "11": rotaDominanteCadeia,
    "12": arrCadeia,
    "13": rroCadeia,
    "14": nraCadeia,
    "15": ctrCadeia,
    "16": thxCadeia,
    "17": thxAerCadeia,
    "18": validacaoCadeia,
    "19": { ciclo: cicloCadeia, intervencao: intervencaoCadeia },
    "20": ganhosCadeia,
    "21": longitudinalCadeia,
    "22": relatoriosCadeia
  };

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
  const polarEmVerificacao = polar.projecao_em_verificacao === true;
  const eegEmVerificacao = eeg.projecao_em_verificacao === true;
  const polarValoresHud = objeto(polar.valores);
  const polarMetricasHud = objeto(polar.metricas);
  const eegValoresHud = objeto(eeg.valores);
  const fase = sessaoBaseline
    ? `BASELINE · ${baseline.estado}`
    : sessao.fase_atual
    ? texto(sessao.fase_atual)
    : sessaoFinalizada
      ? "SESSÃO ENCERRADA"
      : "SEM FASE ATIVA";
  const faseAtual = faseCientificaAtual;
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
  const fonteCapturando = (fonte: Fonte) => ["CONECTADO", "CAPTURANDO"].includes(
    String(fonte.estado ?? "").toUpperCase().replaceAll("_", " ")
  );
  const polarAguardando = !fonteCapturando(polar);
  const epocAguardando = !fonteCapturando(eeg);
  const orientacaoDeConexao = polarAguardando
    ? "Conecte o Polar H10 para iniciar a leitura cardiovascular real. O Centro de Comando permanece pronto sem fabricar dados."
    : epocAguardando
      ? "Polar H10 ativo. O EPOC X está indisponível ou reconectando; a sessão continua sem reutilizar dados EEG anteriores."
      : "Fontes autorizadas conectadas. A qualidade do EPOC modula somente a confiança do EEG e não bloqueia o fluxo da sessão.";

  const enviarRegistro = async () => {
    if (!registro.trim()) return;
    await registrar(categoria, registro.trim());
    setRegistro("");
  };

  return (
    <section className="hx-live-cockpit" data-cockpit-mode={cockpit.modo}>
      <nav className="hx-live-levels" aria-label="Arquitetura do Centro de Comando">
        <a href="#hx-command-level"><span>01</span><strong>Comando</strong></a>
        <a href="#hx-regulation-level"><span>02</span><strong>Regulação</strong></a>
        <a href="#hx-evidence-level"><span>03</span><strong>Evidências</strong></a>
        <a href="#hx-inspection-level"><span>04</span><strong>Inspeção</strong></a>
      </nav>
      <header className="hx-live-cockpit__masthead">
        <div className="hx-live-masthead-rail" aria-hidden="true"><i /><i /><i /></div>
        <div>
          <span className="hx-live-eyebrow">
            {modoHistorico
              ? "MODO OPERACIONAL — REPLAY HISTÓRICO"
              : modoSincronizando
                ? "MODO OPERACIONAL — SINCRONIZANDO COM O NÚCLEO"
              : modoAguardando
                ? "MODO OPERACIONAL — AGUARDANDO CONEXÃO"
                : "MODO OPERACIONAL AO VIVO"}
          </span>
          <h1>{texto(contextoSessao.nome_operacional, "Sessão operacional")}</h1>
          <p>
            {texto(participante.nome ?? participante.referencia_externa, "Participante")} · {
              sessaoBaseline
                ? "Baseline"
                : `THX ${texto(thx.codigo)} · ${texto(execucao.estado)}`
            }
          </p>
        </div>
        <div className="hx-live-mode-actions">
          <span className={modoHistorico ? "is-history" : modoSincronizando || modoAguardando ? "is-waiting" : "is-live"}>
            {modoHistorico
              ? "REPLAY HISTÓRICO"
              : modoSincronizando
                ? "SINCRONIZANDO ESTADO CANÔNICO"
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
        <div><small>ZONA OPERACIONAL</small><strong>{zonaCalculada ? texto(zona.nome ?? zona.codigo) : "NÃO CLASSIFICÁVEL"}</strong><span>{zonaCalculada ? `Taxonomia canônica · ${texto(zona.versao_da_taxonomia, "versão não informada")}` : `${texto(zona.motivo, "IIRH oficial indisponível")} · ${texto(zona.versao_da_taxonomia, "taxonomia não informada")}`}</span></div>
        <div><small>THX</small><strong>{texto(thx.codigo)}</strong><span>{texto(execucao.estado)}</span></div>
        <div><small>FASE</small><strong>{fase}</strong><span>{sessaoBaseline ? estadoDoBaseline : texto(fases[String(sessao.fase_atual ?? "")], texto(contextoSessao.estado))}</span></div>
        <div><small>TEMPO</small><strong>{duracao(inicioDoCronometro, fimDoCronometro, agora)}</strong><span>{sessaoBaseline ? "Baseline" : "Sessão"}</span></div>
        <div><small>FREQUÊNCIA CARDÍACA</small><strong>{polar.ao_vivo === true || polarEmVerificacao ? <LeituraNumerica valor={polarValoresHud.hr_bpm} sufixo=" bpm" /> : "Sem leitura atual"}</strong><span>{polarEmVerificacao ? "Última projeção canônica · não é leitura atual" : texto(polar.estado)}</span></div>
        <div><small>RMSSD</small><strong>{polar.ao_vivo === true || polarEmVerificacao ? <LeituraNumerica valor={polarValoresHud.rmssd_tecnico_ms} casas={1} sufixo=" ms" /> : "Sem leitura atual"}</strong><span>{polarEmVerificacao ? "Última projeção canônica · validade em verificação" : texto(polar.estado)}</span></div>
        <div><small>ESTADO DO EEG</small><strong>{texto(eeg.estado)}</strong><span>{eeg.ao_vivo === true ? `Atual ${percentual(eegValoresHud.qualidade_global)} · mediana ${percentual(eegValoresHud.qualidade_mediana_da_janela)}` : eegEmVerificacao ? `Última projeção ${percentual(eegValoresHud.qualidade_global)} · não atual` : "Sem leitura atual"}</span></div>
        <div><small>ESTADO DO POLAR</small><strong>{texto(polar.estado)}</strong><span>{polar.ao_vivo === true ? `Sequência atual ${numero(polarMetricasHud.ultima_sequencia)}` : polarEmVerificacao ? `Última sequência canônica ${numero(polarMetricasHud.ultima_sequencia)} · não atual` : "Sem leitura atual"}</span></div>
      </section>

      <section className="hx-live-scientific-explanations" aria-label="Explicação dos resultados científicos">
        <PorQueEsteResultado
          valor={iirh.por_que_este_resultado}
          fallback={texto(iirh.motivo, "Evidência humana insuficiente para o IIRH.")}
        />
        <PorQueEsteResultado
          valor={zona.por_que_este_resultado}
          fallback={texto(zona.motivo, "As precondições científicas da Zona não foram satisfeitas.")}
        />
        <PorQueEsteResultado
          valor={resultante.por_que_este_resultado}
          fallback={texto(resultante.justificativa ?? resultante.motivo, "Configuração vetorial insuficiente.")}
        />
        <PorQueEsteResultado
          valor={trajetoria.por_que_este_resultado}
          fallback={texto(trajetoria.motivo, "Sessões comparáveis insuficientes para trajetória e VEV.")}
        />
      </section>

      {Object.keys(configuracaoBasal).length ? (
        <HxSurface
          as="section"
          className="hx-live-scientific-chain"
          aria-label="Configuração regulatória basal"
        >
          <HxSectionHeader
            eyebrow={texto(configuracaoBasal.versao, "BASELINE REGULATÓRIO AUTORAL")}
            title="Configuração regulatória basal"
            aside={<span>FORMALIZAÇÃO AUTORAL IMPLEMENTADA · VALIDAÇÃO COMPUTACIONAL</span>}
          />
          <div className="hx-live-scientific-chain__rail">
            <article className={anamneseBasal.estado === "FONTE_ESTRUTURANTE_ADMISSIVEL" ? "is-ready" : "is-blocked"}>
              <i>01</i>
              <div>
                <small>Anamnese Regulatória</small>
                <strong>{texto(anamneseBasal.estado, "FONTE ESTRUTURANTE AUSENTE")}</strong>
                <span>{numero(anamneseBasal.evidencias_basais_aceitas)} evidências estruturadas aceitas · {lista(anamneseBasal.familias_humanas_independentes).length || (Array.isArray(anamneseBasal.familias_humanas_independentes) ? anamneseBasal.familias_humanas_independentes.length : 0)} família independente · texto livre não convertido.</span>
              </div>
            </article>
            <article className={Number(configuracaoBasal.vetores_calculaveis) > 0 ? "is-ready" : "is-blocked"}>
              <i>02</i>
              <div>
                <small>Dez vetores basais</small>
                <strong>{numero(configuracaoBasal.vetores_calculaveis)}/10 calculáveis</strong>
                <span>Magnitude somente quando sustentada por regra autoral e evidência admissível.</span>
              </div>
            </article>
            <article className={["PERSISTIDO", "ELEGIVEL_PARA_PERSISTENCIA_AO_ENCERRAR_BASELINE"].includes(texto(snapshotBasal.estado)) ? "is-ready" : "is-blocked"}>
              <i>03</i>
              <div>
                <small>Snapshot basal canônico</small>
                <strong>{texto(snapshotBasal.estado, "NÃO PERSISTIDO")}</strong>
                <span>
                  {texto(snapshotBasal.motivo, "Nenhum snapshot científico foi fabricado.")}
                  {snapshotBasal.identificador ? ` · ID ${texto(snapshotBasal.identificador)}` : ""}
                  {snapshotBasal.timestamp ? ` · ${texto(snapshotBasal.timestamp)}` : ""}
                  {snapshotBasal.versao_da_biblioteca ? ` · Biblioteca ${texto(snapshotBasal.versao_da_biblioteca)}` : ""}
                </span>
              </div>
            </article>
          </div>
          {snapshotBasal.estado === "PERSISTIDO" ? (
            <details className="hx-live-vector-trace hx-live-snapshot-inspection">
              <summary>Inspecionar snapshot basal imutável</summary>
              <dl>
                <div><dt>Identificador</dt><dd>{texto(snapshotBasal.identificador)}</dd></div>
                <div><dt>Timestamp</dt><dd>{dataLegivel(snapshotBasal.timestamp)}</dd></div>
                <div><dt>Organização</dt><dd>{texto(snapshotBasal.identificador_da_organizacao ?? organizacao.identificador)}</dd></div>
                <div><dt>Participante</dt><dd>{texto(snapshotBasal.identificador_do_participante ?? participante.identificador)}</dd></div>
                <div><dt>Sessão</dt><dd>{texto(snapshotBasal.identificador_da_sessao ?? snapshotBasal.identificador_da_sessao_de_origem)}</dd></div>
                <div><dt>Versão científica</dt><dd>{texto(snapshotBasal.versao_cientifica)}</dd></div>
                <div><dt>Biblioteca</dt><dd>{texto(snapshotBasal.versao_da_biblioteca)}</dd></div>
                <div><dt>Taxonomia de Zona</dt><dd>{texto(snapshotBasal.versao_da_taxonomia_de_zona)}</dd></div>
                <div><dt>Cobertura</dt><dd>{percentual(snapshotBasal.cobertura)}</dd></div>
                <div><dt>Qualidade</dt><dd>{percentual(snapshotBasal.qualidade)}</dd></div>
                <div><dt>Confiança</dt><dd>{percentual(snapshotBasal.confianca)}</dd></div>
                <div><dt>Fontes</dt><dd>{lista(snapshotBasal.fontes).length
                  ? lista(snapshotBasal.fontes).map((item) => texto(item.codigo ?? item.nome ?? item)).join(" · ")
                  : Array.isArray(snapshotBasal.fontes)
                    ? snapshotBasal.fontes.map((item) => texto(item)).join(" · ") || "Nenhuma"
                    : "Nenhuma"}</dd></div>
                <div><dt>Famílias</dt><dd>{Array.isArray(snapshotBasal.familias) ? snapshotBasal.familias.map((item) => texto(item)).join(" · ") || "Nenhuma" : "Nenhuma"}</dd></div>
                <div><dt>IIRH</dt><dd>{iirhDoSnapshot.valor == null ? `NULO · ${texto(iirhDoSnapshot.motivo)}` : `${numero(iirhDoSnapshot.valor, 1)} · qualidade ${percentual(iirhDoSnapshot.qualidade)} · confiança ${percentual(iirhDoSnapshot.confiabilidade ?? snapshotBasal.confianca)}`}</dd></div>
                <div><dt>Zona</dt><dd>{texto(zonaDoSnapshot.nome ?? zonaDoSnapshot.codigo, `NULA · ${texto(zonaDoSnapshot.motivo, "Precondições não atendidas no snapshot")}`)}</dd></div>
                <div><dt>Resultante</dt><dd>{resultanteDoSnapshot.valor == null ? `NULA/PARCIAL · ${texto(resultanteDoSnapshot.motivo ?? resultanteDoSnapshot.justificativa)}` : `${numero(resultanteDoSnapshot.valor, 2)} · ${texto(resultanteDoSnapshot.estado)}`}</dd></div>
                <div><dt>Proveniência</dt><dd>{referenciaCientificaLegivel(snapshotBasal.proveniencia) || "Proveniência preservada no snapshot"}</dd></div>
                <div><dt>Regra longitudinal</dt><dd>{texto(snapshotBasal.regra_de_comparacao_longitudinal)}</dd></div>
                {vetoresDoSnapshot.map(([codigo, valor]) => {
                  const vetor = objeto(valor);
                  return (
                    <div key={codigo}>
                      <dt>{codigo} · {texto(vetor.nome, "Vetor oficial")}</dt>
                      <dd>{vetor.magnitude == null
                        ? `NULO · ${texto(vetor.motivo ?? vetor.motivo_da_ausencia ?? motivosNulosDoSnapshot[codigo], "Evidência admissível ausente")}`
                        : `${numero(vetor.magnitude, 2)} · cobertura ${percentual(vetor.cobertura)} · confiança ${percentual(vetor.confianca)}`}</dd>
                    </div>
                  );
                })}
                <div><dt>Integridade</dt><dd>{texto(snapshotBasal.integridade_sha256)}</dd></div>
                <div><dt>Regra de ausência</dt><dd>Valores nulos permanecem nulos; zero e fallback são proibidos.</dd></div>
              </dl>
            </details>
          ) : null}
          <details className="hx-live-vector-trace">
            <summary>Por que este resultado? · Vetores basais e decisões pendentes</summary>
            <dl>
              {vetoresBasais.map((vetor) => (
                <div key={texto(vetor.codigo)}>
                  <dt>{texto(vetor.codigo)} · {texto(vetor.nome)}</dt>
                  <dd>
                    {texto(
                      vetor.estado_do_contrato_operacional,
                      texto(vetor.estado)
                    )} · Magnitude {vetor.magnitude == null
                      ? "não calculável"
                      : numero(vetor.magnitude, 2)} · Cobertura {percentual(vetor.cobertura)} · Confiança {percentual(vetor.confianca)} · {texto(
                      vetor.motivo,
                      texto(
                        vetor.decisao_autoral_pendente,
                        "Sem composição basal admissível."
                      )
                    )}
                    {vetor.magnitude == null && vetor.classificacao_da_ausencia
                      ? ` · Classificação ${texto(vetor.classificacao_da_ausencia)} — ${texto(
                          vetor.classificacao_da_ausencia
                        ) === "A"
                          ? "ausência real de evidência"
                          : texto(vetor.classificacao_da_ausencia) === "B"
                            ? "limite científico formal"
                            : "lacuna autoral real"
                        }`
                      : ""}
                    {lista(vetor.evidencias_utilizadas).length
                      ? ` · Evidências ${lista(vetor.evidencias_utilizadas).map((item) => texto(item.codigo)).join(" · ")}`
                      : " · Evidências: nenhuma"}
                    {vetor.mecanismo_operacional
                      ? ` · Regra ${referenciaCientificaLegivel(
                          vetor.mecanismo_operacional
                        )}`
                      : ""}
                  </dd>
                </div>
              ))}
            </dl>
          </details>
          <PorQueEsteResultado
            valor={configuracaoBasal.por_que_este_resultado}
            fallback="A configuração basal permanece limitada às regras autorais formalizadas."
          />
        </HxSurface>
      ) : null}

      <section id="hx-command-level" className="hx-live-operation-focus" aria-label="Comando e progressão da sessão">
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
              disabled={ocupado || !permitirOperacao}
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

      <div id="hx-regulation-level" className="hx-live-command-center">
        {radarVetorial.length ? (
          <HxSurface as="section" className="hx-live-vector-stage">
            <HxSectionHeader
              eyebrow={configuracaoBasalCanonica
                ? "VETORES BASAIS CANÔNICOS · MATRIZ VETORIAL"
                : "VETORES VIVOS · MATRIZ VETORIAL"}
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
                ) ?? estadosVetoriaisPorDefinicao.get(vetor.code);
                const vetorBasal = vetoresBasaisPorCodigo.get(vetor.code);
                const estadoVetorialExibido = configuracaoBasalCanonica
                  ? vetorBasal
                  : estadoVetorial;
                const evidenciasUtilizadas = lista(
                  estadoVetorialExibido?.evidencias_utilizadas
                );
                const evidenciasAusentes = Array.isArray(
                  estadoVetorialExibido?.evidencias_ausentes
                )
                  ? estadoVetorialExibido.evidencias_ausentes.map(String)
                  : [];
                const origemMatematica = objeto(
                  estadoVetorialExibido?.origem_matematica
                );
                return (
                  <div className={vetor.value == null ? "is-missing" : "has-value"} key={vetor.code}>
                    <div>
                      <span><b>{vetor.code}</b>{vetor.name}</span>
                      <strong>
                        {vetor.value == null
                          ? texto(
                              estadoVetorialExibido?.estado,
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
                    <details className="hx-live-vector-trace">
                      <summary>Por que este resultado? · Rastreabilidade científica</summary>
                      <dl>
                        <div><dt>Estado</dt><dd>{texto(estadoVetorialExibido?.estado, "NAO_DEFINIDO")}</dd></div>
                        <div><dt>Cobertura</dt><dd>{percentual(estadoVetorialExibido?.cobertura)}</dd></div>
                        <div><dt>Qualidade</dt><dd>{percentual(estadoVetorialExibido?.qualidade)}</dd></div>
                        <div><dt>Confiança</dt><dd>{percentual(estadoVetorialExibido?.confiabilidade ?? estadoVetorialExibido?.confianca)}</dd></div>
                        <div><dt>Sessão</dt><dd>{texto(estadoVetorialExibido?.identificador_da_sessao ?? configuracaoBasal.identificador_da_sessao)}</dd></div>
                        <div><dt>Fase</dt><dd>{texto(estadoVetorialExibido?.fase ?? configuracaoBasal.contexto_temporal)}</dd></div>
                        <div><dt>Timestamp</dt><dd>{dataLegivel(estadoVetorialExibido?.timestamp ?? configuracaoBasal.calculado_em)}</dd></div>
                        <div><dt>Biblioteca</dt><dd>{texto(estadoVetorialExibido?.versao_da_biblioteca ?? configuracaoBasal.versao)}</dd></div>
                        <div><dt>Origem matemática</dt><dd>{[
                          texto(origemMatematica.versao),
                          texto(origemMatematica.arquivo),
                          texto(origemMatematica.funcao),
                          texto(origemMatematica.linhas)
                        ].join(" · ")}</dd></div>
                        <div><dt>Evidências utilizadas</dt><dd>{evidenciasUtilizadas.length
                          ? evidenciasUtilizadas.map((item) => texto(item.codigo)).join(" · ")
                          : "Nenhuma"}</dd></div>
                        <div><dt>Evidências ausentes</dt><dd>{evidenciasAusentes.join(" · ") || "Nenhuma"}</dd></div>
                        {vetor.value == null ? (
                          <div><dt>Requisito ausente</dt><dd>{texto(
                            estadoVetorialExibido?.motivo,
                            "EVIDÊNCIA ABAIXO DO MÍNIMO AUTORAL"
                          )}</dd></div>
                        ) : null}
                      </dl>
                    </details>
                  </div>
                );
              })}
            </div>
          </HxSurface>
        ) : null}

        <HxSurface
          as="section"
          id="hx-evidence-level"
          className="hx-live-graphs"
          data-signal-state={modoHistorico ? "HISTORICO" : modoSincronizando ? "SINCRONIZANDO" : modoAguardando ? "AGUARDANDO" : "ATIVO"}
        >
          <HxSectionHeader
            eyebrow={modoHistorico ? "DADOS PRESERVADOS" : modoSincronizando ? "SINCRONIZANDO COM O NÚCLEO" : modoAguardando ? "AGUARDANDO FONTES" : "ATIVIDADE AO VIVO"}
            title="Leitura temporal da sessão"
            aside={<span>{modoHistorico ? "Dados físicos históricos · sem transmissão atual" : modoSincronizando ? "Aguardando a autoridade canônica · sem inferir desconexão" : modoAguardando ? "Nenhum dado é simulado enquanto os sensores não conectam" : "Atualização contínua sem recarregar a página"}</span>}
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
          <em className="hx-live-regulatory-readout__seal">{seloDaResultante}</em>
          <strong>{resultanteCalculada
            ? `${numero(resultante.valor, 2)} ${texto(resultante.unidade, "")}`
            : "NÃO CALCULÁVEL"}</strong>
          <span>{resultanteCalculada
            ? `Direção ${texto(resultante.vetor_dominante, "não dominante")} · Sentido ${texto(resultante.sentido_contextual, "NAO_DETERMINAVEL")}`
            : texto(resultante.justificativa ?? resultante.motivo, "Evidência humana insuficiente")}</span>
          <span>Cobertura {numero(resultante.cobertura, 2)} · Qualidade {numero(resultante.qualidade, 2)} · Confiança {numero(resultante.confianca, 2)}</span>
          <span>Validação profissional obrigatória · nenhuma decisão ou intervenção automática</span>
          <details className="hx-live-vector-trace">
            <summary>Por que este resultado?</summary>
            <dl>
              <div><dt>Estado</dt><dd>{texto(resultante.estado, "NAO_CALCULAVEL")}</dd></div>
              <div><dt>Magnitude</dt><dd>{numero(resultante.magnitude_global, 4)}</dd></div>
              <div><dt>Direção funcional</dt><dd>{JSON.stringify(objeto(resultante.direcao_funcional))}</dd></div>
              <div><dt>Sentido contextual</dt><dd>{texto(resultante.sentido_contextual, "NAO_DETERMINAVEL")}</dd></div>
              <div><dt>Vetores contribuintes</dt><dd>{vetoresContribuintesDaResultante.join(" · ") || "Nenhum"}</dd></div>
              <div><dt>Vetores ausentes</dt><dd>{vetoresAusentesDaResultante.join(" · ") || "Nenhum"}</dd></div>
              <div><dt>Macrocampos cobertos</dt><dd>{macrocamposCobertosDaResultante.join(" · ") || "Nenhum"}</dd></div>
              <div><dt>Macrocampos ausentes</dt><dd>{macrocamposAusentesDaResultante.join(" · ") || "Nenhum"}</dd></div>
              <div><dt>Conflitos</dt><dd>{lista(resultante.conflitos).length}</dd></div>
              <div><dt>Compensações</dt><dd>{lista(resultante.compensacoes).length}</dd></div>
              <div><dt>Contexto</dt><dd>{JSON.stringify(objeto(resultante.contexto))}</dd></div>
              <div><dt>Fase</dt><dd>{texto(resultante.fase)}</dd></div>
              <div><dt>Timestamp</dt><dd>{dataLegivel(resultante.timestamp)}</dd></div>
              <div><dt>Versão científica</dt><dd>{texto(resultante.versao_cientifica)}</dd></div>
              <div><dt>Versão da fórmula</dt><dd>{texto(resultante.versao)}</dd></div>
              <div><dt>Origem matemática</dt><dd>{JSON.stringify(objeto(resultante.origem_matematica))}</dd></div>
              <div><dt>Justificativa</dt><dd>{texto(resultante.justificativa)}</dd></div>
              <div><dt>Incertezas</dt><dd>{incertezasDaResultante.join(" · ") || "Nenhuma"}</dd></div>
            </dl>
          </details>
        </article>
        <article>
          <small>TRAJETÓRIA REGULATÓRIA</small>
          <strong>{trajetoriaCalculada ? texto(trajetoria.valor) : "NÃO INFERÍVEL"}</strong>
          <span>{trajetoriaCalculada
            ? "Estados sucessivos comparáveis"
            : "Um ponto isolado não produz trajetória"}</span>
        </article>
      </section>

      <section
        id="hx-inspection-level"
        className="hx-live-scientific-chain"
        aria-label="Cadeia científica oficial da sessão"
      >
        <header>
          <div>
            <small>HOMOLOGAÇÃO CIENTÍFICA ÚNICA · A–F</small>
            <strong>Cadeia operacional oficial</strong>
          </div>
          <span>Somente relações autorais rastreáveis · nenhuma decisão automática</span>
        </header>
        <div className="hx-live-scientific-chain__rail">
          {etapasDaCadeia.map((etapa) => {
            const estadoNormalizado = etapa.estado.toUpperCase();
            const bloqueada = estadoNormalizado.includes("NAO")
              || estadoNormalizado.includes("SEM ")
              || estadoNormalizado.includes("PENDENTE")
              || estadoNormalizado.includes("AGUARDANDO");
            return (
              <article className={bloqueada ? "is-blocked" : "is-ready"} key={etapa.codigo}>
                <i>{etapa.codigo}</i>
                <div>
                  <small>{etapa.nome}</small>
                  <strong>{etapa.estado}</strong>
                  <span>{etapa.motivo}</span>
                  <details className="hx-chain-why">
                    <summary>Por que este resultado?</summary>
                    <p>{etapa.motivo}</p>
                    <em>Ausência permanece nula; nenhuma decisão ou intervenção é automática.</em>
                    <pre>{JSON.stringify(detalhesDaEtapa[etapa.codigo], null, 2)}</pre>
                  </details>
                </div>
              </article>
            );
          })}
        </div>
        <details>
          <summary>Por que este resultado? — Rastreabilidade, dependências e candidatos documentais · cadeia completa</summary>
          <pre>{JSON.stringify(cadeiaCientifica, null, 2)}</pre>
        </details>
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
                <strong>{estadoDoIndicador(item.estado)}</strong>
                <span>{item.validado_profissionalmente ? "VALIDADO PROFISSIONALMENTE" : texto(
                  objeto(item.motivo_de_indisponibilidade).motivo,
                  "Monitoramento dos requisitos oficiais em andamento."
                )}</span>
                <details>
                  <summary>Dependências e rastreabilidade</summary>
                  <dl>
                    <div><dt>Fontes obrigatórias</dt><dd>{fontesDoIndicador(item.fontes_obrigatorias)}</dd></div>
                    <div><dt>Fontes complementares</dt><dd>{fontesDoIndicador(item.fontes_complementares)}</dd></div>
                    <div><dt>Janela mínima</dt><dd>{item.janela_temporal_minima_segundos == null ? "Não aplicável" : `${numero(item.janela_temporal_minima_segundos)} s`}</dd></div>
                    <div><dt>Atualidade máxima</dt><dd>{item.atualidade_maxima_tecnica_segundos == null ? "Artefato canônico da fase" : `${numero(item.atualidade_maxima_tecnica_segundos)} s`}</dd></div>
                    <div><dt>Confiança atual</dt><dd>{item.confianca_atual == null ? "Ainda não calculável" : percentual(item.confianca_atual)}</dd></div>
                    <div><dt>Regra de ausência</dt><dd>Ausência permanece nula, sem zero e sem fallback</dd></div>
                    <div><dt>Ação possível</dt><dd>{texto(objeto(item.motivo_de_indisponibilidade).acao_possivel, "Nenhuma ação pendente")}</dd></div>
                    <div><dt>Versão científica</dt><dd>{texto(item.versao_cientifica)}</dd></div>
                    <div><dt>Motor/contrato</dt><dd>{texto(item.versao_do_motor)}</dd></div>
                  </dl>
                </details>
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
                disabled={ocupado || (!permitirOperacao && comando !== "ABRIR_REPLAY")}
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
            <select value={categoria} onChange={(evento) => setCategoria(evento.target.value)} disabled={sessaoFinalizada || !permitirOperacao}>
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
              disabled={sessaoFinalizada || !permitirOperacao}
            />
            <button type="button" onClick={() => void enviarRegistro()} disabled={sessaoFinalizada || ocupado || !permitirOperacao || !registro.trim()}>Registrar</button>
          </div>
          <span>{permitirOperacao ? "Atalho: ⌘/Ctrl + Enter · organização, participante, sessão, fase, horário, THX, fontes e cobertura vêm do núcleo." : "Consulta administrativa: registros e comandos operacionais exigem o profissional responsável."}</span>
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
