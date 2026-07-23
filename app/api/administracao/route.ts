import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { requisitarNucleoAutenticado } from "@/lib/humanexus-core";
import { COOKIE_CSRF, COOKIE_SESSAO } from "@/lib/portal-session";
import { exigirCsrf } from "@/lib/request-security";

async function tokenDaSessao() {
  return (await cookies()).get(COOKIE_SESSAO)?.value;
}

export async function GET() {
  const token = await tokenDaSessao();
  if (!token) return NextResponse.json({}, { status: 401 });
  try {
    const [resumo, organizacoes, usuarios] = await Promise.all([
      requisitarNucleoAutenticado("/api/v1/painel/resumo", token),
      requisitarNucleoAutenticado("/api/v1/organizacoes", token),
      requisitarNucleoAutenticado("/api/v1/usuarios", token)
    ]);
    return NextResponse.json({ resumo, organizacoes, usuarios });
  } catch {
    return NextResponse.json(
      { erro: { mensagem: "Acesso administrativo não autorizado." } },
      { status: 403 }
    );
  }
}

export async function POST(request: Request) {
  const armazenamento = await cookies();
  const token = armazenamento.get(COOKIE_SESSAO)?.value;
  try {
    exigirCsrf(request, armazenamento.get(COOKIE_CSRF)?.value);
    if (!token) throw new Error("Sessão ausente");
    const corpo = await request.json();
    if (corpo.acao === "criar_organizacao") {
      return NextResponse.json(
        await requisitarNucleoAutenticado("/api/v1/organizacoes", token, {
          method: "POST",
          body: JSON.stringify({ nome: corpo.nome })
        }),
        { status: 201 }
      );
    }
    if (corpo.acao === "criar_usuario") {
      return NextResponse.json(
        await requisitarNucleoAutenticado("/api/v1/usuarios", token, {
          method: "POST",
          body: JSON.stringify(corpo.usuario)
        }),
        { status: 201 }
      );
    }
    if (corpo.acao === "alterar_acesso") {
      const destino = corpo.ativo ? "reativar" : "suspender";
      return NextResponse.json(
        await requisitarNucleoAutenticado(
          `/api/v1/usuarios/${encodeURIComponent(corpo.identificador)}/${destino}`,
          token,
          { method: "POST" }
        )
      );
    }
    throw new Error("Ação inválida");
  } catch {
    return NextResponse.json(
      { erro: { mensagem: "Operação administrativa recusada." } },
      { status: 400 }
    );
  }
}
