import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const origem = readFileSync(new URL("../lib/tirh-zone-nomenclature.ts", import.meta.url), "utf8");
const codigo = ts.transpileModule(origem, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText;
const modulo = { exports: {} };
new Function("module", "exports", codigo)(modulo, modulo.exports);
const { NOMES_DAS_ZONAS, NOMES_HISTORICOS_DAS_ZONAS, nomeDaZona,
  VERSAO_NOMENCLATURA_DAS_ZONAS } = modulo.exports;

test("quatro códigos canônicos mantidos, só o nome exibido muda", () => {
  assert.deepEqual(Object.keys(NOMES_DAS_ZONAS), ["ZO", "ZA", "ZI", "ZCF"]);
  assert.deepEqual(NOMES_DAS_ZONAS, {
    ZO: "Regulação Ótima", ZA: "Regulação Funcional",
    ZI: "Sobrecarga Regulatória", ZCF: "Desregulação"
  });
  assert.match(VERSAO_NOMENCLATURA_DAS_ZONAS, /^TIRH-ZONAS-NOMES-/);
  for (const [codigo, nome] of Object.entries(NOMES_DAS_ZONAS)) {
    assert.equal(nomeDaZona(codigo), nome);
    assert.equal(nomeDaZona(NOMES_HISTORICOS_DAS_ZONAS[codigo]), nome);
    assert.equal(nomeDaZona(codigo, true), `${nome} (antes: ${NOMES_HISTORICOS_DAS_ZONAS[codigo]})`);
  }
  assert.equal(nomeDaZona("PROVISORIA"), null);
  assert.equal(nomeDaZona("ZF"), null);
});
