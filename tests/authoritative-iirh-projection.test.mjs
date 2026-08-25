import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

import { resolverIirhAutoritativo } from "../lib/authoritative-iirh-projection.ts";

const estruturaRealRedigida = {
  estado: "CALCULADO",
  valor: 37.25,
  unidade: "0-100",
  cobertura: 50,
  confiabilidade: 0.12,
  motivo: "REGISTRO CIENTÍFICO CANÔNICO LIBERADO PELO NÚCLEO",
  por_que_este_resultado: {
    resumo: "ESTRUTURA AUTORITATIVA REDIGIDA"
  }
};

test("estrutura autoritativa real redigida projeta estado CALCULADO sem recálculo", () => {
  const projecao = resolverIirhAutoritativo(estruturaRealRedigida);

  assert.equal(projecao.calculado, true);
  assert.equal(projecao.estado, "CALCULADO");
  assert.equal(projecao.valor, 37.25);
  assert.equal(projecao.unidade, "0-100");
  assert.equal(
    projecao.motivo,
    "REGISTRO CIENTÍFICO CANÔNICO LIBERADO PELO NÚCLEO"
  );
  assert.equal(projecao.registro, estruturaRealRedigida);
});

test("zero autoritativo permanece calculado", () => {
  const projecao = resolverIirhAutoritativo({
    estado: "CALCULADO",
    valor: 0,
    unidade: "0-100"
  });

  assert.equal(projecao.calculado, true);
  assert.equal(projecao.valor, 0);
});

for (const estado of ["PARCIAL", "PLENO"]) {
  test(`estado ${estado} do contrato TIRH V1 permanece calculado`, () => {
    const projecao = resolverIirhAutoritativo({ estado, valor: 48 });
    assert.equal(projecao.calculado, true);
    assert.equal(projecao.valor, 48);
  });
}

test("ausência científica legítima preserva estado e motivo sem exibir valor residual", () => {
  const projecao = resolverIirhAutoritativo({
    estado: "NAO_CALCULAVEL",
    valor: 91,
    motivo: "COBERTURA_FUNCIONAL_INSUFICIENTE"
  });

  assert.equal(projecao.calculado, false);
  assert.equal(projecao.valor, null);
  assert.equal(projecao.estado, "NAO_CALCULAVEL");
  assert.equal(projecao.motivo, "COBERTURA_FUNCIONAL_INSUFICIENTE");
});

test("valor sem estado calculado explícito nunca vira fallback", () => {
  const projecao = resolverIirhAutoritativo({ valor: 64 });
  assert.equal(projecao.calculado, false);
  assert.equal(projecao.valor, null);
});

test("as projeções humanas usam o resolvedor compartilhado e não calculam IIRH", async () => {
  const arquivos = await Promise.all([
    "../components/operacao-homologacao.tsx",
    "../components/cockpit-operacional-vivo.tsx",
    "../components/sintese-validacao-tirh-v1.tsx",
    "../lib/tirh-report-document.ts"
  ].map((caminho) => readFile(new URL(caminho, import.meta.url), "utf8")));

  for (const fonte of arquivos) {
    assert.match(fonte, /resolverIirhAutoritativo/);
    assert.doesNotMatch(fonte, /calcularIirh/i);
  }
});
