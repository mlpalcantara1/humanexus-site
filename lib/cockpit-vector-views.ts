export type VisaoVetorial = "HUMANO" | "TAREFA" | "SINTESE";

export type VetorDaVisao = {
  code: string;
  name: string;
  value: number | null;
  macrofield?: string | null;
  trend?: string | null;
};

function codigoDoMacrocampo(valor: unknown): string {
  return String(valor ?? "").trim().toUpperCase();
}

/**
 * Seleciona eixos; nunca calcula magnitude. A associação usa exclusivamente o
 * macrocampo oficial recebido na definição científica do núcleo.
 */
export function vetoresDaVisao<T extends VetorDaVisao>(
  vetores: T[],
  visao: VisaoVetorial
): T[] {
  if (visao === "SINTESE") return vetores;
  const macrocampo = visao === "HUMANO" ? "MCH" : "MCT";
  return vetores.filter(
    (vetor) => codigoDoMacrocampo(vetor.macrofield) === macrocampo
  );
}

export function estadoGeometricoVetorial(vetores: VetorDaVisao[]) {
  const calculados = vetores.filter(
    (vetor) => vetor.value != null && Number.isFinite(vetor.value)
  ).length;
  return {
    calculados,
    total: vetores.length,
    completo: vetores.length > 0 && calculados === vetores.length,
    // Uma área requer ao menos três eixos e nenhum valor ausente.
    permitePoligono: vetores.length >= 3 && calculados === vetores.length
  };
}

type Registro = Record<string, unknown>;

function registro(valor: unknown): Registro {
  return valor && typeof valor === "object" && !Array.isArray(valor)
    ? valor as Registro
    : {};
}

/**
 * Tendência só existe quando o próprio contrato canônico declara base temporal
 * válida. O portal não infere tendência comparando leituras.
 */
export function tendenciaVetorialCanonica(valor: unknown): string | null {
  const estado = registro(valor);
  const temporal = registro(estado.tendencia_temporal);
  const valida = estado.tendencia_temporal_valida === true
    || temporal.valida === true
    || temporal.admissivel === true;
  if (!valida) return null;
  const candidata = temporal.valor
    ?? temporal.estado
    ?? estado.tendencia
    ?? estado.trend;
  if (typeof candidata !== "string") return null;
  const normalizada = candidata.trim();
  return normalizada.length ? normalizada : null;
}
