import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import test from "node:test";

const raiz = new URL("../", import.meta.url);
const script = new URL("../deploy/vercel/verificar-ambiente.mjs", import.meta.url);

function verificar(ambiente) {
  return spawnSync(process.execPath, [script.pathname], {
    env: { PATH: process.env.PATH, ...ambiente },
    encoding: "utf8"
  });
}

test("homologação aceita somente URLs HTTPS separadas", () => {
  const resultado = verificar({
    HUMANEXUS_ENVIRONMENT: "homologacao",
    HUMANEXUS_CORE_API_URL: "https://api-homologacao.exemplo.invalid",
    NEXT_PUBLIC_HUMANEXUS_APP_URL: "https://homologacao.exemplo.invalid",
    HUMANEXUS_INVITE_SECRET: "segredo-ficticio-com-mais-de-trinta-e-dois"
  });
  assert.equal(resultado.status, 0, resultado.stderr);
});

test("homologação bloqueia o domínio operacional", () => {
  const resultado = verificar({
    HUMANEXUS_ENVIRONMENT: "homologacao",
    HUMANEXUS_CORE_API_URL: "https://api-homologacao.exemplo.invalid",
    NEXT_PUBLIC_HUMANEXUS_APP_URL: "https://app.institutohumanexus.com",
    HUMANEXUS_INVITE_SECRET: "segredo-ficticio-com-mais-de-trinta-e-dois"
  });
  assert.notEqual(resultado.status, 0);
  assert.match(resultado.stderr, /plataforma operacional/);
});

test("deploy automático permanece desabilitado", async () => {
  const configuracao = JSON.parse(
    await readFile(new URL("../vercel.json", import.meta.url), "utf8")
  );
  assert.equal(configuracao.git.deploymentEnabled, false);
  assert.equal(configuracao.regions[0], "gru1");
});

test("URL do núcleo não é exposta como variável pública", async () => {
  const exemplo = await readFile(new URL("../.env.example", import.meta.url), "utf8");
  assert.match(exemplo, /^HUMANEXUS_CORE_API_URL=/m);
  assert.doesNotMatch(exemplo, /NEXT_PUBLIC_HUMANEXUS_CORE_API_URL/);
});
