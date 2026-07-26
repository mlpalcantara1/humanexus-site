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
        `/api/v1/anamneses/${encodeURIComponent(id)}/revisao`,
        token
      )
    );
  } catch {
    return NextResponse.json(
      { erro: { mensagem: "Revisão profissional não autorizada." } },
      { status: 403 }
    );
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
    const sufixo = acao === "NOVO_CONVITE"
      ? "convites/reenviar"
      : acao === "REABRIR"
      ? "reabrir"
      : acao === "ACEITAR_EVIDENCIA"
        ? "evidencias"
        : acao === "OBSERVAR"
          ? "observacoes"
          : "revisar";
    return NextResponse.json(
      await requisitarNucleoAutenticado(
        `/api/v1/anamneses/${encodeURIComponent(id)}/${sufixo}`,
        token,
        { method: "POST", body: JSON.stringify(corpo) }
      ),
      { status: acao === "REABRIR" || acao === "NOVO_CONVITE" || acao === "ACEITAR_EVIDENCIA" || acao === "OBSERVAR" ? 201 : 200 }
    );
  } catch {
    return NextResponse.json(
      { erro: { mensagem: "Ação profissional não autorizada." } },
      { status: 403 }
    );
  }
}
