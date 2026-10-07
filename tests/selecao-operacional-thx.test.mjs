import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { prepararSelecaoOperacionalThx } from "../lib/selecao-operacional-thx.ts";

const sessao = { identificador: "sessao-teste", identificador_do_participante: "teste" };
const vinculos = [{ codigo_do_ctr: "CTR-OFICIAL", codigo_do_thx: "THX-OFICIAL" }];
const preparar = (p = "teste", s = sessao, prof = "responsavel", ctr = "CTR-OFICIAL", thx = "THX-OFICIAL", j = "  Seleção técnica de teste.  ") =>
  prepararSelecaoOperacionalThx(p, s, vinculos, prof, ctr, thx, j);

test("seleção explícita preserva o par e não envia comando de fase ou resultado", () => {
  assert.deepEqual(preparar(), { identificador_da_sessao: "sessao-teste", dados: {
    identificador_do_profissional: "responsavel", codigo_do_ctr: "CTR-OFICIAL",
    codigo_do_thx: "THX-OFICIAL", justificativa: "Seleção técnica de teste."
  }});
});

test("não escolhe sessão automaticamente nem mistura participantes", () => {
  assert.throws(() => preparar("outro"), /deste participante/);
  assert.throws(() => preparar("teste", {}), /explicitamente/);
});

test("não inventa par, justificativa ou responsável", () => {
  assert.throws(() => preparar("teste", sessao, ""), /responsável/);
  assert.throws(() => preparar("teste", sessao, "responsavel", "CTR-OFICIAL", "OUTRO"), /validado/);
  assert.throws(() => preparar("teste", sessao, "responsavel", "CTR-OFICIAL", "THX-OFICIAL", " "), /justificativa/);
});

test("rota preserva autenticação, CSRF e organização e encaminha ao endpoint existente", () => {
  const rota = readFileSync(new URL("../app/api/gestao-operacional/route.ts", import.meta.url), "utf8");
  assert.match(rota, /acao === "vincular-ctr-thx-operacional"/);
  assert.match(rota, /\/vinculo-operacional-ctr-thx/);
  assert.match(rota, /exigirCsrf\(request/);
  assert.match(rota, /"x-humanexus-organization-id": organizacao/);
  assert.match(rota, /requisitarNucleoAutenticado\(/);
});

test("apresentação não converte seleção explícita em recomendação automática ou execução", () => {
  const componente = readFileSync(new URL("../components/gestao-operacional.tsx", import.meta.url), "utf8");
  assert.match(componente, /SELECAO_PROFISSIONAL_REGISTRADA/);
  assert.match(componente, /Sem recomendação\s+científica automática/);
  assert.match(componente, /\.estado !== "SELECAO_PROFISSIONAL_REGISTRADA"\)\.map/);
  const seletor = componente.slice(componente.indexOf("async function registrarSelecaoOperacionalThx"),
    componente.indexOf("async function prepararSugestaoThx"));
  assert.doesNotMatch(seletor, /INICIAR_|materializar-sugestao|\.at\(0\)/);
});
