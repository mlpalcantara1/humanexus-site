import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const cockpit = fs.readFileSync("components/cockpit-operacional-vivo.tsx", "utf8");
const operacao = fs.readFileSync("components/operacao-homologacao.tsx", "utf8");
const proxy = fs.readFileSync("app/api/operacao-homologacao/route.ts", "utf8");
const estilos = fs.readFileSync("app/globals.css", "utf8");

test("Cockpit consome a síntese TIRH V1 do núcleo sem calcular ciência local", () => {
  assert.match(cockpit, /leituraCientifica\.tirh_operacional_v1/);
  assert.match(cockpit, /tirhV1Persistida\.sintese/);
  assert.match(cockpit, /registroDoCampo\.valor/);
  assert.match(cockpit, /registroDoCampo\.fontes/);
  assert.match(cockpit, /Configuração emergente multivetorial estruturada/);
  assert.doesNotMatch(cockpit, /IIRH_OP_V1\s*=/);
  assert.match(cockpit, /o IIRH isoladamente não determina Zona/);
});

test("validação profissional usa um quadro pós-sessão versionado e auditável", () => {
  assert.match(cockpit, /Validação Profissional · quadro único pós-sessão/);
  assert.match(cockpit, /VALIDAR/);
  assert.match(cockpit, /AJUSTAR/);
  assert.match(cockpit, /MANTER_PENDENTE/);
  assert.match(cockpit, /crypto\.randomUUID\(\)/);
  assert.match(operacao, /validar-claim-tirh-v1/);
  assert.match(proxy, /\/tirh-v1\/validacoes/);
});

test("V1 separa RRD de RRO histórico e não promove legado automaticamente", () => {
  assert.match(cockpit, /RRD · Rota Regulatória Dominante candidata/);
  assert.match(cockpit, /RRO · registro histórico separado do contrato V1/);
  assert.match(cockpit, /Não é promovido automaticamente a RRD/);
});

test("quadro científico permanece responsivo nas larguras autorais", () => {
  assert.match(estilos, /\.hx-tirh-v1-summary__primary/);
  assert.match(estilos, /@media \(max-width: 820px\)/);
  assert.match(estilos, /grid-template-columns: 1fr/);
  assert.doesNotMatch(estilos, /overflow-x:\s*scroll/);
});
