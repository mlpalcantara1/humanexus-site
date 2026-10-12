type RegistroTemporal = Record<string, unknown>;

const ESTADOS_TEMPORAIS_DO_BASELINE = new Set([
  "INICIADO",
  "PAUSADO",
  "FINALIZADO"
]);

export function resolverTempoCanonicoDoCockpit({
  sessaoBaseline,
  baseline,
  fase
}: {
  sessaoBaseline: boolean;
  baseline: RegistroTemporal;
  fase: RegistroTemporal;
}) {
  const estadoDoBaseline = String(baseline.estado ?? "").toUpperCase();
  const faseIdentificada = Boolean(fase.fase);
  const usarBaseline = sessaoBaseline || (
    ESTADOS_TEMPORAIS_DO_BASELINE.has(estadoDoBaseline)
    && !faseIdentificada
  );

  return {
    registro: usarBaseline ? baseline : fase,
    rotulo: usarBaseline ? "Referência inicial" : String(fase.fase ?? "Sem fase ativa")
  };
}

// A aquisição pode estar ausente enquanto a fase operacional está ativa.
// O relógio segue o estado canônico da fase, nunca o polling de sensores.
export function intervaloDoRelogioCanonico(registro: RegistroTemporal) {
  return registro.cronometro_em_execucao === true ? 1_000 : 10_000;
}
