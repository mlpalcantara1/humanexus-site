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
  componenteMontado,
  consultaSolicitada,
  ultimaConsultaAplicada
}: {
  contextoEsperado: ContextoVivo;
  contextoRecebido: ContextoVivo;
  cancelada: boolean;
  componenteMontado: boolean;
  consultaSolicitada?: number;
  ultimaConsultaAplicada?: number;
}): boolean {
  const respostaForaDeOrdem = Number.isFinite(consultaSolicitada)
    && Number.isFinite(ultimaConsultaAplicada)
    && Number(consultaSolicitada) < Number(ultimaConsultaAplicada);
  return componenteMontado
    && !cancelada
    && !respostaForaDeOrdem
    && chaveDoContextoVivo(contextoEsperado)
      === chaveDoContextoVivo(contextoRecebido);
}

type FonteCanonica = Record<string, unknown> & {
  ao_vivo?: boolean;
  estado?: string;
};

export function fonteDuranteSincronizacao<T extends FonteCanonica>(fonte: T): T {
  return {
    ...fonte,
    // A interrupção do transporte HTTP não prova perda da fonte física. Os
    // valores permanecem apenas como última projeção canônica identificada;
    // `ao_vivo=false` impede seu uso como evidência atual ou entrada científica.
    estado: "PROJEÇÃO CANÔNICA EM VERIFICAÇÃO",
    ao_vivo: false,
    projecao_em_verificacao: true
  };
}

export function atrasoDoPollingCanonico(
  estadoOperacional: string,
  falhasConsecutivas = 0
): number {
  if (String(estadoOperacional).toUpperCase() === "PAUSADA") return 15_000;
  if (falhasConsecutivas <= 0) return 2_500;
  return Math.min(30_000, 2_500 * (2 ** Math.min(falhasConsecutivas, 4)));
}
