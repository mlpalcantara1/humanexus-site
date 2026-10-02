// Only read-only cockpit consultations. Never retry a phase/action command.
export async function consultarCockpitComPrazo<T>(
  caminho: string,
  opcoes: { signal?: AbortSignal; timeoutMs?: number; fetch?: typeof fetch } = {}
): Promise<{ resposta: Response; dados: T }> {
  const inicio = Date.now();
  const controlador = new AbortController();
  let temporizador: ReturnType<typeof setTimeout> | undefined;
  let expirou = false;
  let status: number | null = null;
  let cancelar = () => {};
  const cancelamento = new Promise<never>((_, rejeitar) => {
    cancelar = () => {
      controlador.abort(opcoes.signal?.reason);
      rejeitar(new DOMException("Consulta cancelada", "AbortError"));
    };
    if (opcoes.signal?.aborted) cancelar();
    else opcoes.signal?.addEventListener("abort", cancelar, { once: true });
    temporizador = setTimeout(() => {
      expirou = true;
      rejeitar(new Error(
        "O carregamento do painel expirou. Esta consulta não inicia fases; tente carregar novamente."
      ));
      controlador.abort();
    }, opcoes.timeoutMs ?? 30_000);
  });
  try {
    const consulta = async () => {
      if (controlador.signal.aborted) {
        throw new DOMException("Consulta cancelada", "AbortError");
      }
      const resposta = await (opcoes.fetch ?? fetch)(caminho, {
        method: "GET", cache: "no-store", signal: controlador.signal
      });
      status = resposta.status;
      const dados = await resposta.json() as T;
      if (!dados || typeof dados !== "object") {
        throw new Error("Resposta inválida ao carregar o painel. Tente novamente.");
      }
      return { resposta, dados };
    };
    // Deadline covers the body too, even if a transport ignores abort.
    return await Promise.race([consulta(), cancelamento]);
  } catch (causa) {
    if (!opcoes.signal?.aborted) {
      console.warn("[HXP_COCKPIT_LOAD]", JSON.stringify({
        instante: new Date(inicio).toISOString(),
        endpoint: "/api/operacao-homologacao", metodo: "GET",
        status, duracao_ms: Date.now() - inicio,
        falha: expirou ? "TIMEOUT" : causa instanceof SyntaxError
          ? "INVALID_JSON" : "TRANSPORT_OR_RESPONSE_ERROR"
      }));
    }
    throw causa;
  } finally {
    if (temporizador !== undefined) clearTimeout(temporizador);
    opcoes.signal?.removeEventListener("abort", cancelar);
  }
}
