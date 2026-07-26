"use client";

import type { ECharts, EChartsOption } from "echarts";
import { useEffect, useRef } from "react";
import { HX_ECHARTS_THEME } from "@/lib/humanexus-chart-theme";

let temaRegistrado = false;

export function HumanexusChart({
  option,
  className = "",
  height = 360,
  ariaLabel,
  onChartReady
}: {
  option: EChartsOption;
  className?: string;
  height?: number;
  ariaLabel: string;
  onChartReady?: (chart: ECharts) => void;
}) {
  const elemento = useRef<HTMLDivElement | null>(null);
  const instancia = useRef<ECharts | null>(null);

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
      chart.setOption(option, { notMerge: true, lazyUpdate: true });
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
    instancia.current?.setOption(option, { notMerge: true, lazyUpdate: true });
  }, [option]);

  return (
    <div
      className={`hx-echart ${className}`.trim()}
      style={{ height }}
      role="img"
      aria-label={ariaLabel}
      ref={elemento}
    />
  );
}
