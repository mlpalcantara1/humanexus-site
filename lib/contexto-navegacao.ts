export const EVENTO_CONTEXTO_NAVEGACAO_ATUALIZADO =
  "humanexus:contexto-navegacao-atualizado";

export const CHAVES_DO_CONTEXTO_NAVEGACAO = [
  "organizacao",
  "participante",
  "sessao",
  "thx"
] as const;

export function substituirUrlPreservandoContexto(url: URL) {
  window.history.replaceState(window.history.state, "", url);
  window.dispatchEvent(new Event(EVENTO_CONTEXTO_NAVEGACAO_ATUALIZADO));
}
