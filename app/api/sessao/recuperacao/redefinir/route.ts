import { NextResponse } from "next/server";
import { redefinirSenhaNoNucleo } from "@/lib/humanexus-core";
import { exigirMesmaOrigem } from "@/lib/request-security";

export async function POST(request: Request) {
  try {
    exigirMesmaOrigem(request);
    const { token, novaSenha } = await request.json();
    await redefinirSenhaNoNucleo(String(token ?? ""), String(novaSenha ?? ""));
    return NextResponse.json({ concluido: true });
  } catch {
    return NextResponse.json(
      { erro: { mensagem: "O link é inválido, expirou ou já foi utilizado." } },
      { status: 400 }
    );
  }
}
