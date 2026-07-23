import { NextResponse } from "next/server";
import { requisitarNucleoPublico } from "@/lib/humanexus-core";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ token: string; question: string }> }
) {
  try {
    const { token, question } = await params;
    const corpo = await request.json();
    return NextResponse.json(
      await requisitarNucleoPublico(
        `/api/v1/anamnese/convite/${encodeURIComponent(token)}/respostas/${encodeURIComponent(question)}`,
        { method: "PUT", body: JSON.stringify(corpo) }
      )
    );
  } catch {
    return NextResponse.json(
      { erro: { mensagem: "Resposta não salva por conflito ou convite inválido." } },
      { status: 409 }
    );
  }
}
