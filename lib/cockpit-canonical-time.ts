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
    rotulo: usarBaseline ? "Baseline" : String(fase.fase ?? "Sem fase ativa")
  };
}
