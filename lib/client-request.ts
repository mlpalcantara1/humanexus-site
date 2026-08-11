export class ErroDeConsulta extends Error {
  constructor(
    mensagem: string,
    readonly status: number,
    readonly reconectavel: boolean
  ) {
    super(mensagem);
  }
}

export function publicarEstadoDoNucleo(
  estado: "conectado" | "reconectando" | "offline"
) {
  window.dispatchEvent(new CustomEvent("humanexus:nucleo-status", { detail: estado }));
}

export async function consultarJson<T>(
  caminho: string,
  opcoes: { tentativas?: number; timeoutMs?: number; signal?: AbortSignal } = {}
): Promise<T> {
  const tentativas = Math.max(1, opcoes.tentativas ?? 3);
  const timeoutMs = opcoes.timeoutMs ?? 8000;
  let ultimaFalha: unknown = null;

  for (let tentativa = 1; tentativa <= tentativas; tentativa += 1) {
    const controlador = new AbortController();
    const cancelar = () => controlador.abort();
    opcoes.signal?.addEventListener("abort", cancelar, { once: true });
    const limite = window.setTimeout(() => controlador.abort(), timeoutMs);
    try {
      const resposta = await fetch(caminho, {
        cache: "no-store",
        signal: controlador.signal
      });
      const corpo = await resposta.json().catch(() => null);
      if (!resposta.ok) {
        const reconectavel = [408, 429, 502, 503, 504].includes(resposta.status);
        throw new ErroDeConsulta(
          corpo?.erro?.mensagem ?? "A resposta do núcleo não pôde ser processada.",
          resposta.status,
          reconectavel
        );
      }
      publicarEstadoDoNucleo("conectado");
      return corpo as T;
    } catch (erro) {
      ultimaFalha = erro;
      if (opcoes.signal?.aborted) throw erro;
      const reconectavel = erro instanceof ErroDeConsulta
        ? erro.reconectavel
        : erro instanceof DOMException && erro.name === "AbortError"
          ? true
          : !navigator.onLine;
      if (!reconectavel || tentativa === tentativas) break;
      publicarEstadoDoNucleo(navigator.onLine ? "reconectando" : "offline");
      await new Promise((resolver) => window.setTimeout(resolver, 350 * (2 ** (tentativa - 1))));
    } finally {
      window.clearTimeout(limite);
      opcoes.signal?.removeEventListener("abort", cancelar);
    }
  }

  publicarEstadoDoNucleo(navigator.onLine ? "reconectando" : "offline");
  if (ultimaFalha instanceof ErroDeConsulta) throw ultimaFalha;
  if (ultimaFalha instanceof DOMException && ultimaFalha.name === "AbortError") {
    throw new ErroDeConsulta("O núcleo demorou mais que o esperado. Tente novamente.", 504, true);
  }
  throw new ErroDeConsulta(
    navigator.onLine
      ? "Núcleo temporariamente indisponível. Estamos tentando restabelecer a conexão."
      : "Sem conexão de rede. Seus dados já preenchidos permanecem nesta tela.",
    navigator.onLine ? 503 : 0,
    true
  );
}
