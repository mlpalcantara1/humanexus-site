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
    "Nove Vetores momentâneos",
    "VEV longitudinal",
    "Indicadores oficiais integrados à leitura",
    "Devolutiva ao participante",
    "Limites da leitura",
    "Rastreabilidade técnica"
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
  for (const termo of ["Gráficos regulatórios da sessão", "EEG · Theta", "Polar H10 · Frequência cardíaca", "mínimo 11.34", "máximo 13.56", "mínimo 65.12", "máximo 67.45", "2 registros", "2026-10-09T18:00:30.000Z"]) assert.ok(extracao.stdout.includes(termo), termo);
  assert.match(extracao.stdout, /Lacunas não interpoladas/);
});
