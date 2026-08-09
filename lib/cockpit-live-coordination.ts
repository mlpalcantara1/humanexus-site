export type ContextoVivo = {
  organizacao: string;
  participante: string;
  sessao: string;
};

export function chaveDoContextoVivo(contexto: ContextoVivo): string {
  return [
    contexto.organizacao,
    contexto.participante,
    contexto.sessao
  ].join(":");
}

export function podeAplicarRespostaCanonica({
  contextoEsperado,
  contextoRecebido,
  cancelada,
  componenteMontado
}: {
  contextoEsperado: ContextoVivo;
  contextoRecebido: ContextoVivo;
  cancelada: boolean;
  componenteMontado: boolean;
}): boolean {
  return componenteMontado
    && !cancelada
    && chaveDoContextoVivo(contextoEsperado)
      === chaveDoContextoVivo(contextoRecebido);
}

export function atrasoDoPollingCanonico(
  estadoOperacional: string,
  falhasConsecutivas = 0
): number {
  if (String(estadoOperacional).toUpperCase() === "PAUSADA") return 15_000;
  if (falhasConsecutivas <= 0) return 2_500;
  return Math.min(30_000, 2_500 * (2 ** Math.min(falhasConsecutivas, 4)));
}
