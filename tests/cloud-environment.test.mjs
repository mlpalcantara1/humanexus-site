import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import test from "node:test";

const raiz = new URL("../", import.meta.url);
const script = new URL("../deploy/vercel/verificar-ambiente.mjs", import.meta.url);
const coreCandidato =
  "https://humanexus-core-12dmrtx51-mlpalcantara1-5540s-projects.vercel.app";
const bypassFicticio = "bypass-ficticio-com-mais-de-trinta-e-dois";

function verificar(ambiente) {
  return spawnSync(process.execPath, [script.pathname], {
    env: { PATH: process.env.PATH, ...ambiente },
    encoding: "utf8"
  });
}

test("Preview usa Core candidato com bypass somente no servidor", () => {
  const resultado = verificar({
    HUMANEXUS_ENVIRONMENT: "homologacao",
    HUMANEXUS_CORE_API_URL: coreCandidato,
    HUMANEXUS_CORE_PROTECTION_BYPASS_SECRET: bypassFicticio,
    NEXT_PUBLIC_HUMANEXUS_APP_URL: "https://homologacao.exemplo.invalid",
    HUMANEXUS_INVITE_SECRET: "segredo-ficticio-com-mais-de-trinta-e-dois"
  });
  assert.equal(resultado.status, 0, resultado.stderr);
});

test("Preview bloqueia Production e qualquer Core divergente", () => {
  const resultado = verificar({
    HUMANEXUS_ENVIRONMENT: "homologacao",
    HUMANEXUS_CORE_API_URL: "https://api.institutohumanexus.com",
    HUMANEXUS_CORE_PROTECTION_BYPASS_SECRET: bypassFicticio,
    NEXT_PUBLIC_HUMANEXUS_APP_URL: "https://homologacao.exemplo.invalid",
    HUMANEXUS_INVITE_SECRET: "segredo-ficticio-com-mais-de-trinta-e-dois"
  });
  assert.notEqual(resultado.status, 0);
  assert.match(resultado.stderr, /Core candidato protegido/);
});

test("Preview bloqueia ausência do bypass servidor-a-servidor", () => {
  const resultado = verificar({
    HUMANEXUS_ENVIRONMENT: "homologacao",
    HUMANEXUS_CORE_API_URL: coreCandidato,
    NEXT_PUBLIC_HUMANEXUS_APP_URL: "https://homologacao.exemplo.invalid",
    HUMANEXUS_INVITE_SECRET: "segredo-ficticio-com-mais-de-trinta-e-dois"
  });
  assert.notEqual(resultado.status, 0);
  assert.match(resultado.stderr, /PROTECTION_BYPASS_SECRET ausente ou fraco/);
});

test("segredo de bypass nunca usa prefixo público", () => {
  const resultado = verificar({
    HUMANEXUS_ENVIRONMENT: "homologacao",
    HUMANEXUS_CORE_API_URL: coreCandidato,
    HUMANEXUS_CORE_PROTECTION_BYPASS_SECRET: bypassFicticio,
    NEXT_PUBLIC_HUMANEXUS_CORE_PROTECTION_BYPASS_SECRET: bypassFicticio,
    NEXT_PUBLIC_HUMANEXUS_APP_URL: "https://homologacao.exemplo.invalid",
    HUMANEXUS_INVITE_SECRET: "segredo-ficticio-com-mais-de-trinta-e-dois"
  });
  assert.notEqual(resultado.status, 0);
  assert.match(resultado.stderr, /não pode ser exposto ao browser/);
});

test("homologação bloqueia o domínio operacional", () => {
  const resultado = verificar({
    HUMANEXUS_ENVIRONMENT: "homologacao",
    HUMANEXUS_CORE_API_URL: coreCandidato,
    HUMANEXUS_CORE_PROTECTION_BYPASS_SECRET: bypassFicticio,
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
