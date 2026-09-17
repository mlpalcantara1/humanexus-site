import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import Module from "node:module";
import path from "node:path";
import test from "node:test";
import ts from "typescript";

const arquivo = path.resolve(
  "app/api/plataforma/participantes/[id]/instrumentos-integrados/[apresentacao]/pdf/route.ts"
);

class Resposta {
  constructor(body, options = {}) {
    this.body = body;
    this.status = options.status ?? 200;
    this.headers = new Headers(options.headers);
  }
  static json(body, options = {}) {
    return new Resposta(body, { ...options, headers: {
      "content-type": "application/json", ...options.headers
    } });
  }
}

async function carregarRota({ sessao = "sessao-sintetica", historico }) {
  const transpilado = ts.transpileModule(await readFile(arquivo, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true
    }
  }).outputText;
  const modulo = new Module(arquivo);
  modulo.filename = arquivo;
  modulo.paths = Module._nodeModulePaths(path.dirname(arquivo));
  let caminhoConsultado = "";
  modulo.require = (nome) => {
    if (nome === "next/headers") return {
      cookies: async () => ({ get: () => sessao ? { value: sessao } : undefined })
    };
    if (nome === "next/server") return { NextResponse: Resposta };
    if (nome === "@/lib/portal-session") return { COOKIE_SESSAO: "sessao" };
    if (nome === "@/lib/api-route-error") return {
      responderErroDaApi: () => Resposta.json({ erro: "acesso negado" }, { status: 403 })
    };
    if (nome === "@/lib/humanexus-core") return {
      requisitarNucleoAutenticado: async (caminho, token) => {
        assert.equal(token, sessao);
        caminhoConsultado = caminho;
        return historico;
      }
    };
    if (nome === "@/lib/instrumento-integrado-pdf") return {
      gerarPdfInstrumentoIntegrado: async (copia) => {
        assert.equal(copia.manifestacao.identificador, "manifestacao-sintetica");
        return Buffer.from("%PDF-copia-sintetica");
      }
    };
    return Module.createRequire(arquivo)(nome);
  };
  modulo._compile(transpilado, arquivo);
  return { GET: modulo.exports.GET, caminhoConsultado: () => caminhoConsultado };
}

test("cópia administrativa exige sessão e registro confirmado no escopo", async () => {
  const historico = {
    identificador_da_organizacao: "org-sintetica",
    identificador_do_participante: "participante-sintetico",
    registros: [
      {
        apresentacao: { identificador: "convite-pendente" },
        resposta_registrada: false,
        copia: null
      },
      {
        apresentacao: { identificador: "convite-confirmado" },
        resposta_registrada: true,
        copia: { manifestacao: { identificador: "manifestacao-sintetica" } }
      }
    ]
  };
  const contexto = (apresentacao) => ({ params: Promise.resolve({
    id: "participante-sintetico", apresentacao
  }) });
  const url = "http://127.0.0.1/api/plataforma/participantes/participante-sintetico/instrumentos-integrados/convite-confirmado/pdf?organizacao=org-sintetica";
  const semSessao = await carregarRota({ sessao: "", historico });
  assert.equal((await semSessao.GET(new Request(url), contexto("convite-confirmado"))).status, 401);

  const rota = await carregarRota({ historico });
  const pendente = await rota.GET(new Request(url), contexto("convite-pendente"));
  assert.equal(pendente.status, 404);
  const pdf = await rota.GET(new Request(url), contexto("convite-confirmado"));
  assert.equal(pdf.status, 200);
  assert.equal(pdf.headers.get("content-type"), "application/pdf");
  assert.equal(pdf.headers.get("cache-control")?.includes("no-store"), true);
  assert.equal(Buffer.from(pdf.body).subarray(0, 4).toString(), "%PDF");
  assert.equal(rota.caminhoConsultado(),
    "/api/v1/participantes/participante-sintetico/instrumentos-integrados?organizacao=org-sintetica");

  const outraOrg = await carregarRota({ historico: {
    ...historico, identificador_da_organizacao: "outra-organizacao"
  } });
  assert.equal((await outraOrg.GET(new Request(url), contexto("convite-confirmado"))).status, 403);
});
