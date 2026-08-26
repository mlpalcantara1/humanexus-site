import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

import {
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
  assert.equal(disponibilidade.iirh.referenciaCongelada, true);
  assert.equal(disponibilidade.iirh.projecao.valor, 42.5);
  assert.equal(disponibilidade.zona.referenciaCongelada, true);
  assert.equal(disponibilidade.zona.projecao.codigo, "ZA");
  assert.equal(disponibilidade.iirh.origem.fase, "PRE");
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

  assert.equal(disponibilidade.iirh.aguardandoPrimeiraReferencia, true);
  assert.equal(disponibilidade.iirh.projecao.valor, null);
  assert.equal(disponibilidade.zona.aguardandoPrimeiraReferencia, true);
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
});
