import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { entradaDaPlataforma } from "../lib/entrada-plataforma.ts";

const raiz = new URL("../", import.meta.url);
const fonte = (caminho) => readFile(new URL(caminho, raiz), "utf8");

async function comAmbiente(ambiente, executar) {
  const anterior = {
    VERCEL_ENV: process.env.VERCEL_ENV,
    NEXT_PUBLIC_HUMANEXUS_APP_URL: process.env.NEXT_PUBLIC_HUMANEXUS_APP_URL
  };
  try {
    for (const [chave, valor] of Object.entries(ambiente)) {
      if (valor === undefined) delete process.env[chave];
      else process.env[chave] = valor;
    }
    await executar();
  } finally {
    for (const [chave, valor] of Object.entries(anterior)) {
      if (valor === undefined) delete process.env[chave];
      else process.env[chave] = valor;
    }
  }
}

test("Preview preserva no próprio build o fluxo funcional GOLD", async () => {
  await comAmbiente(
    {
      VERCEL_ENV: "preview",
      NEXT_PUBLIC_HUMANEXUS_APP_URL:
        "https://humanexus-site-homologacao.vercel.app"
    },
    () => {
      assert.equal(entradaDaPlataforma(), "/area-humanexus");
    }
  );
});

test("produção não cria auto-loop na HOME e mantém a entrada GOLD", async () => {
  await comAmbiente(
    {
      VERCEL_ENV: "production",
      NEXT_PUBLIC_HUMANEXUS_APP_URL:
        "https://app.institutohumanexus.com/"
    },
    () => {
      assert.equal(entradaDaPlataforma(), "/area-humanexus");
    }
  );
  await comAmbiente(
    {
      VERCEL_ENV: undefined,
      NEXT_PUBLIC_HUMANEXUS_APP_URL: undefined
    },
    () => {
      assert.equal(entradaDaPlataforma(), "/area-humanexus");
    }
  );
});

test("HOME conduz à Área HUMANEXUS e dali ao login canônico", async () => {
  const [cabecalho, rodape, area, entrar] = await Promise.all([
    fonte("components/site-header.tsx"),
    fonte("components/site-footer.tsx"),
    fonte("app/(entry)/area-humanexus/page.tsx"),
    fonte("app/(entry)/entrar/page.tsx")
  ]);

  assert.match(cabecalho, /href=\{entradaDaArea\}/);
  assert.match(rodape, /href=\{entradaDaArea\}/);
  assert.match(area, /title: "Plataforma HUMANEXUS"/);
  assert.match(area, /href: "\/entrar"/);
  assert.match(entrar, /<FormularioEntrada \/>/);
});

test("entrada pública nunca monta navegação privada nem redireciona sessão válida", async () => {
  const [layoutEntrada, shellEntrada, entrar, layoutPrivado] = await Promise.all([
    fonte("app/(entry)/layout.tsx"),
    fonte("components/platform-entry-shell.tsx"),
    fonte("app/(entry)/entrar/page.tsx"),
    fonte("app/(platform)/layout.tsx")
  ]);

  assert.match(layoutEntrada, /PlatformEntryShell/);
  assert.doesNotMatch(layoutEntrada, /PlatformShell/);
  assert.doesNotMatch(shellEntrada, /PlatformNavigation|SessionContinuity|sessaoAtual/);
  assert.doesNotMatch(shellEntrada, /Administrador Proprietário|Sair com segurança/);
  assert.match(entrar, /Continuar sessão segura/);
  assert.doesNotMatch(entrar, /redirect\(/);
  assert.match(layoutPrivado, /PlatformShell/);
});

test("login, segundo fator e entrada autenticada preservam o contrato GOLD", async () => {
  const [formulario, rota, sessao, middleware] = await Promise.all([
    fonte("components/formulario-entrada.tsx"),
    fonte("app/api/sessao/entrar/route.ts"),
    fonte("lib/portal-session.ts"),
    fonte("middleware.ts")
  ]);

  assert.match(formulario, /fetch\("\/api\/sessao\/entrar"/);
  assert.match(formulario, /dados\.segundo_fator_necessario/);
  assert.match(formulario, /Confirmar segundo fator/);
  assert.match(formulario, /router\.replace\(destinoSeguro\)/);
  assert.match(rota, /confirmarSegundoFatorNoNucleo/);
  assert.match(rota, /destinoDoPerfil\(usuario\.perfil\)/);
  assert.match(sessao, /ADMINISTRADOR_PROPRIETARIO: "\/admin"/);
  assert.match(middleware, /NextResponse\.redirect\(new URL\("\/entrar"/);
});
