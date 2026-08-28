import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { requisitarNucleoAutenticado } from "@/lib/humanexus-core";
import { COOKIE_SESSAO } from "@/lib/portal-session";
import { exigirMesmaOrigem } from "@/lib/request-security";

async function tokenAtual() {
  return (await cookies()).get(COOKIE_SESSAO)?.value;
}

export async function GET() {
  try {
    const token = await tokenAtual();
    if (!token) throw new Error("Sessão ausente");
    return NextResponse.json(
      await requisitarNucleoAutenticado("/api/v1/anamneses", token)
    );
  } catch {
    return NextResponse.json(
      { erro: { mensagem: "Consulta não autorizada." } },
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
    return NextResponse.json(
      await requisitarNucleoAutenticado(
        "/api/v1/anamneses/convites-seguros",
        token,
        {
          method: "POST",
          body: JSON.stringify({
            identificador_da_organizacao:
              corpo.identificador_da_organizacao,
            identificador_do_participante:
              corpo.identificador_do_participante || null,
            novo_participante: corpo.novo_participante || null,
            chave_de_idempotencia: corpo.chave_de_idempotencia || null,
            tipo_atendimento: corpo.tipo_atendimento,
            identificador_da_organizacao_de_vinculo:
              corpo.identificador_da_organizacao_de_vinculo ?? null,
            nicho: corpo.nicho,
            funcao: corpo.funcao,
            validade_horas: Number(corpo.validade_horas ?? 72),
            usos_permitidos: Number(corpo.usos_permitidos ?? 50),
            identificador_da_sessao: corpo.identificador_da_sessao ?? null
          })
        }
      ),
      { status: 201 }
    );
  } catch (erro) {
    return NextResponse.json(
      {
        erro: {
          mensagem: erro instanceof Error
            ? erro.message
            : "Não foi possível criar o convite."
        }
      },
      { status: 422 }
    );
  }
}
