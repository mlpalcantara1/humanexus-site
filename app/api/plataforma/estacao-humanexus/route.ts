import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { requisitarNucleoAutenticado } from "@/lib/humanexus-core";
import { COOKIE_CSRF, COOKIE_SESSAO } from "@/lib/portal-session";
import { exigirCsrf } from "@/lib/request-security";

async function sessaoDoPortal() {
  const armazenamento = await cookies();
  const token = armazenamento.get(COOKIE_SESSAO)?.value;
  if (!token) throw new Error("Sessão ausente.");
  return { armazenamento, token };
}

export async function GET(request: Request) {
  try {
    const { token } = await sessaoDoPortal();
    const organizacao =
      new URL(request.url).searchParams.get("organizacao") ?? "";
    const dados = await requisitarNucleoAutenticado(
      `/api/v1/estacao-humanexus?identificador_da_organizacao=${
        encodeURIComponent(organizacao)
      }`,
      token
    );
    return NextResponse.json(dados, {
      headers: { "cache-control": "no-store" }
    });
  } catch (erro) {
    return NextResponse.json(
      {
        erro: {
          mensagem:
            erro instanceof Error ? erro.message : "Estação indisponível."
        }
      },
      { status: 403 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { armazenamento, token } = await sessaoDoPortal();
    exigirCsrf(request, armazenamento.get(COOKIE_CSRF)?.value);
    const corpo = await request.json();
    const dados = await requisitarNucleoAutenticado(
      "/api/v1/estacao-humanexus",
      token,
      { method: "POST", body: JSON.stringify(corpo) }
    );
    return NextResponse.json(dados, { status: 201 });
  } catch (erro) {
    return NextResponse.json(
      {
        erro: {
          mensagem:
            erro instanceof Error ? erro.message : "Configuração recusada."
        }
      },
      { status: 400 }
    );
  }
}
