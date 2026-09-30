import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const require=createRequire(import.meta.url);
function carregar(path) {
 const u=new URL('../'+path,import.meta.url);
 const js=ts.transpileModule(readFileSync(u,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
 const m={exports:{}};new Function('require','module','exports',js)(n=>n.startsWith('@/')?carregar(n.slice(2)+(existsSync(new URL('../'+n.slice(2)+'.ts',import.meta.url))?'.ts':'.tsx')):require(n),m,m.exports);return m.exports;
}
const p=carregar('lib/registro-local-protegido.ts');
const {novoRascunho,chaveDoRegistro}=carregar('lib/registro-integrado.ts');
function storage(){const s={};Object.defineProperties(s,{getItem:{value:k=>s[k]??null},setItem:{value:(k,v)=>s[k]=v},removeItem:{value:k=>delete s[k]}});return s;}
test('logout mantém ciphertext recuperável somente pelo titular e no contexto original',async()=>{
 const a=await p.importarChave('profissional-teste-A','a'.repeat(64)),b=await p.importarChave('profissional-teste-B','b'.repeat(64));
 const contexto=chaveDoRegistro('org-teste','participante-teste','sessao-teste','profissional-teste-A');
 const r=novoRascunho();r.texto='FIXTURE DE TESTE — observação não enviada';r.fila.push({acao:'NOTA',chave:'chave-idempotente-teste',texto:r.texto});
 const s=storage(),id=p.PREFIXO_CIFRADO+contexto+':aba-teste';
 await p.salvarProtegido(s,id,contexto,a,r);s.setItem('humanexus-cache','dados de teste');p.limparAposLogout(s);
 assert.equal(s.getItem('humanexus-cache'),null);assert.doesNotMatch(s.getItem(id),/observação|NOTA/);
 assert.deepEqual(await p.decifrar(a,contexto,s.getItem(id)),r);
 await assert.rejects(()=>p.decifrar(b,contexto,s.getItem(id)));
 await assert.rejects(()=>p.decifrar(a,contexto+'outro',s.getItem(id)));
});
test('migração de diário preserva original até confirmar cópia cifrada e não abre outro titular',async()=>{
 const a=await p.importarChave('A','c'.repeat(64)),s=storage();
 const contexto=chaveDoRegistro('o','p','s','A'),id=contexto+':aba';const r=novoRascunho();r.texto='fixture legado';s.setItem(id,JSON.stringify(r));
 await p.protegerLegados(s,'B',a);assert.ok(s.getItem(id));
 await p.protegerLegados(s,'A',a);assert.equal(s.getItem(id),null);assert.deepEqual(await p.decifrar(a,contexto,s.getItem(p.PREFIXO_CIFRADO+id)),r);
});
test('instrumentos IIRH e Zona permanecem identificados sem leitura nem faixas substitutas',()=>{
 const {CockpitIirhZonaTemporal}=carregar('components/cockpit-iirh-zona-temporal.tsx');const h=renderToStaticMarkup(React.createElement(CockpitIirhZonaTemporal,{leitura:{},historico:false}));
 for(const t of ['IIRH atual','Zona atual','Aguardando primeira leitura real','Faixas visuais indisponíveis','Confiança:','Transições:']) assert.ok(h.includes(t),t);
 assert.doesNotMatch(h,/<rect/);
});
test('Replay e longitudinal apresentam distribuição canônica e provisoriedade sem recomputar',()=>{
 const {DistribuicaoTemporalCanonica}=carregar('components/distribuicao-temporal-canonica.tsx');const d={versao:'TESTE',tempo_por_zona_segundos:{ZA:12,ZI:3},zona_predominante:'ZA',inclui_leituras_provisorias:true,emissoes:[{identificador:'emissao-teste',fase:'PRE',zona:{estado:'PROVISORIA'}}]};
 const h=renderToStaticMarkup(React.createElement(DistribuicaoTemporalCanonica,{titulo:'Replay de teste',distribuicao:d}));assert.match(h,/12 s válidos/);assert.match(h,/inclui leituras provisórias/);assert.match(h,/PROVISORIA/);
 const vazio=renderToStaticMarkup(React.createElement(DistribuicaoTemporalCanonica,{titulo:'Histórico de teste',distribuicao:{}}));assert.doesNotMatch(vazio,/Zona predominante no tempo válido/);
});

test('falha de armazenamento mantém cópia cifrada recuperável, sem confirmar gravação', async()=>{
 const a=await p.importarChave('titular-teste','d'.repeat(64));const contexto=chaveDoRegistro('o','p','s','titular-teste');
 const r=novoRascunho();r.texto='fixture pendente com armazenamento cheio';
 const cheio={setItem(){throw new Error('quota simulada exclusivamente no teste');}};
 await assert.rejects(()=>p.salvarProtegido(cheio,'diario-falhou',contexto,a,r));
 await assert.rejects(()=>p.aguardarPersistencia());
 const copia=p.pendenciasParaCopia().find(x=>x.id==='diario-falhou');assert.ok(copia);
 assert.deepEqual(await p.decifrar(a,contexto,copia.cifrado),r);
 assert.doesNotMatch(copia.cifrado,/armazenamento cheio/);
});


test('armazenamento bloqueado não impede saída nem conserva chave do profissional em memória', async()=>{
 await p.importarChave('titular-saida-teste','e'.repeat(64));
 assert.equal(p.limparAposLogout(()=>{throw new Error('SecurityError exclusivamente de teste');}),false);
 const anterior=globalThis.fetch;let consultouAutenticacao=false;
 globalThis.fetch=async()=>{consultouAutenticacao=true;return {ok:false};};
 try { await assert.rejects(()=>p.obterChave('titular-saida-teste'));assert.equal(consultouAutenticacao,true); }
 finally {globalThis.fetch=anterior;}
 const bloqueado=new Proxy({}, {ownKeys(){throw new Error('armazenamento bloqueado exclusivamente de teste');}});
 assert.equal(p.limparAposLogout(bloqueado),false);
});
