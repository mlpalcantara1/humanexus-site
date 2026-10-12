import test from 'node:test';
import assert from 'node:assert/strict';
import {registroDaReferenciaIndividual} from '../lib/baseline-reference-presentation.ts';
const anterior = {identificador:'B1', estado:'FINALIZADO'};
const referencia = {decisao:{tipo:'UTILIZAR_BASELINE_ANTERIOR', identificador_do_baseline_de_referencia:'B1'}, elegibilidade_individual:{valida_para_inicio:true,baseline:anterior}};
test('nova sessão usa estado do Baseline individual explicitamente reaproveitado',()=>assert.deepEqual(registroDaReferenciaIndividual(referencia,{}),anterior));
test('referência inválida ou outra decisão não é apresentada como Baseline vinculado',()=>{
 assert.deepEqual(registroDaReferenciaIndividual({...referencia,elegibilidade_individual:{valida_para_inicio:false,baseline:anterior}},{}),{});
 assert.deepEqual(registroDaReferenciaIndividual({...referencia,decisao:{tipo:'REALIZAR_NOVO_BASELINE'}},{}),{});
});
test('referência identificada diferente não é trocada silenciosamente',()=>assert.deepEqual(registroDaReferenciaIndividual({...referencia,decisao:{tipo:'UTILIZAR_BASELINE_ANTERIOR',identificador_do_baseline_de_referencia:'B2'}},{}),{}));
test('registro próprio preserva precedência e ausência não herda estado da sessão',()=>{
 assert.deepEqual(registroDaReferenciaIndividual({...referencia,baseline:{estado:'PAUSADO'}},{}),{estado:'PAUSADO'});
 assert.deepEqual(registroDaReferenciaIndividual({},{}),{});
});
