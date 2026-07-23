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
    // O próprio núcleo aplica a permissão exclusiva do Administrador Proprietário.
    const dados = await requisitarNucleoAutenticado<unknown>(
      "/api/v1/humanexus-lab",
      token
    );
    return NextResponse.json({ dados });
  } catch {
    return NextResponse.json(
      { erro: { mensagem: "HUMANEXUS LAB disponível somente ao Administrador Proprietário." } },
      { status: 403 }
    );
  }
}
