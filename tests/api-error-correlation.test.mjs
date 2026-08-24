import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const source = (path) => readFile(new URL(path, root), "utf8");

test("correlação e código do núcleo atravessam o proxy sem reclassificar 5xx como 4xx", async () => {
  const core = await source("lib/humanexus-core.ts");
  const errors = await source("lib/api-route-error.ts");
  const route = await source("app/api/operacao-homologacao/route.ts");

  assert.match(core, /readonly correlacao\?: string/);
  assert.match(core, /headers\.get\("x-humanexus-correlation-id"\)/);
  assert.match(errors, /class ErroDaRota extends Error/);
  assert.match(errors, /erroConhecido/);
  assert.match(errors, /erro\.correlacao/);
  assert.match(errors, /erro\.codigo/);
  assert.match(errors, /"x-humanexus-correlation-id": correlacao/);
  assert.match(errors, /preservarMensagemSeguraDoNucleo/);
  assert.match(errors, /\[400, 409, 422\]\.includes\(status\)/);
  assert.match(route, /responderErroDaApi/);
  assert.match(route, /rota: "COMANDO_OPERACIONAL"/);
  assert.match(route, /preservarMensagemSeguraDoNucleo: true/);
  assert.doesNotMatch(route, /catch \(erro\) \{\s*return NextResponse\.json/);
  assert.doesNotMatch(
    route,
    /catch \(erro\) \{\s*return NextResponse\.json\([^]*?\{ status: 400 \}\);\s*\}\s*$/
  );
});
