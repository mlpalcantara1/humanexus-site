import assert from "node:assert/strict";
import test from "node:test";
import { cabecalhosDaSessaoDeGravacao } from "../lib/gravacao-session-scope.ts";

test("administrador inicia captura no escopo da sessão, independente da organização de login", () => {
  const contexto = {sessao: {identificador: "sessao-genesis", identificador_da_organizacao: "instituto"}};
  assert.equal(cabecalhosDaSessaoDeGravacao(contexto, "sessao-genesis").get("x-humanexus-organization-id"), "instituto");
});
test("não encaminha comandos com contexto de outra sessão ou organização ausente", () => {
  for (const contexto of [null, {}, {sessao: {identificador:"outra", identificador_da_organizacao:"instituto"}}, {sessao: {identificador:"sessao-genesis"}}]) {
    assert.throws(() => cabecalhosDaSessaoDeGravacao(contexto, "sessao-genesis"));
  }
});
