export function normalizarComandoOperacional(comando: unknown) {
  return String(comando ?? "").trim().toUpperCase().replace(/\s+/g, "_");
}

export function criarPayloadDoComandoPrincipal(
  comandoVisivel: unknown,
  chaveDeIdempotencia: string
) {
  const comando = normalizarComandoOperacional(comandoVisivel);
  const chave = String(chaveDeIdempotencia ?? "").trim();
  if (!comando) {
    throw new Error("O comando operacional visível não foi informado.");
  }
  if (!chave) {
    throw new Error("A tentativa operacional não possui chave de idempotência.");
  }
  return {
    comando,
    chave_de_idempotencia: chave
  };
}
