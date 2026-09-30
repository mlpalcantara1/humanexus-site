// A existência de uma fase operacional não depende de snapshot científico/THX.
export function resumirFasesRegistradas(fases: Record<string, unknown>[]): string | null {
  const codigos = new Set(fases
    .filter((fase) => typeof fase.identificador === "string" && fase.identificador.trim())
    .map((fase) => String(fase.fase ?? "").toUpperCase())
    .filter((codigo) => ["PRE", "TREINO", "POS"].includes(codigo)));
  if (!codigos.size) return null;
  return codigos.size === 1
    ? "1 fase operacional registrada"
    : `${codigos.size} fases operacionais registradas`;
}
