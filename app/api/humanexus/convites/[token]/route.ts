import { NextResponse } from "next/server";
import {
  ErroDoNucleo,
  requisitarNucleoPublico
} from "@/lib/humanexus-core";

const CORRELACAO = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const IDEMPOTENCIA = /^[A-Za-z0-9._:-]{16,160}$/;

async function chaveDeConclusao(token: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(token)
  );
  const hash = Array.from(new Uint8Array(digest))
    .map((item) => item.toString(16).padStart(2, "0"))
    .join("");
  return `anamnese:${hash}`;
}

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
        confirmacao_persistencia?: Record<string, unknown>;
      }>(
        `/api/v1/anamnese/convite/${seguro}/progresso`,
        {},
        { tempoLimiteMs: 20_000 }
      )
    ]);
    return NextResponse.json({
      ...estrutura,
      progresso: progresso.anamnese,
      confirmacao_persistencia: progresso.confirmacao_persistencia,
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
      const correlacaoRecebida = String(
        request.headers.get("x-humanexus-correlation-id") ?? ""
      ).trim();
      const correlacao = CORRELACAO.test(correlacaoRecebida)
        ? correlacaoRecebida
        : crypto.randomUUID();
      const chaveRecebida = String(
        request.headers.get("x-humanexus-idempotency-key")
        ?? corpo.chave_de_idempotencia
        ?? ""
      ).trim();
      const chave = chaveRecebida || await chaveDeConclusao(token);
      if (!IDEMPOTENCIA.test(chave)) {
        return NextResponse.json(
          { erro: { codigo: "CHAVE_DE_IDEMPOTENCIA_INVALIDA", mensagem: "Não foi possível preparar o envio seguro. Mantenha a tela aberta e tente novamente." } },
          { status: 400 }
        );
      }
      return NextResponse.json(
        await requisitarNucleoPublico(
          `/api/v1/anamnese/convite/${seguro}/concluir`,
          {
            method: "POST",
            headers: {
              "x-humanexus-correlation-id": correlacao,
              "x-humanexus-idempotency-key": chave
            },
            body: JSON.stringify({ chave_de_idempotencia: chave })
          },
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
