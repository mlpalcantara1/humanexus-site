import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { requisitarNucleoAutenticado } from "@/lib/humanexus-core";
import { COOKIE_CSRF, COOKIE_SESSAO } from "@/lib/portal-session";
import { exigirCsrf } from "@/lib/request-security";
import { responderErroDaApi } from "@/lib/api-route-error";

async function tokenDaSessao() {
  return (await cookies()).get(COOKIE_SESSAO)?.value;
}

export async function GET() {
  const token = await tokenDaSessao();
  if (!token) return NextResponse.json({}, { status: 401 });
  try {
    const resumo = await requisitarNucleoAutenticado("/api/v1/painel/resumo", token);
    const organizacoes = await requisitarNucleoAutenticado("/api/v1/organizacoes", token);
    const usuarios = await requisitarNucleoAutenticado("/api/v1/usuarios", token);
    return NextResponse.json({ resumo, organizacoes, usuarios });
  } catch (erro) {
    return responderErroDaApi(erro, {
      modulo: "ADMINISTRACAO",
      rota: "/api/v1/painel/resumo",
      mensagemDeAcessoNegado: "Acesso administrativo não autorizado."
    });
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
    if (corpo.acao === "atualizar_usuario") {
      return NextResponse.json(
        await requisitarNucleoAutenticado(
          `/api/v1/usuarios/${encodeURIComponent(corpo.identificador)}`,
          token,
          {
            method: "PUT",
            body: JSON.stringify(corpo.usuario)
          }
        )
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
