import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

import {
  resolverActiveTirhSnapshot,
  resolverDisponibilidadeContinuaIirhZona,
  resolverIirhAutoritativo
} from "../lib/authoritative-iirh-projection.ts";

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

function leituraContinua({
  modoIirh = "REFERENCIA_CONGELADA",
  registroIirh = { estado: "CALCULADO", valor: 42.5 },
  modoZona = "REFERENCIA_CONGELADA",
  registroZona = { estado: "SUGERIDA", codigo: "ZA", nome: "Zona Adaptativa" }
} = {}) {
  const origem = {
    identificador_da_sessao: "sessao-fixture",
    fase: "PRE",
    momento: "2026-08-25T12:00:00+00:00",
    integridade_sha256: "integridade-fixture",
    elegibilidade: "ELEGIVEL"
  };
  return {
    disponibilidade_continua_iirh_zona: {
      autoridade: "NUCLEO_HUMANEXUS",
      portal_autorizado_a_calcular: false,
      zona_derivada_do_iirh: false,
      janela_atual: {
        estado: "JANELA_EM_FORMACAO",
        fase: "TREINO",
        iirh_atual: {
          estado: "NAO_CALCULAVEL",
          valor: null,
          motivo: "COBERTURA_FUNCIONAL_INSUFICIENTE"
        },
        zona_atual: {
          estado: "NAO_CLASSIFICAVEL",
          codigo: null,
          motivo: "CRITERIOS_SEMANTICOS_MULTIFONTE_INSUFICIENTES"
        }
      },
      iirh: { modo: modoIirh, registro: registroIirh, origem },
      zona: { modo: modoZona, registro: registroZona, origem }
    }
  };
}

test("referência congelada preserva valor, zona e proveniência sem apresentá-los como atuais", () => {
  const disponibilidade = resolverDisponibilidadeContinuaIirhZona(
    leituraContinua()
  );

  assert.equal(disponibilidade.contratoAutoritativo, true);
  assert.equal(disponibilidade.iirh.atual, true);
  assert.equal(disponibilidade.iirh.projecao.valor, null);
  assert.equal(disponibilidade.iirhReferencia.referenciaCongelada, true);
  assert.equal(disponibilidade.iirhReferencia.projecao.valor, 42.5);
  assert.equal(disponibilidade.zonaReferencia.referenciaCongelada, true);
  assert.equal(disponibilidade.zonaReferencia.projecao.codigo, "ZA");
  assert.equal(disponibilidade.iirhReferencia.origem.fase, "PRE");
  assert.equal(disponibilidade.janelaAtual.estado, "JANELA_EM_FORMACAO");
});

test("primeira sessão sem referência mantém os dois quadros sem fabricar valor", () => {
  const disponibilidade = resolverDisponibilidadeContinuaIirhZona(
    leituraContinua({
      modoIirh: "AGUARDANDO_PRIMEIRA_REFERENCIA_VALIDA",
      registroIirh: null,
      modoZona: "AGUARDANDO_PRIMEIRA_REFERENCIA_VALIDA",
      registroZona: null
    })
  );

  assert.equal(disponibilidade.iirh.atual, true);
  assert.equal(disponibilidade.iirh.projecao.valor, null);
  assert.equal(disponibilidade.iirhReferencia.aguardandoPrimeiraReferencia, true);
  assert.equal(disponibilidade.zonaReferencia.aguardandoPrimeiraReferencia, true);
  assert.equal(disponibilidade.zona.projecao.codigo, null);
});

test("IIRH atual zero permanece válido sem fabricar Zona", () => {
  const disponibilidade = resolverDisponibilidadeContinuaIirhZona(
    leituraContinua({
      modoIirh: "ATUAL",
      registroIirh: { estado: "CALCULADO", valor: 0 },
      modoZona: "AGUARDANDO_PRIMEIRA_REFERENCIA_VALIDA",
      registroZona: null
    })
  );

  assert.equal(disponibilidade.iirh.atual, true);
  assert.equal(disponibilidade.iirh.projecao.valor, 0);
  assert.equal(disponibilidade.zona.projecao.classificada, false);
});

test("contrato v2 separa estado atual indisponível da referência congelada", () => {
  const leitura = leituraContinua();
  const contrato = leitura.disponibilidade_continua_iirh_zona;
  contrato.estado_atual = {
    iirh: {
      modo: "ATUAL",
      registro: {
        estado: "NAO_CALCULAVEL",
        valor: null,
        motivo: "JANELA_ATUAL_EM_FORMACAO"
      },
      origem: {
        identificador_da_sessao: "sessao-fixture",
        fase: "TREINO",
        momento: "2026-09-10T12:01:00+00:00"
      }
    },
    zona: {
      modo: "ATUAL",
      registro: {
        estado: "NAO_CLASSIFICAVEL",
        codigo: null,
        motivo: "COBERTURA_VETORIAL_INSUFICIENTE"
      },
      origem: {
        identificador_da_sessao: "sessao-fixture",
        fase: "TREINO",
        momento: "2026-09-10T12:01:00+00:00"
      }
    }
  };
  contrato.referencia_congelada = {
    iirh: contrato.iirh,
    zona: contrato.zona
  };
  contrato.iirh = contrato.estado_atual.iirh;
  contrato.zona = contrato.estado_atual.zona;

  const disponibilidade = resolverDisponibilidadeContinuaIirhZona(leitura);

  assert.equal(disponibilidade.iirh.projecao.valor, null);
  assert.equal(disponibilidade.iirh.projecao.motivo, "JANELA_ATUAL_EM_FORMACAO");
  assert.equal(disponibilidade.iirhReferencia.projecao.valor, 42.5);
  assert.equal(disponibilidade.iirhReferencia.referenciaCongelada, true);
  assert.equal(disponibilidade.zona.projecao.codigo, null);
  assert.equal(disponibilidade.zonaReferencia.projecao.codigo, "ZA");
  assert.equal(disponibilidade.iirh.origem.fase, "TREINO");
  assert.equal(disponibilidade.iirhReferencia.origem.fase, "PRE");
});

test("ACTIVE_TIRH_SNAPSHOT projeta os nove vetores e o zero sem cálculo local", () => {
  const vetores = Object.fromEntries(
    ["VH", "VT", "VS", "VSI", "VAR", "VAM", "VJ", "VE", "VR"].map(
      (codigo, indice) => [codigo, {
        code: codigo,
        value: indice === 0 ? 0 : indice / 10,
        status: "CURRENT",
        reason: null
      }]
    )
  );
  const leitura = {
    active_tirh_snapshot: {
      authority: "NUCLEO_HUMANEXUS",
      portal_authorized_to_calculate: false,
      reference_used_as_live_fallback: false,
      revision: "rev-17",
      sequence: 17,
      live_state: {
        vectors: vetores,
        resultant: {
          estado: "CALCULAVEL",
          valor: 0,
          direcao_funcional: "VH",
          sentido_contextual: "ADAPTATIVO"
        },
        trend: {
          estado: "DISPONIVEL",
          vetor_evolucao: {
            estado: "VALIDO",
            magnitude: 0,
            direcao: "ESTABILIDADE",
            nivel_longitudinal: "TENDENCIA_INICIAL"
          }
        }
      },
      reference_state: {},
      canonical_state: {
        authorization: { trend: true }
      }
    }
  };

  const snapshot = resolverActiveTirhSnapshot(leitura);

  assert.equal(snapshot.authoritative, true);
  assert.equal(Object.keys(snapshot.vectors).length, 9);
  assert.equal(snapshot.vectors.VH.value, 0);
  assert.equal(snapshot.resultant.valor, 0);
  assert.equal(snapshot.trend.vetor_evolucao.magnitude, 0);
  assert.equal(snapshot.trend.vetor_evolucao.direcao, "ESTABILIDADE");
  assert.equal(snapshot.canonicalState.authorization.trend, true);
  assert.equal(snapshot.revision, "rev-17");
  assert.equal(snapshot.sequence, 17);
});

test("ACTIVE_TIRH_SNAPSHOT não autoritativo é recusado sem fallback", () => {
  const snapshot = resolverActiveTirhSnapshot({
    active_tirh_snapshot: {
      authority: "PORTAL",
      portal_authorized_to_calculate: true,
      reference_used_as_live_fallback: true,
      live_state: {
        vectors: { VH: { value: 99 } },
        resultant: { valor: 99 }
      }
    }
  });

  assert.equal(snapshot.authoritative, false);
  assert.deepEqual(snapshot.vectors, {});
  assert.deepEqual(snapshot.resultant, {});
  assert.equal(snapshot.revision, null);
});

test("contrato não autoritativo é recusado sem fallback local", () => {
  const leitura = leituraContinua();
  leitura.disponibilidade_continua_iirh_zona.portal_autorizado_a_calcular = true;
  const disponibilidade = resolverDisponibilidadeContinuaIirhZona(leitura);

  assert.equal(disponibilidade.contratoAutoritativo, false);
  assert.equal(disponibilidade.iirh.projecao.valor, null);
  assert.equal(disponibilidade.zona.projecao.codigo, null);
});

test("as projeções humanas usam o resolvedor compartilhado e não calculam IIRH", async () => {
  const arquivos = await Promise.all([
    "../components/operacao-homologacao.tsx",
    "../components/cockpit-operacional-vivo.tsx",
    "../components/sintese-validacao-tirh-v1.tsx",
    "../lib/tirh-report-document.ts"
  ].map((caminho) => readFile(new URL(caminho, import.meta.url), "utf8")));

  for (const fonte of arquivos) {
    assert.match(fonte, /resolverDisponibilidadeContinuaIirhZona/);
    assert.doesNotMatch(fonte, /calcularIirh/i);
  }

  const resolvedor = await readFile(
    new URL("../lib/authoritative-iirh-projection.ts", import.meta.url),
    "utf8"
  );
  assert.doesNotMatch(resolvedor, /(?:calcular|classificar|inferir)Iirh/i);
});
