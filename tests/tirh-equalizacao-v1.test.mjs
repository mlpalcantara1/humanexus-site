import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const cockpit = fs.readFileSync("components/cockpit-operacional-vivo.tsx", "utf8");
const operacao = fs.readFileSync("components/operacao-homologacao.tsx", "utf8");
const sinteseValidacao = fs.readFileSync("components/sintese-validacao-tirh-v1.tsx", "utf8");
const proxy = fs.readFileSync("app/api/operacao-homologacao/route.ts", "utf8");
const estilos = fs.readFileSync("app/globals.css", "utf8");
const design = fs.readFileSync("app/humanexus-design-system.css", "utf8");

test("Cockpit consome a síntese TIRH V1 do núcleo sem calcular ciência local", () => {
  assert.match(sinteseValidacao, /leituraCientifica\.tirh_operacional_v1/);
  assert.match(sinteseValidacao, /tirhV1Persistida\.sintese/);
  assert.match(sinteseValidacao, /registroDoCampo\.valor/);
  assert.match(sinteseValidacao, /registroDoCampo\.fontes/);
  assert.match(cockpit, /Configuração emergente multivetorial estruturada/);
  assert.doesNotMatch(cockpit, /IIRH_OP_V1\s*=/);
  assert.match(cockpit, /o IIRH isoladamente não determina Zona/);
});

test("validação profissional usa um quadro pós-sessão versionado e auditável", () => {
  assert.match(sinteseValidacao, /Validação Profissional · quadro único pós-sessão/);
  assert.match(sinteseValidacao, /VALIDAR/);
  assert.match(sinteseValidacao, /AJUSTAR/);
  assert.match(sinteseValidacao, /MANTER_PENDENTE/);
  assert.match(sinteseValidacao, /chaveIdempotenteDocumental/);
  assert.doesNotMatch(sinteseValidacao, /crypto\.randomUUID\(\)/);
  assert.match(operacao, /validar-claim-tirh-v1/);
  assert.match(proxy, /\/tirh-v1\/validacoes/);
});

test("Síntese e validação V1 ficam visíveis no modo científico sem duplicar elegibilidade", () => {
  assert.match(sinteseValidacao, /if \(!Object\.keys\(tirhV1\)\.length\) return null/);
  assert.match(sinteseValidacao, /className="hx-tirh-v1-claims"[\s\S]{0,180}\{claimsPendentesTirhV1\.map/);
  assert.doesNotMatch(sinteseValidacao, /className="hx-tirh-v1-claims"[\s\S]{0,180}\{claimsTirhV1\.map/);
  assert.match(sinteseValidacao, /data-eligible-claims-count=\{claimsPendentesTirhV1\.length\}/);
  const bloqueioIncondicional = design.match(
    /\/\* A superfície operacional não replica documentação científica\.[\s\S]*?\n\}/
  )?.[0] ?? "";
  assert.ok(bloqueioIncondicional);
  assert.doesNotMatch(bloqueioIncondicional, /#hx-inspection-level/);
  assert.match(design, /\[data-hx-experience-mode="executivo"\] \.hx-live-cockpit > #hx-inspection-level/);
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
  assert.doesNotMatch(operacao, /vetores \|\| 10/);
  assert.match(proxy, /rro_legacy: registrosRro/);
});

test("Inspeção, Replay, Resultante e Relatório usam uma única projeção TIRH V1", () => {
  assert.match(operacao, /function projecaoCanonicaTirhV1/);
  assert.match(operacao, /const respostaPersistida = objeto\(estado\.tirh_v1\)/);
  assert.match(operacao, /const sintesePersistida = objeto\(respostaPersistida\.sintese\)/);
  assert.match(operacao, /vetoresMomentaneosDaProjecaoV1\(estado\)/);
  assert.match(operacao, /Estado da materialização vetorial/);
  assert.match(operacao, /Vetores momentâneos V1 · \{vetoresReplay\.length\}\/9 projetados/);
  assert.match(operacao, /Resultante estruturada/);
  assert.match(operacao, /Contrato ·/);
  assert.doesNotMatch(operacao, /Vetores · não registrados nesta sessão/);
  assert.doesNotMatch(operacao, /Resultante · não registrada nesta sessão/);
});

test("Resultante V1 estruturada não exige magnitude escalar", () => {
  assert.match(operacao, /Estado estrutural/);
  assert.match(operacao, /Magnitude escalar/);
  assert.match(operacao, /NÃO APLICÁVEL NA TIRH V1/);
  assert.match(operacao, /possuiProjecaoV1/);
});

test("relatório V1 usa somente a projeção canônica e não reativa IIRH legacy", () => {
  assert.match(operacao, /PROJEÇÃO CANÔNICA TIRH V1/);
  assert.match(operacao, /IIRH:/);
  assert.match(operacao, /NÃO CALCULÁVEL/);
  assert.match(operacao, /Magnitude escalar: <strong>NÃO APLICÁVEL NA TIRH V1/);
  assert.doesNotMatch(operacao, /IIRH LEGACY:|valorIirhDoRelatorioLegacy/);
});

test("quadro científico permanece responsivo nas larguras autorais", () => {
  assert.match(estilos, /\.hx-tirh-v1-summary__primary/);
  assert.match(estilos, /@media \(max-width: 820px\)/);
  assert.match(estilos, /grid-template-columns: 1fr/);
  assert.doesNotMatch(estilos, /overflow-x:\s*scroll/);
});
