import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const cockpit = fs.readFileSync("components/cockpit-operacional-vivo.tsx", "utf8");
const operacao = fs.readFileSync("components/operacao-homologacao.tsx", "utf8");
const compartilhado = fs.readFileSync("components/sintese-validacao-tirh-v1.tsx", "utf8");

function ocorrencias(texto, padrao) {
  return texto.match(padrao)?.length ?? 0;
}

test("visão geral e relatório montam o mesmo componente uma única vez por visão", () => {
  assert.equal(ocorrencias(cockpit, /<SinteseValidacaoTirhV1\b/g), 1);
  const blocoRelatorio = operacao.match(
    /const visaoRelatorio = \([\s\S]*?const visaoColetiva = \(/
  )?.[0] ?? "";
  assert.equal(ocorrencias(blocoRelatorio, /<SinteseValidacaoTirhV1\b/g), 1);
  assert.equal(
    ocorrencias(compartilhado, /aria-label="Síntese TIRH operacional autoral V1"/g),
    1
  );
});

test("fluxo humano da visão relatório preserva Síntese, Validação e Relatório nessa ordem", () => {
  const blocoRelatorio = operacao.match(
    /const visaoRelatorio = \([\s\S]*?const visaoColetiva = \(/
  )?.[0] ?? "";
  const sintese = blocoRelatorio.indexOf("<SinteseValidacaoTirhV1");
  const relatorio = blocoRelatorio.indexOf("<RelatorioCanonicoV1");
  assert.ok(sintese >= 0);
  assert.ok(relatorio > sintese);
  assert.match(blocoRelatorio, /validarClaimTirhV1=\{\(payload\) =>[\s\S]*validar-claim-tirh-v1/);
});

test("fixture Thor mantém exatamente o claim elegível canônico", () => {
  const claimsThor = [
    {
      claim_id: "CLM-19241FE26F69A8DD37866288",
      requer_validacao_profissional: true,
      reportavel: true,
      estado_da_validacao_profissional: "PENDENTE"
    },
    {
      claim_id: "CLM-FATO-OBJETIVO",
      requer_validacao_profissional: false,
      reportavel: true,
      estado_da_validacao_profissional: "NAO_APLICAVEL"
    },
    {
      claim_id: "CLM-NAO-REPORTAVEL",
      requer_validacao_profissional: true,
      reportavel: false,
      estado_da_validacao_profissional: "PENDENTE"
    }
  ];
  const elegiveis = claimsThor.filter((claim) =>
    claim.requer_validacao_profissional === true
      && claim.reportavel === true
      && ["PENDENTE", "AJUSTE_PENDENTE"].includes(
        claim.estado_da_validacao_profissional
      )
  );
  assert.equal(elegiveis.length, 1);
  assert.equal(elegiveis[0].claim_id, "CLM-19241FE26F69A8DD37866288");
  assert.match(compartilhado, /claimsTirhV1\.filter\([\s\S]*claimElegivelParaValidacaoTirhV1/);
});

test("ações dependem de elegibilidade e nenhuma decisão é persistida automaticamente", () => {
  assert.match(compartilhado, /className="hx-tirh-v1-validation"/);
  assert.doesNotMatch(compartilhado, /className="hx-live-vector-trace"/);
  for (const acao of ["VALIDAR", "AJUSTAR", "MANTER_PENDENTE"]) {
    assert.match(compartilhado, new RegExp(`value="${acao}"`));
  }
  assert.match(
    compartilhado,
    /\{claimsPendentesTirhV1\.length \? \([\s\S]*className="hx-tirh-v1-validation-form"/
  );
  assert.match(compartilhado, /onClick=\{\(\) => void enviarValidacaoTirhV1\(\)\}/);
  assert.doesNotMatch(compartilhado, /useEffect/);
  assert.equal(ocorrencias(compartilhado, /await validarClaimTirhV1\(/g), 1);
});

test("decisão existente fica visível sem reexpor o claim nem oferecer segunda adjudicação", () => {
  const claimAdjudicado = {
    claim_id: "CLM-19241FE26F69A8DD37866288",
    requer_validacao_profissional: true,
    reportavel: true,
    estado_da_validacao_profissional: "VALIDADO_PROFISSIONALMENTE",
    validacao_profissional: {
      decisao: "VALIDAR",
      estado: "VALIDADO_PROFISSIONALMENTE",
      versao_da_validacao: 1,
      criado_em: "2026-08-23T13:46:08.636477+00:00"
    }
  };
  const elegiveis = [claimAdjudicado].filter((claim) =>
    claim.requer_validacao_profissional === true
      && claim.reportavel === true
      && ["PENDENTE", "AJUSTE_PENDENTE"].includes(
        claim.estado_da_validacao_profissional
      )
  );
  assert.equal(elegiveis.length, 0);
  assert.match(compartilhado, /decisoesProfissionaisPreservadasTirhV1\(claimsTirhV1\)/);
  assert.match(compartilhado, /Decisão profissional preservada/);
  assert.match(compartilhado, /Estado efetivo:/);
  assert.match(compartilhado, /Segunda adjudicação indisponível/);
  assert.match(compartilhado, /Nenhuma nova adjudicação está disponível/);
});

test("PDF, Print, Replay e Longitudinal permanecem no mesmo fluxo", () => {
  assert.match(operacao, /Baixar PDF final/);
  assert.match(operacao, /Abrir impressão final/);
  assert.match(operacao, /cicloDoRelatorioAtual\.finalDisponivel/);
  assert.match(operacao, /visao === "replay"/);
  assert.match(operacao, /visao === "longitudinal"/);
  assert.match(operacao, /const visaoReplay = \(/);
  assert.match(operacao, /const visaoLongitudinal = \(/);
});
