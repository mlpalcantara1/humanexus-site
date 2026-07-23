import { NextRequest, NextResponse } from "next/server";

const ROTAS_PRIVADAS = [
  "/admin",
  "/governanca",
  "/organizacao",
  "/profissional",
  "/operacional",
  "/auditoria",
  "/alterar-senha",
  "/sair"
];

export function middleware(request: NextRequest) {
  const resposta = NextResponse.next();
  resposta.headers.set("X-Content-Type-Options", "nosniff");
  resposta.headers.set("X-Frame-Options", "DENY");
  resposta.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  resposta.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  const privada = ROTAS_PRIVADAS.some(
    (rota) =>
      request.nextUrl.pathname === rota ||
      request.nextUrl.pathname.startsWith(`${rota}/`)
  );
  if (privada && !request.cookies.get("humanexus_sessao")?.value) {
    return NextResponse.redirect(new URL("/entrar", request.url));
  }
  return resposta;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/governanca/:path*",
    "/organizacao/:path*",
    "/profissional/:path*",
    "/operacional/:path*",
    "/auditoria/:path*",
    "/alterar-senha",
    "/sair"
  ]
};
