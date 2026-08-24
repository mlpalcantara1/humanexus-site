import test from "node:test";
import assert from "node:assert/strict";
import { resolverTempoCanonicoDoCockpit } from "../lib/cockpit-canonical-time.ts";

const baseline = {
  estado: "INICIADO",
  duracao_segundos: 71.38,
  cronometro_em_execucao: true
};

test("fluxo PRÉ/TREINO/PÓS usa o tempo do Baseline enquanto ele está ativo", () => {
  const resultado = resolverTempoCanonicoDoCockpit({
    sessaoBaseline: false,
    baseline,
    fase: {}
  });
  assert.equal(resultado.registro, baseline);
  assert.equal(resultado.rotulo, "Referência inicial");
});

test("pausa e finalização do Baseline preservam sua autoridade temporal", () => {
  for (const estado of ["PAUSADO", "FINALIZADO"]) {
    const registro = { ...baseline, estado, cronometro_em_execucao: false };
    const resultado = resolverTempoCanonicoDoCockpit({
      sessaoBaseline: false,
      baseline: registro,
      fase: {}
    });
    assert.equal(resultado.registro, registro);
    assert.equal(resultado.rotulo, "Referência inicial");
  }
});

test("fase identificada assume a autoridade temporal sem herdar o Baseline", () => {
  const fase = { fase: "PRE", duracao_segundos: 12 };
  const resultado = resolverTempoCanonicoDoCockpit({
    sessaoBaseline: false,
    baseline: { ...baseline, estado: "FINALIZADO" },
    fase
  });
  assert.equal(resultado.registro, fase);
  assert.equal(resultado.rotulo, "PRE");
});

test("sessão independente de Baseline sempre usa seu registro canônico", () => {
  const registro = { ...baseline, estado: "PAUSADO" };
  const resultado = resolverTempoCanonicoDoCockpit({
    sessaoBaseline: true,
    baseline: registro,
    fase: { fase: "PRE", duracao_segundos: 99 }
  });
  assert.equal(resultado.registro, registro);
  assert.equal(resultado.rotulo, "Referência inicial");
});
