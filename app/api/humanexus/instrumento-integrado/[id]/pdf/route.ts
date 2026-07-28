import { NextResponse } from "next/server";
import { requisitarNucleoPublico } from "@/lib/humanexus-core";
import { gerarPdfInstrumentoIntegrado } from "@/lib/instrumento-integrado-pdf";

type Registro = Record<string, unknown>;
type Contexto = { params: Promise<{ id: string }> };

export async function GET(request: Request, contexto: Contexto) {
  try {
    const { id } = await contexto.params;
    const token = new URL(request.url).searchParams.get("token") ?? "";
    if (!token) throw new Error("Cópia indisponível.");
    const copia = await requisitarNucleoPublico<Registro>(
      `/api/v1/instrumento-integrado/apresentacoes/${encodeURIComponent(id)}`
      + `/copia?token=${encodeURIComponent(token)}`
    );
    const pdf = await gerarPdfInstrumentoIntegrado(copia);
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "content-type": "application/pdf",
        "content-disposition":
          `attachment; filename="instrumento-integrado-humanexus-${encodeURIComponent(id.slice(0, 8))}.pdf"`,
        "cache-control": "private, no-store"
      }
    });
  } catch {
    return NextResponse.json(
      { erro: { mensagem: "Cópia integral indisponível." } },
      { status: 404 }
    );
  }
}
