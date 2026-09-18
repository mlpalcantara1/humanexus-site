import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

import { resolverPreflightTirh } from "../lib/tirh-operational-readiness.ts";

const fonte = (codigo) => ({ codigo, estado: "CAPTURANDO", ao_vivo: true });
const vetor = (code, value) => ({ code, value, estado: "CALCULADO" });
const codigos = ["VH", "VT", "VS", "VSI", "VAM", "VJ", "VE", "VR", "VAR"];

function hidratacaoPronta() {
  return {
    entradas: {
      anamnese: { estado: "PERSISTENTE_ELEGÍVEL", motivo: "Anamnese concluída." },
      baseline: { estado: "PERSISTENTE_ELEGÍVEL", motivo: "Referência finalizada." },
      perfil_tarefa: { estado: "FASE_ESPECÍFICA", motivo: "Perfil explícito atual." }
    }
  };
}

test("preflight só fica READY com fontes e nove vetores autoritativos", () => {
  const resultado = resolverPreflightTirh({
    autoHidratacao: hidratacaoPronta(),
    fontes: [fonte("POLAR_H10"), fonte("EMOTIV_EPOC_X")],
    vetores: codigos.map((codigo, indice) => vetor(codigo, indice === 0 ? 0 : 50)),
    resultante: { estado: "PLENA" },
    tendencia: { estado: "CALCULADA", tendencia: "ESTÁVEL" }
  });

  assert.equal(resultado.estado, "READY");
  assert.equal(resultado.inicio.estado, "READY");
  assert.equal(resultado.vetores.length, 9);
  assert.equal(resultado.vetores[0].estado, "READY");
});

test("ausência permanece PENDING com motivo e sem zero fabricado", () => {
  const resultado = resolverPreflightTirh({
    autoHidratacao: hidratacaoPronta(),
    fontes: [fonte("POLAR_H10")],
    vetores: [
      { code: "VH", value: null, reason: "Evidência profissional ainda não validada" }
    ],
    resultante: { estado: "NAO_CALCULAVEL" },
    tendencia: { estado: "AUSENTE" }
  });

  assert.equal(resultado.estado, "NOT_READY");
  assert.equal(resultado.vetores.length, 9);
  assert.equal(resultado.vetores[0].estado, "PENDING");
  assert.equal(resultado.vetores[0].resolucao, "PROFISSIONAL");
  assert.equal(resultado.fontes.find((item) => item.codigo === "EMOTIV_EPOC_X")?.estado, "UNAVAILABLE");
  assert.equal(resultado.inicio.estado, "READY");
  assert.deepEqual(
    resultado.inicio.avisos.map((item) => item.codigo),
    ["EMOTIV_EPOC_X"]
  );
});

test("início de fase é bloqueado por contexto estrutural ausente, não por sensor", () => {
  const resultado = resolverPreflightTirh({
    autoHidratacao: {
      entradas: {
        anamnese: { estado: "PERSISTENTE_ELEGÍVEL", motivo: "Anamnese concluída." },
        baseline: { estado: "PERSISTENTE_ELEGÍVEL", motivo: "Referência finalizada." },
        perfil_tarefa: {
          estado: "AUSENTE",
          motivo: "A tarefa atual ainda não possui perfil explícito elegível.",
          exige_acao_profissional: true
        }
      }
    },
    fontes: [],
    vetores: [],
    resultante: {},
    tendencia: {}
  });

  assert.equal(resultado.inicio.estado, "BLOCKED");
  assert.deepEqual(
    resultado.inicio.bloqueios.map((item) => item.codigo),
    ["PERFIL_TAREFA"]
  );
  assert.deepEqual(
    resultado.inicio.avisos.map((item) => item.codigo),
    ["POLAR_H10", "EMOTIV_EPOC_X"]
  );
});

test("captura profissional permanece local, contextual e fora do cálculo científico", async () => {
  const componente = await readFile(
    new URL("../components/cockpit-operacional-vivo.tsx", import.meta.url),
    "utf8"
  );
  const prontidao = await readFile(
    new URL("../lib/tirh-operational-readiness.ts", import.meta.url),
    "utf8"
  );

  for (const marcador of [
    "VALIDAR_LOTE",
    "AJUSTAR_NARRATIVA",
    "Confirmar selecionados",
    "Confirmar recomendados (0)",
    "Rejeitar selecionados",
    "Deixar pendentes",
    "INÍCIO BLOQUEADO",
    "Completar perfil mínimo da tarefa",
    "Informar somente o perfil mínimo",
    "Complete enquanto a fase está em execução",
    "Registrar somente o que foi observado",
    "identificador_da_tarefa: identificadorDaTarefa.trim()",
    "metricasDisponiveisNoPerfil",
    "inicioDeFaseBloqueado"
  ]) assert.match(componente, new RegExp(marcador.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));

  assert.match(componente, /Referência[\s\S]*permanece congelada/);

  assert.doesNotMatch(prontidao, /IIRH\s*[+*/-]|zona\s*=/i);
  assert.doesNotMatch(componente, /objeto\(estado\.thx_individual\)\.codigo/);
  assert.match(componente, /Nenhum clique cria nota/i);
  assert.match(componente, /nenhuma captura cria vetor ou interpretação/i);
  assert.match(componente, /não produz cálculo científico/i);
  assert.doesNotMatch(componente, /SpeechRecognition|webkitSpeechRecognition/);
  const integrado = await readFile(new URL("../components/registro-integrado-sessao.tsx", import.meta.url), "utf8");
  assert.match(integrado, /iniciarTranscricaoLocal/);
  assert.match(integrado, /Confirmação final profissional/);
  assert.match(componente, /CONTEÚDO BRUTO PRESERVADO/i);
});
