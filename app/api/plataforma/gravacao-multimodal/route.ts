import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { requisitarNucleoAutenticado } from "@/lib/humanexus-core";
import { COOKIE_CSRF, COOKIE_SESSAO } from "@/lib/portal-session";
import { exigirCsrf } from "@/lib/request-security";

type Registro = Record<string, unknown>;

async function token() {
  const armazenamento = await cookies();
  const valor = armazenamento.get(COOKIE_SESSAO)?.value;
  if (!valor) throw new Error("Sessão ausente.");
  return { armazenamento, valor };
}

export async function GET(request: Request) {
  try {
    const { valor } = await token();
    const sessao = new URL(request.url).searchParams.get("sessao") ?? "";
    const dados = await requisitarNucleoAutenticado(
      `/api/v1/sessoes/${encodeURIComponent(sessao)}/gravacao`,
      valor
    );
    return NextResponse.json(dados, { headers: { "cache-control": "no-store" } });
  } catch (erro) {
    return NextResponse.json(
      { erro: { mensagem: erro instanceof Error ? erro.message : "Gravação indisponível." } },
      { status: 403 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { armazenamento, valor } = await token();
    exigirCsrf(request, armazenamento.get(COOKIE_CSRF)?.value);
    const corpo = await request.json() as Registro;
    const sessao = encodeURIComponent(String(corpo.sessao ?? ""));
    const acao = String(corpo.acao ?? "");
    const caminhos: Record<string, string> = {
      configurar: `/api/v1/sessoes/${sessao}/gravacao/configuracoes`,
      dispositivo: `/api/v1/sessoes/${sessao}/gravacao/dispositivos`,
      revogar: `/api/v1/sessoes/${sessao}/gravacao/revogar`
    };
    const caminho = caminhos[acao];
    if (!caminho) throw new Error("Ação de gravação inválida.");
    const dados = await requisitarNucleoAutenticado(
      caminho,
      valor,
      {
        method: "POST",
        body: JSON.stringify(corpo.dados ?? {})
      }
    );
    return NextResponse.json(dados, { status: 201 });
  } catch (erro) {
    return NextResponse.json(
      { erro: { mensagem: erro instanceof Error ? erro.message : "Operação recusada." } },
      { status: 400 }
    );
  }
}
