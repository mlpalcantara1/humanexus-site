import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const raiz = new URL("../", import.meta.url);
const ler = (caminho) => readFile(new URL(caminho, raiz), "utf8");

test("a camada visível não altera o DOM durante a hidratação inicial", async () => {
  const fonte = await ler("components/camada-portugues-visivel.tsx");

  assert.match(fonte, /ativarTraducaoDepoisDaHidratacaoInicial/);
  assert.match(fonte, /document\.readyState === "complete"/);
  assert.match(fonte, /addEventListener\("load", depoisDoCarregamento/);
  assert.match(fonte, /requestAnimationFrame/);
  assert.match(fonte, /requestIdleCallback/);

  const inicioDoEfeito = fonte.indexOf("export function CamadaPortuguesVisivel");
  const chamadaProtegida = fonte.indexOf(
    "ativarTraducaoDepoisDaHidratacaoInicial(() =>",
    inicioDoEfeito
  );
  const primeiraMutacao = fonte.indexOf(
    "traduzirArvore(document.body)",
    inicioDoEfeito
  );
  const observacao = fonte.indexOf(
    "observador.observe(document.body",
    inicioDoEfeito
  );

  assert.ok(chamadaProtegida > inicioDoEfeito);
  assert.ok(primeiraMutacao > chamadaProtegida);
  assert.ok(observacao > chamadaProtegida);
  assert.equal(
    fonte.slice(inicioDoEfeito, chamadaProtegida)
      .includes("traduzirArvore(document.body)"),
    false
  );
});

test("a correção preserva tradução, observação dinâmica e limpeza completa", async () => {
  const fonte = await ler("components/camada-portugues-visivel.tsx");

  assert.match(fonte, /portuguesVisivelPreservandoEspacos/);
  assert.match(fonte, /new MutationObserver/);
  assert.match(fonte, /characterData: true/);
  assert.match(fonte, /attributeFilter: \[\.\.\.ATRIBUTOS_VISIVEIS\]/);
  assert.match(fonte, /cancelarAtivacao\(\)/);
  assert.match(fonte, /observador\?\.disconnect\(\)/);
});

test("a página administrativa permanece SSR e sem supressão genérica", async () => {
  const [pagina, layout, camada] = await Promise.all([
    ler("app/(platform)/admin/page.tsx"),
    ler("app/(platform)/layout.tsx"),
    ler("components/camada-portugues-visivel.tsx")
  ]);

  assert.doesNotMatch(pagina, /"use client"/);
  assert.doesNotMatch(layout, /dynamic\([^)]*ssr:\s*false/s);
  assert.doesNotMatch(camada, /suppressHydrationWarning/);
  assert.match(pagina, /await sessaoAtual\(\)/);
  assert.match(layout, /<PlatformShell>/);
});
