import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import * as lote from "../lib/iicca-lote.ts";

// Executes the real component handlers with isolated hook state and mocked HTTP.
// No production requests, participant records or consent responses are created.
function montar(responder, participantes = []) {
  const slots = [], efeitos = [], chamadas = [];
  let indice = 0;
  const react = {
    useState(initial) {
      const i = indice++;
      slots[i] ??= { value: initial };
      return [slots[i].value, next => { slots[i].value = typeof next === "function" ? next(slots[i].value) : next; }];
    },
    useRef(initial) {
      const i = indice++;
      slots[i] ??= { current: initial };
      return slots[i];
    },
    useEffect(effect, deps) {
      const i = indice++;
      if (!slots[i] || deps.some((dep, j) => dep !== slots[i].deps[j])) {
        slots[i]?.cleanup?.();
        slots[i] = { deps };
        efeitos.push(() => { slots[i].cleanup = effect(); });
      }
    }
  };
  const codigo = ts.transpileModule(readFileSync(new URL("../components/lote-instrumentos.tsx", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 }
  }).outputText;
  const exports = {};
  const jsx = (type, props) => ({ type, props });
  vm.runInNewContext(codigo, {
    exports,
    require: name => {
      if (name === "react") return react;
      if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
      if (name === "@/lib/iicca-lote") return lote;
      throw new Error(`Import não esperado: ${name}`);
    },
    document: { cookie: "humanexus_csrf=synthetic-csrf" },
    window: { location: { origin: "http://synthetic.invalid" }, setTimeout: callback => { queueMicrotask(callback); return 1; } },
    AbortSignal, URL, Blob,
    fetch: async (url, options) => {
      assert.ok(url.startsWith("/api/"));
      assert.equal(options.headers["x-humanexus-csrf"], "synthetic-csrf");
      const body = JSON.parse(options.body);
      chamadas.push({ url, body });
      const data = await responder(url, body, chamadas.length);
      return { ok: true, json: async () => data };
    }
  });
  let props = { organizacao: "org-a", nomeDaOrganizacao: "Empresa sintética", setorDaOrganizacao: "Aviação",
    participantes, autorizado: true, aoConcluir: async () => {} };
  function render() {
    indice = 0;
    const tree = exports.LoteInstrumentos(props);
    efeitos.splice(0).forEach(effect => effect());
    return tree;
  }
  function elementos(node, result = []) {
    if (Array.isArray(node)) node.forEach(n => elementos(n, result));
    else if (node && typeof node === "object") { result.push(node); elementos(node.props?.children, result); }
    return result;
  }
  function texto(node) {
    if (Array.isArray(node)) return node.map(texto).join("");
    if (node && typeof node === "object") return texto(node.props?.children);
    return node == null || typeof node === "boolean" ? "" : String(node);
  }
  const encontrar = (type, text) => elementos(render()).find(n => n.type === type && texto(n).includes(text));
  async function flush() { for (let i = 0; i < 30; i++) await new Promise(setImmediate); }
  render();
  return {
    chamadas, flush, texto: () => texto(render()),
    trocar: () => { props = { ...props, organizacao: "org-b" }; render(); },
    async preparar(csv, modo) {
      const input = elementos(render()).find(n => n.type === "input" && n.props.type === "file");
      input.props.onChange({ target: { files: [{ size: csv.length, text: async () => csv }] } });
      await flush();
      const marcar = label => elementos(encontrar("label", label)).find(n => n.type === "input")
        .props.onChange({ target: { checked: true } });
      marcar("Confirmei que a lista");
      if (modo === "email") marcar("Enviar um e-mail por pessoa");
      if (modo === "links") marcar("Gerar links individuais");
    },
    iniciar() { encontrar("button", "Cadastrar").props.onClick(); }
  };
}

function sucesso(url, body, numero) {
  if (body.acao === "criar-participante") return { identificador: `p-${numero}` };
  if (url.endsWith("anamneses")) return { convite: { identificador: `a-${numero}` }, token_de_entrega_unica: "anamnese-sintetica" };
  return { identificador: `i-${numero}`, token_de_entrega_unica: "instrumento-sintetico", entrega_por_email: { estado: "ENVIADO" } };
}

test("componente: cadastra contatos ausentes sem emitir convite ou enviar e-mail", async () => {
  const h = montar(sucesso);
  await h.preparar("nome;email;referencia\nSintética A;a@example.invalid;A\nSintética B;;B", "email");
  h.iniciar(); await h.flush();
  assert.equal(h.chamadas.length, 4);
  assert.equal(h.chamadas.filter(c => c.body.acao === "criar-participante").length, 2);
  assert.match(h.texto(), /CONTATO_PENDENTE/);
  assert.match(h.texto(), /ENVIADO/);
});

test("links nominais sem e-mail: duas rotas por pessoa e clique duplo não duplica", async () => {
  const h = montar(sucesso);
  await h.preparar("nome;referencia\nSintética A;A\nSintética B;B", "links");
  h.iniciar(); h.iniciar(); await h.flush();
  assert.equal(h.chamadas.length, 6);
  const apresentacoes = h.chamadas.filter(c => c.body.acao === "apresentar-instrumento-integrado");
  assert.equal(apresentacoes.length, 2);
  for (const c of apresentacoes) {
    assert.equal(c.body.dados.entregar_por_email, false);
    assert.ok(c.body.dados.convite_da_anamnese.token);
    assert.equal(c.body.dados.identificador_da_sessao, null);
    assert.equal("decisoes" in c.body.dados, false);
  }
  assert.match(h.texto(), /LINKS_GERADOS/);
  assert.doesNotMatch(h.texto(), /FALHOU_ENVIO/);
});

test("falha após cadastro interrompe lote e não apresenta confirmação falsa", async () => {
  const h = montar((url, body, numero) => {
    if (url.endsWith("anamneses")) throw new Error("Falha sintética de rede");
    return sucesso(url, body, numero);
  });
  await h.preparar("nome;referencia\nSintética A;A\nSintética B;B", "links");
  h.iniciar(); await h.flush();
  assert.equal(h.chamadas.length, 2);
  assert.match(h.texto(), /REVISAR/);
  assert.doesNotMatch(h.texto(), /LINKS_GERADOS|ENVIADO/);
});

test("troca de organização ignora resposta atrasada e não cria convite subsequente", async () => {
  let responder;
  const h = montar(() => new Promise(resolve => { responder = resolve; }));
  await h.preparar("nome;referencia\nSintética A;A", "links");
  h.iniciar(); await h.flush();
  assert.equal(h.chamadas.length, 1);
  h.trocar(); responder({ identificador: "p-a" }); await h.flush();
  assert.equal(h.chamadas.length, 1);
  assert.doesNotMatch(h.texto(), /Processados|LINKS_GERADOS/);
});

test("homônimo com outra referência não é duplicado automaticamente", async () => {
  const h = montar(sucesso, [{ identificador: "existente", referencia_externa: "outra", ativo: true,
    tipo_atendimento: "ORGANIZACIONAL", identificador_da_organizacao: "org-a",
    perfil_operacional: { dados_cadastrais: { nome_completo: "Sintética A", email: "" } } }]);
  await h.preparar("nome;referencia\nSintética A;A", "links");
  h.iniciar(); await h.flush();
  assert.equal(h.chamadas.length, 0);
  assert.match(h.texto(), /REVISAR/);
});
