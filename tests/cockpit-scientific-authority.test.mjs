import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { snapshotOficialDeFaseAplicavel } from "../lib/cockpit-scientific-authority.ts";

function leitura(overrides = {}) {
  return {
    origem_temporal: "SNAPSHOT_FASE_PERSISTIDO",
    snapshot_de_fase: {
      identificador_da_sessao: "sessao-a",
      fase: "POS",
      integridade_sha256: "integridade-preservada"
    },
    vetores: [
      { definicao: "VH", magnitude: { valor: 61.25 } },
      { definicao: "VSI", magnitude: { valor: null } }
    ],
    iirh: { estado: "CALCULADO", valor: 58.86 },
    zona: { estado: "NAO_CLASSIFICAVEL", codigo: null },
    resultante: { estado: "CALCULAVEL", valor: 60.65 },
    ...overrides
  };
}

test("sessão terminal aceita somente o snapshot oficial da própria sessão", () => {
  assert.equal(snapshotOficialDeFaseAplicavel({
    leituraCientifica: leitura(),
    identificadorDaSessao: "sessao-a",
    sessaoFinalizada: true
  }), true);
});

test("snapshot de outra sessão, sem integridade ou fora de fase é rejeitado", () => {
  for (const snapshot_de_fase of [
    {
      identificador_da_sessao: "sessao-b",
      fase: "POS",
      integridade_sha256: "integridade-preservada"
    },
    {
      identificador_da_sessao: "sessao-a",
      fase: "POS",
      integridade_sha256: ""
    },
    {
      identificador_da_sessao: "sessao-a",
      fase: "OUTRA",
      integridade_sha256: "integridade-preservada"
    }
  ]) {
    assert.equal(snapshotOficialDeFaseAplicavel({
      leituraCientifica: leitura({ snapshot_de_fase }),
      identificadorDaSessao: "sessao-a",
      sessaoFinalizada: true
    }), false);
  }
});

test("Baseline finalizado aceita somente seu snapshot oficial assinado", () => {
  assert.equal(snapshotOficialDeFaseAplicavel({
    leituraCientifica: leitura({
      snapshot_de_fase: {
        identificador_da_sessao: "sessao-a",
        fase: "BASELINE",
        integridade_sha256: "integridade-baseline"
      }
    }),
    identificadorDaSessao: "sessao-a",
    sessaoFinalizada: true
  }), true);
});

test("Portal separa resultado atual, janela em formação e referência histórica", async () => {
  const cockpit = await readFile(
    new URL("../components/cockpit-operacional-vivo.tsx", import.meta.url),
    "utf8"
  );
  assert.match(cockpit, /estado_da_janela_cientifica/);
  assert.match(cockpit, /JANELA EM FORMAÇÃO/);
  assert.match(cockpit, /referencia_historica_da_fase_anterior/);
  assert.match(cockpit, /não é apresentada como valor atual/);
  assert.match(cockpit, /referencia_temporal_congelada/);
  assert.match(cockpit, /resultanteAutoritativa/);
});

test("fase histórica explícita atravessa Portal e Núcleo sem cálculo local", async () => {
  const rota = await readFile(
    new URL("../app/api/operacao-homologacao/route.ts", import.meta.url),
    "utf8"
  );
  const componente = await readFile(
    new URL("../components/operacao-homologacao.tsx", import.meta.url),
    "utf8"
  );
  assert.match(rota, /fase_cientifica/);
  assert.match(rota, /parametros\.set\("fase"/);
  assert.match(componente, /fase_cientifica/);
  assert.doesNotMatch(
    cockpitCalculationSource(componentSource(componente)),
    /calcular.*(?:IIRH|Zona|Resultante)/i
  );
});

function componentSource(source) {
  return source;
}

function cockpitCalculationSource(source) {
  return source;
}

test("leitura viva nunca é convertida em snapshot histórico pelo Portal", () => {
  assert.equal(snapshotOficialDeFaseAplicavel({
    leituraCientifica: leitura({ origem_temporal: "AO_VIVO" }),
    identificadorDaSessao: "sessao-a",
    sessaoFinalizada: true
  }), false);
  assert.equal(snapshotOficialDeFaseAplicavel({
    leituraCientifica: leitura(),
    identificadorDaSessao: "sessao-a",
    sessaoFinalizada: false
  }), false);
});
