import { NextResponse } from "next/server";
import { requisitarNucleoPublico } from "@/lib/humanexus-core";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const seguro = encodeURIComponent(token);
    const [estrutura, progresso] = await Promise.all([
      requisitarNucleoPublico<Record<string, unknown>>(
        `/api/v1/anamnese/convite/${seguro}/estrutura`
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
      }>(`/api/v1/anamnese/convite/${seguro}/progresso`)
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
  } catch {
    return NextResponse.json(
      { erro: { mensagem: "Convite inválido, expirado ou revogado." } },
      { status: 404 }
    );
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
          }
        )
      );
    }
    if (acao === "CONCLUIR") {
      return NextResponse.json(
        await requisitarNucleoPublico(
          `/api/v1/anamnese/convite/${seguro}/concluir`,
          { method: "POST" }
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
          }
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
          }
        )
      );
    }
    throw new Error("Ação inválida");
  } catch {
    return NextResponse.json(
      { erro: { mensagem: "Não foi possível atualizar a anamnese." } },
      { status: 422 }
    );
  }
}
