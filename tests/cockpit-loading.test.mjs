import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { consultarCockpitComPrazo } from "../lib/cockpit-loading.ts";

const caminho = "/api/operacao-homologacao?organizacao=synthetic&sessao=isolated";
const aguardar = ms => new Promise(resolve => setTimeout(resolve, ms));

test("consulta real de leitura preserva método, no-store e dados", async () => {
  const retorno = await consultarCockpitComPrazo(caminho, { fetch: async (url, init) => {
    assert.equal(url, caminho);
    assert.equal(init.method, "GET");
    assert.equal(init.cache, "no-store");
    return Response.json({ sessao: "synthetic", valor: null });
  }});
  assert.deepEqual(retorno.dados, { sessao: "synthetic", valor: null });
});

test("transporte que ignora abort não mantém a consulta indefinida", async () => {
  let signal;
  await assert.rejects(consultarCockpitComPrazo(caminho, {
    timeoutMs: 10, fetch: async (_, init) => {
      signal = init.signal;
      return new Promise(() => {});
    }
  }), /carregamento do painel expirou/);
  assert.equal(signal.aborted, true);
});

test("prazo cobre corpo pendente mesmo após HTTP 200", async () => {
  await assert.rejects(consultarCockpitComPrazo(caminho, {
    timeoutMs: 10, fetch: async () => ({ status: 200, json: () => new Promise(() => {}) })
  }), /expirou/);
});

test("resposta tardia não é aplicada e uma consulta posterior recupera", async () => {
  let entregar;
  let aplicacoes = 0;
  await assert.rejects(consultarCockpitComPrazo(caminho, {
    timeoutMs: 10, fetch: () => new Promise(resolve => { entregar = resolve; })
  }).then(() => { aplicacoes++; }), /expirou/);
  entregar(Response.json({ valor: 99 }));
  await aguardar(10);
  assert.equal(aplicacoes, 0);
  const recuperada = await consultarCockpitComPrazo(caminho, {
    fetch: async () => Response.json({ valor: null, atual: false })
  });
  assert.deepEqual(recuperada.dados, { valor: null, atual: false });
});

test("troca de geração cancela leitura sem aceitar resposta antiga", async () => {
  const controlador = new AbortController();
  const consulta = consultarCockpitComPrazo(caminho, {
    signal: controlador.signal, fetch: () => new Promise(() => {})
  });
  controlador.abort("novo-contexto");
  await assert.rejects(consulta, { name: "AbortError" });
});

test("sinal já cancelado não envia requisição", async () => {
  const controlador = new AbortController();
  controlador.abort();
  let enviadas = 0;
  await assert.rejects(consultarCockpitComPrazo(caminho, {
    signal: controlador.signal, fetch: async () => { enviadas++; return Response.json({}); }
  }), { name: "AbortError" });
  assert.equal(enviadas, 0);
});

test("falha de transporte e JSON inválido não viram confirmação", async () => {
  await assert.rejects(consultarCockpitComPrazo(caminho, {
    fetch: async () => { throw new TypeError("Load failed"); }
  }), /Load failed/);
  await assert.rejects(consultarCockpitComPrazo(caminho, {
    fetch: async () => new Response("not-json", { status: 200 })
  }), SyntaxError);
});

test("consulta integral libera bloqueio no finally e oferece recuperação somente leitura", () => {
  const fonte = readFileSync(new URL("../components/operacao-homologacao.tsx", import.meta.url), "utf8");
  assert.match(fonte, /if \(!leve\) \{\s*const consulta = await consultarCockpitComPrazo/);
  assert.match(fonte, /finally \{[\s\S]*carregamentoIntegralEmAndamento\.current = null/);
  const recuperacao = fonte.slice(fonte.indexOf('const recuperarConsulta ='), fonte.indexOf('if (!estado) return'));
  assert.match(recuperacao, /Tentar carregar novamente/);
  assert.match(recuperacao, /await carregar\(contextoDoPolling\.current, false, true\)/);
  assert.doesNotMatch(recuperacao, /enviar\(|comandos\.|POST/);
  assert.match(fonte, /erro && !autenticacaoExpirada \? recuperacaoDaConsulta/);
});
