import test from "node:test";
import assert from "node:assert/strict";
import { resumoOperacionalDoRelatorio } from "../lib/resumo-operacional-relatorio.ts";

test("relatório apresenta grandezas nativas, tempos e ausências sem inventar o PÓS", () => {
  const entrada = { cockpit: { leitura_cientifica: {
    distribuicao_temporal_das_zonas: { zona_predominante: "ZI", tempo_por_zona_segundos: { ZO: 14.9, ZA: 463.7, ZI: 541.1, ZCF: 0 } },
    reprocessamento_eeg: { fontes_da_ultima_janela_historica: [
      { codigo: "EMOTIV_EPOC_X", valores: { qualidade_eeg: 8, qualidade_de_contato: 100, qualidade_da_taxa_de_amostragem: 100 }, atividade_de_bandas_eeg: { timestamp: "2026-10-07T21:45:57Z", bandas: [{ codigo: "beta_baixa", valor_agregado: 20.203, unidade: "potencia_espectral_nativa_cortex" }] } },
      { codigo: "POLAR_H10", valores: { hr_bpm: 63, rr_ms: 926.32, rmssd_tecnico_ms: 19.56 } }
    ] }
  } } };
  const antes = structuredClone(entrada);
  const texto = JSON.stringify(resumoOperacionalDoRelatorio(entrada));
  for (const termo of ["7 min 43 s 700 ms", "9 min 1 s 100 ms", "Sobrecarga Regulatória", "Qualidade EEG: 8%", "Beta baixa: 20,203", "RMSSD: 19,56", "PÓS: sem resultado registrado", "não é uma leitura atual", "Baseline individual"]) assert.ok(texto.includes(termo), termo);
  assert.ok(!texto.includes("800%"));
  assert.deepEqual(entrada, antes);
});
test("sem dados não apresenta zeros, ganho ou recomendação fabricada", () => {
  const texto = JSON.stringify(resumoOperacionalDoRelatorio({}));
  assert.ok(texto.includes("FC: indisponível"));
  assert.ok(texto.includes("Theta: indisponível"));
  assert.ok(texto.includes("Comparação desde a primeira sessão indisponível"));
  assert.ok(!texto.includes("RMSSD: 0"));
});
