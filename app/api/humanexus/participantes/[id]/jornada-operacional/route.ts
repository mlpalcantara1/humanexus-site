import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ErroDoNucleo, requisitarNucleoAutenticado } from "@/lib/humanexus-core";
import { COOKIE_CSRF, COOKIE_SESSAO } from "@/lib/portal-session";
import { exigirCsrf } from "@/lib/request-security";
import { responderErroDaApi } from "@/lib/api-route-error";

type Contexto = { params: Promise<{ id: string }> };
async function encaminhar(request: Request, contexto: Contexto, escrita: boolean) {
  try {
    const jar = await cookies();
    const token = jar.get(COOKIE_SESSAO)?.value;
    if (!token) throw new ErroDoNucleo("Sessão ausente.", 401, "SESSAO_AUSENTE");
    if (escrita) exigirCsrf(request, jar.get(COOKIE_CSRF)?.value);
    const { id } = await contexto.params;
    const url = new URL(request.url);
    const org = url.searchParams.get("organizacao");
    if (!org) throw new ErroDoNucleo("Selecione o contexto do participante.", 400, "CONTEXTO_AUSENTE");
    const query = new URLSearchParams();
    const sessao = url.searchParams.get("sessao");
    if (sessao) query.set("sessao", sessao);
    const resposta = await requisitarNucleoAutenticado(
      `/api/v1/participantes/${encodeURIComponent(id)}/${escrita ? "formulacao-assistida" : "jornada-operacional"}?${query}`,
      token, { method: escrita ? "POST" : "GET", headers: { "x-humanexus-organization-id": org },
        ...(escrita ? { body: JSON.stringify(await request.json()) } : {}) },
      { tentativas: 1, tempoLimiteMs: 30000 }
    );
    return NextResponse.json(resposta, { headers: { "cache-control": "private, no-store" } });
  } catch (erro) {
    return responderErroDaApi(erro, { modulo: "JORNADA", rota: "JORNADA_OPERACIONAL", preservarMensagemSeguraDoNucleo: true });
  }
}
export function GET(request: Request, contexto: Contexto) { return encaminhar(request, contexto, false); }
export function POST(request: Request, contexto: Contexto) { return encaminhar(request, contexto, true); }
