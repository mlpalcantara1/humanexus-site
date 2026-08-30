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

test("resolvedor recupera a linguagem prática sem fabricar interpretação", () => {
  const execucao = executarModulo(`
    import { projetarMicrotrajetoriaRegulatoria } from "./lib/projecao-narrativa-relatorio.ts";
    const resultado = projetarMicrotrajetoriaRegulatoria({
      execucao: { objetivo: "Sustentar organização diante de pressão temporal comparável." },
      treinamento: "THX registrado pelo profissional",
      relatorio: {
        secoes: [
          { codigo: "CONTEXTO_OPERACIONAL_HUMANO", itens: ["Chegou com estabilidade reduzida diante da demanda registrada."] },
          { codigo: "GATILHOS_E_CONTEXTO_DOCUMENTADOS", itens: ["Pressão temporal registrada."] }
        ]
      },
      consolidacao: {
        conclusao: "A sessão documenta reorganização após a intervenção registrada.",
        recursos_regulatorios_observados: "Recuperação e capacidade de reorganizar a ação.",
        pontos_de_atencao: "Sustentação da resposta quando a demanda aumentou.",
        resposta_observada: "Houve recuperação no PÓS após a intervenção.",
        interpretacao_profissional: "A mudança observada é contextual e ainda requer confirmação.",
        o_que_ainda_nao_se_consolidou: "Manutenção da resposta em sessões comparáveis.",
        recomendacao: "Repetir a atividade em condição comparável.",
        conteudo_da_devolutiva_ao_participante: "Você conseguiu reorganizar a resposta após a intervenção nesta sessão.",
        observacoes_por_fase: { PRE: "Estabilidade reduzida.", TREINO: "Reorganização observada.", POS: "Recuperação registrada." }
      }
    }).leituraPratica;
    console.log(JSON.stringify(resultado));
  `);
  assert.equal(execucao.status, 0, execucao.stderr);
  const leitura = JSON.parse(execucao.stdout);
  assert.match(leitura.resultados[0], /^Os resultados mostram:/);
  assert.match(leitura.comoChegou[0], /^Durante a condição observada:/);
  assert.match(leitura.pontosFortes[0], /^Capacidades e recursos observados:/);
  assert.match(leitura.pontosDeAtencao[0], /^Pontos de atenção registrados:/);
  assert.ok(leitura.respostaAoTreinamento.some((item) => item.startsWith("Resposta observada:")));
  assert.ok(leitura.respostaAoTreinamento.some((item) => item.startsWith("PRÉ —")));
  assert.ok(leitura.respostaAoTreinamento.some((item) => item.startsWith("TREINO —")));
  assert.ok(leitura.respostaAoTreinamento.some((item) => item.startsWith("PÓS —")));
  assert.match(leitura.significadoPratico[0], /^Na prática, a leitura profissional indica:/);
  assert.match(leitura.desenvolvimento[0], /^O que ainda precisa ser desenvolvido ou confirmado:/);
  assert.match(leitura.recomendacoes[0], /^O próximo passo recomendado é:/);
  assert.deepEqual(leitura.devolutivaAoParticipante, [
    "Você conseguiu reorganizar a resposta após a intervenção nesta sessão."
  ]);
  assert.match(leitura.limitesDaLeitura.at(-1), /não prevê comportamento específico nem resultado futuro/i);
});

test("texto técnico é retirado do corpo e seções sem conteúdo são omitidas", () => {
  const execucao = executarModulo(`
    import { projetarMicrotrajetoriaRegulatoria } from "./lib/projecao-narrativa-relatorio.ts";
    const resultado = projetarMicrotrajetoriaRegulatoria({
      execucao: {}, relatorio: {},
      consolidacao: {
        conclusao: "A cobertura técnica indica fixture de migration.",
        conteudo_da_devolutiva_ao_participante: "Mensagem humana preservada."
      }
    }).leituraPratica;
    console.log(JSON.stringify(resultado));
  `);
  assert.equal(execucao.status, 0, execucao.stderr);
  const leitura = JSON.parse(execucao.stdout);
  assert.deepEqual(leitura.resultados, []);
  assert.deepEqual(leitura.pontosFortes, []);
  assert.deepEqual(leitura.pontosDeAtencao, []);
  assert.deepEqual(leitura.devolutivaAoParticipante, ["Mensagem humana preservada."]);
  assert.doesNotMatch(JSON.stringify(leitura), /fixture|migration|cobertura técnica/i);
});

test("composição Web apresenta dez respostas práticas uma única vez e omite blocos vazios", async () => {
  const componente = await source("components/resultado-regulatorio-da-sessao.tsx");
  for (const titulo of [
    "O que os resultados mostram",
    "Como chegou",
    "Pontos fortes e capacidades observadas",
    "Pontos de atenção",
    "Resposta ao treinamento",
    "O que isso significa na prática",
    "O que precisa ser desenvolvido",
    "Recomendações",
    "DEVOLUTIVA AO PARTICIPANTE",
    "LIMITES DA LEITURA"
  ]) assert.match(componente, new RegExp(titulo, "i"));
  assert.match(componente, /if \(!itens\.length\) return null/);
  assert.match(componente, /estadosDaMudanca\.filter/);
  assert.doesNotMatch(componente, /fixture|migration|schema|cobertura técnica|confiança computacional/i);
});

test("PDF atual e LEGACY_HISTORICO compartilham a linguagem prática e permanecem PDFs reais", async () => {
  const pasta = await mkdtemp(join(tmpdir(), "hxp-p035-linguagem-"));
  for (const contrato of ["TIRH_V1", "LEGACY_HISTORICO"]) {
    const destino = join(pasta, `${contrato}.pdf`);
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
    const extracao = spawnSync("pdftotext", ["-layout", destino, "-"], { encoding: "utf8" });
    assert.equal(extracao.status, 0, extracao.stderr);
    const texto = extracao.stdout.replace(/\s+/g, " ");
    const corpo = texto.split(/Rastreabilidade técnica/i)[0];
    for (const titulo of [
      "O que os resultados mostram",
      "Como chegou",
      "Pontos fortes e capacidades observadas",
      "Pontos de atenção",
      "Resposta ao treinamento",
      "O que isso significa na prática",
      "Recomendações",
      "Devolutiva ao participante",
      "Limites da leitura"
    ]) assert.match(corpo, new RegExp(titulo, "i"));
    assert.doesNotMatch(corpo, /fixture|migration|schema|pipeline|contrato legado|confiança computacional/i);
    assert.doesNotMatch(texto, /^\s*\{\s*"erro"/);
  }
});

test("Portal não recalcula ciência e o coletivo continua sem identidade individual", async () => {
  const resolver = await source("lib/projecao-narrativa-relatorio.ts");
  const cockpit = await source("components/operacao-homologacao.tsx");
  assert.doesNotMatch(resolver, /calcular|recalcular|reclassificar|fallback/i);
  const coletivo = cockpit.slice(
    cockpit.indexOf("const visaoColetiva"),
    cockpit.indexOf("const visaoTecnica")
  );
  assert.match(coletivo, /CPF e identidades individuais: NÃO EXPOSTOS/);
  assert.doesNotMatch(coletivo, /nome_documental|cpf_documental|ResultadoRegulatorioDaSessao/);
});
