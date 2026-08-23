export type RegistroTirhV1 = Record<string, unknown>;

function objeto(valor: unknown): RegistroTirhV1 {
  return valor && typeof valor === "object" && !Array.isArray(valor)
    ? valor as RegistroTirhV1
    : {};
}

export function claimElegivelParaValidacaoTirhV1(claim: RegistroTirhV1) {
  return claim.requer_validacao_profissional === true
    && claim.reportavel === true
    && ["PENDENTE", "AJUSTE_PENDENTE"].includes(
      String(claim.estado_da_validacao_profissional ?? "PENDENTE")
    );
}

export function decisoesProfissionaisPreservadasTirhV1(
  claims: RegistroTirhV1[]
) {
  return claims
    .map((claim) => objeto(claim.validacao_profissional))
    .filter((validacao) => (
      Object.keys(validacao).length > 0
      && typeof validacao.decisao === "string"
      && validacao.decisao.length > 0
    ));
}
