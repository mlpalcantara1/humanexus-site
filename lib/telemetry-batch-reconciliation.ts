export type DiagnosticoDaTelemetria =
  | "SEM_HISTORICO_CONFIRMADO"
  | "LOTE_CONFIRMADO"
  | "RECUPERADA_POR_CONSULTA_DIRETA"
  | "DIVERGENCIA_ENTRE_FONTES";

export async function conciliarTelemetriaDoNucleo<T>(
  pacotesDoLote: T[],
  historicoConfirmadoPeloCockpit: boolean,
  consultarDiretamente: () => Promise<T[]>
): Promise<{ pacotes: T[]; diagnostico: DiagnosticoDaTelemetria }> {
  if (pacotesDoLote.length) {
    return { pacotes: pacotesDoLote, diagnostico: "LOTE_CONFIRMADO" };
  }
  if (!historicoConfirmadoPeloCockpit) {
    return { pacotes: [], diagnostico: "SEM_HISTORICO_CONFIRMADO" };
  }
  try {
    const pacotesDiretos = await consultarDiretamente();
    if (Array.isArray(pacotesDiretos) && pacotesDiretos.length) {
      return {
        pacotes: pacotesDiretos,
        diagnostico: "RECUPERADA_POR_CONSULTA_DIRETA"
      };
    }
  } catch {
    // O painel continua disponível, mas a ausência não vira "sem pacotes".
  }
  return { pacotes: [], diagnostico: "DIVERGENCIA_ENTRE_FONTES" };
}
