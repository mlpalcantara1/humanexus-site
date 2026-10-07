import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
import ts from "typescript";
const source = readFileSync(new URL("../lib/eeg-quality-policy-presentation.ts", import.meta.url),"utf8");
const code = ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const mod={exports:{}}; new Function("module","exports",code)(mod,mod.exports);
const {textoDoCriterioEeg,textoDaReavaliacaoEeg}=mod.exports;
test("apresenta mínimo inclusivo recebido do Núcleo, não deduz pelo contato",()=>{
  for(const qualidade of [.07,.08,.17]) {
    const text=textoDoCriterioEeg({qualidade_eeg_minima_inclusiva:.08,qualidade_eeg_atual:qualidade,qualidade_de_contato_atual:1,politica:"POLITICA-OPERACIONAL-EPOC-X-1.1"});
    assert.match(text,/≥8% \(inclusive\)/);
    assert.doesNotMatch(text,/30%|abaixo/);
  }
  assert.match(textoDoCriterioEeg({}),/não informado/);
});
test("reprocessamento fica histórico e distinto de aquisição atual",()=>{
  assert.deepEqual(textoDaReavaliacaoEeg({}),[]);
  const text=textoDaReavaliacaoEeg({reprocessamento_eeg:{politica:"1.1",limiar:.08,pacotes:{POW:{elegiveis:517,recebidos:680}},janelas_elegiveis:470,janelas_avaliadas:681,inicio:"21:32",fim:"21:46",reprocessado_em:"22:50",efeito:"Resultante indisponível: faltam evidências da tarefa."}}).join(" ");
  assert.match(text,/517 de 680/); assert.match(text,/não é leitura atual/); assert.match(text,/SEM VALIDADE CLÍNICA/);
});
test("tela e PDF utilizam a mesma apresentação da revisão",()=>{
  for(const file of ["../components/operacao-homologacao.tsx","../lib/tirh-report-document.ts"]){
    assert.match(readFileSync(new URL(file,import.meta.url),"utf8"),/textoDaReavaliacaoEeg/);
  }
});
