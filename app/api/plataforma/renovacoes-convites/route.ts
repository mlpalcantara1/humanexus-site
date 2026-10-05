import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { requisitarNucleoAutenticado } from "@/lib/humanexus-core";
import { COOKIE_CSRF, COOKIE_SESSAO } from "@/lib/portal-session";
import { exigirCsrf } from "@/lib/request-security";
import { responderErroDaApi } from "@/lib/api-route-error";

const caminho = "/api/v1/administracao/renovacoes-convites";

export async function GET(request: Request) {
  const token = (await cookies()).get(COOKIE_SESSAO)?.value;
  if (!token) {
    return NextResponse.json({ erro: { mensagem: "Sessão ausente." } }, { status: 401 });
  }
  const chave = new URL(request.url).searchParams.get("chave")?.trim() ?? "";
  if (!/^[A-Za-z0-9._:-]{12,100}$/.test(chave)) {
    return NextResponse.json({ erro: { mensagem: "Chave inválida." } }, { status: 400 });
  }
  try {
    const resultado = await requisitarNucleoAutenticado(
      `${caminho}/${encodeURIComponent(chave)}`, token
    );
    return NextResponse.json(resultado);
  } catch (erro) {
    return responderErroDaApi(erro, {
      modulo: "RENOVACAO_CONVITES",
      rota: caminho,
      mensagemDeAcessoNegado: "Consulta de renovação não autorizada."
    });
  }
}

export async function POST(request: Request) {
  const armazenamento = await cookies();
  const token = armazenamento.get(COOKIE_SESSAO)?.value;
  if (!token) {
    return NextResponse.json({ erro: { mensagem: "Sessão ausente." } }, { status: 401 });
  }
  try {
    exigirCsrf(request, armazenamento.get(COOKIE_CSRF)?.value);
    const dados = await request.json() as Record<string, unknown>;
    const organizacao = String(dados.identificador_da_organizacao ?? "").trim();
    if (!organizacao) throw new Error("Organização selecionada obrigatória.");
    const resultado = await requisitarNucleoAutenticado(caminho, token, {
      method: "POST",
      headers: { "x-humanexus-organization-id": organizacao },
      body: JSON.stringify(dados)
    });
    return NextResponse.json(resultado, { status: 201 });
  } catch (erro) {
    return responderErroDaApi(erro, {
      modulo: "RENOVACAO_CONVITES",
      rota: caminho,
      mensagemDeAcessoNegado: "Renovação não autorizada."
    });
  }
}
