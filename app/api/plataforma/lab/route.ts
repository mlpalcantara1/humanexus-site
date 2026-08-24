import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { requisitarNucleoAutenticado } from "@/lib/humanexus-core";
import { COOKIE_SESSAO } from "@/lib/portal-session";
import { responderErroDaApi } from "@/lib/api-route-error";

export async function GET() {
  const token = (await cookies()).get(COOKIE_SESSAO)?.value;
  if (!token) {
    return NextResponse.json({ erro: { mensagem: "Sessão ausente." } }, { status: 401 });
  }
  try {
    // O próprio núcleo aplica a permissão exclusiva do Administrador Proprietário.
    const dados = await requisitarNucleoAutenticado<unknown>(
      "/api/v1/humanexus-lab?modo=indice",
      token,
      {},
      { tentativas: 2, tempoLimiteMs: 5000 }
    );
    return NextResponse.json({ dados });
  } catch (erro) {
    return responderErroDaApi(erro, {
      modulo: "HUMANEXUS_LAB",
      rota: "/api/v1/humanexus-lab?modo=indice",
      mensagemDeAcessoNegado: "Laboratório HUMANEXUS disponível somente ao Administrador Proprietário."
    });
  }
}
