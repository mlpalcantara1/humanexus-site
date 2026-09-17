import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { requisitarNucleoAutenticado } from "@/lib/humanexus-core";
import { COOKIE_SESSAO } from "@/lib/portal-session";
import { responderErroDaApi } from "@/lib/api-route-error";
import { gerarPdfInstrumentoIntegrado } from "@/lib/instrumento-integrado-pdf";

type Registro = Record<string, unknown>;
type Contexto = { params: Promise<{ id: string; apresentacao: string }> };

export async function GET(request: Request, contexto: Contexto) {
  const token = (await cookies()).get(COOKIE_SESSAO)?.value;
  if (!token) {
    return NextResponse.json({ erro: { mensagem: "Sessão ausente." } }, { status: 401 });
  }
  const { id, apresentacao } = await contexto.params;
  const organizacao = new URL(request.url).searchParams.get("organizacao")?.trim();
  if (!id || !apresentacao || !organizacao) {
    return NextResponse.json({ erro: { mensagem: "Documento indisponível." } }, { status: 400 });
  }
  const caminho = `/api/v1/participantes/${encodeURIComponent(id)}/instrumentos-integrados?organizacao=${encodeURIComponent(organizacao)}`;
  try {
    const historico = await requisitarNucleoAutenticado<{
      identificador_da_organizacao: string;
      identificador_do_participante: string;
      registros: Registro[];
    }>(caminho, token);
    if (historico.identificador_da_organizacao !== organizacao
      || historico.identificador_do_participante !== id) {
      throw new Error("Documento fora do escopo.");
    }
    const registro = historico.registros.find((item) =>
      (item.apresentacao as Registro)?.identificador === apresentacao
      && item.resposta_registrada === true
    );
    if (!registro || !registro.copia) {
      return NextResponse.json({ erro: { mensagem: "Cópia ainda não disponível." } }, { status: 404 });
    }
    const pdf = await gerarPdfInstrumentoIntegrado(registro.copia as Registro);
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="iicca-${encodeURIComponent(apresentacao.slice(0, 8))}.pdf"`,
        "cache-control": "private, no-store, no-cache, max-age=0, must-revalidate",
        pragma: "no-cache",
        expires: "0",
        "x-humanexus-context-source": "authenticated-participant-history"
      }
    });
  } catch (erro) {
    return responderErroDaApi(erro, {
      modulo: "INSTRUMENTO_INTEGRADO",
      rota: caminho
    });
  }
}
