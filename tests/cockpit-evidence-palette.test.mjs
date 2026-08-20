import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const cockpit = fs.readFileSync(new URL("../components/cockpit-operacional-vivo.tsx", import.meta.url), "utf8");
const rota = fs.readFileSync(new URL("../app/api/operacao-homologacao/route.ts", import.meta.url), "utf8");
const estilos = fs.readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

test("captura um clique sem nota automatica", () => {
  assert.match(cockpit, /Um clique durante a execu/);
  assert.match(cockpit, /Nenhum clique cria nota/);
  assert.match(cockpit, /capturarEventoObjetivo\("ERRO"\)/);
});

test("qualificacao explicita usa contrato oficial", () => {
  assert.match(cockpit, /Âncora oficial/);
  assert.match(cockpit, /a âncora qualifica a manifestação observada, não atribui nota ao vetor/);
  assert.match(cockpit, /Confiança/);
  assert.match(cockpit, /Qualidade/);
  assert.match(cockpit, /NAO_APLICAVEL/);
  assert.match(cockpit, /NAO_OBSERVADA/);
  assert.match(cockpit, /SEM_OPORTUNIDADE_VALIDA/);
  assert.match(cockpit, /EVIDENCIA_INSUFICIENTE/);
  assert.match(cockpit, /AUSENTE/);
  assert.match(cockpit, /Oportunidade válida/);
  assert.match(cockpit, /0 · Não manifestado/);
  assert.match(cockpit, /4 · Robusta/);
  assert.doesNotMatch(cockpit, /selecionar polaridade/i);
  assert.match(cockpit, /Qualificar e preservar/);
});

test("ponte API existe", () => {
  assert.match(rota, /evidencias-profissionais/);
  assert.match(rota, /evidencia-profissional/);
});

test("tipografia da paleta foi ampliada na regra original sem camada de override", () => {
  assert.doesNotMatch(estilos, /HX_EVIDENCIA_PROFISSIONAL_TIPOGRAFIA_V2/);
  assert.match(estilos, /font:400 22px\/1\.2 Georgia,serif/);
  assert.match(estilos, /font:12px\/1\.5 Arial,Helvetica,sans-serif/);
  assert.match(estilos, /\.hx-evidence-palette__groups button\{[^}]*font:12px\/1\.4/);
  assert.match(estilos, /\.hx-evidence-qualification select,[^{]+\{[^}]*font-size:12px/);
});

test("tipografia da paleta permanece isolada da plataforma", () => {
  const inicio = estilos.indexOf(".hx-evidence-palette{");
  const fim = estilos.indexOf("@media(max-width:900px)", inicio);
  const bloco = estilos.slice(inicio, fim);
  assert.ok(inicio >= 0 && fim > inicio);
  assert.doesNotMatch(bloco, /(?:^|})\s*(?:body|html|button|select|label)\s*[,{]/);
  assert.doesNotMatch(bloco, /\.hx-app|\.hx-module|\.hx-cockpit(?!-operacional)/);
});
