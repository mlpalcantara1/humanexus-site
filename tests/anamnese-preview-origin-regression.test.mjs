import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const painel = await readFile(
  new URL("../components/painel-profissional.tsx", import.meta.url),
  "utf8"
);

test("convite da anamnese permanece no mesmo ambiente do operador", () => {
  assert.ok(
    painel.includes('const base = window.location.origin.replace(/\\/$/, "");')
  );
  assert.doesNotMatch(painel, /NEXT_PUBLIC_HUMANEXUS_APP_URL/);
  assert.doesNotMatch(painel, /humanexus-site-homologacao\.vercel\.app/);
  assert.equal(
    (painel.match(/montarLigacaoDoConvite\(gerado\.token_de_entrega_unica\)/g) ?? []).length,
    2
  );
});

test("ligação técnica exibida não passa pela tradução de conteúdo", () => {
  assert.match(
    painel,
    /className="hx-invite-link" data-portugues-preservar="true">\{link\}/
  );
  assert.match(painel, /<a href=\{link\}/);
});
