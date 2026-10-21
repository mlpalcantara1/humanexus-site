import type { SecaoOperacional } from './resumo-operacional-relatorio.ts';

type R = Record<string, unknown>;
const obj = (v: unknown): R => v && typeof v === 'object' && !Array.isArray(v) ? v as R : {};
const rows = (v: unknown): R[] => Array.isArray(v) ? v.map(obj) : [];
const numero = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const texto = (v: unknown) => typeof v === 'string' ? v.trim() : '';
const fmt = (v: number) => v.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
const json = (v: unknown): R => {
  if (typeof v !== 'string') return obj(v);
  try { return obj(JSON.parse(v)); } catch { return {}; }
};
export type ContextoLeituraEeg = {
  basal: boolean;
  atividade?: unknown;
  participanteNome?: unknown;
  polar?: unknown;
  protocolo?: unknown;
  evidencias?: unknown;
  contexto?: { sessao?: unknown; participante?: unknown; organizacao?: unknown };
};
const bandas = [
  { codigo: 'theta', aliases: ['theta'], nome: 'Theta', faixa: '4–8 Hz',
    significado: 'Pode participar da memória de trabalho e do controle diante de exigências; em outras condições pode acompanhar redução de vigilância. Localização, vigília e tarefa mudam a interpretação.' },
  { codigo: 'alpha', aliases: ['alpha', 'alfa'], nome: 'Alfa', faixa: '8–12 Hz',
    significado: 'Participa da seleção e filtragem de informação. Olhos abertos ou fechados e distribuição posterior influenciam sua potência. Aumento não equivale automaticamente a relaxamento; redução não equivale automaticamente a piora.' },
  { codigo: 'beta_baixa', aliases: ['beta_baixa', 'betal', 'low_beta'], nome: 'Beta baixa', faixa: '12–16 Hz',
    significado: 'Pode participar da organização sensório-motora e manutenção de uma configuração de ação. O valor global não identifica, sozinho, concentração nem eficiência.' },
  { codigo: 'beta_alta', aliases: ['beta_alta', 'betah', 'high_beta'], nome: 'Beta alta', faixa: '16–25 Hz',
    significado: 'Pode variar com a atividade relacionada à tarefa, mas tensão facial, fala e contração muscular também contribuem, sobretudo nas frequências mais altas. Não identifica ansiedade isoladamente.' },
  { codigo: 'gamma', aliases: ['gamma', 'gama'], nome: 'Gama', faixa: '25–45 Hz no Cortex',
    significado: 'Atividade neural rápida pode participar do processamento de informação; no EEG de superfície há especial vulnerabilidade a músculos e movimentos oculares. Mais potência não demonstra maior inteligência ou melhor integração.' }
];

/** Narrativa derivada, sem novos escores, classificação ou validação profissional. */
export function leituraEegContextual(e: ContextoLeituraEeg): SecaoOperacional[] {
  const saida: SecaoOperacional[] = [];
  if (e.basal) {
    saida.push({ titulo: 'Referência inicial sem tarefa', itens: [
      'A referência inicial é realizada em repouso, sem tarefa THX ou THX-AER. As bandas descrevem a configuração basal observada; não são resposta a uma exigência programada.',
      'Desempenho, acertos, erros, omissões e tempo de reação não se aplicam à referência sem tarefa. A ausência desses resultados não constitui falha de coleta.',
      'A recuperação após tarefa e o custo adicional para sustentar desempenho não são demonstrados por esta referência isolada. VT ou VR declarativos permanecem contexto da anamnese, sem representar tarefa ou recuperação executadas.'
    ] });
  } else {
    const c = e.contexto ?? {};
    // Exige o mesmo isolamento usado nas medidas admissíveis de desempenho.
    const escopoCompleto = [c.sessao, c.participante, c.organizacao].every(v => typeof v === 'string' && v.length > 0);
    const perfis = escopoCompleto ? rows(e.evidencias).filter(v =>
      v.origem === 'task_profile' && v.estado_de_validade === 'VALIDO'
      && v.identificador_da_sessao === c.sessao
      && v.identificador_do_participante === c.participante
      && v.identificador_da_organizacao === c.organizacao
    ).map(v => ({ dado: json(v.valor_json), instante: texto(v.criado_em), id: texto(v.identificador) })) : [];
    const itens: string[] = [];
    for (const fase of ['PRE', 'TREINO', 'POS']) {
      const nome = fase === 'PRE' ? 'PRÉ' : fase === 'POS' ? 'PÓS' : fase;
      const registros = perfis.filter(v => v.dado.fase === fase);
      const tarefas = new Set(registros.map(v => texto(v.dado.identificador_da_tarefa)).filter(Boolean));
      if (tarefas.size !== 1) {
        itens.push(`${nome}: ${tarefas.size > 1 ? 'há diferentes tarefas no recorte; suas exigências e respostas não foram unidas em uma interpretação única' : 'o perfil admissível da tarefa não foi recebido neste recorte; a tarefa não será inferida pelo nome do protocolo'}.`);
        continue;
      }
      const tarefa = [...tarefas][0];
      const selecionado = texto(obj(e.protocolo).codigo);
      if (selecionado && /^(THX-|THX-AER-)/.test(tarefa) && selecionado !== tarefa) {
        itens.push(`${nome}: o perfil registrado corresponde a ${tarefa}, diferente do protocolo selecionado ${selecionado}; interpretação contextual pendente de conciliação.`);
        continue;
      }
      registros.sort((a,b) => a.instante.localeCompare(b.instante) || a.id.localeCompare(b.id));
      const perfil = registros.at(-1)!.dado;
      const m = obj(perfil.task);
      const campos = [
        ['complexity','complexidade'], ['ambiguity','ambiguidade'],
        ['error_consequence','consequência do erro'], ['coordination','coordenação'],
        ['communication','comunicação'], ['symbolic_context','contexto simbólico']
      ];
      const exigencias = campos.filter(([k]) => numero(m[k])).map(([k,n]) => `${n} ${fmt(m[k] as number)}`);
      const descricao = texto(perfil.tarefa);
      const tarefaBase = selecionado === tarefa ? texto(obj(e.protocolo).tarefa_base) : '';
      if(tarefaBase && !descricao)itens.push(`${nome}: tarefa-base do protocolo selecionado — ${tarefaBase}. O perfil fixado nesta fase tem precedência sobre sugestões do catálogo.`);
      itens.push(`${nome} · tarefa ${tarefa}${descricao ? `: ${descricao}` : ''}. ${exigencias.length ? `Exigências programadas registradas: ${exigencias.join('; ')}. São parâmetros do cenário, não resultados do participante.` : 'Exigências quantitativas não disponibilizadas neste recorte.'}`);
      const resultados = [
        ['correct_answers','acertos'],['errors','erros'],['omissions','omissões'],
        ['reaction_time_ms','tempo de reação (ms)'],['decision_time_ms','tempo de decisão (ms)']
      ].filter(([k]) => numero(m[k])).map(([k,n]) => `${n} ${fmt(m[k] as number)}`);
      itens.push(`${nome}: ${resultados.length ? `resposta observada registrada: ${resultados.join('; ')}. Relacionar as mudanças EEG deste mesmo período à resposta observada e à referência individual.` : 'desempenho não medido neste perfil; a configuração da tarefa não comprova que ela foi executada nem que houve resposta fisiológica.'}`);
    }
    saida.push({ titulo: 'Tarefa hidratada e resposta por etapa', itens: [
      'A leitura utiliza automaticamente os perfis admissíveis fixados na sessão pela plataforma, respeitando a definição e os ajustes profissionais. Sugestões de catálogo não substituem o perfil registrado para a etapa.', ...itens,
      'PRÉ e PÓS só são interpretados como exposição à tarefa quando houver registro correspondente. Um PÓS em repouso descreve o período após a exigência; não recebe resultados ou exigências de outra fase como se fossem observados nele.'
    ] });
  }
  const presentes = rows(obj(e.atividade).bandas);
  const nome = texto(e.participanteNome) || 'quem foi acompanhado';
  const interpretacoes: string[] = [];
  const mediana = (v: number[]) => {
    const ordenados=[...v].sort((a,b)=>a-b), meio=Math.floor(v.length/2);
    return v.length%2 ? ordenados[meio] : (ordenados[meio-1]+ordenados[meio])/2;
  };
  const faseNome = (f: string) => f==='PRE'?'PRÉ':f==='POS'?'PÓS':f==='TREINO'?'TREINO':f==='BASELINE'?'repouso':'recorte sem fase identificada';
  const observadas: string[]=[];
  for (const banda of bandas) {
    const registro = presentes.find(b => banda.aliases.includes(texto(b.codigo).toLowerCase()) || banda.aliases.includes(texto(b.nome).toLowerCase()));
    if (!registro) continue;
    const valores = rows(registro.serie_global).filter(v => numero(v.valor) && Number.isFinite(Date.parse(texto(v.timestamp))));
    const trechos: string[]=[];
    for(const fase of e.basal?['BASELINE']:['PRE','TREINO','POS','SEM_FASE']){
      const pontos=valores.filter(v=> e.basal ? !texto(v.momento)||v.momento==='BASELINE' : fase==='SEM_FASE' ? !['PRE','TREINO','POS'].includes(texto(v.momento)) : v.momento===fase);
      if(!pontos.length)continue;
      const v=pontos.map(p=>p.valor as number);
      trechos.push(`${faseNome(fase)}: mediana ${fmt(mediana(v))}, entre ${fmt(Math.min(...v))} e ${fmt(Math.max(...v))} µV²/Hz, em ${v.length} medidas`);
    }
    if(!trechos.length && numero(registro.valor_agregado))trechos.push(`valor agregado registrado ${fmt(registro.valor_agregado)} µV²/Hz; sem fase e janela caracterizadas neste resumo`);
    if(!trechos.length)continue;
    observadas.push(banda.codigo);
    const dado=`${banda.nome} (${banda.faixa}) em ${nome} — ${trechos.join('; ')}.`;
    const sentido=banda.codigo==='theta'
      ? e.basal?'Neste repouso, esse registro é o ponto de partida para acompanhar vigilância e mobilização de controle. Não demonstra recrutamento de memória de trabalho por tarefa, pois não houve exigência programada. Nas próximas atividades, verificar sua mudança por região e evento, junto de precisão e latência.'
        :'Na tarefa registrada, relacionar a modulação de Theta à necessidade de manter informação e organizar respostas. Seus valores por etapa descrevem o que foi registrado; não distinguem sozinhos mobilização de controle, redução de vigilância ou artefato.'
      :banda.codigo==='alpha'
      ? e.basal?'A Alfa observada oferece o comparador individual para futuras mudanças no processamento sensorial e na seleção de informação. A condição dos olhos e a distribuição posterior precisam estar documentadas para caracterizar relaxamento ou redução de atenção.'
        :'Interpretar a Alfa desta etapa junto das exigências visuais e da seleção de informação da tarefa. Mudança de olhos abertos/fechados ou de canais pode alterar o valor; aumento ou redução não equivale por si a melhora ou piora.'
      :banda.codigo==='beta_baixa'
      ? e.basal?'Esta medida das frequências sensório-motoras caracteriza o estado sem tarefa. Não mede capacidade de ação ou concentração. Será comparador para observar como o participante organiza a execução quando uma atividade for aplicada.'
        :'Relacionar a Beta baixa registrada à ação efetivamente realizada, considerando postura e movimento. O parâmetro da tarefa descreve a exigência; o sinal e o desempenho do mesmo período sustentam a leitura da resposta individual.'
      :banda.codigo==='beta_alta'
      ? 'O valor de Beta alta compõe a referência das frequências rápidas deste participante. Fala e tensão facial podem contribuir para essa faixa. Para relacioná-la à pressão vivida, é necessário cruzar o mesmo período com observação, relato e sinais Polar; o valor isolado não identifica ansiedade.'
      :'A Gama registrada compõe a configuração espectral individual. A atividade de músculos e os movimentos oculares podem contribuir para esta faixa, sem que isso prove contaminação nesta coleta. Não converter sua potência em inteligência, eficiência ou integração global.';
    interpretacoes.push(`${dado} ${sentido}`);
  }
  if(interpretacoes.length){
    const series=obj(obj(e.polar).series_preservadas??obj(e.polar).series);
    const hr=rows(series.hr).filter(p=>numero(p.valor)&&Number.isFinite(Date.parse(texto(p.timestamp)))).map(p=>p.valor as number);
    if(hr.length)interpretacoes.push(`Integração com o Polar de ${nome}: a FC registrada variou entre ${fmt(Math.min(...hr))} e ${fmt(Math.max(...hr))} bpm. Relacionar essa mobilização às bandas e ao contexto já descritos, respeitando as janelas de cada fonte. A coexistência de medidas não demonstra acoplamento entre EEG e resposta autonômica, equilíbrio global ou baixo custo.`);
    interpretacoes.push(e.basal
      ? `Síntese individual: a configuração EEG de ${nome} documenta o repouso nos trechos disponíveis. Nenhuma banda isolada confirma uma rota declarada na anamnese. O interesse longitudinal será a reorganização diante da tarefa validada, ligada aos eventos, ao comportamento e ao Polar; sem perturbação aplicada, não atribuir custo de desempenho nem recuperação pós-exigência.`
      : `Síntese individual: a leitura de ${nome} depende do cruzamento dos valores por etapa com a tarefa e as respostas registradas acima. Desempenho preservado pode motivar investigar o esforço que o sustentou; erros ou lentidão podem motivar investigar dificuldade de organização. Essas hipóteses não são confirmadas pela potência de uma banda. O PÓS informa resposta imediata; manutenção exige encontros comparáveis.`);
    interpretacoes.push('Os valores globais não localizam atividade frontal ou posterior. Potência também contém atividade aperiódica; o maior valor entre bandas não identifica função predominante. Qualidade EEG ≥8%, contato e amostragem são condições distintas; sem EEG bruto disponível, a inspeção de artefatos permanece limitada. Ausências e mudanças de canais não são melhora ou piora.');
    saida.push({titulo:'Interpretação integrada das bandas no caso individual',itens:interpretacoes});
    saida.push({titulo:'Fundamentos da leitura EEG',itens:['Gevins et al., 1997 (doi:10.1093/cercor/7.4.374); supressão atencional (PMID:11489617); Beta e ação (PMID:20161997); Whitham et al., 2007 (doi:10.1016/j.clinph.2007.04.027); Donoghue et al., 2020 (doi:10.1038/s41593-020-00744-x). Faixas do stream pow: documentação Cortex.']});
  }
  return saida;
}
