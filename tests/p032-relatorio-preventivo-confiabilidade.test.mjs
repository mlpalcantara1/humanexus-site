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

test("composição preventiva usa somente registros profissionais, remove duplicação e não expõe objeto bruto", () => {
  const execucao = executarModulo(`
    import { projetarMicrotrajetoriaRegulatoria } from "./lib/projecao-narrativa-relatorio.ts";
    const projecao = projetarMicrotrajetoriaRegulatoria({
      execucao: { objetivo: "Ampliar estabilidade sob demanda comparável." },
      relatorio: {
        secoes: [
          { codigo: "FINALIDADE_DO_TREINAMENTO", itens: ["Objetivo genérico duplicado."] },
          { codigo: "CONTEXTO_OPERACIONAL_HUMANO", itens: ["Chegou com elevação de custo sob pressão temporal."] },
          { codigo: "GATILHOS_E_CONTEXTO_DOCUMENTADOS", itens: ["Pressão temporal registrada."] },
          { codigo: "ROTA_DOMINANTE", itens: ["Rota predominante registrada pelo profissional."] },
          { codigo: "MUDANCA_DE_ROTA", itens: ["Mudança de rota observada após a intervenção."] },
          { codigo: "SINAIS_PRECURSORES", itens: ["Aceleração e perda de discriminação registradas antes da resposta."] },
          { codigo: "LIMITE_REGULATORIO_OBSERVADO", itens: ["A estabilidade se modificou na elevação documentada da demanda."] },
          { codigo: "CONFIABILIDADE_OPERACIONAL_HUMANA", itens: ["Capacidade protetiva demonstrada somente neste contexto."] },
          { codigo: "LEITURA_PREVENTIVA_PROFISSIONAL", itens: ["Interromper a progressão se os sinais registrados reaparecerem."] }
        ]
      },
      consolidacao: {
        contexto_e_objetivo: "Chegou com elevação de custo sob pressão temporal.",
        observacoes_por_fase: { PRE: "Sinal inicial.", TREINO: "Mudança observada.", POS: "Recuperação registrada." },
        intervencao: "THX aplicado.",
        resposta_observada: "Resposta aguda observada.",
        interpretacao_profissional: "Mudança contextual registrada.",
        sinais_precursores: "Aceleração e perda de discriminação registradas antes da resposta.",
        limite_regulatorio_observado: "A estabilidade se modificou na elevação documentada da demanda.",
        confiabilidade_operacional: "Capacidade protetiva demonstrada somente neste contexto.",
        leitura_preventiva: "Interromper a progressão se os sinais registrados reaparecerem.",
        aquisicao: "Aquisição registrada pelo profissional.",
        consolidacao: "",
        transferencia: "",
        manutencao: "",
        limitacoes: JSON.stringify({ objeto_bruto: "não deve aparecer" }),
        proximo_passo_regulatorio: "Repetir em condição comparável."
      },
      treinamento: "THX registrado",
      indicadores: ["IIRH oficial preservado."]
    });
    console.log(JSON.stringify(projecao));
  `);
  assert.equal(execucao.status, 0, execucao.stderr);
  const resultado = JSON.parse(execucao.stdout);
  assert.equal(resultado.comoChegou[0].itens.length, 1);
  assert.deepEqual(resultado.sinaisPrecursores, [
    "Aceleração e perda de discriminação registradas antes da resposta."
  ]);
  assert.deepEqual(resultado.limiteRegulatorio, [
    "A estabilidade se modificou na elevação documentada da demanda."
  ]);
  assert.deepEqual(resultado.confiabilidadeOperacional, [
    "Capacidade protetiva demonstrada somente neste contexto."
  ]);
  assert.equal(resultado.estadosDaMudanca.find((item) => item.codigo === "AQUISICAO").itens.length, 1);
  assert.equal(resultado.estadosDaMudanca.find((item) => item.codigo === "CONSOLIDACAO").itens.length, 0);
  assert.doesNotMatch(JSON.stringify(resultado), /objeto_bruto|não deve aparecer/);
});

test("linguagem é condicional, nenhuma conclusão determinística é produzida e dados técnicos ficam fora do corpo", async () => {
  const resolver = await source("lib/projecao-narrativa-relatorio.ts");
  const componente = await source("components/resultado-regulatorio-da-sessao.tsx");
  const pdf = await source("lib/tirh-report-document.ts");
  for (const termo of [
    "previsibilidade",
    "não prevê comportamento específico",
    "SINAIS PRECURSORES",
    "LIMITE REGULATÓRIO OBSERVADO",
    "CONFIABILIDADE OPERACIONAL HUMANA",
    "Resposta aguda não equivale automaticamente a consolidação"
  ]) {
    assert.match(resolver + componente + pdf, new RegExp(termo, "i"));
  }
  assert.doesNotMatch(
    componente + pdf,
    /o operador certamente fará|a plataforma prevê que ocorrerá|o acidente será evitado|o comportamento futuro está comprovado/i
  );
  assert.match(resolver, /LINGUAGEM_TECNICA_INTERNA/);
  assert.match(pdf, /Nenhum indicador isolado produz conclusão profissional/);
});

test("IIRH e Zona do documento não são combinados com estado contínuo incompatível", async () => {
  const cockpit = await source("components/operacao-homologacao.tsx");
  const pdf = await source("lib/tirh-report-document.ts");
  for (const codigo of [cockpit, pdf]) {
    assert.match(codigo, /resolverIirhAutoritativo\(projecao\.iirh\)/);
    assert.match(codigo, /resolverZonaAutoritativa\(projecao\.zona\)/);
    assert.match(codigo, /VALOR OFICIAL DO DOCUMENTO|valor oficial do documento/);
    assert.match(codigo, /ESTADO OFICIAL DO DOCUMENTO|estado oficial do documento/);
  }
  assert.doesNotMatch(cockpit, /iirhAutoritativo\.valor[^\n]+AGUARDANDO PRIMEIRA REFERÊNCIA VÁLIDA/);
});

test("gráficos vazios são omitidos e Vetores ausentes são resumidos sem lista técnica", async () => {
  const cockpit = await source("components/operacao-homologacao.tsx");
  const pdf = await source("lib/tirh-report-document.ts");
  assert.match(cockpit, /fasesComComparacao\.length >= 2 \|\| trilhasDoRelatorio\.length > 0/);
  assert.match(cockpit, /\.filter\(\(trilha\) => trilha\.points\.length > 0\)/);
  assert.match(cockpit, /trilha\.id === "quality"[\s\S]+typeof registro\?\.confiabilidade === "number"/);
  assert.match(cockpit, /trilha\.id === "coverage"[\s\S]+typeof registro\?\.cobertura === "number"/);
  assert.doesNotMatch(cockpit, /vetoresCalculaveis\.length >= 3[\s\S]+hx-report-regulatory-charts/);
  assert.match(pdf, /if \(possuiGraficoOficial\)/);
  assert.match(pdf, /vetoresCalculados\.length >= 3/);
  assert.match(pdf, /pontosDaTrajetoria >= 2/);
  assert.match(pdf, /9 - vetoresCalculados\.length/);
  assert.doesNotMatch(pdf, /vetores\.map\(\(vetor\) => \(\s*`\$\{vetor\.codigo\}.*ausente/s);
});

test("longitudinal só apresenta evolução quando há comparabilidade declarada", () => {
  const execucao = executarModulo(`
    import { projetarMacrotrajetoriaRegulatoria } from "./lib/projecao-narrativa-relatorio.ts";
    const semComparabilidade = projetarMacrotrajetoriaRegulatoria({
      linha_do_tempo: [{ estado: "inicial" }, { estado: "atual" }]
    });
    const comparavel = projetarMacrotrajetoriaRegulatoria({
      sessoes_comparaveis: true,
      linha_do_tempo: [{ estado: "inicial" }, { estado: "atual" }],
      atual: { sinais_longitudinais: { resposta_aguda: "resposta registrada", manutencao: "manutenção registrada" } }
    });
    console.log(JSON.stringify({ semComparabilidade, comparavel }));
  `);
  assert.equal(execucao.status, 0, execucao.stderr);
  const resultado = JSON.parse(execucao.stdout);
  assert.equal(resultado.semComparabilidade.length, 1);
  assert.equal(resultado.semComparabilidade[0].codigo, "COMPARABILIDADE_LONGITUDINAL");
  assert.ok(resultado.comparavel.some((item) => item.codigo === "RESPOSTA_AGUDA"));
  assert.ok(resultado.comparavel.some((item) => item.codigo === "MANUTENCAO"));
});

test("PDF atual e LEGACY_HISTORICO mantêm conteúdo preventivo equivalente e PDF real", async () => {
  const pasta = await mkdtemp(join(tmpdir(), "hxp-p032-preventivo-"));
  const textos = [];
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
    textos.push(extracao.stdout);
  }
  for (const textoBruto of textos) {
    const texto = textoBruto.replace(/\s+/g, " ");
    for (const termo of [
      "Prevenção adaptativa e confiabilidade operacional humana",
      "Síntese de confiabilidade operacional",
      "Mapa preventivo do funcionamento",
      "Sinais precursores",
      "Limite regulatório observado",
      "Efeito do treinamento",
      "Confiabilidade operacional humana",
      "Resposta aguda, aquisição, consolidação, transferência e manutenção",
      "Como chegou",
      "O que mudou",
      "Como saiu"
    ]) assert.match(texto, new RegExp(termo, "i"));
    assert.doesNotMatch(texto, /THX-FIXTURE-001/i);
    assert.doesNotMatch(texto, /IIRH:\s*0\s*\/\s*100/i);
  }
});

test("adaptador P0.3.1 permanece byte a byte igual à base homologada e fail-closed", async () => {
  const atual = await source("lib/compatibilidade-documental-historica.ts");
  const base = spawnSync(
    "git",
    ["show", "29505bebaecc7464c083e3ba7defaafa094cb1e8:lib/compatibilidade-documental-historica.ts"],
    { cwd: raiz, encoding: "utf8" }
  );
  assert.equal(base.status, 0, base.stderr);
  assert.equal(atual, base.stdout);
  assert.match(atual, /MENSAGEM_DE_SNAPSHOT_HISTORICO_REPRODUZIVEL/);
  assert.match(atual, /erro\.message === MENSAGEM_DE_SNAPSHOT_HISTORICO_REPRODUZIVEL/);
});

test("coletivo permanece sem identidade individual", async () => {
  const cockpit = await source("components/operacao-homologacao.tsx");
  const coletivo = cockpit.slice(
    cockpit.indexOf("const visaoColetiva"),
    cockpit.indexOf("const visaoTecnica")
  );
  assert.match(coletivo, /CPF e identidades individuais: NÃO EXPOSTOS/);
  assert.doesNotMatch(coletivo, /nome_documental|cpf_documental|ResultadoRegulatorioDaSessao/);
});
