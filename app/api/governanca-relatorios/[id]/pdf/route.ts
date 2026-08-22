import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { responderErroDaApi } from "@/lib/api-route-error";
import { requisitarNucleoBinario } from "@/lib/humanexus-core";
import { COOKIE_SESSAO } from "@/lib/portal-session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = (await cookies()).get(COOKIE_SESSAO)?.value;
  if (!token) {
    return NextResponse.json(
      { erro: { mensagem: "Sua sessão expirou." } },
      { status: 401 },
    );
  }
  try {
    const { id } = await params;
    const arquivo = await requisitarNucleoBinario(
      `/api/v1/relatorios/${encodeURIComponent(id)}/pdf`,
      token,
    );
    return new NextResponse(new Uint8Array(arquivo.bytes), {
      headers: {
        "content-type": arquivo.tipo,
        "content-disposition": arquivo.disposicao
          ?? "attachment; filename=humanexus-relatorio.pdf",
        "cache-control": "private, no-store",
      },
    });
  } catch (erro) {
    return responderErroDaApi(erro, {
      modulo: "GOVERNANCA_RELATORIOS",
      rota: "/api/v1/relatorios/:id/pdf",
      mensagemDeAcessoNegado: (
        "Seu perfil não possui autorização para exportar este relatório."
      ),
    });
  }
}
