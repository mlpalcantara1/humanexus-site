import { projetarMacrotrajetoriaRegulatoria } from './projecao-narrativa-relatorio.ts';
import { nomeDaZona } from './tirh-zone-nomenclature.ts';
import type { SecaoOperacional } from './resumo-operacional-relatorio.ts';
type R=Record<string,unknown>;
const obj=(v:unknown):R=>v&&typeof v==='object'&&!Array.isArray(v)?v as R:{};
const numero=(v:unknown)=>typeof v==='number'&&Number.isFinite(v)?v:null;
const fmt=(v:number)=>v.toLocaleString('pt-BR',{maximumFractionDigits:2});
export function leituraLongitudinalIndividual(valor:unknown):SecaoOperacional[]{
 const l=obj(valor);
 const pontos=(Array.isArray(l.pontos_regulatorios)?l.pontos_regulatorios:[]).map(obj);
 const itens=pontos.map(p=>{
  const instante=Date.parse(String(p.instante??p.criado_em));
  const data=Number.isFinite(instante)?new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeZone:'America/Manaus'}).format(instante):'Data não registrada';
  const i=numero(p.iirh);
  return `${data} · ${String(p.nome_operacional??'Sessão registrada')}: ${i!==null&&p.iirh_valido!==false?`IIRH ${fmt(i)}/100`:'IIRH sem medida válida'} · ${nomeDaZona(p.zona)??'Zona sem classificação disponível'}. ${p.comparavel===true?'Comparabilidade confirmada.':p.comparavel===false?'Não comparar diretamente com as demais sessões.':'Comparabilidade ainda não confirmada.'}`;
 });
 return [
  {titulo:'Acompanhamento individual ao longo das sessões',itens:[
   'A referência inicial documenta o ponto de partida. O PRÉ mostra como a pessoa chegou a cada encontro; o PÓS mostra a condição após o treino. A evolução exige comparar momentos equivalentes, tarefas e condições semelhantes.',
   ...(itens.length?itens:['Ainda não há uma sequência de resultados disponível neste relatório. Uma única referência não demonstra evolução.'])]},
  ...projetarMacrotrajetoriaRegulatoria(l).map(e=>({titulo:e.rotulo,itens:e.itens})),
  {titulo:'O que precisa permanecer na comparação',itens:['IIRH e Zonas, custo autonômico e cognitivo, desempenho, vetores e recuperação devem ser acompanhados com suas medidas válidas. Mudanças de tarefa, qualidade do sinal ou referência individual precisam ser consideradas antes de concluir melhora ou piora.']}
 ];
}
/** Recebe somente o DTO coletivo já sanitizado. Não recebe nem agrega resultados individuais. */
export function leituraLongitudinalOrganizacional(valor:unknown):SecaoOperacional[]{
 const p=obj(valor),e=obj(p.elegibilidade_cientifica),x=obj(p.exposicao);
 const pessoas=numero(e.participantes_com_sessao_elegivel),sessoes=numero(e.sessoes_individuais_elegiveis),autorizadas=numero(x.participantes_com_permissao_explicita);
 return [{titulo:'Acompanhamento da organização',itens:[
  ...(pessoas!==null&&sessoes!==null?[`${fmt(pessoas)} participantes com ${fmt(sessoes)} sessões elegíveis no recorte consultado.`]:['A quantidade de participantes e sessões elegíveis ainda não foi informada.']),
  ...(autorizadas!==null?[`${fmt(autorizadas)} participantes possuem permissão explícita de exposição coletiva.`]:[]),
  e.agregacao_permitida===true?'O grupo atende aos critérios de agregação informados. A evolução entre períodos depende de resultados coletivos comparáveis.':'Os dados ainda não atendem aos critérios para apresentar um resultado regulatório coletivo.',
  'Quantidade de sessões não mede melhora. A leitura longitudinal organizacional deve considerar períodos, composição do grupo, funções e tarefas comparáveis. IIRH, Zonas e custos individuais não são convertidos em médias do grupo neste relatório.',
  'Nomes, documentos e respostas individuais permanecem fora da devolutiva organizacional.'
 ]}];
}
