import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

test("PDF final funcional tem conteúdo real, paginação variável e paridade documental", async () => {
  const pasta = await mkdtemp(join(tmpdir(), "hxp-final-funcional-"));
  const pdf = join(pasta, "relatorio-final-funcional.pdf");
  const geracao = spawnSync(
    process.execPath,
    ["--experimental-strip-types", "scripts/gerar-relatorio-final-funcional-fixture.mjs"],
    {
      cwd: new URL("../", import.meta.url),
      env: { ...process.env, HXP_FINAL_PDF_OUTPUT: pdf },
      encoding: "utf8"
    }
  );
  assert.equal(geracao.status, 0, geracao.stderr);
  assert.equal((await readFile(pdf)).subarray(0, 5).toString(), "%PDF-");

  const info = spawnSync("pdfinfo", [pdf], { encoding: "utf8" });
  assert.equal(info.status, 0, info.stderr);
  const paginas = Number(info.stdout.match(/Pages:\s+(\d+)/)?.[1]);
  assert.ok(paginas >= 2 && paginas <= 9, `paginação inesperada: ${paginas}`);

  const texto = spawnSync("pdftotext", [pdf, "-"], { encoding: "utf8" });
  assert.equal(texto.status, 0, texto.stderr);
  for (const termo of [
    "Participante de Verificação",
    "000.000.000-00",
    "Organização de Verificação",
    "O que os resultados mostram",
    "Como chegou",
    "Pontos fortes e capacidades observadas",
    "Pontos de atenção",
    "Resposta ao treinamento",
    "O que isso significa na prática",
    "O que precisa ser desenvolvido",
    "Recomendações",
    "Vetores: recursos e forças presentes",
    "VEV longitudinal",
    "Resultante: como essas forças se organizaram",
    "Devolutiva ao participante",
    "Limites da leitura",
    "Conclusão e próximo passo"
  ]) assert.match(texto.stdout, new RegExp(termo, "i"));
  assert.doesNotMatch(texto.stdout, /Nenhum registro autorizado/i);
  assert.doesNotMatch(texto.stdout, /Nome completo não informado|CPF não informado/i);
});

test("PDF identifica revisão EEG histórica sem convertê-la em leitura atual", async () => {
  const pasta = await mkdtemp(join(tmpdir(), "hxp-eeg-revisao-"));
  const pdf = join(pasta, "revisao-eeg.pdf");
  const geracao = spawnSync(process.execPath, ["--experimental-strip-types", "scripts/gerar-relatorio-final-funcional-fixture.mjs"], {
    cwd: new URL("../", import.meta.url), encoding: "utf8",
    env: { ...process.env, HXP_FINAL_PDF_OUTPUT: pdf, HXP_EEG_REPROCESS_TEST: "1" }
  });
  assert.equal(geracao.status, 0, geracao.stderr);
  const texto = spawnSync("pdftotext", [pdf, "-"], { encoding: "utf8" });
  assert.equal(texto.status, 0, texto.stderr);
  for (const termo of ["POLITICA-OPERACIONAL-EPOC-X-1.1", "530 de 681", "517 de 680", "470 de 681", "não é leitura atual", "SEM VALIDADE CLÍNICA OU CIENTÍFICA"]) assert.ok(texto.stdout.replace(/\s+/g, " ").includes(termo), termo);
  console.log(`PDF de teste EEG: ${pdf}`);
});


test("PDF preserva trajetórias recebidas durante ausência atual sem fabricar medidas", async () => {
  const pasta = await mkdtemp(join(tmpdir(), "hxp-series-controladas-"));
  const sinais = join(pasta, "sinais-controlados.json");
  const pdf = join(pasta, "graficos.pdf");
  const ponto = (valor, timestamp) => ({ valor, timestamp, momento: "PRE" });
  await writeFile(sinais, JSON.stringify({ fontes: [
    { codigo: "POLAR_H10", ao_vivo: false, series: {}, series_preservadas: { hr: [ponto(65.12, "2026-10-09T18:00:00Z"), ponto(67.45, "2026-10-09T18:00:30Z")] } },
    { codigo: "EMOTIV_EPOC_X", ao_vivo: false, atividade_de_bandas_eeg: { bandas: [] }, atividade_de_bandas_eeg_preservada: { bandas: [{ codigo: "theta", nome: "Theta", serie_global: [ponto(11.34, "2026-10-09T18:00:00Z"), ponto(13.56, "2026-10-09T18:00:30Z")] }] } }
  ] }));
  const geracao = spawnSync(process.execPath, ["--experimental-strip-types", "scripts/gerar-relatorio-final-funcional-fixture.mjs"], { cwd: new URL("../", import.meta.url), env: { ...process.env, HXP_TEST_SIGNAL_FILE: sinais, HXP_FINAL_PDF_OUTPUT: pdf }, encoding: "utf8" });
  assert.equal(geracao.status, 0, geracao.stderr);
  const extracao = spawnSync("pdftotext", ["-layout", pdf, "-"], { encoding: "utf8" });
  assert.equal(extracao.status, 0, extracao.stderr);
  for (const termo of ["Gráficos regulatórios da sessão", "EEG · Theta", "Polar H10 · Frequência cardíaca", "mínimo 11.34", "máximo 13.56", "mínimo 65.12", "máximo 67.45", "2 medidas", "14:00:30 (Manaus)"]) assert.ok(extracao.stdout.includes(termo), termo);
  assert.match(extracao.stdout, /Lacunas não interpoladas/);
});


test("PDF usa Resultante operacional explícita sem recorrer à configuração V1", async () => {
  const pasta = await mkdtemp(join(tmpdir(), "hxp-resultante-principal-"));
  const arquivo = join(pasta, "resultante-controlada.json");
  const pdf = join(pasta, "resultante.pdf");
  await writeFile(arquivo, JSON.stringify({ estado: "CALCULAVEL", magnitude_global: 71.5594,
    direcao_funcional: { coordenadas_unitarias: { VT: .296442, VAR: .405137 } }, sentido_contextual: "NAO_DETERMINAVEL" }));
  const gerar = () => spawnSync(process.execPath, ["--experimental-strip-types", "scripts/gerar-relatorio-final-funcional-fixture.mjs"], {
    cwd: new URL("../", import.meta.url), encoding: "utf8",
    env: { ...process.env, HXP_FINAL_PDF_OUTPUT: pdf, HXP_TEST_RESULTANTE_FILE: arquivo }
  });
  assert.equal(gerar().status, 0);
  let extracao = spawnSync("pdftotext", ["-layout", pdf, "-"], { encoding: "utf8" });
  assert.match(extracao.stdout, /Magnitude registrada: 71,56/);
  assert.match(extracao.stdout, /VT 0\.296/);
  assert.match(extracao.stdout, /VAR 0\.405/);
  assert.match(extracao.stdout, /Tipo B em validação empírica/);
  await writeFile(arquivo, JSON.stringify({ estado: "NAO_CALCULAVEL", magnitude_global: null }));
  assert.equal(gerar().status, 0);
  extracao = spawnSync("pdftotext", ["-layout", pdf, "-"], { encoding: "utf8" });
  assert.match(extracao.stdout, /magnitude global ainda não está disponível/);
  assert.doesNotMatch(extracao.stdout, /Magnitude registrada: 71,56/);
});
