import { NextResponse } from "next/server";
import { solicitarRecuperacaoNoNucleo } from "@/lib/humanexus-core";
import { exigirMesmaOrigem } from "@/lib/request-security";

export async function POST(request: Request) {
  try {
    exigirMesmaOrigem(request);
    const { email } = await request.json();
    const resposta = await solicitarRecuperacaoNoNucleo(String(email ?? ""));
    return NextResponse.json(resposta, { status: 202 });
  } catch {
    return NextResponse.json(
      { mensagem: "Se o endereço estiver cadastrado, as instruções serão enviadas." },
      { status: 202 }
    );
  }
}
