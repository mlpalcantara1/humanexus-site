import test from 'node:test';
import assert from 'node:assert/strict';
import { leituraEegContextual } from '../lib/leitura-eeg-contextual.ts';
import { leituraHumanaDoRelatorio } from '../lib/leitura-humana-relatorio.ts';
const contexto={sessao:'s',participante:'p',organizacao:'o'};
const evidencia=(fase,task={},extra={})=>({origem:'task_profile',estado_de_validade:'VALIDO',identificador_da_sessao:'s',identificador_do_participante:'p',identificador_da_organizacao:'o',criado_em:'2026-10-20T15:00:00Z',valor_json:{fase,identificador_da_tarefa:'THX-AER-042',task},...extra});
test('baseline ignora tarefa mesmo hidratada, sem converter ausência em erro de desempenho',()=>{
 const entrada={basal:true,contexto,evidencias:[evidencia('TREINO',{errors:3,communication:75})]};
 const antes=structuredClone(entrada),s=JSON.stringify(leituraEegContextual(entrada));
 assert.match(s,/repouso, sem tarefa/);assert.doesNotMatch(s,/THX-AER-042|comunicação 75|erros 3/);assert.deepEqual(entrada,antes);
});
test('perfil válido fornece exigências separadas de resposta, preservando zero',()=>{
 const s=JSON.stringify(leituraEegContextual({basal:false,contexto,protocolo:{codigo:'THX-AER-042'},evidencias:[evidencia('TREINO',{communication:75,ambiguity:0,errors:0,reaction_time_ms:420})]}));
 assert.match(s,/comunicação 75/);assert.match(s,/ambiguidade 0/);assert.match(s,/erros 0/);assert.match(s,/420/);assert.match(s,/PRÉ: o perfil admissível/);assert.match(s,/PÓS: o perfil admissível/);
});
test('sugestão e dados de outra pessoa, sessão ou organização não alimentam interpretação',()=>{
 const evidencias=[evidencia('TREINO',{communication:99},{identificador_do_participante:'outro'}),evidencia('TREINO',{communication:98},{identificador_da_sessao:'outra'}),evidencia('TREINO',{communication:97},{identificador_da_organizacao:'outra'}),evidencia('TREINO',{communication:96},{estado_de_validade:'SUGERIDO'})];
 const s=JSON.stringify(leituraEegContextual({basal:false,contexto,evidencias}));assert.doesNotMatch(s,/99|98|97|96|THX-AER-042/);
});
test('tarefa não é inferida só pelo código do THX e exige escopo completo',()=>{
 for(const c of [undefined,{sessao:'s',participante:'p'}]){
 const s=JSON.stringify(leituraEegContextual({basal:false,contexto:c,protocolo:{codigo:'THX-AER-042'},evidencias:[evidencia('TREINO',{communication:75})]}));assert.doesNotMatch(s,/comunicação 75/);assert.match(s,/não será inferida pelo nome/);
 }});
test('tarefas diferentes na mesma fase não são unidas nem tratadas como comparáveis',()=>{
 const b=evidencia('TREINO',{complexity:100});b.valor_json.identificador_da_tarefa='THX-AER-005';
 const s=JSON.stringify(leituraEegContextual({basal:false,contexto,evidencias:[evidencia('TREINO',{complexity:25}),b]}));assert.match(s,/diferentes tarefas/);assert.doesNotMatch(s,/complexidade 100|complexidade 25/);
});
test('bandas sem medida não recebem interpretação; potência zero medida é preservada',()=>{
 const s=JSON.stringify(leituraEegContextual({basal:true,atividade:{bandas:[{codigo:'theta',valor_agregado:null},{codigo:'gamma',valor_agregado:0}]}}));assert.doesNotMatch(s,/Theta \(/);assert.match(s,/Gama \(/);assert.match(s,/músculos/);
});
test('baseline não recebe conclusão genérica de treinamento nem custo para sustentar tarefa',()=>{
 const s=JSON.stringify(leituraHumanaDoRelatorio({sessao:{tipo_de_sessao:'BASELINE'},consolidacao:{conclusao:'Texto profissional preservado.'}}));
 assert.match(s,/Texto profissional preservado/);assert.match(s,/sem tarefa/);assert.doesNotMatch(s,/O que os resultados mostram|A que custo o funcionamento foi sustentado|Como respondeu à tarefa/);
});

test('descrição da tarefa-base só acompanha perfil admissível do mesmo protocolo',()=>{
 const base={basal:false,contexto,evidencias:[evidencia('TREINO',{communication:75})]};
 const s=JSON.stringify(leituraEegContextual({...base,protocolo:{codigo:'THX-AER-042',tarefa_base:'Transmitir informação crítica'}}));
 assert.match(s,/Transmitir informação crítica/);
 const outro=JSON.stringify(leituraEegContextual({...base,protocolo:{codigo:'THX-AER-005',tarefa_base:'Corrigir falha'}}));assert.doesNotMatch(outro,/Corrigir falha/);assert.match(outro,/diferente do protocolo selecionado/);
});

test('interpretação usa nome, números reais e fases separadas sem repetir aula genérica',()=>{
 const s=JSON.stringify(leituraEegContextual({basal:false,contexto,participanteNome:'PESSOA TESTE',atividade:{bandas:[{codigo:'theta',serie_global:[{timestamp:'2026-10-20T15:00:00Z',valor:2,momento:'PRE'},{timestamp:'2026-10-20T15:01:00Z',valor:8,momento:'TREINO'}]}]},evidencias:[evidencia('TREINO',{errors:2})]}));
 assert.match(s,/PESSOA TESTE/);assert.match(s,/PRÉ: mediana 2/);assert.match(s,/TREINO: mediana 8/);assert.match(s,/erros 2/);assert.doesNotMatch(s,/Interpretação neurofisiológica das bandas EEG|melhorou|sonolento/);
});
test('relatório contém uma seção EEG integrada sem bloco anterior repetido',()=>{
 const secoes=leituraHumanaDoRelatorio({sessao:{tipo_de_sessao:'BASELINE'},participanteNome:'PESSOA TESTE',cockpit:{fontes:[{codigo:'EMOTIV_EPOC_X',atividade_de_bandas_eeg:{bandas:[{codigo:'alpha',serie_global:[{timestamp:'2026-10-20T15:00:00Z',valor:1.5,momento:'BASELINE'}]}]}}]}});
 assert.equal(secoes.filter(s=>s.titulo==='Interpretação integrada das bandas no caso individual').length,1);assert.equal(secoes.filter(s=>s.titulo==='Atividade das bandas EEG · EPOC X'||s.titulo==='EEG — bandas e qualidade').length,0);
});
