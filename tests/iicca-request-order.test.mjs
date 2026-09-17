import assert from "node:assert/strict";
import test from "node:test";
import { respostaIiccaVigente } from "../lib/iicca-request-order.ts";

function adiar() {
  let resolver;
  const promessa = new Promise((resolve) => { resolver = resolve; });
  return { promessa, resolver };
}

test("resposta fora de ordem não reativa autorização revogada", async () => {
  let geracao = 1;
  let sequencia = 0;
  let estadoVisivel = "AUTORIZADO";
  const respostaAntiga = adiar();
  const primeira = ++sequencia;
  const aplicar = async (resposta, numero, geracaoDaResposta) => {
    const estado = await resposta;
    if (respostaIiccaVigente(
      geracaoDaResposta, geracao, numero, sequencia
    )) estadoVisivel = estado;
  };
  const pendente = aplicar(respostaAntiga.promessa, primeira, geracao);
  geracao++;
  const segunda = ++sequencia;
  await aplicar(Promise.resolve("REVOGADO"), segunda, geracao);
  respostaAntiga.resolver("AUTORIZADO");
  await pendente;
  assert.equal(estadoVisivel, "REVOGADO");
});

test("polling e retomada aceitam só a consulta mais recente", async () => {
  const geracao = 5;
  let sequencia = 0;
  let estadoVisivel = "REVOGADO";
  const pollingLento = adiar();
  const primeira = ++sequencia;
  const pendente = pollingLento.promessa.then((estado) => {
    if (respostaIiccaVigente(geracao, geracao, primeira, sequencia)) {
      estadoVisivel = estado;
    }
  });
  const retomada = ++sequencia;
  if (respostaIiccaVigente(geracao, geracao, retomada, sequencia)) {
    estadoVisivel = "REVOGADO";
  }
  pollingLento.resolver("AUTORIZADO");
  await pendente;
  assert.equal(estadoVisivel, "REVOGADO");
});
