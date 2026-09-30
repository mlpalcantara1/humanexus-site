type Registro = Record<string, unknown>;
const obj = (v: unknown): Registro => v && typeof v === 'object' ? v as Registro : {};
const nomes: Record<string, string> = { ZO: 'Zona Ótima', ZA: 'Zona Adaptativa', ZI: 'Zona de Instabilidade', ZCF: 'Zona de Comprometimento Funcional' };
export function DistribuicaoTemporalCanonica({ distribuicao, titulo }: { distribuicao: Registro; titulo: string }) {
  const tempos = obj(distribuicao.tempo_por_zona_segundos);
  const emissoes = Array.isArray(distribuicao.emissoes) ? distribuicao.emissoes.map(obj) : [];
  return <section className="hx-cockpit-panel" aria-label={titulo}>
    <h3>{titulo}</h3>
    {!emissoes.length && <p>Sem linha temporal válida preservada. Snapshots pontuais não definem predominância.</p>}
    <dl>{Object.entries(nomes).map(([z, nome]) => <div key={z}><dt>{nome}</dt><dd>{typeof tempos[z] === 'number' && Number.isFinite(tempos[z]) ? `${tempos[z]} s válidos` : 'Tempo indisponível'}</dd></div>)}</dl>
    {nomes[String(distribuicao.zona_predominante)] && <p>Zona predominante no tempo válido: {nomes[String(distribuicao.zona_predominante)]}{distribuicao.inclui_leituras_provisorias === true ? ' · inclui leituras provisórias; não representa resultado integral definitivo' : ''}</p>}
    {distribuicao.empate === true && <p>Empate no tempo válido; sem predominância única.</p>}
    <small>Fonte: {String(distribuicao.versao ?? 'não disponível')} · lacunas sem duração atribuída.</small>
    {!!emissoes.length && <details><summary>Janelas, validade e proveniência ({emissoes.length})</summary><ul>{emissoes.map(e => <li key={String(e.identificador)}>{String(e.fase)} · {String(e.inicio_da_janela)} — {String(e.fim_da_janela)} · {String(obj(e.zona).estado)} · cobertura {String(e.cobertura ?? 'indisponível')} · confiança {String(e.confianca ?? 'indisponível')} · qualidade {String(e.qualidade ?? 'indisponível')} · {String(e.versao_motor)}</li>)}</ul></details>}
  </section>;
}
