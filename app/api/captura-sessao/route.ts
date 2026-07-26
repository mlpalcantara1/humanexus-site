import { NextResponse } from "next/server";
import { requisitarNucleoPublico } from "@/lib/humanexus-core";
import { exigirMesmaOrigem } from "@/lib/request-security";

type Registro = Record<string, unknown>;

export async function POST(request: Request) {
  try {
    exigirMesmaOrigem(request);
    const token = request.headers.get("x-humanexus-capture-token") ?? "";
    if (token.length < 32 || token.length > 160) {
      throw new Error("Acesso de captura inválido.");
    }
    const corpo = await request.json() as Registro;
    const resultado = await requisitarNucleoPublico(
      "/api/v1/captura-segura",
      {
        method: "POST",
        body: JSON.stringify({ ...corpo, token })
      }
    );
    return NextResponse.json(resultado, {
      headers: {
        "cache-control": "no-store",
        "referrer-policy": "no-referrer"
      }
    });
  } catch (erro) {
    return NextResponse.json(
      {
        erro: {
          mensagem: erro instanceof Error
            ? erro.message
            : "Captura indisponível."
        }
      },
      { status: 403 }
    );
  }
}
