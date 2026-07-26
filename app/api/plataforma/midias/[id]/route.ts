import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  requisitarNucleoAutenticado,
  requisitarNucleoBinario
} from "@/lib/humanexus-core";
import { COOKIE_SESSAO } from "@/lib/portal-session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = (await cookies()).get(COOKIE_SESSAO)?.value;
  if (!token) {
    return NextResponse.json(
      { erro: { mensagem: "Sessão ausente." } },
      { status: 401 }
    );
  }
  try {
    const { id } = await params;
    const autorizacao = await requisitarNucleoAutenticado<{
      estado: string;
      url?: string;
    }>(
      `/api/v1/midias/${encodeURIComponent(id)}/reproduzir`,
      token,
      {
        method: "POST",
        body: JSON.stringify({ finalidade: "REPLAY_AUTORIZADO" })
      }
    );
    if (autorizacao.estado === "URL_TEMPORARIA" && autorizacao.url) {
      return NextResponse.redirect(autorizacao.url, 307);
    }
    const arquivo = await requisitarNucleoBinario(
      `/api/v1/midias/${encodeURIComponent(id)}/conteudo`,
      token
    );
    return new NextResponse(arquivo.bytes, {
      headers: {
        "content-type": arquivo.tipo,
        "cache-control": "private, no-store, max-age=0",
        "content-security-policy": "default-src 'none'",
        "x-content-type-options": "nosniff"
      }
    });
  } catch (erro) {
    return NextResponse.json(
      { erro: { mensagem: erro instanceof Error ? erro.message : "Mídia indisponível." } },
      { status: 403 }
    );
  }
}
