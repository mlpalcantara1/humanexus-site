import { leituraLongitudinalIndividual } from './leitura-longitudinal-humana.ts';
import { apresentarResultante } from './resultante-apresentacao.ts';
import { resolverIirhAutoritativo, resolverZonaAutoritativa } from './authoritative-iirh-projection.ts';
import { nomeDaZona } from './tirh-zone-nomenclature.ts';
import { compatibilizarVetoresDoSnapshotHistorico } from './historical-vector-compatibility.ts';
import { SIGNIFICADOS_FUNCIONAIS_DOS_VETORES } from './tirh-linguagem-funcional.ts';
import { resumoOperacionalDoRelatorio, type SecaoOperacional } from './resumo-operacional-relatorio.ts';
import { itensDeSecoesAutorizadas, valoresNarrativos, projetarMicrotrajetoriaRegulatoria } from './projecao-narrativa-relatorio.ts';

type R = Record<string, unknown>;
const obj = (v: unknown): R => v && typeof v === 'object' && !Array.isArray(v) ? v as R : {};
const num = (v: unknown) => typeof v === 'number' && Number.isFinite(v) ? v : null;
const fmt = (v: unknown) => num(v)?.toLocaleString('pt-BR', { maximumFractionDigits: 2 }) ?? 'sem medida';
const nomes: Record<string, string> = {VH:'Vetor Humano',VT:'Vetor Tarefa',VS:'Vetor Social',VSI:'Vetor Simbólico',VAR:'Vetor Autonômico',VAM:'Vetor Ação/Motor',VJ:'Vetor Julgamento',VE:'Vetor Estabilidade',VR:'Vetor Recuperação'};
export function ehReferenciaInicial(sessao: unknown, gravacao: unknown): boolean {
 const s=obj(sessao), g=obj(gravacao);
 return (obj(s.detalhes_operacionais).tipo_de_sessao ?? s.tipo_de_sessao ?? obj(g.configuracao).tipo_de_sessao) === 'BASELINE';
}
export type EntradaLeituraHumana = {
 projecao?: unknown; sessao?: unknown; gravacao?: unknown; cockpit?: unknown; ciclo?: unknown;
 protocolo?: unknown; ctr?: unknown; longitudinal?: unknown; relatorio?: unknown; consolidacao?: unknown;
 desempenho?: SecaoOperacional; execucao?: unknown;
};
/** Camada de apresentação comum a tela e PDF. Não recalcula nem aprova resultados. */
export function leituraHumanaDoRelatorio(e: EntradaLeituraHumana): SecaoOperacional[] {
 const p=obj(e.projecao), basal=ehReferenciaInicial(e.sessao,e.gravacao);
 const i=resolverIirhAutoritativo(p.iirh), z=resolverZonaAutoritativa(p.zona);
 const ir=obj(p.iirh), zr=obj(p.zona), r=obj('resultante_operacional' in p ? p.resultante_operacional : p.resultante);
 const c=obj(e.consolidacao);
 const secoes:SecaoOperacional[]=[];
 const narrativa=projetarMicrotrajetoriaRegulatoria({relatorio:e.relatorio,consolidacao:c,execucao:e.execucao??null,treinamento:[obj(e.protocolo).codigo,obj(e.protocolo).nome].filter(Boolean).join(" · ")}).leituraPratica;
 const add=(titulo:string,itens:string[])=>{const anteriores=new Set(secoes.flatMap(s=>s.itens));const unicos=[...new Set(valoresNarrativos(itens).filter(t=>!anteriores.has(t)))];if(unicos.length)secoes.push({titulo,itens:unicos});};
 const parcial=i.estadoNormalizado==='PARCIAL'||String(zr.estado).toUpperCase().includes('PROVIS');
 add(basal?'Como o participante se apresentou na referência inicial':'Síntese do funcionamento nesta sessão',[
  i.calculado ? `IIRH ${fmt(i.valor)}/100${z.classificada ? ` · ${nomeDaZona(z.codigo ?? z.nome) ?? z.nome ?? 'Zona registrada'}` : ' · Zona ainda não definida'}${parcial?' · leitura provisória.':'.'}` : 'As evidências disponíveis ainda não permitem apresentar um IIRH conclusivo ou caracterizar a organização regulatória global.',
  'O IIRH expressa a leitura integrada disponível neste registro. Um valor isolado não descreve toda a Inteligência Regulatória Humana nem demonstra melhora.',
  ...(num(ir.cobertura)!==null ? [`O cálculo reúne ${fmt(Number(ir.cobertura)*100)}% dos componentes previstos${num(ir.confianca)!==null?`; confiança interna ${fmt(Number(ir.confianca)*100)}%`:''}. Confiança interna não é probabilidade de acerto clínico.`]:[]),
  basal ? 'Esta referência descreve o momento inicial. A condição de repouso, a postura e os acontecimentos durante a captura devem ser confirmados pelo profissional. Não há comparação antes e depois de treinamento nesta etapa.' : 'A resposta à exigência deve ser lida junto da tarefa, da mobilização autonômica e cognitiva e da recuperação observada.',
 ]);
 add('O que os resultados mostram',narrativa.resultados);
 add('Como chegou',narrativa.comoChegou);
 const custos=itensDeSecoesAutorizadas(e.relatorio,'CUSTO_REGULATORIO','MEDIDAS_DE_CUSTO_POR_FASE');
 add('A que custo o funcionamento foi sustentado',custos.length?custos:[
  'O Polar H10 informa a mobilização autonômica; as bandas EEG do EPOC X informam a atividade neuroelétrica observada. O custo regulatório depende da relação desses sinais com a exigência, a resposta e a referência individual.',
  basal ? 'Nesta referência inicial, os sinais caracterizam o ponto de partida. Não permitem, sozinhos, concluir quanto esforço adicional seria necessário diante de uma tarefa.' : 'Sem medidas comparáveis, não é possível afirmar que o participante precisou de mais ou menos esforço para manter o funcionamento.'
 ]);
 const fontes=Array.isArray(obj(e.cockpit).fontes)?(obj(e.cockpit).fontes as unknown[]).map(obj):[];
 const polar=fontes.find(f=>f.codigo==='POLAR_H10')??{};
 const eeg=fontes.find(f=>f.codigo==='EMOTIV_EPOC_X')??{};
 const series=obj(polar.series_preservadas??polar.series);
 const resumoSerie=(serie:unknown,label:string,unidade:string)=>{
  const pontos=(Array.isArray(serie)?serie:[]).map(obj).filter(v=>num(v.valor)!==null&&Number.isFinite(Date.parse(String(v.timestamp))));
  if(!pontos.length)return '';
  const valores=pontos.map(v=>Number(v.valor)).sort((a,b)=>a-b);const meio=Math.floor(valores.length/2);
  const mediana=valores.length%2?valores[meio]:(valores[meio-1]+valores[meio])/2;
  return `${label}: mediana ${fmt(mediana)} ${unidade}; valores entre ${fmt(valores[0])} e ${fmt(valores.at(-1))} ${unidade} (${valores.length} medidas registradas).`;
 };
 const medidasPolar=[resumoSerie(series.hr,'Frequência cardíaca','bpm'),resumoSerie(series.rr,'Intervalo RR','ms'),resumoSerie(series.rmssd,'RMSSD recebido','ms')].filter(Boolean);
 if(medidasPolar.length)add('Resposta autonômica · Polar H10',[...medidasPolar,
  'As estatísticas resumem as medidas disponíveis nos gráficos deste relatório. O RMSSD recebido corresponde às janelas calculadas durante a captura; sua mediana não é um novo RMSSD de toda a sessão.',
  'A variação cardíaca descreve a mobilização observada. Sua relação com esforço e recuperação depende da referência individual e da situação vivida.'
 ]);
 const atividade=obj(eeg.atividade_de_bandas_eeg_preservada??eeg.atividade_de_bandas_eeg);
 const bandas=(Array.isArray(atividade.bandas)?atividade.bandas:[]).map(obj);
 const medidasEeg=bandas.map(b=>resumoSerie(b.serie_global,String(b.nome??b.codigo??'Banda EEG'),'µV²/Hz')).filter(Boolean);
 if(medidasEeg.length)add('Atividade das bandas EEG · EPOC X',[...medidasEeg,
  'As bandas mostram a potência registrada, não um traçado EEG bruto. As estatísticas descrevem somente os pontos presentes nas séries; não certificam, sozinhas, a qualidade de cada amostra.',
  'Potência elevada ou reduzida, isoladamente, não determina emoção, esforço cognitivo ou recuperação. Contato, qualidade EEG e amostragem são medidas diferentes.'
 ]);
 const resumo=resumoOperacionalDoRelatorio({cockpit:e.cockpit,ciclo:e.ciclo,gravacao:e.gravacao,protocolo:e.protocolo,ctr:e.ctr,longitudinal:e.longitudinal,incluirFisiologia:!custos.length});
 for(const s of resumo){
  if(/Baseline individual/.test(s.titulo))continue;
  if(basal && /Antes, durante|Zona Regulatória dominante|CTR, THX/.test(s.titulo))continue;
  if(medidasPolar.length&&s.titulo==='Polar e HRV — registro fisiológico')continue;
  if(medidasEeg.length&&s.titulo==='EEG — bandas e qualidade')continue;
  add(s.titulo,s.itens);
 }
 if(!basal){
  add('O que cada etapa permite compreender',['PRÉ: condição de entrada e resposta à tarefa antes da intervenção. TREINO: resposta durante a intervenção e esforço para sustentar a tarefa. PÓS: condição após o treino, recuperação e possível mudança imediata. Uma mudança no PÓS não comprova consolidação ao longo do tempo.']);
  const desempenho=itensDeSecoesAutorizadas(e.relatorio,'RESPOSTA_AOS_ESTIMULOS');
  add('Como respondeu à tarefa',desempenho.length?desempenho:e.desempenho?.itens??['Tempo de reação, acertos, erros e omissões não foram disponibilizados neste relatório. Os sensores não substituem a observação do desempenho.']);
 }
 const rotas=itensDeSecoesAutorizadas(e.relatorio,'ROTA_DOMINANTE','ROTAS_REGULATORIAS','ARR_DECLARATIVA_DA_ANAMNESE');
 add('Rota regulatória e contexto pessoal',rotas.length?rotas:['A rota dominante ainda não foi caracterizada neste relatório. A Zona Regulatória não identifica, por si só, a rota utilizada pelo participante.']);
 const vetores=compatibilizarVetoresDoSnapshotHistorico(p.vetores ?? p.vetores_oficiais).vetoresMomentaneosCanonicos;
 const ausentes:string[]=[];const linhas:string[]=[];
 for(const [codigo,nome] of Object.entries(nomes)){
  const v=vetores.find(v=>v.codigo===codigo)??{};const valor=v.magnitude??v.valor??v.value;
  if(num(valor)===null){ausentes.push(codigo);continue;}
  const fontes=Array.isArray(v.fontes)?v.fontes:[];
  const declarativo=fontes.length>0&&fontes.every(f=>f==='participant_self_report');
  const origem=declarativo?'Informação da anamnese; não é uma resposta observada nesta captura.':fontes.includes('polar')?'Derivado dos sinais cardíacos do Polar H10.':fontes.includes('emotiv')?'Inclui métricas proprietárias da Emotiv; não equivale diretamente à potência das bandas EEG.':'Valor registrado para as evidências disponíveis.';
  linhas.push(`${codigo} ${fmt(valor)} · ${nome}. ${SIGNIFICADOS_FUNCIONAIS_DOS_VETORES[codigo]??''} ${origem}`);
 }
 if(ausentes.length)linhas.push(`Ainda sem medida: ${ausentes.join(', ')}. Essas ausências não indicam deficiência do participante.`);
 add('Vetores: recursos e forças presentes',linhas);
 const vbruto=p.vetores??p.vetores_oficiais;const vev=Array.isArray(vbruto)?vbruto.map(obj).find(v=>v.codigo==='VEV'):obj(obj(vbruto).VEV);
 add('VEV longitudinal',num(vev?.magnitude??vev?.valor)!==null?[`Evolução registrada: ${fmt(vev?.magnitude??vev?.valor)}. Deve ser lida com as sessões comparáveis que sustentaram esse resultado.`]:['Ainda não há medida de evolução longitudinal. Ela exige referência inicial e quatro sessões válidas e comparáveis.']);
 add('Resultante: como essas forças se organizaram',[
  apresentarResultante(r).magnitude!==null?`Magnitude registrada: ${fmt(apresentarResultante(r).magnitude)}.`:'A magnitude global ainda não está disponível para este registro.',
  !/NAO_|NÃO|INDETER|AUSENTE/.test(apresentarResultante(r).direcaoTexto)?`Direção funcional: ${apresentarResultante(r).direcaoTexto.replaceAll('_',' ')}.`:'As evidências ainda não permitem afirmar a direção global do funcionamento.',
  ...('resultante_operacional' in p ? ['Resultante Tipo B em validação empírica.'] : []),
  ...(apresentarResultante(r).sentidoTexto!=='Não determinável'?[`Sentido regulatório: ${apresentarResultante(r).sentidoTexto}.`]:[]),
  ...(typeof r.tendencia==='string'&&!/NAO|NÃO|INDETER|AUSENTE/.test(r.tendencia)?[`Tendência: ${r.tendencia.replaceAll('_',' ')}.`]:[]),
  'A Resultante não é sinônimo de IIRH. Valores parciais dos vetores não bastam, por si só, para concluir equilíbrio, recuperação ou compensação.'
 ]);
 for (const [titulo,itens] of [
 ['O que os resultados mostram',narrativa.resultados],
 ['Como chegou',narrativa.comoChegou],
 ['Pontos fortes e capacidades observadas',narrativa.pontosFortes],
 ['Pontos de atenção',narrativa.pontosDeAtencao],
 ['Resposta ao treinamento',basal?[]:narrativa.respostaAoTreinamento],
 ['O que precisa ser desenvolvido',narrativa.desenvolvimento],
 ] as [string,string[]][]) add(titulo,itens);
 add('O que isso significa na prática',narrativa.significadoPratico);
 add('Devolutiva ao participante',narrativa.devolutivaAoParticipante);
 const conclusao=valoresNarrativos([c.conclusao]);
 add('Conclusão e próximo passo',conclusao.length?[...conclusao,...valoresNarrativos([c.recomendacao,c.proximo_passo_regulatorio])]:[
  basal?'Esta sessão pode compor a referência individual nos aspectos que tenham medidas válidas. A comparação futura deverá considerar condições semelhantes de aquisição e contexto.':'A conclusão sobre mudança depende de medidas comparáveis e da revisão profissional da resposta à tarefa.',
  'A interpretação profissional permanece pendente; nenhum benefício ou prejuízo foi presumido.'
 ]);
 add('Recomendações',narrativa.recomendacoes);
 add('Limites da leitura',valoresNarrativos([c.limitacoes]).length?valoresNarrativos([c.limitacoes]):['Somente medidas e observações efetivamente registradas sustentam esta leitura. Ausência de medida não significa ausência do fenômeno.']);
 if(!basal)for(const secao of leituraLongitudinalIndividual(e.longitudinal))add(secao.titulo,secao.itens);
 return secoes;
}
