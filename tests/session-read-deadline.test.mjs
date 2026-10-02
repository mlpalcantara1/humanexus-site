import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { lerSessaoComPrazo } from "../lib/session-read-deadline.ts";

test("a rota não aguarda indefinidamente transporte que ignora abort", async () => {
  let signal;
  await assert.rejects(lerSessaoComPrazo(s => {
    signal = s;
    return new Promise(() => {});
  }, 10), /HXP_SESSION_READ_TIMEOUT/);
  assert.equal(signal.aborted, true);
});

test("prazo inclui corpo pendente após os cabeçalhos", async () => {
  await assert.rejects(lerSessaoComPrazo(async () => {
    const resposta = { status: 200, json: () => new Promise(() => {}) };
    return await resposta.json();
  }, 10), /HXP_SESSION_READ_TIMEOUT/);
});

test("resultado tardio não autentica e a consulta seguinte pode recuperar", async () => {
  let resolver;
  let aplicacoes = 0;
  await assert.rejects(lerSessaoComPrazo(() => new Promise(r => { resolver = r; }), 10)
    .then(() => { aplicacoes++; }), /TIMEOUT/);
  resolver({ identificador: "tardio" });
  await new Promise(r => setTimeout(r, 5));
  assert.equal(aplicacoes, 0);
  assert.deepEqual(await lerSessaoComPrazo(async () => ({ identificador: "atual" })),
    { identificador: "atual" });
});

test("rejeição de acesso e falha de rede preservam a causa original", async () => {
  for (const erro of [Object.assign(new Error("negado"), { status: 401 }), new TypeError("rede")]) {
    await assert.rejects(lerSessaoComPrazo(async () => { throw erro; }), e => e === erro);
  }
});

test("consultas concorrentes não compartilham cancelamento nem resultado", async () => {
  let sinalLento;
  let sinalRapido;
  const resultados = await Promise.allSettled([
    lerSessaoComPrazo(signal => {
      sinalLento = signal;
      return new Promise(() => {});
    }, 10),
    lerSessaoComPrazo(async signal => {
      sinalRapido = signal;
      return { identificador: "contexto-independente" };
    }, 10)
  ]);
  assert.equal(resultados[0].status, "rejected");
  assert.match(resultados[0].reason.message, /HXP_SESSION_READ_TIMEOUT/);
  assert.deepEqual(resultados[1], {
    status: "fulfilled", value: { identificador: "contexto-independente" }
  });
  assert.notEqual(sinalLento, sinalRapido);
  assert.equal(sinalLento.aborted, true);
  assert.equal(sinalRapido.aborted, false);
});

test("rejeição tardia do transporte não impede recuperação após timeout", async () => {
  let rejeitarTransporte;
  await assert.rejects(lerSessaoComPrazo(() => new Promise((_, rejeitar) => {
    rejeitarTransporte = rejeitar;
  }), 10), /HXP_SESSION_READ_TIMEOUT/);
  rejeitarTransporte(new TypeError("transporte encerrou depois do prazo"));
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(await lerSessaoComPrazo(async () => "recuperado"), "recuperado");
});

test("integração limita a leitura autenticada e não converte timeout em logout", () => {
  const core = readFileSync(new URL("../lib/humanexus-core.ts", import.meta.url), "utf8");
  const sessao = readFileSync(new URL("../lib/portal-session.ts", import.meta.url), "utf8");
  const trecho = core.slice(core.indexOf("export async function obterUsuarioDoNucleo"), core.indexOf("export async function renovarNoNucleo"));
  assert.match(trecho, /lerSessaoComPrazo/);
  assert.match(trecho, /\{ signal \}/);
  assert.match(trecho, /tentativas: 1/);
  assert.match(trecho, /504/);
  assert.match(sessao, /erro.status === 401\) return null/);
  assert.doesNotMatch(trecho, /console\.(?:warn|log)\([^;]*(?:token,|usuario,|csrf)/);
});
