import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  estadoGeometricoVetorial,
  tendenciaVetorialCanonica,
  vetoresDaVisao
} from "../lib/cockpit-vector-views.ts";
import {
  CADENCIA_VISUAL_REGULATORIA_MS,
  estabilizarApresentacaoRegulatoria
} from "../lib/cockpit-regulatory-visual-stability.ts";

const vetores = [
  ["VH", "Vetor Humano", "MCH"],
  ["VT", "Vetor Tarefa", "MCT"],
  ["VS", "Vetor Social", "MCE"],
  ["VSI", "Vetor Simbólico", "MCE"],
  ["VAR", "Vetor Autonômico", "MCN"],
  ["VAM", "Vetor Ação/Motor", "MCN"],
  ["VJ", "Vetor Julgamento", "MCN"],
  ["VE", "Vetor Estabilidade", "MCH"],
  ["VR", "Vetor Recuperação", "MCH"],
  ["VEV", "Vetor Evolução", "MCH"]
].map(([code, name, macrofield]) => ({ code, name, macrofield, value: null }));

function revisao(contexto, ordemCanonica, valores, ativo = true) {
  return {
    contexto,
    ordemCanonica,
    ativo,
    vetores: vetores.map((vetor) => ({
      ...vetor,
      value: Object.hasOwn(valores, vetor.code) ? valores[vetor.code] : null
    })),
    iirh: null,
    zona: null
  };
}

test("A/B/N — ausência e configuração parcial nunca formam geometria falsa", () => {
  const ausente = estadoGeometricoVetorial(vetores);
  assert.deepEqual(ausente, {
    calculados: 0,
    total: 10,
    completo: false,
    permitePoligono: false
  });
  const parcial = estadoGeometricoVetorial(vetores.map((vetor) => ({
    ...vetor,
    value: vetor.code === "VH" ? 0.4317 : null
  })));
  assert.equal(parcial.calculados, 1);
  assert.equal(parcial.permitePoligono, false);
});

test("E — HUMANO, TAREFA e SÍNTESE usam apenas o macrocampo canônico", () => {
  assert.deepEqual(vetoresDaVisao(vetores, "HUMANO").map((item) => item.code), [
    "VH", "VE", "VR", "VEV"
  ]);
  assert.deepEqual(vetoresDaVisao(vetores, "TAREFA").map((item) => item.code), ["VT"]);
  assert.deepEqual(vetoresDaVisao(vetores, "SINTESE").map((item) => item.code), [
    "VH", "VT", "VS", "VSI", "VAR", "VAM", "VJ", "VE", "VR", "VEV"
  ]);
});

test("C/D — atualização única e simultânea aplica a revisão canônica sem cálculo local", () => {
  const contexto = "org-a|p-a|s-a|BASELINE";
  let estado = estabilizarApresentacaoRegulatoria(
    null,
    revisao(contexto, 1, { VH: 0.43 }),
    0
  );
  estado = estabilizarApresentacaoRegulatoria(
    estado,
    revisao(contexto, 2, { VH: 0.44, VT: 0.52, VSI: 0.49, VR: 0.37 }),
    CADENCIA_VISUAL_REGULATORIA_MS
  );
  assert.equal(estado.vetores.find((item) => item.code === "VH")?.value, 0.44);
  assert.equal(estado.vetores.find((item) => item.code === "VT")?.value, 0.52);
  assert.equal(estado.vetores.find((item) => item.code === "VS")?.value, null);
});

test("F/G — fase nova limpa o estado anterior e resposta atrasada não regride", () => {
  const baseline = "org-a|p-a|s-a|BASELINE";
  let estado = estabilizarApresentacaoRegulatoria(
    null,
    revisao(baseline, 10, { VH: 0.43 }),
    0
  );
  const atrasada = estabilizarApresentacaoRegulatoria(
    estado,
    revisao(baseline, 9, { VH: 0.12 }),
    2_000
  );
  assert.equal(atrasada.vetores[0].value, 0.43);
  estado = estabilizarApresentacaoRegulatoria(
    atrasada,
    revisao("org-a|p-a|s-a|PRE", 1, {}),
    2_100
  );
  assert.equal(estado.vetores[0].value, null);
  assert.match(estado.contexto, /\|PRE$/);
});

test("H/I/O — interrupção, foreground e reconexão retomam somente do canônico", () => {
  const contexto = "org-a|p-a|s-a|BASELINE";
  let estado = estabilizarApresentacaoRegulatoria(
    null,
    revisao(contexto, 1, { VH: 0.43 }),
    0
  );
  estado = estabilizarApresentacaoRegulatoria(
    estado,
    revisao(contexto, 2, {}, false),
    100
  );
  assert.equal(estado.vetores[0].value, null);
  estado = estabilizarApresentacaoRegulatoria(
    estado,
    revisao(contexto, 8, { VH: 0.61 }),
    60_000,
    { forcarCanonico: true }
  );
  assert.equal(estado.vetores[0].value, 0.61);
  assert.equal(estado.maiorOrdemCanonica, 8);
});

test("J — sessão longa mantém revisão monotônica e memória limitada", () => {
  const contexto = "org-a|p-a|s-a|BASELINE";
  let estado = null;
  for (let segundo = 0; segundo <= 2 * 60 * 60; segundo += 1) {
    estado = estabilizarApresentacaoRegulatoria(
      estado,
      revisao(contexto, segundo, { VH: (segundo % 100) / 100 }),
      segundo * 1_000
    );
    assert.ok(estado.revisoesNaJanela.length <= 5);
  }
  assert.equal(estado.maiorOrdemCanonica, 7_200);
});

test("K/L/M — encerramento e trocas de participante/sessão isolam integralmente", () => {
  const sessaoA = "org-a|p-a|s-a|BASELINE";
  const sessaoB = "org-a|p-b|s-b|BASELINE";
  const estadoA = estabilizarApresentacaoRegulatoria(
    null,
    revisao(sessaoA, 5, { VH: 0.43 }),
    0
  );
  const encerrada = estabilizarApresentacaoRegulatoria(
    estadoA,
    revisao(sessaoA, 6, {}, false),
    100
  );
  assert.equal(encerrada.vetores[0].value, null);
  const estadoB = estabilizarApresentacaoRegulatoria(
    encerrada,
    revisao(sessaoB, 1, { VT: 0.52 }),
    200
  );
  assert.equal(estadoB.vetores.find((item) => item.code === "VH")?.value, null);
  assert.equal(estadoB.vetores.find((item) => item.code === "VT")?.value, 0.52);
  assert.equal(estadoA.vetores.find((item) => item.code === "VH")?.value, 0.43);
});

test("tendência só aparece quando o contrato declara base temporal válida", () => {
  assert.equal(tendenciaVetorialCanonica({ tendencia: "ASCENDENTE" }), null);
  assert.equal(tendenciaVetorialCanonica({
    tendencia_temporal: { valida: true, valor: "ASCENDENTE" }
  }), "ASCENDENTE");
});

test("o gráfico recebe somente vetores do motor e não lê sensores diretamente", async () => {
  const componente = await readFile(
    new URL("../components/cockpit-operacional-vivo.tsx", import.meta.url),
    "utf8"
  );
  const visualizacao = await readFile(
    new URL("../components/hx-command-visualizations.tsx", import.meta.url),
    "utf8"
  );
  assert.match(componente, /const estadosVetoriais = lista\(leituraCientifica\.vetores\)/);
  assert.match(componente, /vetoresDaVisao\(radarVetorial, visaoVetorial\)/);
  assert.match(visualizacao, /data-false-geometry="none"/);
  assert.doesNotMatch(
    visualizacao.match(/export function VectorRadarChart[\s\S]*?export function CockpitSignalStack/)?.[0] ?? "",
    /polar|epoc|sensor|rmssd|frequência cardíaca/i
  );
});
