import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { requisitarNucleoAutenticado } from "@/lib/humanexus-core";
import { COOKIE_SESSAO } from "@/lib/portal-session";
import { responderErroDaApi } from "@/lib/api-route-error";

type Contexto = { params: Promise<{ id: string }> };

export async function GET(request: Request, contexto: Contexto) {
  const token = (await cookies()).get(COOKIE_SESSAO)?.value;
  if (!token) {
    return NextResponse.json({ erro: { mensagem: "Sessão ausente." } }, { status: 401 });
  }
  const { id } = await contexto.params;
  const organizacao = new URL(request.url).searchParams.get("organizacao")?.trim();
  if (!id || !organizacao) {
    return NextResponse.json({ erro: { mensagem: "Participante e organização são obrigatórios." } }, { status: 400 });
  }
  const caminho = `/api/v1/participantes/${encodeURIComponent(id)}/instrumentos-integrados?organizacao=${encodeURIComponent(organizacao)}`;
  try {
    const historico = await requisitarNucleoAutenticado(caminho, token);
    return NextResponse.json(historico, {
      headers: { "cache-control": "private, no-store" }
    });
  } catch (erro) {
    return responderErroDaApi(erro, {
      modulo: "INSTRUMENTO_INTEGRADO",
      rota: caminho
    });
  }
}
