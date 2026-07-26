import { NextResponse } from "next/server";
import { requisitarNucleoPublico } from "@/lib/humanexus-core";
import { exigirMesmaOrigem } from "@/lib/request-security";

type Contexto = { params: Promise<{ id: string }> };

export async function GET(request: Request, contexto: Contexto) {
  try {
    const { id } = await contexto.params;
    const token = new URL(request.url).searchParams.get("token") ?? "";
    const dados = await requisitarNucleoPublico(
      `/api/v1/consentimentos/apresentacoes/${encodeURIComponent(id)}?token=${encodeURIComponent(token)}`
    );
    return NextResponse.json(dados);
  } catch {
    return NextResponse.json(
      { erro: { mensagem: "Documento indisponível." } },
      { status: 404 }
    );
  }
}

export async function POST(request: Request, contexto: Contexto) {
  try {
    exigirMesmaOrigem(request);
    const { id } = await contexto.params;
    const corpo = await request.json();
    const dados = await requisitarNucleoPublico(
      `/api/v1/consentimentos/apresentacoes/${encodeURIComponent(id)}/manifestacoes`,
      {
        method: "POST",
        body: JSON.stringify({
          token: String(corpo.token ?? ""),
          estado: String(corpo.estado ?? ""),
          papel: String(corpo.papel ?? "PARTICIPANTE")
        })
      }
    );
    return NextResponse.json(dados, { status: 201 });
  } catch {
    return NextResponse.json(
      { erro: { mensagem: "Não foi possível registrar a manifestação." } },
      { status: 400 }
    );
  }
}
