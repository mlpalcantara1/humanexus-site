"use client";

import type { ECharts, EChartsOption } from "echarts";
import { useEffect, useMemo, useRef, useState } from "react";
import { HX_ECHARTS_THEME } from "@/lib/humanexus-chart-theme";

let temaRegistrado = false;

export function HumanexusChart({
  option,
  className = "",
  height = 360,
  ariaLabel,
  onChartReady,
  reducedMotion = false
}: {
  option: EChartsOption;
  className?: string;
  height?: number;
  ariaLabel: string;
  onChartReady?: (chart: ECharts) => void;
  reducedMotion?: boolean;
}) {
  const elemento = useRef<HTMLDivElement | null>(null);
  const instancia = useRef<ECharts | null>(null);
  const [movimentoReduzidoDoSistema, setMovimentoReduzidoDoSistema] = useState(false);
  const movimentoReduzido = movimentoReduzidoDoSistema || reducedMotion;
  const opcaoEfetiva = useMemo<EChartsOption>(() => movimentoReduzido ? {
    ...option,
    animation: false,
    animationDuration: 0,
    animationDurationUpdate: 0
  } : option, [movimentoReduzido, option]);

  useEffect(() => {
    const consulta = window.matchMedia("(prefers-reduced-motion: reduce)");
    const atualizar = () => setMovimentoReduzidoDoSistema(consulta.matches);
    atualizar();
    consulta.addEventListener("change", atualizar);
    return () => consulta.removeEventListener("change", atualizar);
  }, []);

  useEffect(() => {
    let cancelado = false;
    let observador: ResizeObserver | null = null;

    import("echarts").then((echarts) => {
      if (cancelado || !elemento.current) return;
      if (!temaRegistrado) {
        echarts.registerTheme("humanexus-command", HX_ECHARTS_THEME);
        temaRegistrado = true;
      }
      const chart = echarts.init(elemento.current, "humanexus-command", {
        renderer: "canvas",
        useDirtyRect: true
      });
      instancia.current = chart;
      chart.setOption(opcaoEfetiva, { notMerge: true, lazyUpdate: true });
      onChartReady?.(chart);
      observador = new ResizeObserver(() => chart.resize());
      observador.observe(elemento.current);
    });

    return () => {
      cancelado = true;
      observador?.disconnect();
      instancia.current?.dispose();
      instancia.current = null;
    };
  }, []);

  useEffect(() => {
    instancia.current?.setOption(opcaoEfetiva, { notMerge: true, lazyUpdate: true });
  }, [opcaoEfetiva]);

  return (
    <div
      className={`hx-echart ${className}`.trim()}
      data-motion={movimentoReduzido ? "reduced" : "active"}
      style={{ height }}
      role="img"
      aria-label={ariaLabel}
      ref={elemento}
    />
  );
}
