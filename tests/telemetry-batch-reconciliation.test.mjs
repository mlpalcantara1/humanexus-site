import assert from "node:assert/strict";
import test from "node:test";
import { conciliarTelemetriaDoNucleo } from "../lib/telemetry-batch-reconciliation.ts";

test("preserva o lote confirmado sem consulta adicional", async () => {
  let chamadas = 0;
  const pacotes = [{ sequencia: 1 }];
  const resultado = await conciliarTelemetriaDoNucleo(
    pacotes,
    true,
    async () => { chamadas++; return []; }
  );
  assert.equal(chamadas, 0);
  assert.deepEqual(resultado.pacotes, pacotes);
  assert.equal(resultado.diagnostico, "LOTE_CONFIRMADO");
});

test("sessão sem histórico não exige leitura direta", async () => {
  let chamadas = 0;
  const resultado = await conciliarTelemetriaDoNucleo(
    [],
    false,
    async () => { chamadas++; return []; }
  );
  assert.equal(chamadas, 0);
  assert.equal(resultado.diagnostico, "SEM_HISTORICO_CONFIRMADO");
});

test("lote vazio com histórico confirmado recupera somente pacotes da leitura autenticada", async () => {
  const pacotes = [{ sequencia: 10, instante: "historico" }];
  const resultado = await conciliarTelemetriaDoNucleo(
    [],
    true,
    async () => pacotes
  );
  assert.deepEqual(resultado.pacotes, pacotes);
  assert.equal(resultado.diagnostico, "RECUPERADA_POR_CONSULTA_DIRETA");
});

test("ausência ou falha nas duas leituras não é apresentada como ausência de aquisição", async () => {
  const vazio = await conciliarTelemetriaDoNucleo([], true, async () => []);
  const falha = await conciliarTelemetriaDoNucleo([], true, async () => {
    throw new Error("transporte indisponível");
  });
  for (const resultado of [vazio, falha]) {
    assert.deepEqual(resultado.pacotes, []);
    assert.equal(resultado.diagnostico, "DIVERGENCIA_ENTRE_FONTES");
  }
});
