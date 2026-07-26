import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { requisitarNucleoAutenticado } from "@/lib/humanexus-core";
import { COOKIE_CSRF, COOKIE_SESSAO } from "@/lib/portal-session";
import { exigirCsrf } from "@/lib/request-security";

type Registro = Record<string, unknown>;

export async function GET() {
  const token = (await cookies()).get(COOKIE_SESSAO)?.value;
  if (!token) {
    return NextResponse.json({ erro: { mensagem: "Sessão ausente." } }, { status: 401 });
  }
  try {
    const [governanca, backups, consentimentos] = await Promise.all([
      requisitarNucleoAutenticado<Registro>(
        "/api/v1/governanca-operacional",
        token
      ),
      requisitarNucleoAutenticado<Registro[]>(
        "/api/v1/governanca-operacional/backups",
        token
      ).catch(() => []),
      requisitarNucleoAutenticado<Registro>(
        "/api/v1/consentimentos/lab",
        token
      )
    ]);
    return NextResponse.json({ governanca, backups, consentimentos });
  } catch (erro) {
    return NextResponse.json(
      { erro: { mensagem: erro instanceof Error ? erro.message : "Acesso negado." } },
      { status: 403 }
    );
  }
}

export async function POST(request: Request) {
  const armazenamento = await cookies();
  const token = armazenamento.get(COOKIE_SESSAO)?.value;
  try {
    exigirCsrf(request, armazenamento.get(COOKIE_CSRF)?.value);
    if (!token) throw new Error("Sessão ausente.");
    const corpo = await request.json() as Registro;
    const acao = String(corpo.acao ?? "");
    const identificador = encodeURIComponent(String(corpo.identificador ?? ""));
    const destinos: Record<string, string> = {
      "inventario-lgpd": "/api/v1/governanca-operacional/lgpd/inventario",
      "texto-juridico": "/api/v1/governanca-operacional/lgpd/textos",
      "direito-titular": "/api/v1/governanca-operacional/lgpd/direitos",
      "incidente": "/api/v1/governanca-operacional/incidentes",
      "backup": "/api/v1/governanca-operacional/backups",
      "modelo-consentimento": "/api/v1/consentimentos/modelos",
      "responsavel-legal": "/api/v1/consentimentos/responsaveis-legais",
      "apresentar-consentimento": "/api/v1/consentimentos/apresentacoes",
      "revogar-consentimento": `/api/v1/consentimentos/manifestacoes/${identificador}/revogar`,
      "restaurar": `/api/v1/governanca-operacional/backups/${identificador}/testar-restauracao`
    };
    const caminho = destinos[acao];
    if (!caminho) throw new Error("Ação de governança inválida.");
    const resultado = await requisitarNucleoAutenticado(
      caminho,
      token,
      { method: "POST", body: JSON.stringify(corpo.dados ?? {}) }
    );
    return NextResponse.json(resultado, { status: 201 });
  } catch (erro) {
    return NextResponse.json(
      { erro: { mensagem: erro instanceof Error ? erro.message : "Operação recusada." } },
      { status: 400 }
    );
  }
}
