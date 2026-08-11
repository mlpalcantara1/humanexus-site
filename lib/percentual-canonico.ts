export function formatarPercentualCanonico(valor: unknown): string {
  if (valor == null || valor === "") return "—";
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return "—";
  const percentual = numero >= 0 && numero <= 1 ? numero * 100 : numero;
  return `${Math.round(percentual)}%`;
}
