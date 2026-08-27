import { NextResponse } from "next/server";
import {
  ErroDoNucleo,
  requisitarNucleoPublico
} from "@/lib/humanexus-core";

function respostaDeErro(erro: unknown) {
  if (!(erro instanceof ErroDoNucleo)) {
    return NextResponse.json(
      { erro: { codigo: "FALHA_TRANSITORIA", mensagem: "Não foi possível confirmar a resposta. O conteúdo permanece neste dispositivo para uma nova tentativa." } },
      { status: 503 }
    );
  }
  const conviteIndisponivel = [401, 403, 404, 410].includes(erro.status);
  const conflito = erro.status === 409;
  const mensagem = conviteIndisponivel
    ? "Este convite expirou ou não está mais disponível. Suas respostas não serão apagadas desta tela."
    : conflito
      ? "Esta resposta foi atualizada em outro acesso. Revise o campo indicado antes de tentar novamente."
      : erro.status >= 500
        ? "O Núcleo demorou a confirmar a resposta. O conteúdo foi preservado para uma nova tentativa."
        : erro.message;
  return NextResponse.json(
    { erro: { codigo: erro.codigo, mensagem } },
    { status: conviteIndisponivel ? 410 : erro.status }
  );
}

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
        { method: "PUT", body: JSON.stringify(corpo) },
        { tempoLimiteMs: 20_000 }
      )
    );
  } catch (erro) {
    return respostaDeErro(erro);
  }
}
