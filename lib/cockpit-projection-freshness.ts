/** Relógio de apresentação apenas; não altera elegibilidade ou cálculo do Núcleo. */
export function projecaoTemporalDesatualizada({
  momento, agora, pollingConfirmadoEm, atualizadoEm, limiteMs = 20_000
}: {
  momento: unknown; agora: number; pollingConfirmadoEm?: unknown;
  atualizadoEm?: unknown; limiteMs?: number;
}): boolean {
  const origem = Date.parse(String(momento ?? ""));
  const polling = Date.parse(String(pollingConfirmadoEm ?? ""));
  // A confirmação é criada no navegador ao receber a resposta. Pode anteceder
  // o próximo tick React; isso não torna a resposta recém-recebida vencida.
  const relogio = Number.isFinite(polling) ? Math.max(agora, polling) : agora;
  const transporte = Number.isFinite(polling)
    ? polling : Date.parse(String(atualizadoEm ?? ""));
  const transporteInformado = pollingConfirmadoEm !== undefined || atualizadoEm !== undefined;
  return !Number.isFinite(origem)
    || (relogio > 0 && relogio - origem > limiteMs)
    || (transporteInformado && (!Number.isFinite(transporte)
      || (relogio > 0 && relogio - transporte > limiteMs)));
}
