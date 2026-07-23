import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const source = (path) => readFile(new URL(path, root), "utf8");

test("site expõe Área HUMANEXUS sem substituir AGENDAR", async () => {
  const header = await source("components/site-header.tsx");
  const footer = await source("components/site-footer.tsx");
  const platformEntry =
    /https:\/\/app\.institutohumanexus\.com\/recuperar-acesso/;
  assert.match(header, /Área HUMANEXUS/);
  assert.match(header, /Entrar na Plataforma/);
  assert.match(header, platformEntry);
  assert.match(header, /Agendar/);
  assert.match(footer, /Área HUMANEXUS/);
  assert.match(footer, /Entrar na Plataforma/);
  assert.match(footer, platformEntry);
});

test("perfis oficiais possuem destinos privados exatos", async () => {
  const session = await source("lib/portal-session.ts");
  const expected = {
    ADMINISTRADOR_DO_SISTEMA: "/admin",
    GOVERNANCA_CIENTIFICA: "/governanca",
    ADMINISTRADOR_DA_ORGANIZACAO: "/organizacao",
    PROFISSIONAL_HUMANEXUS: "/profissional",
    VISUALIZADOR_OPERACIONAL: "/operacional",
    AUDITOR: "/auditoria"
  };
  for (const [profile, destination] of Object.entries(expected)) {
    assert.match(session, new RegExp(`${profile}: "${destination}"`));
  }
});

test("token de sessão não é armazenado no navegador", async () => {
  const files = [
    "app/(platform)/entrar/page.tsx",
    "components/formulario-entrada.tsx",
    "lib/humanexus-api.ts"
  ];
  for (const file of files) {
    const content = await source(file);
    assert.doesNotMatch(content, /sessionStorage|localStorage/);
  }
  const login = await source("app/api/sessao/entrar/route.ts");
  assert.match(login, /httpOnly: true/);
  assert.match(login, /sameSite: "strict"/);
  assert.match(login, /protocol === "https:"/);
});

test("site e plataforma possuem layouts estruturalmente isolados", async () => {
  const rootLayout = await source("app/layout.tsx");
  const siteLayout = await source("app/(site)/layout.tsx");
  const platformLayout = await source("app/(platform)/layout.tsx");
  const platformShell = await source("components/platform-shell.tsx");

  assert.doesNotMatch(rootLayout, /SiteHeader|SiteFooter|FloatingWhatsApp/);
  assert.match(siteLayout, /SiteHeader/);
  assert.match(siteLayout, /SiteFooter/);
  assert.match(siteLayout, /FloatingWhatsApp/);
  assert.match(platformLayout, /PlatformShell/);
  assert.doesNotMatch(platformShell, /SiteHeader|SiteFooter|FloatingWhatsApp/);
});

test("autenticação provisória está funcionalmente desativada", async () => {
  const legacy = await source("app/api/humanexus/auth/route.ts");
  const security = await source("lib/humanexus-security.ts");
  assert.match(legacy, /status: 410/);
  assert.doesNotMatch(security, /createProfessionalToken|verifyProfessionalCredentials/);
});

test("convite usa a rota canônica", async () => {
  const panel = await source("components/painel-profissional.tsx");
  const config = await source("next.config.ts");
  assert.match(panel, /\/anamnese\/convite\/\$\{/);
  assert.match(config, /destination: "\/anamnese\/convite\/:token"/);
});

test("middleware cobre todas as áreas privadas", async () => {
  const middleware = await source("middleware.ts");
  for (const route of [
    "/admin",
    "/governanca",
    "/organizacao",
    "/profissional",
    "/operacional",
    "/auditoria",
    "/sair"
  ]) {
    assert.match(middleware, new RegExp(`"${route.replace("/", "\\/")}`));
  }
});
