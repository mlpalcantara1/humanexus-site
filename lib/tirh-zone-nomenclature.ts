/** Nomenclatura de apresentação; não participa do cálculo nem altera registros preservados. */
export const VERSAO_NOMENCLATURA_DAS_ZONAS = "TIRH-ZONAS-NOMES-2026-10-01";

export const NOMES_DAS_ZONAS = {
  ZO: "Regulação Ótima",
  ZA: "Regulação Funcional",
  ZI: "Sobrecarga Regulatória",
  ZCF: "Desregulação"
} as const;

export const NOMES_HISTORICOS_DAS_ZONAS = {
  ZO: "Zona Ótima",
  ZA: "Zona Adaptativa",
  ZI: "Zona de Instabilidade",
  ZCF: "Zona de Comprometimento Funcional"
} as const;

export type CodigoDaZona = keyof typeof NOMES_DAS_ZONAS;

export function codigoDaZona(valor: unknown): CodigoDaZona | null {
  const texto = String(valor ?? "").trim();
  const codigo = texto.toUpperCase();
  if (Object.hasOwn(NOMES_DAS_ZONAS, codigo)) return codigo as CodigoDaZona;
  return (Object.keys(NOMES_DAS_ZONAS) as CodigoDaZona[]).find(
    (item) => texto === NOMES_DAS_ZONAS[item] || texto === NOMES_HISTORICOS_DAS_ZONAS[item]
  ) ?? null;
}

export function nomeDaZona(valor: unknown, historica = false): string | null {
  const codigo = codigoDaZona(valor);
  if (!codigo) return null;
  const atual = NOMES_DAS_ZONAS[codigo];
  return historica ? `${atual} (antes: ${NOMES_HISTORICOS_DAS_ZONAS[codigo]})` : atual;
}

export const NOTA_DE_EQUIVALENCIA_HISTORICA =
  `Nomes exibidos conforme ${VERSAO_NOMENCLATURA_DAS_ZONAS}; códigos, escores e classificações históricas preservados, sem recálculo.`;
