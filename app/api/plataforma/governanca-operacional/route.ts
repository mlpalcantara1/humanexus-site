import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { requisitarNucleoAutenticado } from "@/lib/humanexus-core";
import { COOKIE_CSRF, COOKIE_SESSAO } from "@/lib/portal-session";
import { exigirCsrf } from "@/lib/request-security";
import { responderErroDaApi } from "@/lib/api-route-error";

type Registro = Record<string, unknown>;

export async function GET(request: Request) {
  const token = (await cookies()).get(COOKIE_SESSAO)?.value;
  if (!token) {
    return NextResponse.json({ erro: { mensagem: "Sessão ausente." } }, { status: 401 });
  }
  try {
    const organizacao = new URL(request.url).searchParams
      .get("organizacao")
      ?.trim() ?? "";
    const init = organizacao
      ? { headers: { "x-humanexus-organization-id": organizacao } }
      : {};
    // O servidor local oficial é deliberadamente conservador. Consultas
    // sequenciais evitam uma fila concorrente que antes convertia latência em
    // falso 403 e podia derrubar a renderização do LAB.
    const governanca = await requisitarNucleoAutenticado<Registro>(
      "/api/v1/governanca-operacional",
      token,
      init
    );
    const backups = await requisitarNucleoAutenticado<Registro[]>(
      "/api/v1/governanca-operacional/backups",
      token,
      init
    ).catch(() => []);
    const consentimentos = await requisitarNucleoAutenticado<Registro>(
      "/api/v1/consentimentos/lab",
      token,
      init
    );
    const seguranca = await requisitarNucleoAutenticado<Registro>(
      "/api/v1/seguranca-proprietario",
      token,
      init
    );
    const instrumentoIntegrado = await requisitarNucleoAutenticado<Registro>(
      "/api/v1/instrumento-integrado/lab",
      token,
      init
    );
    return NextResponse.json({
      governanca,
      backups,
      consentimentos,
      seguranca,
      instrumento_integrado: instrumentoIntegrado
    });
  } catch (erro) {
    return responderErroDaApi(erro, {
      modulo: "GOVERNANCA_OPERACIONAL",
      rota: "/api/v1/governanca-operacional",
      mensagemDeAcessoNegado: "Acesso à governança operacional não autorizado."
    });
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
    const dados = corpo.dados && typeof corpo.dados === "object"
      ? corpo.dados as Registro
      : {};
    const organizacao = String(
      corpo.identificador_da_organizacao
      ?? dados.identificador_da_organizacao
      ?? ""
    ).trim();
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
      "restaurar": `/api/v1/governanca-operacional/backups/${identificador}/testar-restauracao`,
      "confiar-dispositivo": `/api/v1/seguranca-proprietario/dispositivos/${identificador}/confiar`,
      "revogar-dispositivo": `/api/v1/seguranca-proprietario/dispositivos/${identificador}/revogar`,
      "revogar-sessao": `/api/v1/seguranca-proprietario/sessoes/${identificador}/revogar`,
      "revogar-todas-sessoes": "/api/v1/seguranca-proprietario/sessoes/revogar-todas",
      "autorizar-programador": "/api/v1/seguranca-proprietario/programadores",
      "estado-programador": `/api/v1/seguranca-proprietario/programadores/${identificador}/estado`,
      "aprovar-mudanca-critica": "/api/v1/seguranca-proprietario/mudancas-criticas"
    };
    const caminho = destinos[acao];
    if (!caminho) throw new Error("Ação de governança inválida.");
    const resultado = await requisitarNucleoAutenticado(
      caminho,
      token,
      {
        method: "POST",
        headers: organizacao
          ? { "x-humanexus-organization-id": organizacao }
          : undefined,
        body: JSON.stringify(dados)
      }
    );
    return NextResponse.json(resultado, { status: 201 });
  } catch (erro) {
    return NextResponse.json(
      { erro: { mensagem: erro instanceof Error ? erro.message : "Operação recusada." } },
      { status: 400 }
    );
  }
}
