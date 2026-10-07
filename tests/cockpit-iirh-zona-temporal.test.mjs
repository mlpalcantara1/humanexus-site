import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const require = createRequire(import.meta.url);
function carregar(path) {
  const source=readFileSync(new URL('../'+path,import.meta.url),'utf8');
  const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
  const module={exports:{}};
  new Function('require','module','exports',js)(name=>name.startsWith('@/')?carregar(name.slice(2)+'.ts'):require(name),module,module.exports);
  return module.exports;
}
const {CockpitIirhZonaTemporal}=carregar('components/cockpit-iirh-zona-temporal.tsx');
const {SinteseValidacaoTirhV1}=carregar('components/sintese-validacao-tirh-v1.tsx');
const {projecaoTemporalDesatualizada}=carregar('lib/cockpit-projection-freshness.ts');
const {faseCientificaPausada}=carregar('lib/paused-phase-presentation.ts');
test('fim do PRÉ sem janela ativa não apresenta revisão contextual como leitura atual',()=>{
 const l=leitura('PARCIAL',35); l.tirh_operacional_v1={versao_cientifica:'TESTE'};
 l.estado_da_janela_cientifica={estado:'SEM_JANELA_ATUAL_ADMISSIVEL',resultado_atual:false,fase:null};
 l.disponibilidade_continua_iirh_zona.janela_atual={...l.estado_da_janela_cientifica};
 const original=JSON.stringify(l);
 const html=renderToStaticMarkup(React.createElement(SinteseValidacaoTirhV1,{
  estado:{cockpit_operacional:{leitura_cientifica:l}},indicadoresDesatualizados:{iirh:false,zona:false},validarClaimTirhV1:()=>{}
 }));
 assert.equal((html.match(/SEM RESULTADO ATUAL/g)||[]).length,2);
 assert.doesNotMatch(html,/35.0 \/ 100|ATUAL · PARCIAL|ATUAL · PROVISORIA/);
 assert.match(render(l),/Indisponível — sem leitura atual válida/);
 assert.doesNotMatch(render(l),/<strong[^>]*>35</);
 assert.match(render(l),/SEM JANELA ATUAL ADMISSÍVEL/);
 assert.doesNotMatch(render(l),/AO VIVO|Aguardando primeira leitura real/);
 assert.equal(JSON.stringify(l),original);
});
test('pausa canônica da janela prevalece sobre sessão INICIADA, sem alterar projeções',()=>{
 const l=leitura(); l.tirh_operacional_v1={versao_cientifica:'TESTE'};
 l.estado_da_janela_cientifica={estado:'PAUSADA_SEM_RESULTADO_ATUAL'};
 const estado={sessao:{estado:'INICIADA',fase_atual:'PRE',estados_das_fases:{PRE:'INICIADA'}},cockpit_operacional:{leitura_cientifica:l}};
 const original=JSON.stringify(estado);
 assert.equal(faseCientificaPausada(estado),true);
 const html=renderToStaticMarkup(React.createElement(SinteseValidacaoTirhV1,{estado,indicadoresDesatualizados:{iirh:false,zona:false},validarClaimTirhV1:()=>{}}));
 assert.equal((html.match(/INDISPONÍVEL DURANTE PAUSA/g)||[]).length,2);
 assert.doesNotMatch(html,/74.2 \/ 100/);
 assert.equal(JSON.stringify(estado),original);
 const retomado=structuredClone(estado);
 retomado.cockpit_operacional.leitura_cientifica.estado_da_janela_cientifica.estado='ATIVA';
 assert.equal(faseCientificaPausada(retomado),false);
});
test('resposta recebida entre ticks não oscila para desatualizada; origem vencida continua vencida',()=>{
 const polling=Date.parse('2026-10-06T22:46:49.418Z');
 const args={agora:polling-418,pollingConfirmadoEm:new Date(polling).toISOString(),momento:new Date(polling-1000).toISOString()};
 assert.equal(projecaoTemporalDesatualizada(args),false);
 assert.equal(projecaoTemporalDesatualizada({...args,agora:polling+21_000}),true);
 assert.equal(projecaoTemporalDesatualizada({...args,momento:new Date(polling-21_000).toISOString()}),true);
 assert.equal(projecaoTemporalDesatualizada({...args,momento:null}),true);
});
test('cabeçalho considera também transporte vencido sem promover snapshot antigo',()=>{
 const l=leitura();
 const html=renderToStaticMarkup(React.createElement(CockpitIirhZonaTemporal,{
  leitura:l,historico:false,agora:Date.parse('2026-10-02T05:10:05Z'),
  cockpit:{polling_confirmado_em:'2026-10-02T05:09:00Z'}
 }));
 assert.match(html,/Último IIRH registrado/);
 assert.match(html,/Última Zona registrada/);
});
test('síntese durante pausa não apresenta projeção recebida como resultado atual',()=>{
 const l=leitura(); l.tirh_operacional_v1={versao_cientifica:'TESTE'};
 const original=JSON.stringify(l);
 const html=renderToStaticMarkup(React.createElement(SinteseValidacaoTirhV1,{
  estado:{estado_operacional:{estado_da_sessao:'PAUSADA'},cockpit_operacional:{leitura_cientifica:l}},
  indicadoresDesatualizados:{iirh:false,zona:false},validarClaimTirhV1:()=>{}
 }));
 assert.equal((html.match(/FASE PAUSADA — SEM RESULTADO ATUAL/g)||[]).length,2);
 assert.equal((html.match(/="PAUSADA_SEM_RESULTADO_ATUAL"/g)||[]).length,2);
 assert.doesNotMatch(html,/74.2 \/ 100/);
 assert.equal(JSON.stringify(l),original);
});
test('síntese acompanha atualidade independente do cabeçalho sem recalcular valores',()=>{
 const l=leitura(); l.tirh_operacional_v1={versao_cientifica:'TESTE'};
 const estado={cockpit_operacional:{leitura_cientifica:l}};
 const renderSintese=(flags)=>renderToStaticMarkup(React.createElement(SinteseValidacaoTirhV1,{estado,indicadoresDesatualizados:flags,validarClaimTirhV1:()=>{throw Error('não deve validar');}}));
 const passado=renderSintese({iirh:true,zona:true});
 assert.equal((passado.match(/ÚLTIMO REGISTRO — NÃO ATUAL/g)||[]).length,2);
 assert.equal((passado.match(/="DESATUALIZADA"/g)||[]).length,2);
 assert.match(passado,/74.2 \/ 100/); assert.match(passado,/Regulação Funcional/);
 assert.match(passado,/2026-10-02T05:10:00Z/);
 const atual=renderSintese({iirh:false,zona:false});
 assert.match(atual,/ATUAL · PARCIAL/); assert.doesNotMatch(atual,/ÚLTIMO REGISTRO/);
 const mista=renderSintese({iirh:false,zona:true});
 assert.match(mista,/data-iirh-authoritative-state="ATUAL"/);
 assert.match(mista,/data-zone-authoritative-state="DESATUALIZADA"/);
 assert.match(renderSintese(undefined),/ATUALIDADE NÃO VERIFICADA/);
});
function leitura(estado='PARCIAL',valor=74.15,modo='ATUAL') {
 return {disponibilidade_continua_iirh_zona:{autoridade:'NUCLEO_HUMANEXUS',portal_autorizado_a_calcular:false,zona_derivada_do_iirh:false,
 estado_atual:{iirh:{modo,origem:{momento:'2026-10-02T05:10:00Z'},registro:{estado,valor,cobertura:.11,confianca:21.7,qualidade:90}},zona:{modo,origem:{momento:'2026-10-02T05:10:00Z'},registro:{codigo:'ZA',estado:'PROVISORIA'}}}}};
}
const render=(l,historico=false,agora=Date.parse('2026-10-02T05:10:05Z'))=>renderToStaticMarkup(React.createElement(CockpitIirhZonaTemporal,{leitura:l,historico,agora}));
test('projeção antiga nunca permanece rotulada como estado atual',()=>{
 const l=leitura(); const atual=l.disponibilidade_continua_iirh_zona.estado_atual;
 atual.iirh.origem={momento:'2026-10-02T04:45:02Z'};
 atual.zona.origem={momento:'2026-10-02T04:45:02Z'};
 const antiga=render(l,false,Date.parse('2026-10-02T04:54:29Z'));
 assert.match(antiga,/ÚLTIMA PROJEÇÃO — NÃO ATUAL/);
 assert.match(antiga,/Validade IIRH: DESATUALIZADA · Validade Zona: DESATUALIZADA/);
 assert.match(antiga,/Último IIRH registrado/);
 assert.doesNotMatch(antiga,/IIRH atual/);
 const recuperada=render(l,false,Date.parse('2026-10-02T04:45:10Z'));
 assert.match(recuperada,/IIRH atual/);
 assert.match(recuperada,/Validade IIRH: ATUAL · Validade Zona: ATUAL/);
});
test('Zona antiga não se torna atual porque o IIRH recebeu nova projeção',()=>{
 const l=leitura(); const atual=l.disponibilidade_continua_iirh_zona.estado_atual;
 atual.iirh.origem={momento:'2026-10-02T05:10:00Z'};
 atual.zona.origem={momento:'2026-10-02T05:05:00Z'};
 const html=render(l,false,Date.parse('2026-10-02T05:10:05Z'));
 assert.match(html,/IIRH atual/);
 assert.match(html,/Última Zona registrada/);
 assert.match(html,/Validade IIRH: ATUAL · Validade Zona: DESATUALIZADA/);
});
test('leitura parcial atual destaca IIRH, zona provisória, cobertura e confiança',()=>{
 const html=render(leitura());
 for(const s of ['74,15','Regulação Funcional','provisória','11%','22%','AO VIVO'])assert.ok(html.includes(s),s);
 assert.doesNotMatch(html,/congelad/i);
});
test('ausência e referência passada nunca aparecem como número atual',()=>{
 for(const l of [leitura('NAO_CALCULAVEL',91),leitura('CALCULADO',91,'REFERENCIA_CONGELADA'),{}]) {
  const html=render(l);assert.match(html,/Aguardando primeira leitura real/);assert.doesNotMatch(html,/>91</);
 }
});
test('ponto real sem duração não vira intervalo e predominância provisória permanece explícita',()=>{
 const l=leitura();l.distribuicao_temporal_das_zonas={emissoes:[{identificador:'teste-unitario',fase:'PRE',iirh:{valor:74.15},zona:{codigo:'ZA'},duracao_valida_segundos:0,fim_da_janela:'2026-01-01T12:00:00Z',intervalos_validos:[]}],zona_predominante:'ZA',inclui_leituras_provisorias:true};
 const html=render(l,true);assert.match(html,/<circle/);assert.match(html,/sem duração atribuída/);assert.match(html,/inclui leituras provisórias/);assert.match(html,/REPLAY HISTÓRICO/);
});

test('IIRH atual não promove uma Zona histórica a classificação atual',()=>{
 const l=leitura();l.disponibilidade_continua_iirh_zona.estado_atual.zona.modo='REFERENCIA_CONGELADA';
 const h=render(l);assert.match(h,/74,15/);assert.match(h,/Indisponível — sem leitura atual válida/);
 assert.doesNotMatch(h,/<strong[^>]*>Regulação Funcional/);
});

test('frações de qualidade/confiança e justificativa atual são mostradas sem multiplicação incorreta',()=>{
 const l=leitura(); const atual=l.disponibilidade_continua_iirh_zona.estado_atual;
 atual.iirh.registro.confianca=.4; atual.iirh.registro.qualidade=1;
 atual.zona.registro={codigo:'ZI',estado:'PROVISORIA',motivo:'Faixa vigente 35–64,9999',fontes:['polar'],calculado_em:'2026-10-01T12:00:00Z',versao_do_calculo:'contrato-sintetico'};
 const h=render(l);for(const s of ['40%','100%','Faixa vigente','polar','2026-10-01T12:00:00Z','contrato-sintetico','Sem intervalos de fase'])assert.ok(h.includes(s),s);
 assert.doesNotMatch(h,/0[.,]4%/);
});
