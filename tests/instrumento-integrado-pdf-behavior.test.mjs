import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import Module from "node:module";
import path from "node:path";
import test from "node:test";
import ts from "typescript";

const arquivo = path.resolve("lib/instrumento-integrado-pdf.ts");

async function gerador() {
  const fonte = await readFile(arquivo, "utf8");
  const transpilado = ts.transpileModule(fonte, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true
    }
  }).outputText;
  const modulo = new Module(arquivo);
  modulo.filename = arquivo;
  modulo.paths = Module._nodeModulePaths(path.dirname(arquivo));
  modulo._compile(transpilado, arquivo);
  return modulo.exports.gerarPdfInstrumentoIntegrado;
}

test("PDF efetivo reproduz conteúdo e consequências da cópia canônica", async (t) => {
  if (spawnSync("pdftotext", ["-v"]).error) {
    t.skip("pdftotext indisponível neste ambiente");
    return;
  }
  const gerar = await gerador();
  const secoes = [
    {
      codigo: "AVISO_PRIVACIDADE",
      titulo: "Aviso de Privacidade - texto de teste",
      texto: "Categorias e finalidades documentadas no instrumento.\n\nParágrafo distinto para direitos do titular.",
      consequencia: "A ciência não autoriza usos opcionais.",
      natureza: "CIENCIA",
      classificacao: "ESSENCIAL",
      decisao_obrigatoria: true,
      opcoes: ["LI_E_ESTOU_CIENTE", "NAO_ESTOU_CIENTE"]
    },
    {
      codigo: "TERMOS_USO",
      titulo: "Termos de Uso - texto de teste",
      texto: "Condições de acesso e limites da plataforma apresentados antes da decisão.",
      consequencia: "A recusa não é convertida em autorização.",
      natureza: "CONCORDANCIA",
      classificacao: "ESSENCIAL",
      decisao_obrigatoria: true,
      opcoes: ["CONCORDO", "NAO_CONCORDO"]
    }
  ];
  const pdf = await gerar({
    identificacao_institucional: {
      razao_social: "PRESTADOR SINTETICO DE TESTE LTDA",
      cnpj: "00.000.000/0000-00"
    },
    instrumento: {
      codigo: "IICCA-HXP-TESTE",
      versao: "TESTE",
      titulo: "Instrumento integrado de teste",
      secoes
    },
    manifestacao: {
      confirmado_em: "2026-09-16T12:00:00Z",
      politica_de_retencao: "NAO_ARMAZENAR",
      sincronizacao: "PERSISTIDO_NO_NUCLEO",
      hash_do_documento: "a".repeat(64),
      hash_das_decisoes: "b".repeat(64),
      integridade_sha256: "c".repeat(64),
      estado_consolidado_json: {}
    },
    decisoes: [{
      codigo_da_decisao: "AVISO_PRIVACIDADE",
      decisao: "LI_E_ESTOU_CIENTE",
      estado: "VIGENTE"
    }, {
      codigo_da_decisao: "TERMOS_USO",
      decisao: "CONCORDO", estado: "VIGENTE"
    }],
    fluxo_simplificado: false,
    historico_de_versoes: [],
    modalidades_excluidas: []
  });
  assert.ok(Buffer.isBuffer(pdf));
  assert.equal(pdf.subarray(0, 4).toString(), "%PDF");
  if (process.env.HXP_IICCA_PDF_QA) {
    await writeFile(process.env.HXP_IICCA_PDF_QA, pdf);
  }
  const extraido = spawnSync("pdftotext", ["-", "-"], {
    input: pdf,
    maxBuffer: 2_000_000
  });
  assert.equal(extraido.status, 0, extraido.stderr?.toString());
  const texto = extraido.stdout.toString();
  for (const parte of [
    "Aviso de Privacidade - texto de teste",
    "Parágrafo distinto para direitos do titular.",
    "A ciência não autoriza usos opcionais.",
    "Termos de Uso - texto de teste",
    "A recusa não é convertida em autorização."
  ]) {
    assert.ok(texto.includes(parte), `Trecho ausente no PDF: ${parte}`);
  }
  assert.ok(texto.includes("PRESTADOR SINTETICO DE TESTE LTDA"));
  assert.ok(texto.includes("Opções apresentadas:"));
});

test("seção documental longa mantém texto e cabeçalho nas páginas automáticas", async (t) => {
  if (spawnSync("pdftotext", ["-v"]).error) {
    t.skip("pdftotext indisponível neste ambiente");
    return;
  }
  const gerar = await gerador();
  const paragrafos = Array.from({ length: 90 }, (_, indice) =>
    `Parágrafo documental sintético ${indice + 1}: informação de teste sem dado pessoal.`
  );
  const pdf = await gerar({
    instrumento: {
      codigo: "IICCA-HXP-TESTE",
      versao: "TESTE-LONGO",
      titulo: "Instrumento de teste longo",
      secoes: [{
        codigo: "AVISO_PRIVACIDADE",
        titulo: "Aviso extenso de teste",
        texto: paragrafos.join("\n\n"),
        consequencia: "Consequência documental preservada no fim da seção.",
        natureza: "CIENCIA",
        classificacao: "ESSENCIAL"
      }]
    },
    manifestacao: {
      confirmado_em: "2026-09-16T12:00:00Z",
      politica_de_retencao: "NAO_ARMAZENAR",
      sincronizacao: "PERSISTIDO_NO_NUCLEO",
      hash_do_documento: "a".repeat(64),
      hash_das_decisoes: "b".repeat(64),
      integridade_sha256: "c".repeat(64),
      estado_consolidado_json: {}
    },
    decisoes: [],
    fluxo_simplificado: false,
    historico_de_versoes: []
  });
  if (process.env.HXP_IICCA_PDF_QA_LONG) {
    await writeFile(process.env.HXP_IICCA_PDF_QA_LONG, pdf);
  }
  const extraido = spawnSync("pdftotext", ["-layout", "-", "-"], {
    input: pdf,
    maxBuffer: 4_000_000
  });
  assert.equal(extraido.status, 0, extraido.stderr?.toString());
  const paginas = extraido.stdout.toString().split("\f").filter(Boolean);
  assert.ok(paginas.length >= 4);
  for (const [indice, pagina] of paginas.entries()) {
    assert.ok(
      pagina.includes(`CÓPIA INTEGRAL · PÁGINA ${indice + 1}`),
      `Cabeçalho ausente na página ${indice + 1}`
    );
    assert.ok(pagina.includes("Instituto HUMANEXUS"));
  }
  assert.ok(extraido.stdout.toString().includes(paragrafos.at(-1)));
  assert.ok(extraido.stdout.toString().includes(
    "Consequência documental preservada no fim da seção."
  ));
});
