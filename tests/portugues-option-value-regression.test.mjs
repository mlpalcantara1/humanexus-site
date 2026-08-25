import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const raiz = new URL("../", import.meta.url);
const fonte = (caminho) => readFile(new URL(caminho, raiz), "utf8");

test("tradução visual preserva o valor canônico de opções sem value explícito", async () => {
  const camada = await fonte("components/camada-portugues-visivel.tsx");

  assert.match(camada, /no\.parentElement instanceof HTMLOptionElement/);
  assert.match(camada, /!no\.parentElement\.hasAttribute\("value"\)/);
  assert.match(
    camada,
    /setAttribute\("value", no\.parentElement\.value\)/
  );
  assert.ok(
    camada.indexOf('setAttribute("value", no.parentElement.value)')
      < camada.indexOf("portuguesVisivelPreservandoEspacos(atual)"),
    "o valor implícito deve ser congelado antes de traduzir o rótulo"
  );
});

test("formulário de governança mantém os códigos canônicos como origem", async () => {
  const governanca = await fonte("components/governanca-operacional.tsx");

  for (const codigo of [
    "TCLE",
    "AVISO_PRIVACIDADE",
    "DADOS_PESSOAIS",
    "DADOS_SENSIVEIS",
    "AUTORIZACAO_POLAR_H10",
    "AUTORIZACAO_EEG"
  ]) {
    assert.match(governanca, new RegExp(`<option>${codigo}</option>`));
  }
});
