type ContextoDeGravacao = {
  sessao?: { identificador?: string; identificador_da_organizacao?: string };
};

// A organização vem da sessão já autorizada pelo núcleo, nunca de um valor padrão.
export function cabecalhosDaSessaoDeGravacao(contexto: unknown, sessao: string): Headers {
  const registro = (contexto as ContextoDeGravacao | null)?.sessao;
  if (!sessao || registro?.identificador !== sessao || !registro.identificador_da_organizacao) {
    throw new Error("Não foi possível confirmar a organização desta sessão. Atualize a preparação.");
  }
  return new Headers({ "x-humanexus-organization-id": registro.identificador_da_organizacao });
}
