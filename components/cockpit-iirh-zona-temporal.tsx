"use client";

import { resolverDisponibilidadeContinuaIirhZona } from "@/lib/authoritative-iirh-projection";
import { formatarPercentualCanonico } from "@/lib/percentual-canonico";

type Registro = Record<string, unknown>;
const obj = (v: unknown): Registro => v && typeof v === "object" && !Array.isArray(v) ? v as Registro : {};
const lista = (v: unknown): Registro[] => Array.isArray(v) ? v.map(obj) : [];
const numero = (v: unknown): number | null => typeof v === "number" && Number.isFinite(v) ? v : null;
const nomes: Record<string,string> = { ZO: "Zona Ótima", ZA: "Zona Adaptativa", ZI: "Zona de Instabilidade", ZCF: "Zona de Comprometimento Funcional" };
const cores: Record<string,string> = { ZO: "#146e57", ZA: "#649368", ZI: "#bc9035", ZCF: "#a95a53" };

/** Só renderiza números, faixas e intervalos já emitidos pelo Núcleo. */
export function CockpitIirhZonaTemporal({ leitura, historico }: { leitura: Registro; historico: boolean }) {
  const operacional = obj(leitura.iirh_zona_operacional);
  const disponibilidade = resolverDisponibilidadeContinuaIirhZona(leitura);
  const iirh = disponibilidade.iirh.projecao.registro, zona = disponibilidade.zona.projecao.registro;
  const temporal = obj(leitura.distribuicao_temporal_das_zonas);
  const emissoes = lista(temporal.emissoes), transicoes = lista(temporal.transicoes);
  const faixas = lista(operacional.faixas);
  const valor = (historico || disponibilidade.iirh.atual) ? disponibilidade.iirh.projecao.valor : null;
  const cobertura = numero(iirh.cobertura), confianca = numero(iirh.confianca ?? iirh.confiabilidade);
  const qualidade = numero(iirh.qualidade);
  const intervalos = emissoes.flatMap((e) => lista(e.intervalos_validos).map((i) => ({ inicio:i.inicio, fim:i.fim, emissao:e })));
  const pontos = emissoes.filter(e => e.duracao_valida_segundos === 0 && numero(obj(e.iirh).valor) !== null && Number.isFinite(Date.parse(String(e.fim_da_janela))));
  const instantes = [...intervalos.flatMap(i => [Date.parse(String(i.inicio)), Date.parse(String(i.fim))]), ...pontos.map(e => Date.parse(String(e.fim_da_janela)))].filter(Number.isFinite);
  const inicio = instantes.length ? Math.min(...instantes) : 0, fim = instantes.length ? Math.max(...instantes) : 1;
  const x = (v: unknown) => 48 + (Date.parse(String(v))-inicio) / Math.max(1,fim-inicio)*820;
  const y = (v: number) => 230-v*2;
  const zonaDisponivel = (historico || disponibilidade.zona.atual) && disponibilidade.zona.projecao.classificada;
  const provisoria = ["PROVISORIA","SUGERIDA"].includes(String(zona.estado));
  const tempos = obj(temporal.tempo_por_zona_segundos);
  return <section className="hx-cockpit-panel" aria-label="IIRH e Zona — linha temporal canônica">
    <header><small>{historico ? "RESULTADO FINAL DA SESSÃO · REPLAY HISTÓRICO" : "AO VIVO"}</small><h2>IIRH e Zona</h2></header>
    {valor === null && <p role="status">{historico ? "Nenhum IIRH canônico disponível neste registro histórico." : "Aguardando primeira leitura real"}</p>}
    <div style={{display:"flex",gap:32,alignItems:"baseline",flexWrap:"wrap"}}>
      <div><small>IIRH atual</small><strong style={{fontSize:"clamp(2.8rem,6vw,4.8rem)"}}>{valor === null ? "Indisponível" : valor.toLocaleString("pt-BR",{maximumFractionDigits:2})}</strong></div>
      <div><small>Zona atual</small><strong style={{fontSize:24}}>{!zonaDisponivel ? "Indisponível — sem leitura atual válida" : nomes[String(disponibilidade.zona.projecao.codigo)] ?? "Classificação canônica pendente"}{zonaDisponivel && provisoria ? " · provisória" : ""}</strong></div>
    </div>
    <p>Cobertura: {valor === null || cobertura === null ? "não informada" : formatarPercentualCanonico(cobertura)} · Confiança: {valor === null || confianca === null ? "não informada" : `${confianca.toFixed(1)}%`} · Qualidade: {valor === null || qualidade === null ? "não informada" : `${qualidade.toFixed(1)}%`}</p>
    <p>Fase: {String(disponibilidade.iirh.origem.fase ?? "não informada")} · Horário: {String(disponibilidade.iirh.origem.momento ?? "não informado")} · Validade: {String(disponibilidade.iirh.modo)}</p>
    {!faixas.length && <p>Faixas visuais indisponíveis: o Núcleo não forneceu os limites canônicos neste contexto.</p>}
    <svg viewBox="0 0 900 275" role="img" aria-label="IIRH ao longo do tempo válido. Lacunas permanecem sem traço." style={{width:"100%",minHeight:220}}>
      {faixas.map(f => <g key={String(f.codigo)}><rect x={48} y={y(Number(f.maximo))} width={820} height={(Number(f.maximo)-Number(f.minimo))*2} fill={cores[String(f.codigo)] ?? "#777"} opacity={.12}/><text x={52} y={y(Number(f.maximo))+14} fontSize={10}>{nomes[String(f.codigo)]}</text></g>)}
      {[0,25,50,75,100].map(v => <g key={v}><text x={8} y={y(v)+4} fontSize={12}>{v}</text><line x1={43} x2={868} y1={y(v)} y2={y(v)} stroke="currentColor" opacity={.1}/></g>)}
      {intervalos.map((i,n) => { const e=i.emissao; const v=numero(obj(e.iirh).valor); return v === null ? null : <line key={`${String(e.identificador)}-${n}`} x1={x(i.inicio)} x2={x(i.fim)} y1={y(v)} y2={y(v)} stroke={cores[String(obj(e.zona).codigo)] ?? "currentColor"} strokeWidth={3}><title>{`${String(e.fase)} · IIRH ${v} · ${String(i.inicio)} — ${String(i.fim)}`}</title></line>; })}
      {pontos.map(e => <circle key={String(e.identificador)} cx={x(e.fim_da_janela)} cy={y(Number(obj(e.iirh).valor))} r={4} fill={cores[String(obj(e.zona).codigo)] ?? "currentColor"}><title>{`Leitura pontual · sem duração atribuída · ${String(e.fase)}`}</title></circle>)}
      {instantes.length>0 && <><text x={48} y={258} fontSize={12}>{new Date(inicio).toLocaleTimeString("pt-BR")}</text><text x={868} y={258} textAnchor="end" fontSize={12}>{new Date(fim).toLocaleTimeString("pt-BR")}</text></>}
    </svg>
    <div style={{display:"flex",gap:24,flexWrap:"wrap"}}>{Object.entries(nomes).map(([z,nome]) => <p key={z}><b>{nome}</b><br/>{numero(tempos[z]) === null ? "Sem tempo válido registrado" : `${Number(tempos[z]).toFixed(1)} s`}</p>)}</div>
    {nomes[String(temporal.zona_predominante)] && <p>Zona predominante {historico ? "da sessão" : "até esta leitura"}: <strong>{nomes[String(temporal.zona_predominante)]}</strong>{temporal.inclui_leituras_provisorias === true ? " · inclui leituras provisórias; cobertura e confiança preservadas por leitura" : ""}</p>}
    {!transicoes.length && <p>Transições: nenhuma transição válida registrada.</p>}
    {transicoes.length>0 && <details><summary>Transições registradas ({transicoes.length})</summary><ul>{transicoes.map((t,n) => <li key={n}>{String(t.fase)} · {new Date(String(t.momento)).toLocaleTimeString("pt-BR")}: {nomes[String(t.de)]} → {nomes[String(t.para)]}</li>)}</ul></details>}
    <small>Somente intervalos válidos medidos. Lacunas e desconexões não acrescentam tempo. Fonte canônica: {String(temporal.versao ?? operacional.versao ?? "registro histórico")}.</small>
  </section>;
}
