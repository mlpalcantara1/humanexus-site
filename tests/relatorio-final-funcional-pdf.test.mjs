import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
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
  assert.ok(paginas >= 2 && paginas < 9, `paginação inesperada: ${paginas}`);

  const texto = spawnSync("pdftotext", [pdf, "-"], { encoding: "utf8" });
  assert.equal(texto.status, 0, texto.stderr);
  for (const termo of [
    "Participante de Verificação",
    "000.000.000-00",
    "Organização de Verificação",
    "Nove Vetores momentâneos",
    "VEV longitudinal",
    "Resultante, IIRH, Zona e trajetória",
    "ARR, RRD, GRI, CRL e NRA",
    "Devolutiva ao participante"
  ]) assert.match(texto.stdout, new RegExp(termo, "i"));
  assert.doesNotMatch(texto.stdout, /Nenhum registro autorizado/i);
  assert.doesNotMatch(texto.stdout, /Nome completo não informado|CPF não informado/i);
});
