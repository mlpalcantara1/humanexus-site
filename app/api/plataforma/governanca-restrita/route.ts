import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { requisitarNucleoAutenticado } from "@/lib/humanexus-core";
import { COOKIE_SESSAO } from "@/lib/portal-session";

export async function GET() {
  const token = (await cookies()).get(COOKIE_SESSAO)?.value;
  if (!token) {
    return NextResponse.json(
      { erro: { mensagem: "Sessão ausente." } },
      { status: 401 }
    );
  }
  try {
    const dados = await requisitarNucleoAutenticado<unknown>(
      "/api/v1/humanexus-lab/parametrizacao-prospectiva",
      token
    );
    return NextResponse.json({ dados });
  } catch {
    return NextResponse.json(
      { erro: { mensagem: "Recurso de governança restrito." } },
      { status: 403 }
    );
  }
}
