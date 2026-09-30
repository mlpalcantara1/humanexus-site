import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import ts from 'typescript';
const require = createRequire(import.meta.url);
class ErroDoNucleo extends Error { constructor(message,status,codigo='ERRO_DE_SEGURANCA',correlacao='correlacao-teste-local') { super(message); Object.assign(this,{status,codigo,correlacao}); } }
function carregar(contexto) {
 const cache=new Map();
 function load(path){
  if(cache.has(path))return cache.get(path);
  const source=readFileSync(new URL('../'+path,import.meta.url),'utf8');
  const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const mod={exports:{}};
  function req(name){
   if(name==='next/headers')return {cookies:async()=>({get:k=>contexto.cookies[k]?{value:contexto.cookies[k]}:undefined})};
   if(name==='next/server')return {NextResponse:{json:(body,opts={})=>({body,status:opts.status??200,headers:opts.headers??{},deleted:[],cookies:{delete:k=>contexto.deleted.push(k)}})}};
   if(name==='@/lib/humanexus-core')return {ErroDoNucleo,alterarSenhaNoNucleo:async()=>{contexto.calls++;if(contexto.error)throw contexto.error;}};
   if(name==='@/lib/portal-session')return {COOKIE_SESSAO:'humanexus_sessao',COOKIE_CSRF:'humanexus_csrf'};
   if(name.startsWith('@/'))return load(name.slice(2)+'.ts');return require(name);
  }
  new Function('require','module','exports',js)(req,mod,mod.exports);cache.set(path,mod.exports);return mod.exports;
 }
 return load('app/api/sessao/alterar-senha/route.ts');
}
async function executar({error,cookies,headers,body}={}){
 const c={error,cookies:cookies??{humanexus_sessao:'TOKEN_SINTETICO_NAO_REAL',humanexus_csrf:'CSRF_SINTETICO'},deleted:[],calls:0};
 const request=new Request('http://127.0.0.1:43982/api/sessao/alterar-senha',{method:'POST',headers:headers??{'origin':'http://127.0.0.1:43982','host':'127.0.0.1:43982','x-humanexus-csrf':'CSRF_SINTETICO','content-type':'application/json'},body:body??JSON.stringify({senhaAtual:'SEGREDO_FIXTURE_ATUAL',novaSenha:'SEGREDO_FIXTURE_NOVO'})});
 const logs=[];const before=console.error;console.error=(...a)=>logs.push(a.join(' '));
 let r;try{r=await carregar(c).POST(request);}finally{console.error=before;}
 const publico=JSON.stringify({body:r.body,logs});for(const segredo of ['SEGREDO_FIXTURE','TOKEN_SINTETICO','CSRF_SINTETICO'])assert.ok(!publico.includes(segredo));
 return {r,c,logs};
}
test('senha atual incorreta tem motivo específico, conserva status e não remove sessão',async()=>{
 const {r,c,logs}=await executar({error:new ErroDoNucleo('Senha atual inválida.',401)});assert.equal(r.status,401);assert.equal(r.body.erro.codigo,'SENHA_ATUAL_INVALIDA');assert.match(r.body.erro.mensagem,/senha atual informada/);assert.deepEqual(c.deleted,[]);assert.equal(logs.length,1);
});
test('política canônica de dez caracteres é explicada sem relaxamento',async()=>{
 const {r}=await executar({error:new ErroDoNucleo('A senha local deve possuir ao menos dez caracteres.',400,'ERRO_DE_VALIDACAO')});assert.equal(r.status,400);assert.equal(r.body.erro.codigo,'NOVA_SENHA_FORA_DA_POLITICA');assert.match(r.body.erro.mensagem,/dez caracteres/);
});
test('sessão ausente impede chamar o Núcleo',async()=>{const {r,c}=await executar({cookies:{}});assert.equal(r.status,401);assert.equal(c.calls,0);assert.deepEqual(c.deleted,[]);});
test('CSRF e origem divergentes continuam recusados antes do proxy',async()=>{
 for(const headers of [{'origin':'http://127.0.0.1:43982','x-humanexus-csrf':'DIVERGENTE'},{'origin':'https://outro.example.test','x-humanexus-csrf':'CSRF_SINTETICO'}]){
  const {r,c}=await executar({headers});assert.equal(r.status,403);assert.equal(r.body.erro.codigo,'VALIDACAO_CSRF_FALHOU');assert.equal(c.calls,0);
 }
});
test('sessão expirada e falha de serviço não são classificadas como senha incorreta',async()=>{
 for(const status of [401,503,500]){const {r}=await executar({error:new ErroDoNucleo('detalhe interno SEGREDO_FIXTURE',status)});assert.equal(r.status,status);assert.notEqual(r.body.erro.codigo,'SENHA_ATUAL_INVALIDA');}
});
test('formulário ilegível não chega ao Núcleo',async()=>{const {r,c}=await executar({body:'{'});assert.equal(r.status,400);assert.equal(c.calls,0);});
test('sucesso encaminha para entrada e remove apenas os dois cookies previstos',async()=>{const {r,c,logs}=await executar();assert.equal(r.status,200);assert.deepEqual(r.body,{destino:'/entrar'});assert.deepEqual(c.deleted,['humanexus_sessao','humanexus_csrf']);assert.equal(c.calls,1);assert.equal(logs.length,0);});
