"use client";

import { useMemo, useState } from "react";

export type PontoOperacional = {
  x: number;
  y: number;
  rotulo: string;
  lacuna?: boolean;
};

function reduzirPontos(pontos: PontoOperacional[], limite = 180) {
  if (pontos.length <= limite) return pontos;
  const passo = Math.ceil(pontos.length / limite);
  return pontos.filter((_, indice) => indice % passo === 0 || indice === pontos.length - 1);
}

export function GraficoOperacional({
  titulo,
  unidade,
  pontos,
  vazio,
  tom = "dourado"
}: {
  titulo: string;
  unidade: string;
  pontos: PontoOperacional[];
  vazio: string;
  tom?: "dourado" | "ciano" | "verde";
}) {
  const [ativo, setAtivo] = useState<PontoOperacional | null>(null);
  const serie = useMemo(() => reduzirPontos(pontos), [pontos]);
  const limites = useMemo(() => {
    if (!serie.length) return { minX: 0, maxX: 1, minY: 0, maxY: 1 };
    const xs = serie.map((item) => item.x);
    const ys = serie.map((item) => item.y);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    return {
      minX: Math.min(...xs),
      maxX: Math.max(...xs) || 1,
      minY,
      maxY: maxY === minY ? maxY + 1 : maxY
    };
  }, [serie]);
  const coordenada = (ponto: PontoOperacional) => ({
    x: 30 + ((ponto.x - limites.minX) / Math.max(1, limites.maxX - limites.minX)) * 410,
    y: 145 - ((ponto.y - limites.minY) / Math.max(1, limites.maxY - limites.minY)) * 110
  });
  const segmentos = useMemo(() => {
    const grupos: PontoOperacional[][] = [];
    serie.forEach((ponto) => {
      if (!grupos.length || ponto.lacuna) grupos.push([]);
      grupos.at(-1)?.push(ponto);
    });
    return grupos.filter((grupo) => grupo.length);
  }, [serie]);

  return <article className={`hx-chart hx-chart--${tom}`}>
    <header><div><small>{titulo}</small><strong>{serie.length ? `${serie.at(-1)?.y.toFixed(1)} ${unidade}` : "SEM SÉRIE"}</strong></div><span>{serie.length} ponto(s) preservado(s)</span></header>
    {serie.length ? <div className="hx-chart__stage">
      <svg viewBox="0 0 470 170" role="img" aria-label={`${titulo}: ${serie.length} pontos`}>
        <line x1="30" y1="145" x2="445" y2="145" className="hx-chart__axis" />
        <line x1="30" y1="25" x2="30" y2="145" className="hx-chart__axis" />
        {[0, 1, 2].map((linha) => <line key={linha} x1="30" y1={35 + linha * 50} x2="445" y2={35 + linha * 50} className="hx-chart__grid" />)}
        {segmentos.map((grupo, indice) => <polyline key={indice} className="hx-chart__line" points={grupo.map((ponto) => {
          const xy = coordenada(ponto);
          return `${xy.x},${xy.y}`;
        }).join(" ")} />)}
        {serie.map((ponto, indice) => {
          const xy = coordenada(ponto);
          return <circle key={`${ponto.x}-${indice}`} cx={xy.x} cy={xy.y} r="4" className="hx-chart__point" tabIndex={0}
            onMouseEnter={() => setAtivo(ponto)} onMouseLeave={() => setAtivo(null)}
            onFocus={() => setAtivo(ponto)} onBlur={() => setAtivo(null)}>
            <title>{`${ponto.rotulo}: ${ponto.y.toFixed(2)} ${unidade}`}</title>
          </circle>;
        })}
      </svg>
      {ativo ? <div className="hx-chart__tooltip"><b>{ativo.y.toFixed(2)} {unidade}</b><span>{ativo.rotulo}</span></div> : null}
    </div> : <div className="hx-chart__empty"><b>NÃO HÁ CURVA</b><span>{vazio}</span></div>}
  </article>;
}
