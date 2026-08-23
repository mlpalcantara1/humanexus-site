import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const ler = (caminho) => fs.readFileSync(caminho, "utf8");
const cockpit = ler("components/cockpit-operacional-vivo.tsx");
const operacao = ler("components/operacao-homologacao.tsx");
const gestao = ler("components/gestao-operacional.tsx");
const lab = ler("components/modulo-integrado.tsx");
const estilos = ler("app/humanexus-design-system.css");

test("visão Geral mantém Síntese e Validação fora da camada científica recolhida", () => {
  const sintese = cockpit.indexOf("<SinteseValidacaoTirhV1");
  const cadeia = cockpit.indexOf('id="hx-inspection-level"');
  assert.ok(sintese >= 0);
  assert.ok(cadeia >= 0);
  assert.ok(sintese < cadeia);
  assert.doesNotMatch(
    cockpit.slice(cadeia, cockpit.indexOf("hx-live-scientific-chain__rail", cadeia)),
    /<SinteseValidacaoTirhV1/
  );
});

test("visão Técnica explícita restaura seus painéis no modo executivo", () => {
  assert.match(operacao, /hx-cockpit-panel hx-cockpit-panel--technical/);
  assert.match(estilos, /hx-cockpit-panel--technical \.hx-technical-stack[\s\S]*display: grid !important/);
  assert.match(estilos, /hx-cockpit-panel--technical \.hx-telemetry[\s\S]*display: block !important/);
  assert.match(estilos, /hx-cockpit-panel--technical \.hx-technical-details[\s\S]*display: block !important/);
});

test("métricas de gestão não apresentam coleção não carregada como zero real", () => {
  assert.match(gestao, /modulo === "organizacoes"[\s\S]*painel_organizacional[\s\S]*totais/);
  assert.match(gestao, /typeof valor === "number" \? valor : "—"/);
  assert.match(gestao, /modulo === "configuracoes"[\s\S]*contratos: dados\.contratos\.length/);
  assert.doesNotMatch(gestao, /participantes: dados\?\.participantes\.length \?\? 0/);
});

test("LAB contextualiza RRO apenas como registro histórico fora do contrato ativo", () => {
  assert.match(lab, /ARR \/ RRO \/ NRA · registro histórico legado/);
  assert.match(lab, /RRO NÃO ATIVO NA TIRH V1 · FONTE HISTÓRICA PRESERVADA/);
});
