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

test("V1 separa RRD do registro histórico legado e não o promove automaticamente", () => {
  assert.match(cockpit, /RRD · Rota Regulatória Dominante candidata/);
  assert.match(cockpit, /Registro histórico legado de rota · fora do contrato V1/);
  assert.match(cockpit, /Não é promovido automaticamente a RRD/);
});

test("regressão canônica elimina RRO ativo, decisões autorais pendentes e denominador momentâneo dez", () => {
  const navegacao = fs.readFileSync("components/platform-navigation.tsx", "utf8");
  assert.doesNotMatch(navegacao, /ARR · RRO · NRA/);
  assert.doesNotMatch(operacao, /ARR → RRO → NRA|Reorganização da Rota Operacional — RRO/);
  assert.doesNotMatch(cockpit, /vetor\.decisao_autoral_pendente/);
  assert.match(cockpit, /codigoVetorial\(definicao\) !== "VEV"/);
  assert.match(cockpit, /radarVetorial\.length === 9/);
  assert.match(cockpit, /modoHistorico && Object\.keys\(tirhV1\)\.length > 0/);
  assert.match(operacao, /ARR → RRD → GRI \/ CRL → NRA/);
});

test("quadro científico permanece responsivo nas larguras autorais", () => {
  assert.match(estilos, /\.hx-tirh-v1-summary__primary/);
  assert.match(estilos, /@media \(max-width: 820px\)/);
  assert.match(estilos, /grid-template-columns: 1fr/);
  assert.doesNotMatch(estilos, /overflow-x:\s*scroll/);
});
