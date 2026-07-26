import { NextResponse } from "next/server";
import { recuperarProprietarioLocalmenteNoNucleo } from "@/lib/humanexus-core";
import { exigirMesmaOrigem } from "@/lib/request-security";

const HOSPEDES_LOCAIS = new Set(["localhost", "127.0.0.1", "::1"]);

export async function POST(request: Request) {
  try {
    exigirMesmaOrigem(request);
    if (!HOSPEDES_LOCAIS.has(new URL(request.url).hostname)) {
      return NextResponse.json(
        { erro: { mensagem: "Recuperação local indisponível." } },
        { status: 404 }
      );
    }
    const { novaSenha } = await request.json();
    await recuperarProprietarioLocalmenteNoNucleo(
      String(novaSenha ?? "")
    );
    return NextResponse.json({
      concluido: true,
      token_exposto_ao_navegador: false
    });
  } catch {
    return NextResponse.json(
      {
        erro: {
          mensagem:
            "Não foi possível concluir a recuperação local segura."
        }
      },
      { status: 400 }
    );
  }
}
