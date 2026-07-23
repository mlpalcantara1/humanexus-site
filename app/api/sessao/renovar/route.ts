import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { renovarNoNucleo } from "@/lib/humanexus-core";
import { COOKIE_CSRF, COOKIE_SESSAO } from "@/lib/portal-session";
import { exigirCsrf } from "@/lib/request-security";

export async function POST(request: Request) {
  const armazenamento = await cookies();
  try {
    exigirCsrf(request, armazenamento.get(COOKIE_CSRF)?.value);
    const token = armazenamento.get(COOKIE_SESSAO)?.value;
    if (!token) throw new Error("Sessão ausente.");
    const sessao = await renovarNoNucleo(token);
    const resposta = NextResponse.json({ renovada: true });
    resposta.cookies.set(COOKIE_SESSAO, sessao.token, {
      httpOnly: true,
      path: "/",
      sameSite: "strict",
      secure: new URL(request.url).protocol === "https:",
      maxAge: sessao.expiraEmSegundos
    });
    return resposta;
  } catch {
    return NextResponse.json(
      { erro: { mensagem: "Sessão expirada." } },
      { status: 401 }
    );
  }
}
