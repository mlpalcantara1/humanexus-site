import { NextResponse } from "next/server";
import {
  ErroDoNucleo,
  requisitarNucleoPublico
} from "@/lib/humanexus-core";

function respostaDeErro(erro: unknown, padrao: string) {
  if (!(erro instanceof ErroDoNucleo)) {
    return NextResponse.json(
      { erro: { codigo: "FALHA_TRANSITORIA", mensagem: padrao } },
      { status: 503 }
    );
  }
  const conviteIndisponivel = [401, 403, 404, 410].includes(erro.status);
  const mensagem = conviteIndisponivel
    ? "Este convite expirou ou não está mais disponível."
    : erro.status >= 500
      ? "O Núcleo está temporariamente indisponível. Aguarde alguns segundos e tente novamente sem recarregar a página."
      : erro.message;
  return NextResponse.json(
    { erro: { codigo: erro.codigo, mensagem } },
    { status: conviteIndisponivel ? 410 : erro.status }
  );
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const seguro = encodeURIComponent(token);
    const [estrutura, progresso] = await Promise.all([
      requisitarNucleoPublico<Record<string, unknown>>(
        `/api/v1/anamnese/convite/${seguro}/estrutura`,
        {},
        { tempoLimiteMs: 20_000 }
      ),
      requisitarNucleoPublico<{
        anamnese: {
          estado: string;
          ultima_secao?: string;
          percentual_concluido: number;
        };
        respostas: {
          identificador_da_pergunta: string;
          resposta_json: unknown;
          versao_de_controle: number;
        }[];
      }>(
        `/api/v1/anamnese/convite/${seguro}/progresso`,
        {},
        { tempoLimiteMs: 20_000 }
      )
    ]);
    return NextResponse.json({
      ...estrutura,
      progresso: progresso.anamnese,
      respostas: progresso.respostas.map((resposta) => ({
        question_id: resposta.identificador_da_pergunta,
        answer: resposta.resposta_json,
        control_version: resposta.versao_de_controle
      }))
    });
  } catch (erro) {
    return respostaDeErro(erro, "Não foi possível carregar o convite agora. Tente novamente sem descartar o acesso recebido.");
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const corpo = await request.json();
    const { acao } = corpo;
    const seguro = encodeURIComponent(token);
    if (acao === "INICIAR") {
      return NextResponse.json(
        await requisitarNucleoPublico(
          `/api/v1/anamnese/convite/${seguro}/iniciar`,
          {
            method: "POST",
            body: JSON.stringify({
              consentimento: {
                versao: "LGPD-HUMANEXUS-1.0",
                finalidade: "ANAMNESE_REGULATORIA"
              }
            })
          },
          { tempoLimiteMs: 20_000 }
        )
      );
    }
    if (acao === "CONCLUIR") {
      return NextResponse.json(
        await requisitarNucleoPublico(
          `/api/v1/anamnese/convite/${seguro}/concluir`,
          { method: "POST" },
          { tempoLimiteMs: 20_000 }
        )
      );
    }
    if (acao === "SELECIONAR_RAMO") {
      return NextResponse.json(
        await requisitarNucleoPublico(
          `/api/v1/anamnese/convite/${seguro}/ramo`,
          {
            method: "POST",
            body: JSON.stringify({
              alternativa_de_ramo: corpo.alternativa_de_ramo,
              nicho: corpo.nicho,
              funcao: corpo.funcao,
              nicho_customizado: corpo.nicho_customizado,
              funcao_customizada: corpo.funcao_customizada,
              contexto_profissional_declarado: corpo.contexto_profissional_declarado,
              conflito_confirmado: corpo.conflito_confirmado
            })
          },
          { tempoLimiteMs: 20_000 }
        )
      );
    }
    if (acao === "CONFIRMAR_REVISAO_DO_RAMO") {
      return NextResponse.json(
        await requisitarNucleoPublico(
          `/api/v1/anamnese/convite/${seguro}/ramo`,
          {
            method: "POST",
            body: JSON.stringify({ acao: "CONFIRMAR_REVISAO" })
          },
          { tempoLimiteMs: 20_000 }
        )
      );
    }
    throw new Error("Ação inválida");
  } catch (erro) {
    return respostaDeErro(erro, "Não foi possível atualizar a anamnese. O conteúdo preenchido permanece nesta tela para uma nova tentativa.");
  }
}
