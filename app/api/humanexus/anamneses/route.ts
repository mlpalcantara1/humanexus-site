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
    const anamnese = await requisitarNucleoAutenticado<{ identificador: string }>(
      `/api/v1/participantes/${corpo.participante_id}/anamneses`,
      token,
      {
        method: "POST",
        body: JSON.stringify({
          identificador_da_identidade_longitudinal: corpo.identidade_id,
          identificador_do_vinculo: corpo.vinculo_id,
          finalidade: "ANAMNESE_REGULATORIA",
          nicho: corpo.nicho
        })
      }
    );
    return NextResponse.json(
      await requisitarNucleoAutenticado(
        `/api/v1/anamneses/${anamnese.identificador}/convites`,
        token,
        { method: "POST" }
      ),
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { erro: { mensagem: "Não foi possível criar o convite." } },
      { status: 422 }
    );
  }
}
