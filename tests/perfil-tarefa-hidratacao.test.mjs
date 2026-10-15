import test from 'node:test';
import assert from 'node:assert/strict';
import { hidratarPerfilDaTarefa } from '../lib/perfil-tarefa-hidratacao.ts';
for (const codigo of ['THX-001', 'THX-AER-001']) {
  test(`${codigo}: preenche exigências, sem antecipar respostas`, () => {
    const r = hidratarPerfilDaTarefa({}, {identificador_da_tarefa:codigo, task:{complexity:25, ambiguity:0, accuracy:100}});
    assert.deepEqual(r, {identificador:codigo, metricas:{complexity:'25', ambiguity:'0'}});
  });
}
test('ajuste parcial preserva zero e completa somente sugestões da mesma tarefa', () => {
  assert.deepEqual(hidratarPerfilDaTarefa({identificador_da_tarefa:'THX-001',task:{complexity:0, precision:63}}, {identificador_da_tarefa:'THX-001',task:{complexity:75,ambiguity:25}}).metricas,
    {complexity:'0',ambiguity:'25',precision:'63'});
});
test('outra tarefa não recebe parâmetros de um protocolo diferente', () => {
  assert.deepEqual(hidratarPerfilDaTarefa({identificador_da_tarefa:'OUTRA',task:{complexity:50}}, {identificador_da_tarefa:'THX-001',task:{ambiguity:25}}).metricas,{complexity:'50'});
});
test('ausência explícita permanece ausente e código desconhecido não ganha valores', () => {
  assert.deepEqual(hidratarPerfilDaTarefa({task:{complexity:null}}, {task:{complexity:75}}).metricas,{complexity:''});
  assert.deepEqual(hidratarPerfilDaTarefa({},{}),{identificador:'',metricas:{}});
});
