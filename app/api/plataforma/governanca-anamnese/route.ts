import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { requisitarNucleoAutenticado } from "@/lib/humanexus-core";
import { COOKIE_SESSAO } from "@/lib/portal-session";
import { responderErroDaApi } from "@/lib/api-route-error";

export async function GET() {
  const token = (await cookies()).get(COOKIE_SESSAO)?.value;
  if (!token) return NextResponse.json({ erro: { mensagem: "Sessão ausente." } }, { status: 401 });
  try {
    return NextResponse.json({
      dados: await requisitarNucleoAutenticado("/api/v1/anamnese/configuracao", token)
    });
  } catch (erro) {
    return responderErroDaApi(erro, {
      modulo: "GOVERNANCA_ANAMNESE",
      rota: "/api/v1/anamnese/configuracao",
      mensagemDeAcessoNegado: "Governança autoral restrita."
    });
  }
}
