/** Aceita somente a resposta do contexto e da consulta mais recentes. */
export function respostaIiccaVigente(
  geracaoDaResposta: number,
  geracaoAtual: number,
  sequenciaDaResposta?: number,
  sequenciaAtual?: number
): boolean {
  return geracaoDaResposta === geracaoAtual && (
    sequenciaDaResposta === undefined
    || sequenciaDaResposta === sequenciaAtual
  );
}
