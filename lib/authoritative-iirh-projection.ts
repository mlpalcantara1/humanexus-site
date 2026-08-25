type Registro = Record<string, unknown>;

const ESTADOS_AUTORITATIVOS_CALCULADOS = new Set([
  "CALCULADO",
  "PARCIAL",
  "PLENO"
]);

function objeto(valor: unknown): Registro {
  return valor && typeof valor === "object" && !Array.isArray(valor)
    ? valor as Registro
    : {};
}

function textoAutoritativo(...valores: unknown[]) {
  for (const valor of valores) {
    if (typeof valor !== "string") continue;
    const texto = valor.trim();
    if (texto) return texto;
  }
  return null;
}

function normalizarEstado(valor: unknown) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function resolverIirhAutoritativo(valor: unknown) {
  const registro = objeto(valor);
  const estado = textoAutoritativo(registro.estado);
  const estadoNormalizado = normalizarEstado(estado);
  const valorRecebido = typeof registro.valor === "number"
    && Number.isFinite(registro.valor)
    ? registro.valor
    : null;
  const calculado = ESTADOS_AUTORITATIVOS_CALCULADOS.has(estadoNormalizado)
    && valorRecebido != null;
  const porQueEsteResultado = objeto(registro.por_que_este_resultado);

  return {
    registro,
    estado,
    estadoNormalizado,
    calculado,
    valor: calculado ? valorRecebido : null,
    unidade: textoAutoritativo(registro.unidade),
    motivo: textoAutoritativo(
      registro.motivo,
      porQueEsteResultado.resumo,
      registro.justificativa
    )
  };
}
