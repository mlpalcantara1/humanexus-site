import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const participante = readFileSync(
  new URL("../components/anamnese-participante.tsx", import.meta.url),
  "utf8"
);
const estilos = readFileSync(
  new URL("../app/anamnese-operacional.css", import.meta.url),
  "utf8"
);

test("revisão aguarda sincronização e recarrega a verdade do backend", () => {
  assert.match(participante, /async function openReview\(\)/);
  assert.match(participante, /const authoritative = await load\(true\)/);
  assert.match(participante, /structure\?\.validacao\.percentual/);
  assert.match(participante, /structure\.validacao\.pode_concluir/);
  assert.doesNotMatch(
    participante,
    /void syncPending\(\);\s*setReviewing\(true\)/
  );
});

test("participante não recebe códigos internos como títulos visíveis", () => {
  assert.match(
    participante,
    /sections\[section\]\?\.rotulo \?\? "Anamnese Regulatória"/
  );
  assert.match(participante, /structure\.nicho_rotulo/);
  assert.doesNotMatch(
    participante,
    /question\.codigo\} · \{\(question\.secao/
  );
});

test("catálogo visível possui proteção adicional contra duplicidades", () => {
  assert.match(participante, /seenAlternatives/);
  assert.match(participante, /normalize\("NFD"\)/);
});

test("checkboxes e radios preservam alinhamento e acessibilidade", () => {
  assert.match(
    estilos,
    /input:not\(\[type="radio"\]\):not\(\[type="checkbox"\]\)/
  );
  assert.match(estilos, /\.hx-anamnese-option\{display:grid!important/);
  assert.match(estilos, /\.hx-anamnese-option:focus-within/);
  assert.match(estilos, /min-height:48px/);
  assert.match(participante, /aria-describedby=/);
});
