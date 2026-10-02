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
function leitura(estado='PARCIAL',valor=74.15,modo='ATUAL') {
 return {disponibilidade_continua_iirh_zona:{autoridade:'NUCLEO_HUMANEXUS',portal_autorizado_a_calcular:false,zona_derivada_do_iirh:false,
 estado_atual:{iirh:{modo,registro:{estado,valor,cobertura:.11,confianca:21.7,qualidade:90}},zona:{modo,registro:{codigo:'ZA',estado:'PROVISORIA'}}}}};
}
const render=(l,historico=false)=>renderToStaticMarkup(React.createElement(CockpitIirhZonaTemporal,{leitura:l,historico}));
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
