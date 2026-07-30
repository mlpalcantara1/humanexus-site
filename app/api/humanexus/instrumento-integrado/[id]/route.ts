import { NextResponse } from "next/server";
import { requisitarNucleoPublico } from "@/lib/humanexus-core";
import { exigirMesmaOrigem } from "@/lib/request-security";

type Contexto = { params: Promise<{ id: string }> };

const CABECALHOS_SEM_CONTEXTO_ADMINISTRATIVO = {
  "cache-control": "private, no-store, no-cache, max-age=0, must-revalidate",
  pragma: "no-cache",
  expires: "0",
  "x-humanexus-context-source": "instrument-token"
};

export async function GET(request: Request, contexto: Contexto) {
  try {
    const { id } = await contexto.params;
    const url = new URL(request.url);
    const token = url.searchParams.get("token") ?? "";
    if (!id || !token) throw new Error("Instrumento indisponível.");
    const copia = url.searchParams.get("copia") === "1";
    const caminho =
      `/api/v1/instrumento-integrado/apresentacoes/${encodeURIComponent(id)}`
      + (copia ? "/copia" : "")
      + `?token=${encodeURIComponent(token)}`;
    return NextResponse.json(
      await requisitarNucleoPublico(caminho),
      { headers: CABECALHOS_SEM_CONTEXTO_ADMINISTRATIVO }
    );
  } catch {
    return NextResponse.json(
      { erro: { mensagem: "Instrumento indisponível." } },
      {
        status: 404,
        headers: CABECALHOS_SEM_CONTEXTO_ADMINISTRATIVO
      }
    );
  }
}

export async function POST(request: Request, contexto: Contexto) {
  try {
    exigirMesmaOrigem(request);
    const { id } = await contexto.params;
    const corpo = await request.json() as Record<string, unknown>;
    const token = String(corpo.token ?? "");
    if (!id || !token) throw new Error("Instrumento indisponível.");
    const acao = String(corpo.acao ?? "");
    const sufixo = acao === "salvar"
      ? "rascunho"
      : acao === "confirmar"
        ? "confirmar"
        : acao === "revogar"
          ? "revogar"
          : "";
    if (!sufixo) throw new Error("Ação inválida.");
    const dados = await requisitarNucleoPublico(
      `/api/v1/instrumento-integrado/apresentacoes/${encodeURIComponent(id)}/${sufixo}`,
      {
        method: "POST",
        body: JSON.stringify({
          ...corpo,
          token
        })
      }
    );
    return NextResponse.json(dados, {
      status: acao === "confirmar" ? 201 : 200,
      headers: CABECALHOS_SEM_CONTEXTO_ADMINISTRATIVO
    });
  } catch (erro) {
    return NextResponse.json(
      {
        erro: {
          mensagem: erro instanceof Error
            ? erro.message
            : "Não foi possível registrar a decisão."
        }
      },
      {
        status: 400,
        headers: CABECALHOS_SEM_CONTEXTO_ADMINISTRATIVO
      }
    );
  }
}
