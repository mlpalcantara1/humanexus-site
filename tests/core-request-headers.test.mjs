import assert from "node:assert/strict";
import test from "node:test";
import { cabecalhosDaRequisicaoAoNucleo } from "../lib/core-request-headers.ts";

test("preserva a organização de um objeto Headers na consulta autenticada", () => {
  const recebidos = new Headers();
  recebidos.set("x-humanexus-organization-id", "organizacao-alfa");
  const cabecalhos = cabecalhosDaRequisicaoAoNucleo(
    recebidos,
    "token-sintetico",
    "protecao-sintetica"
  );
  assert.equal(cabecalhos.get("x-humanexus-organization-id"), "organizacao-alfa");
  assert.equal(cabecalhos.get("authorization"), "Bearer token-sintetico");
  assert.equal(cabecalhos.get("x-vercel-protection-bypass"), "protecao-sintetica");
  assert.equal(cabecalhos.get("content-type"), "application/json");
});

test("mantém cabeçalhos simples e permite sobrescrever o tipo explicitamente", () => {
  const cabecalhos = cabecalhosDaRequisicaoAoNucleo(
    { "content-type": "application/octet-stream", "x-contexto": "teste" },
    undefined,
    ""
  );
  assert.equal(cabecalhos.get("content-type"), "application/octet-stream");
  assert.equal(cabecalhos.get("x-contexto"), "teste");
  assert.equal(cabecalhos.has("authorization"), false);
});
