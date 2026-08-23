import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import test from "node:test";

const raiz = new URL("../", import.meta.url);
const script = new URL("../deploy/vercel/verificar-ambiente.mjs", import.meta.url);
const coreCandidato =
  "https://humanexus-core-nteknuq90-mlpalcantara1-5540s-projects.vercel.app";
const hostnameCoreCandidato = new URL(coreCandidato).hostname;
const databasePreview =
  "postgresql://usuario:segredo@ep-dry-bar-acj2wv8r-pooler.sa-east-1.aws.neon.tech/banco";
const databaseProduction =
  "postgresql://usuario:segredo@ep-dark-firefly-ac54nu73-pooler.sa-east-1.aws.neon.tech/banco";
const bypassFicticio = "bypass-ficticio-com-mais-de-trinta-e-dois";

function verificar(ambiente) {
  return spawnSync(process.execPath, [script.pathname], {
    env: {
      PATH: process.env.PATH,
      DATABASE_URL: databasePreview,
      HUMANEXUS_EXPECTED_PREVIEW_CORE_HOSTNAME: hostnameCoreCandidato,
      ...ambiente
    },
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

test("Preview recusa o endpoint Neon de Production", () => {
  const resultado = verificar({
    HUMANEXUS_ENVIRONMENT: "homologacao",
    HUMANEXUS_CORE_API_URL: coreCandidato,
    HUMANEXUS_CORE_PROTECTION_BYPASS_SECRET: bypassFicticio,
    NEXT_PUBLIC_HUMANEXUS_APP_URL: "https://homologacao.exemplo.invalid",
    HUMANEXUS_INVITE_SECRET: "segredo-ficticio-com-mais-de-trinta-e-dois",
    DATABASE_URL: databaseProduction
  });
  assert.notEqual(resultado.status, 0);
  assert.match(resultado.stderr, /endpoint Neon isolado/);
});

test("Production recusa o endpoint Neon de Preview", () => {
  const resultado = verificar({
    HUMANEXUS_ENVIRONMENT: "production",
    HUMANEXUS_CORE_API_URL: "https://api.institutohumanexus.com",
    NEXT_PUBLIC_HUMANEXUS_APP_URL: "https://app.institutohumanexus.com",
    HUMANEXUS_INVITE_SECRET: "segredo-ficticio-com-mais-de-trinta-e-dois",
    HUMANEXUS_EXPECTED_PREVIEW_CORE_HOSTNAME: "",
    DATABASE_URL: databasePreview
  });
  assert.notEqual(resultado.status, 0);
  assert.match(resultado.stderr, /endpoint Neon canônico de produção/);
});

test("Production aceita somente o endpoint Neon canônico", () => {
  const resultado = verificar({
    HUMANEXUS_ENVIRONMENT: "production",
    HUMANEXUS_CORE_API_URL: "https://api.institutohumanexus.com",
    NEXT_PUBLIC_HUMANEXUS_APP_URL: "https://app.institutohumanexus.com",
    HUMANEXUS_INVITE_SECRET: "segredo-ficticio-com-mais-de-trinta-e-dois",
    HUMANEXUS_EXPECTED_PREVIEW_CORE_HOSTNAME: "",
    DATABASE_URL: databaseProduction
  });
  assert.equal(resultado.status, 0, resultado.stderr);
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
