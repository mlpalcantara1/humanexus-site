import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const raiz = new URL("../", import.meta.url);
const source = (caminho) => readFile(new URL(caminho, raiz), "utf8");

function executarModulo(codigo) {
  return spawnSync(
    process.execPath,
    ["--experimental-strip-types", "--input-type=module", "--eval", codigo],
    { cwd: raiz, encoding: "utf8" }
  );
}

test("adaptador reconhece somente o marcador oficial e preserva registro bruto e documento congelado", () => {
  const execucao = executarModulo(`
    import {
      erroIndicaSnapshotHistoricoReproduzivel,
      resolverContratoDocumentalSomenteLeitura,
      MENSAGEM_DE_SNAPSHOT_HISTORICO_REPRODUZIVEL
    } from "./lib/compatibilidade-documental-historica.ts";
    const relatorio = {
      identificador: "relatorio-legado-preservado",
      estado_documental: "CONCLUIDO",
      estado_funcional: "RELATORIO_FINAL_VALIDADO",
      numero_da_versao: 3,
      hash: "hash-final-imutavel",
      contexto_json: {
        consolidacao_profissional: {
          contexto_e_objetivo: "registro autoral preservado",
          evidencias_utilizadas: ["evidência preservada"],
          observacoes_por_fase: { PRE: "pré", TREINO: "treino", POS: "pós" },
          intervencao: "intervenção",
          resposta_observada: "resposta",
          interpretacao_profissional: "interpretação",
          recursos_regulatorios_observados: "recursos",
          pontos_de_atencao: "atenção",
          limitacoes: "limites",
          conclusao: "conclusão",
          justificativa: "justificativa",
          recomendacao: "recomendação",
          proximo_passo_regulatorio: "próximo passo",
          conteudo_da_devolutiva_ao_participante: "devolutiva"
        }
      }
    };
    const cockpit = { leitura_cientifica: { vetores: { VETOR_HUMANO: { valor: 0 } } } };
    const brutoAntes = structuredClone({ relatorio, cockpit });
    const resolvido = resolverContratoDocumentalSomenteLeitura({
      relatorio,
      tirhV1: {},
      cockpitOperacional: cockpit,
      contratoLegadoDeclarado: true
    });
    const erroOficial = erroIndicaSnapshotHistoricoReproduzivel(
      new Error(MENSAGEM_DE_SNAPSHOT_HISTORICO_REPRODUZIVEL)
    );
    const erroGenerico = erroIndicaSnapshotHistoricoReproduzivel(
      new Error("falha de transporte")
    );
    console.log(JSON.stringify({
      resolvido,
      brutoInalterado: JSON.stringify(brutoAntes) === JSON.stringify({ relatorio, cockpit }),
      hash: relatorio.hash,
      versao: relatorio.numero_da_versao,
      erroOficial,
      erroGenerico
    }));
  `);
  assert.equal(execucao.status, 0, execucao.stderr);
  const resultado = JSON.parse(execucao.stdout.trim());
  assert.equal(resultado.resolvido.contratoDocumental, "LEGACY_HISTORICO");
  assert.equal(resultado.resolvido.documentoReproduzivel, true);
  assert.equal(resultado.resolvido.ausenciaCientifica, true);
  assert.equal(resultado.resolvido.ausenciaDocumental, false);
  assert.equal(resultado.resolvido.registroBrutoPreservado, true);
  assert.equal(resultado.brutoInalterado, true);
  assert.equal(resultado.hash, "hash-final-imutavel");
  assert.equal(resultado.versao, 3);
  assert.equal(resultado.erroOficial, true);
  assert.equal(resultado.erroGenerico, false);
});

test("adaptador mantém contrato atual quando a projeção TIRH V1 existe", () => {
  const execucao = executarModulo(`
    import { resolverContratoDocumentalSomenteLeitura } from "./lib/compatibilidade-documental-historica.ts";
    const relatorio = {
      identificador: "relatorio-atual",
      estado_documental: "CONCLUIDO",
      estado_funcional: "RELATORIO_FINAL_VALIDADO"
    };
    const tirhV1 = { sintese: { vetores: {}, resultante: {}, iirh: {}, zona: {} } };
    console.log(JSON.stringify(resolverContratoDocumentalSomenteLeitura({
      relatorio,
      tirhV1,
      cockpitOperacional: {},
      contratoLegadoDeclarado: false
    })));
  `);
  assert.equal(execucao.status, 0, execucao.stderr);
  const resultado = JSON.parse(execucao.stdout.trim());
  assert.equal(resultado.contratoDocumental, "TIRH_V1");
  assert.equal(resultado.ausenciaCientifica, false);
  assert.equal(resultado.ausenciaDocumental, false);
});

test("PDF atual e legado são PDFs reais, preservam microtrajetória e ausência honesta", async () => {
  const pasta = await mkdtemp(join(tmpdir(), "hxp-p031-pdf-"));
  const atual = join(pasta, "atual.pdf");
  const legado = join(pasta, "legado.pdf");
  for (const [contrato, destino] of [["TIRH_V1", atual], ["LEGACY_HISTORICO", legado]]) {
    const geracao = spawnSync(
      process.execPath,
      ["--experimental-strip-types", "scripts/gerar-relatorio-final-funcional-fixture.mjs"],
      {
        cwd: raiz,
        env: {
          ...process.env,
          HXP_FINAL_PDF_OUTPUT: destino,
          HXP_FINAL_DOCUMENT_CONTRACT: contrato
        },
        encoding: "utf8"
      }
    );
    assert.equal(geracao.status, 0, geracao.stderr);
    const bytes = await readFile(destino);
    assert.equal(bytes.subarray(0, 5).toString(), "%PDF-");
    assert.doesNotMatch(bytes.subarray(0, 128).toString(), /\{"erro"/);
  }

  const extrair = (arquivo) => spawnSync("pdftotext", ["-layout", arquivo, "-"], {
    encoding: "utf8"
  });
  const textoAtual = extrair(atual);
  const textoLegado = extrair(legado);
  assert.equal(textoAtual.status, 0, textoAtual.stderr);
  assert.equal(textoLegado.status, 0, textoLegado.stderr);
  for (const termo of [
    "Participante de Verificação",
    "CPF 000.000.000-00",
    "O que os resultados mostram",
    "Como chegou",
    "Pontos fortes e capacidades observadas",
    "Resposta ao treinamento",
    "O que isso significa na prática",
    "Recomendações",
    "Limites da leitura",
    "Rastreabilidade técnica"
  ]) {
    assert.match(textoAtual.stdout, new RegExp(termo, "i"));
    assert.match(textoLegado.stdout, new RegExp(termo, "i"));
  }
  assert.match(textoLegado.stdout, /1\/9 Vetores momentâneos possuem valor oficial/i);
  assert.match(textoLegado.stdout, /INDISPONÍVEL|AUSENTE|não materializada/i);
  assert.doesNotMatch(textoLegado.stdout, /IIRH:\s*0\s*\/\s*100/i);
});

test("rota PDF e impressão compartilha o adaptador e nunca converte falha genérica em legado", async () => {
  const rota = await source("app/api/operacao-homologacao/pdf/route.ts");
  const adaptador = await source("lib/compatibilidade-documental-historica.ts");
  const gerador = await source("lib/tirh-report-document.ts");
  assert.match(rota, /erroIndicaSnapshotHistoricoReproduzivel/);
  assert.match(rota, /resolverContratoDocumentalSomenteLeitura/);
  assert.match(rota, /if \(!erroIndicaSnapshotHistoricoReproduzivel\(erro\)\) throw erro/);
  assert.match(rota, /contratoDocumental: contratoDocumental\.contratoDocumental/);
  assert.match(rota, /"content-type": "application\/pdf"/);
  assert.match(rota, /modoImpressao \? "inline" : "attachment"/);
  assert.match(rota, /x-humanexus-document-contract/);
  assert.doesNotMatch(
    adaptador,
    /\b(?:fetch|POST|PUT|PATCH|DELETE|INSERT|UPDATE|migration|migracao)\b/i
  );
  assert.match(gerador, /projetarMicrotrajetoriaRegulatoria/);
  assert.match(gerador, /compatibilizarVetoresDoSnapshotHistorico/);
  assert.doesNotMatch(gerador, /magnitude\s*\|\|\s*0|valor\s*\|\|\s*0/);
});

test("compatibilidade preserva o relatório Web compartilhado e a exposição coletiva", async () => {
  const cockpit = await source("components/operacao-homologacao.tsx");
  const coletivo = cockpit.slice(
    cockpit.indexOf("const visaoColetiva"),
    cockpit.indexOf("const visaoTecnica")
  );
  assert.match(cockpit, /function RelatorioCanonicoV1/);
  assert.match(coletivo, /CPF e identidades individuais: NÃO EXPOSTOS/);
  assert.doesNotMatch(coletivo, /nome_documental|cpf_documental|ResultadoRegulatorioDaSessao/);
});
