type Registro = Record<string, unknown>;

const FASES_CANONICAS = new Set(["BASELINE", "PRE", "TREINO", "POS"]);

export function snapshotOficialDeFaseAplicavel({
  leituraCientifica,
  identificadorDaSessao,
  sessaoFinalizada
}: {
  leituraCientifica: Registro;
  identificadorDaSessao: string;
  sessaoFinalizada: boolean;
}) {
  if (!sessaoFinalizada) return false;
  if (String(leituraCientifica.origem_temporal ?? "") !== "SNAPSHOT_FASE_PERSISTIDO") {
    return false;
  }
  const snapshot = typeof leituraCientifica.snapshot_de_fase === "object"
    && leituraCientifica.snapshot_de_fase !== null
    && !Array.isArray(leituraCientifica.snapshot_de_fase)
    ? leituraCientifica.snapshot_de_fase as Registro
    : {};
  return String(snapshot.identificador_da_sessao ?? "") === identificadorDaSessao
    && FASES_CANONICAS.has(String(snapshot.fase ?? "").toUpperCase())
    && String(snapshot.integridade_sha256 ?? "").length > 0;
}
