import assert from 'node:assert/strict';
import test from 'node:test';
import {chaveDoRegistro, aceitarResposta, recuperarRascunho, novoRascunho, preservarValidacaoRecusada} from '../lib/registro-integrado.ts';
import {reamostrar16k} from '../lib/voz-local.ts';
test('diário isola organização, participante, sessão e profissional',()=>{
 const base=['o','p','s','u'];const chaves=new Set([chaveDoRegistro(...base)]);
 for(let i=0;i<4;i++){const x=[...base];x[i]='outro';chaves.add(chaveDoRegistro(...x))}assert.equal(chaves.size,5);
 assert.notEqual(chaveDoRegistro('a:b','c','d','e'),chaveDoRegistro('a','b:c','d','e'));
});
test('resposta atrasada não regride revisão; repetição pode ser conciliada',()=>{assert.equal(aceitarResposta(8,{revisao:7}),false);assert.equal(aceitarResposta(8,{revisao:8}),true);assert.equal(aceitarResposta(8,{revisao:9}),true)});
test('retomada preserva fila idempotente, fase congelada e correções',()=>{
 const r=novoRascunho();r.texto='nota ainda não enviada';r.fase='PRE';r.faseId='fase-a';r.revisaoBase=4;r.campos.conclusao='conclusão autoral';r.fila.push({acao:'NOTA',chave:'uuid-estavel',identificador_da_fase:'fase-a',texto:'observação'});
 assert.deepEqual(recuperarRascunho(JSON.stringify(r)),r);
 assert.deepEqual(recuperarRascunho(null),novoRascunho());assert.throws(()=>recuperarRascunho('{'));
});
test('áudio reamostrado conserva duração e amplitude sem persistência',()=>{const pcm=new Float32Array(48000).fill(.25);const r=reamostrar16k(pcm,48000);assert.equal(r.length,16000);assert.equal(r[0],.25);assert.equal(r[15999],.25);assert.equal(reamostrar16k(r,16000),r)});
test('validação recusada por conteúdo libera correção sem descartar a tentativa nem aprovar automaticamente',()=>{
 for(const status of [400,422]){
  const r=novoRascunho();const c={acao:'VALIDAR',chave:'original',revisao:4};
  r.fila=[c,{acao:'NOTA',chave:'nota-preservada'}];r.campos.contexto_e_objetivo='texto corrigido';r.revisaoBase=4;
  assert.equal(preservarValidacaoRecusada(r,status,'conteúdo recusado','horário'),true);
  assert.deepEqual(r.fila,[{acao:'NOTA',chave:'nota-preservada'}]);
  assert.equal(r.campos.contexto_e_objetivo,'texto corrigido');assert.equal(r.revisaoBase,4);
  assert.deepEqual(r.validacoesRecusadas,[{comando:c,status,motivo:'conteúdo recusado',em:'horário'}]);
  assert.deepEqual(recuperarRascunho(JSON.stringify(r)),r);
 }
});
test('transporte, autenticação, conflito e demais comandos preservam a fila idempotente',()=>{
 for(const status of [0,401,403,409,429,500,502,504]){
  const r=novoRascunho();r.fila=[{acao:'VALIDAR',chave:'mesma-chave'}];const antes=JSON.stringify(r);
  assert.equal(preservarValidacaoRecusada(r,status,'erro','horário'),false);assert.equal(JSON.stringify(r),antes);
 }
 for(const acao of ['SALVAR','NOTA','REVISAR_NOTA','REVISAR_SUGESTOES']){
  const r=novoRascunho();r.fila=[{acao,chave:'preservada'}];
  assert.equal(preservarValidacaoRecusada(r,400,'erro','horário'),false);assert.equal(r.fila.length,1);
 }
});

test('primeiro rascunho atualiza gate operacional no próprio contexto sem iniciar fase', async () => {
  const { readFile } = await import('node:fs/promises');
  const registro = await readFile('components/registro-integrado-sessao.tsx','utf8');
  const painel = await readFile('components/operacao-homologacao.tsx','utf8');
  assert.match(registro, /primeiraPersistencia && r\.revisao > 0/);
  assert.match(registro, /humanexus:registro-persistido/);
  assert.match(painel, /detalhe\?\.sessao !== contexto\.sessao/);
  assert.match(painel, /detalhe\?\.participante !== contexto\.participante/);
  assert.match(painel, /removeEventListener\("humanexus:registro-persistido"/);
  const cockpit = await readFile('components/cockpit-operacional-vivo.tsx','utf8');
  assert.match(cockpit, /hx-live-operation-action[\s\S]{0,150}role="alert"/);
});
