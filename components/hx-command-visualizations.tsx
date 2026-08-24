"use client";

import type { EChartsOption } from "echarts";
import { useMemo } from "react";
import { HumanexusChart } from "@/components/hx-echarts";
import { estadoGeometricoVetorial } from "@/lib/cockpit-vector-views";
import { HX_CHART_COLORS as C } from "@/lib/humanexus-chart-theme";

export type HxDataPoint = {
  time: number;
  value: number | null;
  label?: string;
  phase?: string;
  source?: string;
  quality?: number | null;
  coverage?: number | null;
  connection?: string;
  event?: string;
  gap?: boolean;
};

export type HxMarker = {
  time: number;
  label: string;
  kind: "event" | "intervention" | "disconnect" | "reconnect" | "phase";
  phase?: string;
};

export type HxPhaseRange = {
  name: "PRÉ" | "TREINO" | "PÓS";
  start: number;
  end: number;
};

export type HxTrack = {
  id: string;
  name: string;
  unit: string;
  color: string;
  points: HxDataPoint[];
  emptyReason?: string;
  min?: number;
  max?: number;
  area?: boolean;
  technical?: boolean;
};

const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";

function horario(valor: number) {
  if (!Number.isFinite(valor)) return "horário não registrado";
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "America/Manaus"
  }).format(new Date(valor));
}

function dataHora(valor: number) {
  if (!Number.isFinite(valor)) return "Instante não registrado";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium",
    timeZone: "America/Manaus"
  }).format(new Date(valor));
}

function normalizarSerie(pontos: HxDataPoint[]) {
  const ordenados = [...pontos].sort((a, b) => a.time - b.time);
  return ordenados.map((ponto, indice) => ({
    ...ponto,
    value: [
      ponto.time,
      ponto.gap || ponto.value == null || !Number.isFinite(ponto.value)
        ? null
        : ponto.value
    ],
    itemStyle: {
      opacity: ponto.gap ? 0 : 1
    },
    symbolSize: ordenados.length > 80 ? 0 : 6,
    id: `${ponto.time}-${indice}`
  }));
}

function tooltipTemporal(parametros: unknown) {
  const itens = Array.isArray(parametros) ? parametros : [parametros];
  const validos = itens.filter(Boolean) as Array<Record<string, unknown>>;
  const primeiro = validos[0];
  const eixo = Number(primeiro?.axisValue ?? (primeiro?.value as unknown[])?.[0]);
  const cabecalho = Number.isFinite(eixo) ? dataHora(eixo) : "Instante não registrado";
  const linhas = validos.map((item) => {
    const dado = (item.data ?? {}) as HxDataPoint & { value?: unknown[] };
    const valor = Array.isArray(item.value) ? item.value[1] : item.value;
    const unidade = String((item as { seriesName?: string }).seriesName ?? "");
    const detalhes = [
      dado.phase ? `Fase: ${dado.phase}` : "",
      dado.source ? `Fonte: ${dado.source}` : "",
      dado.quality != null ? `Qualidade: ${(dado.quality * 100).toFixed(0)}%` : "",
      dado.coverage != null ? `Cobertura: ${(dado.coverage * 100).toFixed(0)}%` : "",
      dado.connection ? `Conexão: ${dado.connection}` : "",
      dado.event ? `Evento: ${dado.event}` : ""
    ].filter(Boolean).join(" · ");
    return `<div class="hx-chart-tooltip__row"><span>${item.marker ?? ""}${unidade}</span><b>${valor == null ? "LACUNA" : Number(valor).toFixed(2)}</b></div>${detalhes ? `<small>${detalhes}</small>` : ""}`;
  }).join("");
  return `<div class="hx-chart-tooltip"><strong>${cabecalho}</strong>${linhas}</div>`;
}

function markAreas(fases: HxPhaseRange[]) {
  const cores = [
    "rgba(78,105,102,.035)",
    "rgba(201,170,99,.045)",
    "rgba(130,189,139,.035)"
  ];
  return fases.map((fase, indice) => ([
    {
      name: fase.name,
      xAxis: fase.start,
      itemStyle: { color: cores[indice] },
      label: {
        show: true,
        color: C.muted,
        fontFamily: MONO,
        fontSize: 9,
        letterSpacing: 2,
        position: "insideTopLeft"
      }
    },
    { xAxis: fase.end }
  ]));
}

function markerSeries(marcadores: HxMarker[], eixo = 0) {
  const cor = (tipo: HxMarker["kind"]) => {
    if (tipo === "disconnect") return C.red;
    if (tipo === "reconnect") return C.green;
    if (tipo === "intervention") return C.gold;
    return C.cyan;
  };
  return {
    name: "Eventos",
    type: "scatter",
    xAxisIndex: eixo,
    yAxisIndex: eixo,
    symbol: "diamond",
    symbolSize: 10,
    z: 20,
    data: marcadores.map((marcador) => ({
      value: [marcador.time, 0],
      name: marcador.label,
      phase: marcador.phase,
      event: marcador.label,
      itemStyle: { color: cor(marcador.kind), borderColor: C.carbon, borderWidth: 2 }
    })),
    tooltip: { show: true }
  };
}

export function EmptySignalState({
  title,
  reason,
  status = "SÉRIE NÃO RECEBIDA"
}: {
  title: string;
  reason: string;
  status?: string;
}) {
  return (
    <article className="hx-data-empty">
      <div className="hx-data-empty__signal" aria-hidden="true"><span /><span /><span /></div>
      <div>
        <small>{title}</small>
        <strong>{status}</strong>
        <p>{reason}</p>
      </div>
    </article>
  );
}

export type HxVectorAxis = {
  code: string;
  name: string;
  value: number | null;
  macrofield?: string | null;
  trend?: string | null;
};

function pontoNoEixo(indice: number, total: number, raio: number) {
  const quantidade = Math.max(1, total);
  const angulo = -Math.PI / 2 + (indice * Math.PI * 2) / quantidade;
  return {
    x: 200 + Math.cos(angulo) * raio,
    y: 200 + Math.sin(angulo) * raio,
    angulo
  };
}

function pontosDoAnel(total: number, raio: number) {
  if (total < 3) return "";
  return Array.from({ length: total }, (_, indice) => {
    const ponto = pontoNoEixo(indice, total, raio);
    return `${ponto.x.toFixed(2)},${ponto.y.toFixed(2)}`;
  }).join(" ");
}

export function VectorRadarChart({
  vectors,
  ariaLabel = "Radar dos nove vetores momentâneos oficiais da TIRH",
  reducedMotion = false
}: {
  vectors: HxVectorAxis[];
  ariaLabel?: string;
  reducedMotion?: boolean;
}) {
  const geometria = estadoGeometricoVetorial(vectors);
  const pontosCalculados = useMemo(() => vectors.flatMap((vetor, indice) => {
    if (vetor.value == null || !Number.isFinite(vetor.value)) return [];
    const valor = Math.max(0, Math.min(1, vetor.value));
    return [{ vetor, indice, valor, ...pontoNoEixo(indice, vectors.length, valor * 124) }];
  }), [vectors]);
  const poligono = geometria.permitePoligono
    ? pontosCalculados.map((ponto) => `${ponto.x.toFixed(2)},${ponto.y.toFixed(2)}`).join(" ")
    : "";

  return (
    <div
      className="hx-vector-radar-live"
      data-vector-coverage={geometria.completo ? "complete" : "partial"}
      data-calculated-vectors={geometria.calculados}
      data-total-vectors={geometria.total}
      data-false-geometry="none"
      data-reduced-motion={reducedMotion ? "true" : "false"}
    >
      <svg className="hx-vector-radar-live__svg" viewBox="0 0 400 400" role="img" aria-label={ariaLabel}>
        <title>{ariaLabel}</title>
        {[1, 2, 3, 4, 5].map((nivel) => vectors.length >= 3 ? (
          <polygon
            className="hx-vector-radar-live__ring"
            key={nivel}
            points={pontosDoAnel(vectors.length, (124 * nivel) / 5)}
          />
        ) : (
          <circle
            className="hx-vector-radar-live__ring"
            key={nivel}
            cx="200"
            cy="200"
            r={(124 * nivel) / 5}
          />
        ))}
        {vectors.map((vetor, indice) => {
          const fim = pontoNoEixo(indice, vectors.length, 124);
          const rotulo = pontoNoEixo(indice, vectors.length, 151);
          const ancora = Math.cos(rotulo.angulo) > .25
            ? "start"
            : Math.cos(rotulo.angulo) < -.25
              ? "end"
              : "middle";
          return (
            <g className={vetor.value == null ? "is-missing" : "has-value"} key={vetor.code}>
              <line className="hx-vector-radar-live__axis" x1="200" y1="200" x2={fim.x} y2={fim.y} />
              <text className="hx-vector-radar-live__label" x={rotulo.x} y={rotulo.y} textAnchor={ancora}>
                <tspan x={rotulo.x} dy="0">{vetor.code}</tspan>
                <tspan className="hx-vector-radar-live__label-state" x={rotulo.x} dy="13">
                  {vetor.value == null ? "AUSENTE" : `${(vetor.value * 100).toFixed(1)}%`}
                </tspan>
              </text>
            </g>
          );
        })}
        {poligono ? <polygon className="hx-vector-radar-live__polygon" points={poligono} /> : null}
        {pontosCalculados.map(({ vetor, x, y }) => (
          <g className="hx-vector-radar-live__point" key={`point-${vetor.code}`}>
            <circle cx={x} cy={y} r="7" />
            <circle cx={x} cy={y} r="3" />
          </g>
        ))}
        <circle className="hx-vector-radar-live__center" cx="200" cy="200" r="3" />
      </svg>
      {!geometria.completo ? (
        <div className="hx-vector-radar-live__block">
          <strong>{geometria.calculados} DE {geometria.total} VETORES CALCULADOS</strong>
          <span>Pontos independentes mostram somente magnitudes canônicas; ausências não formam geometria.</span>
        </div>
      ) : null}
    </div>
  );
}

export function CockpitSignalStack({
  tracks,
  markers,
  phases,
  showTechnicalLegend = true,
  reducedMotion = false,
  primaryDataLabel = "Dado humano"
}: {
  tracks: HxTrack[];
  markers: HxMarker[];
  phases: HxPhaseRange[];
  showTechnicalLegend?: boolean;
  reducedMotion?: boolean;
  primaryDataLabel?: string;
}) {
  const ativas = tracks.filter((trilha) => trilha.points.some((ponto) => ponto.value != null));
  const alturaDoGrafico = Math.max(520, Math.min(1100, ativas.length * 105 + 100));
  const option = useMemo(() => {
    const quantidade = Math.max(1, ativas.length);
    const top = 48;
    const gap = 30;
    const disponivel = alturaDoGrafico - 110;
    const altura = (disponivel - gap * (quantidade - 1)) / quantidade;
    const grids = ativas.map((_, indice) => ({
      left: 58,
      right: 34,
      top: top + indice * (altura + gap),
      height: altura,
      containLabel: false
    }));
    const xAxis = ativas.map((_, indice) => ({
      type: "time",
      gridIndex: indice,
      axisLabel: { show: indice === quantidade - 1, formatter: (valor: number) => horario(valor) },
      axisLine: { show: indice === quantidade - 1 },
      axisPointer: {
        show: true,
        snap: false,
        label: { show: indice === 0, formatter: ({ value }: { value: number }) => horario(value) }
      },
      splitLine: { show: true }
    }));
    const yAxis = ativas.map((trilha, indice) => ({
      type: "value",
      gridIndex: indice,
      name: `${trilha.name} · ${trilha.unit}`,
      nameLocation: "end",
      nameGap: 8,
      nameRotate: 0,
      nameTextStyle: {
        align: "left",
        color: C.warmWhite,
        fontSize: 10,
        fontWeight: 600,
        padding: [0, 0, 4, -48]
      },
      min: trilha.min,
      max: trilha.max,
      splitNumber: 3,
      axisLabel: { formatter: (valor: number) => `${valor}` }
    }));
    const series = ativas.map((trilha, indice) => ({
      name: `${trilha.name} · ${trilha.unit}`,
      type: "line",
      xAxisIndex: indice,
      yAxisIndex: indice,
      showSymbol: trilha.points.length < 40,
      symbol: "circle",
      symbolSize: 6,
      smooth: 0.18,
      connectNulls: false,
      sampling: trilha.points.length > 800 ? "lttb" : undefined,
      large: trilha.points.length > 2000,
      progressive: 500,
      animationDuration: 520,
      animationDurationUpdate: 620,
      animationEasingUpdate: "cubicOut",
      lineStyle: {
        color: trilha.color,
        width: 2,
        shadowBlur: 7,
        shadowColor: `${trilha.color}50`
      },
      itemStyle: {
        color: trilha.color,
        borderColor: C.carbon,
        borderWidth: 2,
        shadowBlur: 7,
        shadowColor: `${trilha.color}55`
      },
      areaStyle: trilha.area ? {
        color: {
          type: "linear",
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: `${trilha.color}38` },
            { offset: 1, color: `${trilha.color}00` }
          ]
        }
      } : undefined,
      data: normalizarSerie(trilha.points),
      markArea: indice === 0 ? { silent: true, data: markAreas(phases) } : undefined,
      markLine: indice === 0 && markers.length ? {
        silent: false,
        symbol: ["none", "none"],
        label: {
          show: false
        },
        lineStyle: { color: C.axis, type: "dashed", width: 1 },
        data: markers.map((marcador) => ({
          name: marcador.label,
          xAxis: marcador.time,
          lineStyle: {
            color: marcador.kind === "disconnect" ? C.red
              : marcador.kind === "reconnect" ? C.green
                : marcador.kind === "intervention" ? C.gold
                  : C.axis
          }
        }))
      } : undefined
    }));
    return {
      animation: true,
      grid: grids,
      axisPointer: { link: [{ xAxisIndex: "all" }] },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "line" },
        confine: true,
        formatter: tooltipTemporal
      },
      toolbox: {
        right: 26,
        top: 4,
        feature: {
          dataZoom: { yAxisIndex: "none", title: { zoom: "Selecionar período", back: "Restaurar período" } },
          restore: { title: "Restaurar" },
          saveAsImage: { title: "Exportar imagem", pixelRatio: 2, backgroundColor: C.carbon }
        },
        iconStyle: { borderColor: C.muted },
        emphasis: { iconStyle: { borderColor: C.gold } }
      },
      dataZoom: [
        { type: "inside", xAxisIndex: ativas.map((_, indice) => indice), filterMode: "none", zoomOnMouseWheel: "shift" },
        { type: "slider", xAxisIndex: ativas.map((_, indice) => indice), bottom: 4, height: 22, filterMode: "none" }
      ],
      xAxis,
      yAxis,
      series
    } as unknown as EChartsOption;
  }, [alturaDoGrafico, ativas, markers, phases]);

  return (
    <section className="hx-command-visual">
      <header className="hx-command-visual__head">
        <div>
          <small>EIXO TEMPORAL COMPARTILHADO</small>
          <h2>Sinais, integridade e eventos no mesmo instante.</h2>
        </div>
        <div className="hx-chart-legend">
          <span><i className="is-human" />{primaryDataLabel}</span>
          {showTechnicalLegend
            ? <span><i className="is-technical" />Simulação técnica</span>
            : null}
          <span><i className="is-gap" />Lacuna real</span>
        </div>
      </header>
      {ativas.length ? (
        <HumanexusChart
          option={option}
          height={alturaDoGrafico}
          ariaLabel="Painel operacional ao vivo com múltiplas trilhas, eixo temporal compartilhado, ampliação e cursor sincronizado"
          reducedMotion={reducedMotion}
        />
      ) : null}
      <div className="hx-data-empty-grid">
        {tracks.filter((trilha) => !trilha.points.some((ponto) => ponto.value != null)).map((trilha) => (
          <EmptySignalState
            title={`${trilha.name} · ${trilha.unit}`}
            reason={trilha.emptyReason ?? "Série não recebida pelo núcleo."}
            key={trilha.id}
          />
        ))}
      </div>
    </section>
  );
}

export function PhaseComparisonChart({
  phases,
  markers
}: {
  phases: Array<{
    name: "PRÉ" | "TREINO" | "PÓS";
    time: number;
    quality: number | null;
    coverage: number | null;
    durationSeconds: number | null;
    sources: string[];
    gaps: string[];
  }>;
  markers: HxMarker[];
}) {
  const option = useMemo(() => {
    const categories = phases.map((phase) => phase.name);
    return {
      animationDuration: 420,
      legend: { top: 8, right: 18, data: ["Qualidade", "Cobertura"] },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        confine: true,
        formatter: (params: unknown) => {
          const itens = (Array.isArray(params) ? params : [params]) as Array<Record<string, unknown>>;
          const indice = Number(itens[0]?.dataIndex ?? 0);
          const phase = phases[indice];
          return `<div class="hx-chart-tooltip"><strong>${phase?.name ?? ""} · ${phase ? dataHora(phase.time) : ""}</strong>
            <div class="hx-chart-tooltip__row"><span>Qualidade</span><b>${phase?.quality == null ? "AUSENTE" : `${phase.quality.toFixed(1)}%`}</b></div>
            <div class="hx-chart-tooltip__row"><span>Cobertura</span><b>${phase?.coverage == null ? "AUSENTE" : `${phase.coverage.toFixed(1)}%`}</b></div>
            <small>Duração: ${phase?.durationSeconds == null ? "não registrada" : `${phase.durationSeconds}s`} · Fontes: ${phase?.sources.join(", ") || "não registradas"} · Lacunas: ${phase?.gaps.join(", ") || "nenhuma declarada"}</small></div>`;
        }
      },
      grid: { left: 48, right: 28, top: 54, bottom: 70 },
      xAxis: {
        type: "category",
        data: categories,
        axisLabel: { color: C.warmWhite, fontSize: 12, fontWeight: 600 }
      },
      yAxis: {
        type: "value",
        min: 0,
        max: 100,
        name: "%",
        splitNumber: 4
      },
      dataZoom: [{ type: "inside", xAxisIndex: 0, filterMode: "none" }],
      series: [
        {
          name: "Qualidade",
          type: "bar",
          barMaxWidth: 34,
          data: phases.map((phase) => phase.quality),
          itemStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [{ offset: 0, color: C.green }, { offset: 1, color: "rgba(130,189,139,.24)" }]
            },
            borderRadius: [4, 4, 0, 0]
          }
        },
        {
          name: "Cobertura",
          type: "line",
          smooth: 0.15,
          connectNulls: false,
          symbolSize: 9,
          data: phases.map((phase) => phase.coverage),
          lineStyle: { color: C.cyan, width: 2 },
          itemStyle: { color: C.cyan, borderColor: C.carbon, borderWidth: 2 },
          markPoint: markers.length ? {
            symbol: "pin",
            symbolSize: 28,
            label: { show: false },
            data: markers.map((marker) => ({
              coord: [marker.phase ?? "TREINO", 100],
              name: marker.label,
              itemStyle: { color: marker.kind === "intervention" ? C.gold : C.cyan }
            }))
          } : undefined
        }
      ]
    } as unknown as EChartsOption;
  }, [phases, markers]);
  const values = phases.flatMap((phase) => [phase.quality, phase.coverage]).filter((value): value is number => value != null);
  return values.length ? (
    <section className="hx-command-visual hx-command-visual--phase">
      <header className="hx-command-visual__head">
        <div><small>COMPARAÇÃO GOVERNADA</small><h2>Mesma escala, fases independentes.</h2></div>
        <span className="hx-chart-classification">REGISTROS PRESERVADOS · SEM INFERÊNCIA AUTOMÁTICA</span>
      </header>
      <HumanexusChart option={option} height={400} ariaLabel="Comparação de qualidade e cobertura entre PRÉ, TREINO e PÓS" />
      <div className="hx-phase-detail">
        {phases.map((phase) => (
          <article key={phase.name}>
            <small>{phase.name}</small>
            <strong>{phase.coverage == null ? "COMPARAÇÃO INDISPONÍVEL" : `${phase.coverage.toFixed(0)}% cobertura`}</strong>
            <span>{phase.sources.length ? phase.sources.join(" · ") : "Fonte não registrada"} · {phase.gaps.length ? `${phase.gaps.length} lacuna(s)` : "sem lacuna declarada"}</span>
          </article>
        ))}
      </div>
    </section>
  ) : <EmptySignalState title="PRÉ / TREINO / PÓS" status="COMPARAÇÃO INDISPONÍVEL" reason="As fases não possuem qualidade e cobertura comparáveis." />;
}

function histograma(valores: number[], classes = 8) {
  if (!valores.length) return [];
  const minimo = Math.min(...valores);
  const maximo = Math.max(...valores);
  const largura = Math.max((maximo - minimo) / classes, 1);
  const bins = Array.from({ length: classes }, (_, indice) => ({
    inicio: minimo + indice * largura,
    fim: minimo + (indice + 1) * largura,
    total: 0
  }));
  valores.forEach((valor) => {
    const indice = Math.min(classes - 1, Math.floor((valor - minimo) / largura));
    bins[indice].total += 1;
  });
  return bins;
}

export function TelemetryCommandChart({
  frequency,
  latency,
  buffer,
  markers
}: {
  frequency: HxDataPoint[];
  latency: HxDataPoint[];
  buffer: HxDataPoint[];
  markers: HxMarker[];
}) {
  const histogram = useMemo(() => histograma(latency.flatMap((point) => point.value == null ? [] : [point.value])), [latency]);
  const option = useMemo(() => {
    const tracks = [
      { name: "Frequência", unit: "Hz", points: frequency, color: C.cyan },
      { name: "Latência", unit: "ms", points: latency, color: C.gold },
      { name: "Buffer", unit: "pacotes", points: buffer, color: C.green }
    ];
    return {
      animationDuration: 340,
      axisPointer: { link: [{ xAxisIndex: [0, 1, 2] }] },
      tooltip: { trigger: "axis", axisPointer: { type: "line" }, confine: true, formatter: tooltipTemporal },
      grid: [
        { left: 70, right: "54%", top: 48, height: 112 },
        { left: 70, right: "54%", top: 196, height: 112 },
        { left: 70, right: "54%", top: 344, height: 112 },
        { left: "58%", right: 32, top: 80, bottom: 76 }
      ],
      xAxis: [
        ...tracks.map((_, index) => ({
          type: "time",
          gridIndex: index,
          axisLabel: { show: index === 2, formatter: (value: number) => horario(value) },
          axisPointer: { show: true }
        })),
        {
          type: "category",
          gridIndex: 3,
          data: histogram.map((bin) => `${bin.inicio.toFixed(0)}–${bin.fim.toFixed(0)}`),
          axisLabel: { rotate: 34, fontSize: 9 },
          name: "LATÊNCIA (ms)",
          nameLocation: "middle",
          nameGap: 54
        }
      ],
      yAxis: [
        ...tracks.map((track, index) => ({
          type: "value",
          gridIndex: index,
          name: `${track.name} · ${track.unit}`,
          nameLocation: "middle",
          nameGap: 48,
          nameTextStyle: { color: C.warmWhite, fontSize: 10 }
        })),
        { type: "value", gridIndex: 3, name: "PACOTES", splitNumber: 4 }
      ],
      dataZoom: [
        { type: "inside", xAxisIndex: [0, 1, 2], filterMode: "none", zoomOnMouseWheel: "shift" },
        { type: "slider", xAxisIndex: [0, 1, 2], bottom: 10, left: 70, right: "54%", height: 20, filterMode: "none" }
      ],
      series: [
        ...tracks.map((track, index) => ({
          name: `${track.name} · ${track.unit}`,
          type: "line",
          xAxisIndex: index,
          yAxisIndex: index,
          smooth: 0.12,
          showSymbol: track.points.length < 40,
          connectNulls: false,
          sampling: track.points.length > 800 ? "lttb" : undefined,
          progressive: 500,
          lineStyle: { color: track.color, width: 2 },
          itemStyle: { color: track.color, borderColor: C.carbon, borderWidth: 2 },
          data: normalizarSerie(track.points),
          markLine: index === 0 && markers.length ? {
            symbol: ["none", "none"],
            label: { show: false },
            lineStyle: { color: C.red, type: "dashed" },
            data: markers.map((marker) => ({ xAxis: marker.time, name: marker.label }))
          } : undefined
        })),
        {
          name: "Distribuição de latência",
          type: "bar",
          xAxisIndex: 3,
          yAxisIndex: 3,
          data: histogram.map((bin) => bin.total),
          barMaxWidth: 32,
          itemStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [{ offset: 0, color: C.gold }, { offset: 1, color: "rgba(201,170,99,.18)" }]
            },
            borderRadius: [4, 4, 0, 0]
          }
        }
      ]
    } as unknown as EChartsOption;
  }, [buffer, frequency, histogram, latency, markers]);
  if (!frequency.length && !latency.length && !buffer.length) {
    return <EmptySignalState title="TELEMETRIA BRIDGE" reason="Nenhum pacote técnico foi recebido." />;
  }
  return (
    <section className="hx-command-visual hx-command-visual--telemetry">
      <header className="hx-command-visual__head">
        <div><small>SAÚDE DO BRIDGE</small><h2>Recepção, latência, sequência e integridade.</h2></div>
        <span className="hx-chart-classification is-technical">SIMULAÇÃO TÉCNICA · NÃO É RESULTADO HUMANO</span>
      </header>
      <HumanexusChart option={option} height={540} ariaLabel="Telemetria técnica com frequência, latência, buffer, distribuição e eventos" />
    </section>
  );
}

export function ReplayTimelineChart({
  items,
  phases,
  markers,
  cursorPercent,
  interval,
  zoom,
  visibleTracks
}: {
  items: Array<{ time: number; track: string; label: string; event?: string; source?: string }>;
  phases: HxPhaseRange[];
  markers: HxMarker[];
  cursorPercent: number;
  interval: [number, number];
  zoom: number;
  visibleTracks: string[];
}) {
  const option = useMemo(() => {
    const ordenados = [...items].sort((a, b) => a.time - b.time);
    const inicio = ordenados[0]?.time ?? Date.now();
    const fim = ordenados.at(-1)?.time ?? inicio + 1;
    const cursorTime = inicio + ((fim - inicio) * cursorPercent) / 100;
    const larguraSelecionada = Math.max(1, (interval[1] - interval[0]) / Math.max(1, zoom));
    const centro = Math.max(interval[0], Math.min(interval[1], cursorPercent));
    const inicioVisual = Math.max(interval[0], Math.min(interval[1] - larguraSelecionada, centro - larguraSelecionada / 2));
    const fimVisual = Math.min(interval[1], inicioVisual + larguraSelecionada);
    const series = visibleTracks.map((track) => ({
      name: track,
      type: "scatter",
      symbolSize: (value: unknown, params: { data: { event?: string } }) => params.data?.event?.includes("INTERVEN") ? 15 : 10,
      data: ordenados.filter((item) => item.track === track).map((item) => ({
        value: [item.time, track],
        event: item.event,
        source: item.source,
        label: item.label,
        itemStyle: {
          color: item.event?.includes("DESCONE") ? C.red
            : item.event?.includes("RECONE") ? C.green
              : item.event?.includes("INTERVEN") ? C.gold
                : track === "TELEMETRIA" ? C.cyan
                  : C.warmWhite,
          shadowBlur: 8,
          shadowColor: "rgba(0,0,0,.5)"
        }
      })),
      markArea: track === visibleTracks[0] ? { silent: true, data: markAreas(phases) } : undefined,
      markLine: track === visibleTracks[0] ? {
        silent: true,
        symbol: ["none", "none"],
        lineStyle: { color: C.gold, width: 1.5 },
        label: { formatter: "CURSOR", color: C.gold, fontFamily: MONO, fontSize: 8 },
        data: [{ xAxis: cursorTime }]
      } : undefined
    }));
    return {
      animationDuration: 360,
      animationDurationUpdate: 440,
      animationEasingUpdate: "cubicOut",
      legend: { show: false },
      tooltip: {
        trigger: "item",
        confine: true,
        formatter: (param: unknown) => {
          const item = param as { data?: { value?: unknown[]; event?: string; source?: string; label?: string }; seriesName?: string };
          const time = Number(item.data?.value?.[0]);
          return `<div class="hx-chart-tooltip"><strong>${dataHora(time)}</strong><div class="hx-chart-tooltip__row"><span>${item.seriesName ?? ""}</span><b>${item.data?.event ?? item.data?.label ?? "REGISTRO"}</b></div><small>Fonte: ${item.data?.source ?? "núcleo oficial"}</small></div>`;
        }
      },
      toolbox: {
        right: 22,
        top: 4,
        feature: {
          dataZoom: { yAxisIndex: "none", title: { zoom: "Selecionar intervalo", back: "Restaurar" } },
          restore: { title: "Restaurar" },
          saveAsImage: { title: "Exportar visual", pixelRatio: 2, backgroundColor: C.carbon }
        },
        iconStyle: { borderColor: C.muted }
      },
      grid: { left: 116, right: 28, top: 44, bottom: 70 },
      xAxis: {
        type: "time",
        min: inicio,
        max: fim,
        axisPointer: { show: true, snap: false, label: { formatter: ({ value }: { value: number }) => horario(value) } },
        axisLabel: { formatter: (value: number) => horario(value) },
        splitLine: { show: true }
      },
      yAxis: {
        type: "category",
        inverse: true,
        data: visibleTracks,
        axisLabel: { color: C.warmWhite, fontSize: 10, fontWeight: 600 },
        splitLine: { show: true }
      },
      dataZoom: [
        {
          type: "inside",
          xAxisIndex: 0,
          start: inicioVisual,
          end: fimVisual,
          zoomLock: false,
          zoomOnMouseWheel: true,
          moveOnMouseMove: true,
          filterMode: "none"
        },
        {
          type: "slider",
          xAxisIndex: 0,
          start: inicioVisual,
          end: fimVisual,
          bottom: 12,
          height: 22,
          filterMode: "none"
        }
      ],
      graphic: markers.length ? [{
        type: "text",
        right: 28,
        bottom: 48,
        style: {
          text: `${markers.length} evento(s) · zoom ${zoom.toFixed(2)}×`,
          fill: C.muted,
          font: `9px ${MONO}`
        }
      }] : [],
      series
    } as unknown as EChartsOption;
  }, [cursorPercent, interval, items, markers, phases, visibleTracks, zoom]);

  if (!items.length) return <EmptySignalState title="REPRODUÇÃO HISTÓRICA MULTIMODAL" reason="A linha temporal ainda não possui itens íntegros." />;
  return (
    <HumanexusChart
      option={option}
      height={Math.max(420, visibleTracks.length * 64 + 150)}
      ariaLabel="Reprodução histórica multimodal com controle deslizante, cursor sincronizado, fases, eventos e ampliação"
    />
  );
}

export function LongitudinalEvolutionChart({
  points
}: {
  points: Array<HxDataPoint & { zone?: string; ctr?: string; thx?: string; version?: string }>;
}) {
  const validos = points.filter((point) => point.value != null && Number.isFinite(point.value));
  const option = useMemo(() => ({
    tooltip: { trigger: "axis", confine: true, formatter: tooltipTemporal },
    grid: { left: 62, right: 28, top: 42, bottom: 68 },
    toolbox: {
      right: 20,
      feature: { dataZoom: { yAxisIndex: "none" }, restore: {}, saveAsImage: { backgroundColor: C.carbon } },
      iconStyle: { borderColor: C.muted }
    },
    xAxis: { type: "time", axisLabel: { formatter: (value: number) => dataHora(value) } },
    yAxis: { type: "value", name: "IIRH VÁLIDO", scale: true },
    dataZoom: [{ type: "inside", filterMode: "none" }, { type: "slider", bottom: 10, height: 22, filterMode: "none" }],
    series: [{
      name: "IIRH válido",
      type: "line",
      smooth: 0.15,
      connectNulls: false,
      symbolSize: 8,
      lineStyle: { color: C.gold, width: 2 },
      areaStyle: { color: C.goldSoft },
      data: normalizarSerie(points)
    }]
  } as unknown as EChartsOption), [points]);
  return validos.length ? (
    <section className="hx-command-visual">
      <header className="hx-command-visual__head"><div><small>EVOLUÇÃO COMPATÍVEL</small><h2>Sessões válidas sem continuidade artificial.</h2></div></header>
      <HumanexusChart option={option} height={430} ariaLabel="Evolução longitudinal de sessões metodologicamente compatíveis" />
    </section>
  ) : (
    <EmptySignalState
      title="LONGITUDINAL"
      status="BLOQUEADO POR COMPARABILIDADE"
      reason="Não há sessões humanas elegíveis e metodologicamente compatíveis. Nenhuma trajetória foi desenhada."
    />
  );
}
