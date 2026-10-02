export function cabecalhosDaRequisicaoAoNucleo(
  recebidos: HeadersInit | undefined,
  token: string | undefined,
  segredoDeProtecao: string
): Headers {
  const cabecalhos = new Headers({ "content-type": "application/json" });
  if (segredoDeProtecao) {
    cabecalhos.set("x-vercel-protection-bypass", segredoDeProtecao);
  }
  if (token) {
    cabecalhos.set("authorization", `Bearer ${token}`);
  }
  new Headers(recebidos).forEach((valor, nome) => {
    cabecalhos.set(nome, valor);
  });
  return cabecalhos;
}
