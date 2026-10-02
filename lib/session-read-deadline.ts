/** Bounds the complete read (headers and body), never an authentication write. */
export async function lerSessaoComPrazo<T>(
  ler: (signal: AbortSignal) => Promise<T>,
  timeoutMs = 8_000
): Promise<T> {
  const controlador = new AbortController();
  let temporizador: ReturnType<typeof setTimeout> | undefined;
  const prazo = new Promise<never>((_, rejeitar) => {
    temporizador = setTimeout(() => {
      rejeitar(new Error("HXP_SESSION_READ_TIMEOUT"));
      controlador.abort();
    }, timeoutMs);
  });
  try {
    // A transport ignoring abort or a stalled JSON body cannot hold the route.
    return await Promise.race([Promise.resolve().then(() => ler(controlador.signal)), prazo]);
  } finally {
    if (temporizador !== undefined) clearTimeout(temporizador);
  }
}
