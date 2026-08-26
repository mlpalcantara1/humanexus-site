import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  CADENCIA_VISUAL_REGULATORIA_MS,
  JANELA_VISUAL_REGULATORIA_MS,
  PERSISTENCIA_VISUAL_DA_ZONA_MS,
  estabilizarApresentacaoRegulatoria
} from "../lib/cockpit-regulatory-visual-stability.ts";

function revisao(
  ordemCanonica,
  valor,
  zona,
  contexto = "org-a|p-a|s-a|BASELINE",
  ativo = true,
  iirhModo = "ATUAL",
  zonaModo = "ATUAL"
) {
  return {
    contexto,
    ordemCanonica,
    ativo,
    vetores: [{ code: "VH", name: "Vetor Humano", value: valor }],
    iirh: valor,
    zona,
    iirhModo,
    zonaModo
  };
}

test("transição de referência congelada para atual é atômica e imediata", () => {
  const congelada = estabilizarApresentacaoRegulatoria(
    null,
    revisao(
      1,
      42.5,
      "ZA",
      "org-a|p-a|s-a|TREINO",
      true,
      "REFERENCIA_CONGELADA",
      "REFERENCIA_CONGELADA"
    ),
    0
  );
  const atual = estabilizarApresentacaoRegulatoria(
    congelada,
    revisao(2, 47, "ZO", congelada.contexto, true, "ATUAL", "ATUAL"),
    10
  );

  assert.equal(atual.iirh, 47);
  assert.equal(atual.zona, "ZO");
  assert.equal(atual.iirhModo, "ATUAL");
  assert.equal(atual.zonaModo, "ATUAL");
  assert.equal(atual.revisoesNaJanela.length, 1);
});

test("revisões rápidas são preservadas e a apresentação usa cadência humana", () => {
  let estado = estabilizarApresentacaoRegulatoria(null, revisao(1, 47.8, "ZI"), 0);
  estado = estabilizarApresentacaoRegulatoria(estado, revisao(2, 50.1, "ZI"), 200);
  estado = estabilizarApresentacaoRegulatoria(estado, revisao(3, 48.4, "ZI"), 500);
  assert.equal(estado.iirh, 47.8);
  assert.equal(estado.maiorOrdemCanonica, 3);
  assert.equal(estado.revisoesNaJanela.length, 3);
  estado = estabilizarApresentacaoRegulatoria(
    estado,
    revisao(4, 49.2, "ZI"),
    CADENCIA_VISUAL_REGULATORIA_MS
  );
  assert.equal(estado.iirh, 49.2);
  assert.equal(estado.vetores[0].value, 49.2);
});

test("resposta fora de ordem não regride a apresentação", () => {
  const atual = estabilizarApresentacaoRegulatoria(null, revisao(8, 62, "ZI"), 1_000);
  const atrasada = estabilizarApresentacaoRegulatoria(atual, revisao(7, 12, "ZCF"), 2_000);
  assert.equal(atrasada, atual);
  assert.equal(atrasada.iirh, 62);
});

test("Zona divergente fica explícita até a persistência visual mínima", () => {
  let estado = estabilizarApresentacaoRegulatoria(null, revisao(1, 64, "ZI"), 0);
  estado = estabilizarApresentacaoRegulatoria(estado, revisao(2, 66, "ZA"), 1_000);
  assert.equal(estado.zona, "ZI");
  assert.equal(estado.zonaCanonica, "ZA");
  assert.equal(estado.divergenciaDaZonaVisivel, true);
  estado = estabilizarApresentacaoRegulatoria(
    estado,
    revisao(3, 67, "ZA"),
    1_000 + PERSISTENCIA_VISUAL_DA_ZONA_MS
  );
  assert.equal(estado.zona, "ZA");
  assert.equal(estado.divergenciaDaZonaVisivel, false);
});

test("troca de contexto limpa integralmente a janela", () => {
  const inicial = estabilizarApresentacaoRegulatoria(null, revisao(1, 45, "ZI"), 0);
  const trocado = estabilizarApresentacaoRegulatoria(
    inicial,
    revisao(1, 72, "ZA", "org-b|p-b|s-b|BASELINE"),
    500
  );
  assert.match(trocado.contexto, /org-b\|p-b\|s-b/);
  assert.equal(trocado.iirh, 72);
  assert.equal(trocado.revisoesNaJanela.length, 1);
});

test("foreground retoma imediatamente do canônico atual", () => {
  let estado = estabilizarApresentacaoRegulatoria(null, revisao(1, 45, "ZI"), 0);
  estado = estabilizarApresentacaoRegulatoria(
    estado,
    revisao(9, 81, "ZO"),
    10_000,
    { forcarCanonico: true }
  );
  assert.equal(estado.iirh, 81);
  assert.equal(estado.zona, "ZO");
  assert.equal(estado.revisoesNaJanela.length, 1);
});

test("fim da atualidade remove imediatamente qualquer apresentação viva", () => {
  const vivo = estabilizarApresentacaoRegulatoria(null, revisao(1, 45, "ZI"), 0);
  const ausente = estabilizarApresentacaoRegulatoria(
    vivo,
    revisao(2, null, null, vivo.contexto, false),
    500
  );
  assert.equal(ausente.iirh, null);
  assert.equal(ausente.zona, null);
  assert.equal(ausente.vetores[0].value, null);
});

test("janela visual descarta revisão antiga sem alterar a evidência", () => {
  let estado = estabilizarApresentacaoRegulatoria(null, revisao(1, 40, "ZI"), 0);
  estado = estabilizarApresentacaoRegulatoria(
    estado,
    revisao(2, 41, "ZI"),
    JANELA_VISUAL_REGULATORIA_MS + 1
  );
  assert.equal(estado.revisoesNaJanela.length, 1);
  assert.equal(estado.maiorOrdemCanonica, 2);
});

test("polling repetido da mesma revisão não amplia a memória visual", () => {
  const canonica = revisao(12, 51, "ZI");
  let estado = estabilizarApresentacaoRegulatoria(null, canonica, 0);
  for (let agora = 250; agora <= 8_000; agora += 250) {
    estado = estabilizarApresentacaoRegulatoria(estado, canonica, agora);
    assert.ok(estado.revisoesNaJanela.length <= 1);
  }
  assert.equal(estado.maiorOrdemCanonica, 12);
  assert.equal(estado.iirh, 51);
});

for (const [rotulo, duracaoSegundos] of [
  ["curta", 30],
  ["10 minutos", 10 * 60],
  ["30 minutos", 30 * 60],
  ["2 horas", 2 * 60 * 60],
  ["8 horas", 8 * 60 * 60]
]) {
  test(`estabilidade acelerada de ${rotulo} mantém memória limitada e revisão monotônica`, () => {
    let estado = null;
    for (let segundo = 0; segundo <= duracaoSegundos; segundo += 1) {
      const valor = 45 + ((segundo % 11) / 10);
      estado = estabilizarApresentacaoRegulatoria(
        estado,
        revisao(segundo, valor, "ZI"),
        segundo * 1_000
      );
      assert.ok(estado.revisoesNaJanela.length <= 5);
    }
    assert.equal(estado.maiorOrdemCanonica, duracaoSegundos);
    assert.equal(estado.iirh, 45 + ((duracaoSegundos % 11) / 10));
    assert.equal(estado.zona, "ZI");
  });
}

test("camada visual não persiste nem acessa banco, snapshot, acervo ou rede", async () => {
  const codigo = await readFile(
    new URL("../lib/cockpit-regulatory-visual-stability.ts", import.meta.url),
    "utf8"
  );
  assert.doesNotMatch(
    codigo,
    /fetch\(|localStorage|sessionStorage|indexedDB|snapshot|acervo|INSERT|UPDATE|DELETE/
  );
  assert.match(codigo, /Nenhum valor é interpolado, calculado ou/);
});
