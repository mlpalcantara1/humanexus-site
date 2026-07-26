import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { requisitarNucleoAutenticado } from "@/lib/humanexus-core";
import { COOKIE_SESSAO } from "@/lib/portal-session";
import { exigirMesmaOrigem } from "@/lib/request-security";

async function tokenAtual() {
  return (await cookies()).get(COOKIE_SESSAO)?.value;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await tokenAtual();
    if (!token) throw new Error("Sessão ausente");
    const { id } = await params;
    return NextResponse.json(
      await requisitarNucleoAutenticado(
        `/api/v1/convites/${encodeURIComponent(id)}/historico`,
        token
      )
    );
  } catch {
    return NextResponse.json({ erro: { mensagem: "Consulta não autorizada." } }, { status: 403 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    exigirMesmaOrigem(request);
    const token = await tokenAtual();
    if (!token) throw new Error("Sessão ausente");
    const { id } = await params;
    const corpo = await request.json();
    const acao = String(corpo.acao ?? "");
    const caminho = acao === "REVOGAR"
      ? `/api/v1/convites/${encodeURIComponent(id)}/revogar`
      : `/api/v1/convites/${encodeURIComponent(id)}/compartilhamento`;
    return NextResponse.json(
      await requisitarNucleoAutenticado(caminho, token, {
        method: "POST",
        body: JSON.stringify({
          justificativa: corpo.justificativa,
          provedor_confirmou: acao === "ENVIADO_CONFIRMADO"
        })
      })
    );
  } catch {
    return NextResponse.json(
      { erro: { mensagem: "Ação de convite não autorizada." } },
      { status: 403 }
    );
  }
}
