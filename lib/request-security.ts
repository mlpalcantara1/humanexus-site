export function exigirMesmaOrigem(request: Request) {
  const origem = request.headers.get("origin");
  const destino =
    request.headers.get("x-forwarded-host")?.split(",", 1)[0]?.trim() ||
    request.headers.get("host") ||
    new URL(request.url).host;
  if (!origem || new URL(origem).host !== destino) {
    throw new Error("Origem da requisição não autorizada.");
  }
}

export function exigirCsrf(request: Request, esperado?: string) {
  exigirMesmaOrigem(request);
  const recebido = request.headers.get("x-humanexus-csrf");
  if (!esperado || !recebido || recebido !== esperado) {
    throw new Error("Validação de segurança da sessão falhou.");
  }
}
