import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { alterarSenhaNoNucleo } from "@/lib/humanexus-core";
import { COOKIE_CSRF, COOKIE_SESSAO } from "@/lib/portal-session";
import { exigirCsrf } from "@/lib/request-security";

export async function POST(request: Request) {
  const armazenamento = await cookies();
  try {
    exigirCsrf(request, armazenamento.get(COOKIE_CSRF)?.value);
    const token = armazenamento.get(COOKIE_SESSAO)?.value;
    if (!token) throw new Error("Sessão ausente");
    const { senhaAtual, novaSenha } = await request.json();
    await alterarSenhaNoNucleo(token, String(senhaAtual ?? ""), String(novaSenha ?? ""));
    const resposta = NextResponse.json({ destino: "/entrar" });
    resposta.cookies.delete(COOKIE_SESSAO);
    resposta.cookies.delete(COOKIE_CSRF);
    return resposta;
  } catch {
    return NextResponse.json(
      { erro: { mensagem: "Não foi possível alterar a senha." } },
      { status: 400 }
    );
  }
}
