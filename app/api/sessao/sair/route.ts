import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { sairDoNucleo } from "@/lib/humanexus-core";
import { COOKIE_CSRF, COOKIE_SESSAO } from "@/lib/portal-session";
import { exigirCsrf } from "@/lib/request-security";

export async function POST(request: Request) {
  const armazenamento = await cookies();
  try {
    exigirCsrf(request, armazenamento.get(COOKIE_CSRF)?.value);
  } catch {
    return NextResponse.json(
      { erro: { mensagem: "Requisição de saída não autorizada." } },
      { status: 403 }
    );
  }
  const token = armazenamento.get(COOKIE_SESSAO)?.value;
  if (token) {
    try {
      await sairDoNucleo(token);
    } catch {
      // Remove o cookie local se a sessão já estiver inválida ou expirada.
    }
  }
  const resposta = NextResponse.json({ destino: "/entrar" });
  resposta.cookies.delete(COOKIE_SESSAO);
  resposta.cookies.delete(COOKIE_CSRF);
  return resposta;
}
