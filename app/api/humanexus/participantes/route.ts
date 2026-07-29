import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { requisitarNucleoAutenticado } from "@/lib/humanexus-core";
import { COOKIE_SESSAO } from "@/lib/portal-session";
import { exigirMesmaOrigem } from "@/lib/request-security";

async function tokenAtual() {
  return (await cookies()).get(COOKIE_SESSAO)?.value;
}

export async function GET(request: Request) {
  try {
    const token = await tokenAtual();
    if (!token) throw new Error("Sessão ausente");
    const organizacao = new URL(request.url).searchParams.get("organizacao");
    const parametros = new URLSearchParams({ modulo: "clientes" });
    if (organizacao) parametros.set("organizacao", organizacao);
    return NextResponse.json(
      await requisitarNucleoAutenticado(
        `/api/v1/gestao/contexto?${parametros}`,
        token
      )
    );
  } catch (erro) {
    return NextResponse.json(
      {
        erro: {
          mensagem: erro instanceof Error
            ? erro.message
            : "Participantes indisponíveis."
        }
      },
      { status: 403 }
    );
  }
}

export async function POST(request: Request) {
  try {
    exigirMesmaOrigem(request);
    const token = await tokenAtual();
    if (!token) throw new Error("Sessão ausente");
    const corpo = await request.json();
    const participante = await requisitarNucleoAutenticado(
      "/api/v1/participantes",
      token,
      {
        method: "POST",
        body: JSON.stringify({
          identificador_da_organizacao: corpo.identificador_da_organizacao,
          referencia_externa: corpo.referencia_externa || randomUUID(),
          tipo_de_vinculo: corpo.tipo_de_vinculo,
          dados_minimizados: {
            nome_preferencial: corpo.nome
          },
          dados_cadastrais: {
            nome_completo: corpo.nome,
            email: corpo.email,
            telefone: corpo.telefone
          },
          dados_profissionais: {
            cargo: corpo.funcao
          },
          contatos: [],
          justificativa: "Cadastro realizado para Anamnese Regulatória."
        })
      }
    );
    return NextResponse.json(participante, { status: 201 });
  } catch (erro) {
    return NextResponse.json(
      {
        erro: {
          mensagem: erro instanceof Error
            ? erro.message
            : "Não foi possível cadastrar o participante."
        }
      },
      { status: 422 }
    );
  }
}
