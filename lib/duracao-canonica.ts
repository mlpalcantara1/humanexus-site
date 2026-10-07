/** Apresentação apenas: preserva a duração canônica recebida, sem acumular tempo. */
export function formatarDuracaoCanonica(segundos: unknown): string | null {
  if (typeof segundos !== "number" || !Number.isFinite(segundos) || segundos < 0) return null;
  const totalMs = Math.round(segundos * 1000);
  if (!Number.isSafeInteger(totalMs)) return null;
  const minutos = Math.floor(totalMs / 60_000);
  const segundosRestantes = Math.floor((totalMs % 60_000) / 1000);
  const milissegundos = totalMs % 1000;
  return `${minutos} min ${segundosRestantes} s${milissegundos ? ` ${milissegundos} ms` : ""}`;
}
