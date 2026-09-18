import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { requisitarNucleoAutenticado, ErroDoNucleo } from "@/lib/humanexus-core";
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
    const participante = url.searchParams.get("participante");
    if (!org || !participante) throw new ErroDoNucleo("Selecione organização e participante.", 400, "CONTEXTO_AUSENTE");
    const corpo = escrita ? await request.json() : null;
    const resposta = await requisitarNucleoAutenticado(
      `/api/v1/sessoes/${encodeURIComponent(id)}/registro-integrado?participante=${encodeURIComponent(participante)}`,
      token, {
        method: escrita ? "POST" : "GET",
        headers: { "x-humanexus-organization-id": org },
        ...(escrita ? { body: JSON.stringify({ ...corpo, identificador_do_participante: participante }) } : {})
      }, { tentativas: 1, tempoLimiteMs: escrita && corpo?.acao === "VALIDAR" ? 60000 : 20000 }
    );
    return NextResponse.json(resposta, { headers: { "cache-control": "private, no-store" } });
  } catch (erro) {
    return responderErroDaApi(erro, { modulo: "REGISTRO_SESSAO", rota: "REGISTRO_INTEGRADO", preservarMensagemSeguraDoNucleo: true });
  }
}
export function GET(request: Request, contexto: Contexto) { return encaminhar(request, contexto, false); }
export function POST(request: Request, contexto: Contexto) { return encaminhar(request, contexto, true); }
