import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { requisitarNucleoAutenticado } from "@/lib/humanexus-core";
import { COOKIE_SESSAO } from "@/lib/portal-session";

export async function GET() {
  const token = (await cookies()).get(COOKIE_SESSAO)?.value;
  if (!token) {
    return NextResponse.json({ erro: { mensagem: "Sessão ausente." } }, { status: 401 });
  }
  try {
    return NextResponse.json(
      await requisitarNucleoAutenticado("/api/v1/convites-anamnese", token)
    );
  } catch {
    return NextResponse.json(
      { erro: { mensagem: "Consulta de convites não autorizada." } },
      { status: 403 }
    );
  }
}
