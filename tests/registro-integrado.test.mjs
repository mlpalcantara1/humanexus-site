import assert from 'node:assert/strict';
import test from 'node:test';
import {chaveDoRegistro, aceitarResposta, recuperarRascunho, novoRascunho} from '../lib/registro-integrado.ts';
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
