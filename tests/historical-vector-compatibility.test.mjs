import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  VETORES_MOMENTANEOS_CANONICOS,
  compatibilizarVetoresDoSnapshotHistorico,
  itensCanonicosDaLinhaHistorica
} from "../lib/historical-vector-compatibility.ts";

const vetor = (codigo, campo = "definicao", valor = 50) => ({
  [campo]: codigo,
  magnitude: { valor },
  fase: "POS",
  timestamp: "2026-01-01T00:00:00Z"
});
const dezEntradas = () => [
  ...VETORES_MOMENTANEOS_CANONICOS.map((codigo) => vetor(codigo)),
  vetor("VEV")
];

test("formato histórico real redigido mantém nove vetores e separa VEV", () => {
  const bruto = dezEntradas();
  const antes = structuredClone(bruto);
  const projecao = compatibilizarVetoresDoSnapshotHistorico(bruto);

  assert.equal(projecao.quantidadeBrutaDeEntradas, 10);
  assert.deepEqual(
    projecao.vetoresMomentaneosCanonicos.map((item) => item.codigo),
    VETORES_MOMENTANEOS_CANONICOS
  );
  assert.equal(projecao.vetorLongitudinal.codigo, "VEV");
  assert.equal(projecao.calculoCientificoExecutado, false);
  assert.deepEqual(bruto, antes);
});

test("alias duplicado é preservado e não entra duas vezes", () => {
  const projecao = compatibilizarVetoresDoSnapshotHistorico([
    ...dezEntradas(),
    vetor("VETOR_HUMANO", "codigo")
  ]);
  assert.equal(projecao.vetoresMomentaneosCanonicos.length, 9);
  assert.equal(
    projecao.entradasHistoricasAdicionais.at(-1).classificacao,
    "ALIAS_HISTORICO_DUPLICADO"
  );
  assert.equal(
    projecao.bloqueadorExato,
    "ENTRADA_HISTORICA_DESCONHECIDA_OU_DUPLICADA"
  );
});

test("metadado e chave desconhecida ficam fora da contagem canônica", () => {
  const metadado = compatibilizarVetoresDoSnapshotHistorico([
    ...dezEntradas(),
    { tipo: "METADADO_DE_PROVENIENCIA" }
  ]);
  const desconhecida = compatibilizarVetoresDoSnapshotHistorico([
    ...dezEntradas(),
    vetor("VX")
  ]);
  assert.equal(metadado.vetoresMomentaneosCanonicos.length, 9);
  assert.equal(
    metadado.entradasHistoricasAdicionais.at(-1).classificacao,
    "METADADO_HISTORICO"
  );
  assert.equal(desconhecida.vetoresMomentaneosCanonicos.length, 9);
  assert.equal(desconhecida.entradaDesconhecidaIncluidaNoCalculo, false);
  assert.equal(
    desconhecida.diagnosticos.at(-1).codigo,
    "ENTRADA_HISTORICA_DESCONHECIDA"
  );
});

test("9/9 e 8/9 preservam a ausência sem preencher valor", () => {
  const completo = compatibilizarVetoresDoSnapshotHistorico(
    VETORES_MOMENTANEOS_CANONICOS.map((codigo) => vetor(codigo))
  );
  const parcial = compatibilizarVetoresDoSnapshotHistorico(
    VETORES_MOMENTANEOS_CANONICOS
      .filter((codigo) => codigo !== "VR")
      .map((codigo) => vetor(codigo))
  );
  assert.equal(completo.vetoresMomentaneosCanonicos.length, 9);
  assert.deepEqual(completo.vetoresMomentaneosAusentes, []);
  assert.equal(parcial.vetoresMomentaneosCanonicos.length, 8);
  assert.deepEqual(parcial.vetoresMomentaneosAusentes, ["VR"]);
});

for (const fase of ["BASELINE", "PRE", "TREINO", "POS"]) {
  test(`${fase} preserva fase e timestamp do registro estrutural`, () => {
    const projecao = compatibilizarVetoresDoSnapshotHistorico(
      dezEntradas().map((item) => ({ ...item, fase }))
    );
    assert.equal(projecao.vetoresMomentaneosCanonicos[0].fase, fase);
    assert.equal(
      projecao.vetoresMomentaneosCanonicos[0].timestamp,
      "2026-01-01T00:00:00Z"
    );
  });
}

test("linha histórica nasce de fases e timestamps autoritativos", () => {
  const itens = itensCanonicosDaLinhaHistorica({
    itensReplay: [],
    eventos: [
      { momento: "PRE", tipo: "INICIO", ocorrido_em: "2026-01-01T00:00:00Z" },
      { momento: "TREINO", tipo: "INICIO", ocorrido_em: "2026-01-01T00:01:00Z" },
      { momento: "POS", tipo: "ENCERRAMENTO", ocorrido_em: "2026-01-01T00:02:00Z" }
    ],
    registroBaseline: {
      iniciado_em: "2025-12-31T23:58:00Z",
      finalizado_em: "2025-12-31T23:59:00Z"
    }
  });
  assert.deepEqual(itens.map((item) => item.track), [
    "REFERÊNCIA INICIAL",
    "REFERÊNCIA INICIAL",
    "PRÉ",
    "TREINO",
    "PÓS"
  ]);
  assert.ok(itens.every((item) => item.source.includes("NÚCLEO OFICIAL")));
});

test("Resultante histórica continua vindo da autoridade do Núcleo", async () => {
  const fonte = await readFile(
    new URL("../components/operacao-homologacao.tsx", import.meta.url),
    "utf8"
  );
  assert.match(fonte, /resultanteReplay = objeto\(projecaoReplay\.resultante\)/);
  assert.match(fonte, /compatibilizarVetoresDoSnapshotHistorico/);
  assert.doesNotMatch(fonte, /calcular(?:IIRH|Zona|Resultante)/i);
});

test("atualização reexecuta projeção pura sem herdar contagem anterior", () => {
  const primeiro = compatibilizarVetoresDoSnapshotHistorico(
    dezEntradas().slice(0, 8)
  );
  const segundo = compatibilizarVetoresDoSnapshotHistorico(dezEntradas());
  assert.equal(primeiro.vetoresMomentaneosCanonicos.length, 8);
  assert.equal(segundo.vetoresMomentaneosCanonicos.length, 9);
});
