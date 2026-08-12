"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CockpitSignalStack,
  VectorRadarChart,
  type HxPhaseRange,
  type HxTrack,
  type HxVectorAxis
} from "@/components/hx-command-visualizations";
import { ExperienceModeControl } from "@/components/experience-mode-control";
import { HX_CHART_COLORS as C } from "@/lib/humanexus-chart-theme";

const VETORES = [
  ["VH", "Vetor Humano"],
  ["VT", "Vetor Tarefa"],
  ["VS", "Vetor Social"],
  ["VSI", "Vetor Simbólico"],
  ["VAR", "Vetor Autonômico"],
  ["VAM", "Vetor Ação/Motor"],
  ["VJ", "Vetor Julgamento"],
  ["VE", "Vetor Estabilidade"],
  ["VR", "Vetor Recuperação"],
  ["VEV", "Vetor Evolução"]
] as const;

const ESTADOS_DOS_SENSORES = [
  "AGUARDANDO CONEXÃO",
  "CONECTADO",
  "CAPTURA ATIVA",
  "QUALIDADE INSUFICIENTE",
  "RECONECTANDO"
] as const;

const FASES = ["PRÉ", "TREINO", "PÓS", "BASELINE"] as const;

type EstadoDoSensor = typeof ESTADOS_DOS_SENSORES[number];
type FaseDemonstrada = typeof FASES[number];

function limitar(valor: number, minimo: number, maximo: number) {
  return Math.min(maximo, Math.max(minimo, valor));
}

function estadoTecnico(estado: EstadoDoSensor) {
  if (estado === "CAPTURA ATIVA") return "CAPTURANDO";
  if (estado === "QUALIDADE INSUFICIENTE") return "QUALIDADE INSUFICIENTE";
  return estado;
}

function proximaFase(fase: FaseDemonstrada): FaseDemonstrada {
  if (fase === "PRÉ") return "TREINO";
  if (fase === "TREINO") return "PÓS";
  if (fase === "PÓS") return "PRÉ";
  return "BASELINE";
}

function usarMovimentoReduzido() {
  const [reduzido, setReduzido] = useState(false);

  useEffect(() => {
    const consulta = window.matchMedia("(prefers-reduced-motion: reduce)");
    const atualizar = () => setReduzido(consulta.matches);
    atualizar();
    consulta.addEventListener("change", atualizar);
    return () => consulta.removeEventListener("change", atualizar);
  }, []);

  return reduzido;
}

export function CockpitDemonstracaoVisual() {
  const movimentoReduzido = usarMovimentoReduzido();
  const [reducaoDeHomologacao, setReducaoDeHomologacao] = useState(false);
  const [fase, setFase] = useState<FaseDemonstrada>("PRÉ");
  const [sensor, setSensor] = useState<EstadoDoSensor>("CAPTURA ATIVA");
  const [movimentoAtivo, setMovimentoAtivo] = useState(true);
  const [pulso, setPulso] = useState(0);
  const origemTemporal = useMemo(() => Date.now() - 42_000, []);
  const exibindoSinal = ["CONECTADO", "CAPTURA ATIVA", "QUALIDADE INSUFICIENTE"].includes(sensor);
  const qualidade = sensor === "QUALIDADE INSUFICIENTE" ? 0.34 : sensor === "CAPTURA ATIVA" ? 0.91 : 0.78;
  const frequencia = exibindoSinal ? Math.round(76 + Math.sin(pulso / 2.4) * 8) : null;
  const rmssd = exibindoSinal ? 42 + Math.cos(pulso / 3.1) * 7 : null;

  const movimentoEfetivamenteReduzido = movimentoReduzido || reducaoDeHomologacao;

  useEffect(() => {
    if (!movimentoAtivo || movimentoEfetivamenteReduzido) return;
    const id = window.setInterval(() => setPulso((valor) => valor + 1), 850);
    return () => window.clearInterval(id);
  }, [movimentoAtivo, movimentoEfetivamenteReduzido]);

  const vetores = useMemo<HxVectorAxis[]>(() => VETORES.map(([code, name], indice) => ({
    code,
    name,
    value: exibindoSinal
      ? limitar(
          0.52
          + Math.sin((pulso + indice * 1.7) / 4.6) * 0.2
          + Math.cos((pulso + indice) / 7.2) * 0.06,
          0.12,
          0.91
        )
      : null
  })), [exibindoSinal, pulso]);

  const faixas = useMemo<HxPhaseRange[]>(() => fase === "BASELINE" ? [] : [
    { name: "PRÉ", start: origemTemporal, end: origemTemporal + 14_000 },
    { name: "TREINO", start: origemTemporal + 14_000, end: origemTemporal + 30_000 },
    { name: "PÓS", start: origemTemporal + 30_000, end: origemTemporal + 42_000 }
  ], [fase, origemTemporal]);

  const trilhas = useMemo<HxTrack[]>(() => {
    if (!exibindoSinal) return [];
    const pontos = Array.from({ length: 42 }, (_, indice) => {
      const deslocamento = pulso + indice;
      return {
        time: origemTemporal + indice * 1_000,
        value: 76 + Math.sin(deslocamento / 3.8) * 8 + Math.cos(deslocamento / 6.4) * 3,
        label: "Dado sintético para homologação visual",
        phase: fase,
        source: "DEMONSTRAÇÃO VISUAL ISOLADA",
        quality: qualidade,
        coverage: 1,
        connection: estadoTecnico(sensor),
        gap: false
      };
    });
    const qualidadeDoSinal = pontos.map((ponto, indice) => ({
      ...ponto,
      value: limitar(
        qualidade * 100 + Math.sin((pulso + indice) / 5) * 4,
        18,
        98
      )
    }));
    return [
      {
        id: "demo-fc",
        name: "Frequência cardíaca demonstrativa",
        unit: "bpm",
        color: C.gold,
        points: pontos,
        min: 54,
        max: 108,
        area: true
      },
      {
        id: "demo-qualidade",
        name: "Qualidade demonstrativa",
        unit: "%",
        color: sensor === "QUALIDADE INSUFICIENTE" ? C.amber : C.green,
        points: qualidadeDoSinal,
        min: 0,
        max: 100,
        area: true
      }
    ];
  }, [exibindoSinal, fase, origemTemporal, pulso, qualidade, sensor]);

  const passos = fase === "BASELINE" ? ["BASELINE"] : ["PRÉ", "TREINO", "PÓS"];

  return (
    <section
      className="hx-live-cockpit hx-live-cockpit--demo"
      data-demo-phase={fase}
      data-demo-sensor={sensor}
      data-motion-reduced={movimentoEfetivamenteReduzido ? "true" : "false"}
    >
      <div className="hx-demo-safety" role="status">
        <div>
          <strong>DADOS DE TESTE — NÃO REAIS</strong>
          <span>DADOS SINTÉTICOS · SEM API · SEM BANCO · SEM RELATÓRIOS · DEMONSTRAÇÃO VISUAL ISOLADA · NÃO É RESULTADO HUMANO</span>
        </div>
        <ExperienceModeControl />
      </div>

      <nav className="hx-demo-controls" aria-label="Controles da demonstração visual">
        <div>
          <small>FASE VISUAL</small>
          {FASES.map((item) => (
            <button
              className={item === fase ? "is-active" : ""}
              type="button"
              onClick={() => setFase(item)}
              key={item}
            >
              {item}
            </button>
          ))}
        </div>
        <div>
          <small>ESTADO VISUAL DOS SENSORES</small>
          {ESTADOS_DOS_SENSORES.map((item) => (
            <button
              className={item === sensor ? "is-active" : ""}
              type="button"
              onClick={() => setSensor(item)}
              key={item}
            >
              {item}
            </button>
          ))}
        </div>
        <button
          className="hx-demo-motion"
          type="button"
          onClick={() => setMovimentoAtivo((valor) => !valor)}
          disabled={movimentoEfetivamenteReduzido}
        >
          {movimentoEfetivamenteReduzido
            ? "MOVIMENTO REDUZIDO"
            : movimentoAtivo
              ? "PAUSAR MOVIMENTO"
              : "RETOMAR MOVIMENTO"}
        </button>
        <button
          className={`hx-demo-motion ${reducaoDeHomologacao ? "is-active" : ""}`}
          type="button"
          onClick={() => setReducaoDeHomologacao((valor) => !valor)}
          aria-pressed={reducaoDeHomologacao}
        >
          {reducaoDeHomologacao ? "REDUÇÃO EM HOMOLOGAÇÃO" : "HOMOLOGAR MOVIMENTO REDUZIDO"}
        </button>
      </nav>

      <nav className="hx-live-levels" aria-label="Níveis do Cockpit demonstrativo">
        <a href="#hx-demo-command"><span>01</span><strong>Comando</strong></a>
        <a href="#hx-demo-regulation"><span>02</span><strong>Regulação</strong></a>
        <a href="#hx-demo-evidence"><span>03</span><strong>Evidências</strong></a>
        <a href="#hx-demo-inspection"><span>04</span><strong>Inspeção</strong></a>
      </nav>

      <header className="hx-live-cockpit__masthead">
        <div className="hx-live-masthead-rail" aria-hidden="true"><i /><i /><i /></div>
        <div>
          <span className="hx-live-eyebrow">AMBIENTE DE HOMOLOGAÇÃO VISUAL · NÃO OPERACIONAL</span>
          <h1>Participante sintético não persistido</h1>
          <p>DEMO-VISUAL · THX-DEMO · {fase} · nenhum identificador humano ou operacional</p>
        </div>
        <div className="hx-live-mode-actions">
          <span className={`hx-live-state is-${estadoTecnico(sensor).toLowerCase().replaceAll(" ", "-")}`}>
            <i aria-hidden="true" />
            {estadoTecnico(sensor)}
          </span>
        </div>
      </header>

      <section className="hx-live-context-strip" aria-label="Contexto sintético da demonstração">
        <div><small>AMBIENTE</small><strong>Homologação visual local</strong></div>
        <div><small>IDENTIDADE</small><strong>Nenhuma pessoa real</strong></div>
        <div><small>TIPO DA SESSÃO</small><strong>{fase === "BASELINE" ? "BASELINE" : "PRÉ → TREINO → PÓS"}</strong></div>
        <div><small>PERSISTÊNCIA</small><strong>DESATIVADA</strong></div>
      </section>

      <section className="hx-live-hud" aria-label="HUD demonstrativo com dez itens">
        <div><small>ZONA OPERACIONAL</small><strong>NÃO CLASSIFICADA</strong><span>Demonstração sem ciência</span></div>
        <div><small>ÍNDICE DE INTELIGÊNCIA REGULATÓRIA HUMANA</small><strong>DEMO VISUAL</strong><span>Não calculado</span></div>
        <div><small>THX</small><strong>THX-DEMO</strong><span>Somente interface</span></div>
        <div><small>FASE</small><strong>{fase}</strong><span>Estado visual</span></div>
        <div><small>TEMPO</small><strong>{`00:${String(Math.floor(pulso / 60)).padStart(2, "0")}:${String(pulso % 60).padStart(2, "0")}`}</strong><span>Não persistido</span></div>
        <div><small>FREQUÊNCIA CARDÍACA</small><strong>{frequencia == null ? "— bpm" : `${frequencia} bpm`}</strong><span>Dado sintético identificado</span></div>
        <div><small>RMSSD</small><strong>{rmssd == null ? "— ms" : `${rmssd.toFixed(1)} ms`}</strong><span>Dado sintético identificado</span></div>
        <div><small>ESTADO DO EEG</small><strong>{estadoTecnico(sensor)}</strong><span>Qualidade {exibindoSinal ? `${Math.round(qualidade * 100)}%` : "—"}</span></div>
        <div><small>ESTADO DO POLAR</small><strong>{estadoTecnico(sensor)}</strong><span>Sequência demonstrativa {pulso}</span></div>
        <div><small>QUALIDADE EEG</small><strong>{exibindoSinal ? `${Math.round(qualidade * 100)}%` : "—"}</strong><span>Dado sintético identificado</span></div>
      </section>

      <section className="hx-live-operation-focus" id="hx-demo-command" aria-label="Fluxo demonstrativo">
        <div className="hx-live-operation-flow">
          <small>FLUXO VISUAL</small>
          <div>
            {passos.map((passo) => (
              <span className={passo === fase ? "is-current" : ""} key={passo}>
                <b>{passo}</b>
                <em>{passo === fase ? "EM DEMONSTRAÇÃO" : "AGUARDANDO"}</em>
              </span>
            ))}
          </div>
        </div>
        <div className="hx-live-operation-action">
          <small>COMANDO LOCAL</small>
          <button
            className="hx-live-command__primary"
            type="button"
            onClick={() => setFase((atual) => proximaFase(atual))}
          >
            Avançar ciclo visual
          </button>
        </div>
      </section>

      <div className="hx-live-command-center" id="hx-demo-regulation">
        <section className="hx-live-vector-stage">
          <header>
            <small>VETORES VIVOS · DEMONSTRAÇÃO VISUAL</small>
            <h2>Dez vetores oficiais</h2>
          </header>
          <VectorRadarChart
            vectors={vetores}
            ariaLabel="Radar demonstrativo dos dez vetores oficiais"
            reducedMotion={movimentoEfetivamenteReduzido}
          />
          <div className="hx-live-vector-list" aria-label="Dez vetores em demonstração visual">
            {vetores.map((vetor) => (
              <div className={vetor.value == null ? "is-missing" : "has-value"} key={vetor.code}>
                <div>
                  <span><b>{vetor.code}</b>{vetor.name}</span>
                  <strong>{vetor.value == null ? "SEM SINAL" : `${(vetor.value * 100).toFixed(1)}%`}</strong>
                </div>
                <span className="hx-live-vector-meter" aria-hidden="true">
                  {vetor.value == null ? <em /> : <i style={{ width: `${vetor.value * 100}%` }} />}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="hx-live-graphs" id="hx-demo-evidence" data-signal-state={estadoTecnico(sensor)}>
          <header>
            <div><small>INSTRUMENTAÇÃO DEMONSTRATIVA</small><h2>Leitura temporal da sessão</h2></div>
            <span>Movimento local isolado · nenhum dado é transmitido ou persistido</span>
          </header>
          <div className="hx-live-temporal-rail" aria-label="Linha temporal demonstrativa">
            {passos.map((passo) => (
              <span className={passo === fase ? "is-current" : ""} key={passo}>
                <i aria-hidden="true" />
                <b>{passo}</b>
                <em>{passo === fase ? "ATIVO" : "AGUARDANDO"}</em>
              </span>
            ))}
          </div>
          {trilhas.length ? (
            <CockpitSignalStack
              tracks={trilhas}
              markers={[]}
              phases={faixas}
              showTechnicalLegend={false}
              reducedMotion={movimentoEfetivamenteReduzido}
              primaryDataLabel="Dado sintético identificado"
            />
          ) : (
            <div className="hx-live-temporal-wait" role="status">
              <div className="hx-live-temporal-pulse" aria-hidden="true"><i /><i /><i /></div>
              <div>
                <strong>{estadoTecnico(sensor)}</strong>
                <p>A estrutura permanece viva e legível sem preencher ausências com valores artificiais.</p>
              </div>
            </div>
          )}
          <footer className="hx-live-temporal-footer">
            <span>DEMONSTRAÇÃO VISUAL</span>
            <span>0 registros persistidos</span>
            <span>Sem comunicação com o núcleo</span>
          </footer>
        </section>
      </div>

      <section className="hx-live-regulatory-readout" aria-label="Síntese regulatória demonstrativa">
        <article><small>Estado geral</small><strong>DEMONSTRAÇÃO VISUAL</strong><span>Sem interpretação humana</span></article>
        <article><small>IIRH</small><strong>NÃO CALCULADO</strong><span>Ausência preservada</span></article>
        <article><small>Zona</small><strong>NÃO CLASSIFICADA</strong><span>Ausência preservada</span></article>
        <article><small>Resultante</small><strong>NÃO CALCULADA</strong><span>Ausência preservada</span></article>
        <article><small>ARR · RRO · NRA</small><strong>SEM PROJEÇÃO</strong><span>Nenhuma decisão automática</span></article>
      </section>

      <section className="hx-live-scientific-chain" id="hx-demo-inspection" aria-label="Inspeção científica demonstrativa">
        <header>
          <div><small>MODO CIENTÍFICO · RASTREABILIDADE</small><strong>Cadeia científica preservada</strong></div>
          <span>SEM CÁLCULO · SEM FALLBACK</span>
        </header>
        <div className="hx-live-scientific-chain__rail">
          <article className="is-blocked"><i /><div><small>FONTES</small><strong>DEMONSTRATIVAS</strong><span>Nenhuma evidência real</span></div></article>
          <article className="is-blocked"><i /><div><small>COBERTURA</small><strong>INDISPONÍVEL</strong><span>Nenhuma regra executada</span></div></article>
          <article className="is-blocked"><i /><div><small>CONFIANÇA</small><strong>INDISPONÍVEL</strong><span>Ausência não convertida em zero</span></div></article>
          <article className="is-blocked"><i /><div><small>VERSÃO</small><strong>APENAS INTERFACE</strong><span>Sem persistência</span></div></article>
        </div>
      </section>
    </section>
  );
}
