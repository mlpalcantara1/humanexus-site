import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { entrarNoNucleo, obterUsuarioDoNucleo } from "@/lib/humanexus-core";
import {
  COOKIE_CSRF,
  COOKIE_SESSAO,
  destinoDoPerfil
} from "@/lib/portal-session";
import { exigirMesmaOrigem } from "@/lib/request-security";

export async function POST(request: Request) {
  try {
    exigirMesmaOrigem(request);
    const { email, senha } = await request.json();
    const sessao = await entrarNoNucleo(String(email ?? ""), String(senha ?? ""));
    const usuario = await obterUsuarioDoNucleo(sessao.token);
    const csrf = randomUUID();
    const resposta = NextResponse.json({
      destino: destinoDoPerfil(usuario.perfil)
    });
    const base = {
      path: "/",
      sameSite: "strict" as const,
      secure: new URL(request.url).protocol === "https:",
      maxAge: sessao.expiraEmSegundos
    };
    resposta.cookies.set(COOKIE_SESSAO, sessao.token, {
      ...base,
      httpOnly: true
    });
    resposta.cookies.set(COOKIE_CSRF, csrf, {
      ...base,
      httpOnly: false
    });
    return resposta;
  } catch {
    return NextResponse.json(
      { erro: { mensagem: "E-mail ou senha inválidos." } },
      { status: 401 }
    );
  }
}
