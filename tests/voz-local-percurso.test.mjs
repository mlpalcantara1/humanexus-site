// Fixtures exclusivamente técnicas. Não medem fidelidade de fala humana.
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const origem=new URL('../lib/voz-local.ts',import.meta.url);
function motorFixture(taxa=48000){
 const timers=new Map();let timerId=0,node,worker,paradas=0,fechados=0;
 const track={label:'MICROFONE FIXTURE — TESTE',getSettings:()=>({sampleRate:24000,channelCount:1}),stop:()=>paradas++,addEventListener:(nome,fn)=>track[nome]=fn};
 const contexto={sampleRate:taxa,state:'running',resume:async()=>{},close:async()=>{fechados++;contexto.state='closed';},audioWorklet:{addModule:async url=>{contexto.moduloCarregado=url;}},createGain:()=>({gain:{value:1},connect(){}}),createMediaStreamSource:()=>({connect(){}}),destination:{}};
 class WorkerFixture{constructor(url){worker=this;this.url=url;this.mensagens=[];}postMessage(x){this.mensagens.push(x);}terminate(){this.terminado=true;}emit(data){return this.onmessage?.({data});}}
 class NodeFixture{constructor(){node=this;this.port={mensagens:[],postMessage:x=>this.port.mensagens.push(x)};}connect(){}disconnect(){} emit(data){this.port.onmessage?.({data});}}
 const exports={};const sandbox={exports,module:{exports},Float32Array,Error,Worker:WorkerFixture,AudioWorkletNode:NodeFixture,AudioContext:function(){return contexto;},navigator:{mediaDevices:{getUserMedia:async()=>({getTracks:()=>[track],getAudioTracks:()=>[track]})}},setTimeout:fn=>{timers.set(++timerId,fn);return timerId;},clearTimeout:id=>timers.delete(id)};
 sandbox.window=sandbox;vm.runInNewContext(ts.transpileModule(readFileSync(origem,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,sandbox);
 const estados=[],erros=[],textos=[],obtidos=[],diagnosticos=[];let finais=0;
 return {api:exports,estados,erros,textos,obtidos,diagnosticos,contexto,track,timers,get node(){return node;},get worker(){return worker;},get finais(){return finais;},get paradas(){return paradas;},get fechados(){return fechados;},async iniciar(){return exports.iniciarTranscricaoLocal({estado:x=>estados.push(x),erro:x=>erros.push(x),texto:x=>textos.push(x),obtido:x=>obtidos.push(x),diagnostico:x=>diagnosticos.push(x),fim:()=>finais++});}};
}
function worklet(codigo){let Classe;const enviados=[];vm.runInNewContext(codigo,{Float32Array,AudioWorkletProcessor:class{constructor(){this.port={postMessage:x=>enviados.push(x)};}},registerProcessor:(_nome,classe)=>Classe=classe});return {node:new Classe(),enviados};}
test('reprodução do defeito anterior: encerramento perdia o bloco parcial; protocolo novo o entrega uma vez',()=>{
 const anterior=execFileSync('git',['show','69de1f99892fbe361cccbc4d76ea00ca80f4f3d1:public/voz-local/captura.worklet.js'],{encoding:'utf8'});
 const velho=worklet(anterior);velho.node.process([[new Float32Array(2176).fill(.25)]]);
 assert.equal(velho.enviados.reduce((n,b)=>n+b.length,0),2048); // 128 amostras realmente retidas antes do disconnect antigo.
 const novo=worklet(readFileSync(new URL('../public/voz-local/captura.worklet.js',import.meta.url),'utf8'));
 novo.node.process([[new Float32Array(2176).fill(.25)]]);novo.node.port.onmessage({data:{tipo:'ENCERRAR'}});novo.node.port.onmessage({data:{tipo:'ENCERRAR'}});
 assert.equal(novo.enviados.filter(x=>x instanceof Float32Array).reduce((n,b)=>n+b.length,0),2176);
 assert.equal(novo.enviados.filter(x=>x.tipo==='ENCERRADO').length,1);assert.ok(novo.node.buffer.every(x=>x===0));assert.equal(novo.node.process([[new Float32Array(128)]]),false);
});
test('percurso 48k preserva último bloco, origem observada e duração; não confunde taxa da entrada com contexto',async()=>{
 const f=motorFixture();const c=await f.iniciar();await f.worker.emit({tipo:'PRONTO'});
 const cacheAnterior=new Map([['/voz-local/captura.worklet.js','worklet-sem-flush'],['/voz-local/transcricao.worker.js','worker-anterior']]);
 assert.equal(cacheAnterior.has(f.contexto.moduloCarregado),false);assert.equal(cacheAnterior.has(f.worker.url),false);
 f.node.emit(new Float32Array(24000).fill(.1));c.parar();assert.equal(f.worker.mensagens.filter(x=>x.tipo==='TRANSCREVER').length,0);
 f.node.emit(new Float32Array(480).fill(.1));f.node.emit({tipo:'ENCERRADO'});c.parar();
 const envio=f.worker.mensagens.filter(x=>x.tipo==='TRANSCREVER');assert.equal(envio.length,1);assert.equal(envio[0].audio.length,8160);
 const d=f.diagnosticos.at(-1);assert.equal(d.microfone,'MICROFONE FIXTURE — TESTE');assert.equal(d.taxaEntrada,24000);assert.equal(d.taxaContexto,48000);assert.equal(d.duracaoSegundos,.51);assert.equal(d.amostrasRecebidas,24480);assert.ok(d.rms>.09);assert.equal(f.paradas,1);
 await f.worker.emit({tipo:'TEXTO',texto:'texto arbitrário da fixture, sem fala humana'});assert.equal(f.textos.length,1);assert.equal(f.finais,1);assert.match(f.estados.at(-1),/Fidelidade ainda não confirmada/);
});
test('contexto 24k converte duração correta e não cria nota a partir de música',async()=>{
 const f=motorFixture(24000);const c=await f.iniciar();await f.worker.emit({tipo:'PRONTO'});f.node.emit(new Float32Array(12000).fill(.1));c.parar();f.node.emit({tipo:'ENCERRADO'});
 assert.equal(f.worker.mensagens.at(-1).audio.length,8000);await f.worker.emit({tipo:'TEXTO',texto:'[música]'});
 assert.deepEqual(f.obtidos,['[música]']);assert.deepEqual(f.textos,[]);assert.match(f.erros.at(-1),/não produziu fala utilizável/);assert.equal(f.finais,1);
});
test('silêncio, ausência de amostras e entrada encerrada falham sem reconhecimento nem nota',async()=>{
 for(const silencio of [true,false]){const f=motorFixture();const c=await f.iniciar();await f.worker.emit({tipo:'PRONTO'});if(silencio)f.node.emit(new Float32Array(24000));c.parar();f.node.emit({tipo:'ENCERRADO'});assert.equal(f.worker.mensagens.filter(x=>x.tipo==='TRANSCREVER').length,0);assert.equal(f.textos.length,0);assert.match(f.erros.at(-1),silencio?/sem sinal suficiente/:/Nenhuma amostra/);}
 const f=motorFixture();await f.iniciar();await f.worker.emit({tipo:'PRONTO'});f.track.ended();assert.match(f.erros.at(-1),/desconectado/);assert.equal(f.finais,1);assert.equal(f.paradas,1);
});
test('ausência de confirmação do bloco final é falha explícita; cancelar não entrega resultado atrasado',async()=>{
 const f=motorFixture();const c=await f.iniciar();await f.worker.emit({tipo:'PRONTO'});f.node.emit(new Float32Array(24000).fill(.1));c.parar();[...f.timers.values()].at(-1)();assert.match(f.erros.at(-1),/último bloco/);assert.equal(f.textos.length,0);assert.equal(f.worker.terminado,true);
 const g=motorFixture();const controle=await g.iniciar();await g.worker.emit({tipo:'PRONTO'});const bloco=new Float32Array(24000).fill(.1);g.node.emit(bloco);controle.cancelar();assert.ok(bloco.every(x=>x===0));await g.worker.emit({tipo:'TEXTO',texto:'não entregar'});assert.equal(g.textos.length,0);
});
test('resultado vazio ou apenas rótulos não verbais não vira fala; texto legítimo não é substituído',()=>{
 const {api}=motorFixture();for(const x of ['','...','[música]','(Music) [aplausos]','[silêncio]'])assert.equal(api.textoDeFalaAdmissivel(x),false,x);
 for(const x of ['A tarefa envolve música.','[música] observação presente','Música'])assert.equal(api.textoDeFalaAdmissivel(x),true,x);
 assert.throws(()=>api.reamostrar16k(new Float32Array([NaN]),48000));assert.throws(()=>api.reamostrar16k(new Float32Array([.1]),NaN));
});
test('resultado aparece junto ao controle, com erro ou texto original e sem aprovação implícita',()=>{
 const codigo=ts.transpileModule(readFileSync(new URL('../components/resultado-voz-local.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
 const m={exports:{}};new Function('require','module','exports',codigo)(require,m,m.exports);
 const html=renderToStaticMarkup(React.createElement(m.exports.ResultadoVozLocal,{estado:'Falha: resultado não verbal',texto:'[música]',diagnostico:{microfone:'FIXTURE',taxaContexto:48000,amostrasRecebidas:24000,amostras16k:8000}}));
 for(const v of ['Resultado da voz local','Falha: resultado não verbal','[música]','Texto obtido pelo reconhecimento','Microfone:','48000 Hz','8000','não equivale a revisão profissional'])assert.ok(html.includes(v),v);
 assert.match(html,/<p data-portugues-preservar="true"[^>]*>\[música\]<\/p>/);
 const componente=readFileSync(new URL('../components/registro-integrado-sessao.tsx',import.meta.url),'utf8');assert.match(componente,/estado: \(m\).*setEstadoVoz/);assert.doesNotMatch(componente,/estado: \(m\).*setMensagem/);
});

test('worker executa reconhecimento em português no PCM recebido e apaga áudio em sucesso ou falha',async()=>{
 const fonte=readFileSync(new URL('../public/voz-local/transcricao.worker.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');
 for(const falhar of [false,true]){
  const mensagens=[],chamadas=[];const env={backends:{onnx:{wasm:{}}}};const self={postMessage:m=>mensagens.push(m)};
  const sandbox={self,env,Float32Array,URL,Error,pipeline:async(...config)=>{chamadas.push(config);return async(audio,opcoes)=>{chamadas.push({audio:audio.slice(),opcoes});if(falhar)throw new Error('FALHA SINTÉTICA — TESTE');return {text:'Texto livre retornado pela fixture técnica.'};};}};
  vm.runInNewContext(fonte.replace('import.meta.url',JSON.stringify('http://127.0.0.1/voz-local/transcricao.worker.js')),sandbox);
  await self.onmessage({data:{tipo:'CARREGAR'}});assert.equal(mensagens.at(-1).tipo,'PRONTO');
  const audio=new Float32Array(8000).fill(.125);await self.onmessage({data:{tipo:'TRANSCREVER',audio}});
  assert.equal(chamadas[0][1],'onnx-community/whisper-tiny');assert.equal(chamadas[0][2].revision,'ff4177021cc41f7db950912b73ea4fdf7d01d8e7');assert.equal(chamadas[0][2].device,'wasm');
  assert.equal(chamadas[1].opcoes.language,'portuguese');assert.equal(chamadas[1].opcoes.task,'transcribe');assert.equal(chamadas[1].audio[0],.125);assert.ok(audio.every(x=>x===0));
  assert.equal(mensagens.at(-1).tipo,falhar?'ERRO':'TEXTO');if(!falhar)assert.equal(mensagens.at(-1).texto,'Texto livre retornado pela fixture técnica.');
 }
});
