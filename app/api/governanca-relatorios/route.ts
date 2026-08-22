import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { responderErroDaApi } from "@/lib/api-route-error";
import { requisitarNucleoAutenticado } from "@/lib/humanexus-core";
import { COOKIE_CSRF, COOKIE_SESSAO } from "@/lib/portal-session";
import { exigirCsrf } from "@/lib/request-security";

type Corpo = Record<string, unknown>;

export async function POST(request: Request) {
  const armazenamento = await cookies();
  const token = armazenamento.get(COOKIE_SESSAO)?.value;
  try {
    exigirCsrf(request, armazenamento.get(COOKIE_CSRF)?.value);
    if (!token) throw new Error("Sessão ausente.");
    const corpo = await request.json() as Corpo;
    const acao = String(corpo.acao ?? "");
    const identificador = String(corpo.identificador_do_relatorio ?? "");

    if (acao === "CRIAR_NOVA_VERSAO_TIRH") {
      return NextResponse.json(await requisitarNucleoAutenticado(
        `/api/v1/relatorios/${encodeURIComponent(identificador)}/versoes`,
        token,
        {
          method: "POST",
          body: JSON.stringify({ justificativa: corpo.justificativa }),
        },
      ), { status: 201 });
    }
    if (acao === "TRANSICIONAR") {
      return NextResponse.json(await requisitarNucleoAutenticado(
        `/api/v1/relatorios/${encodeURIComponent(identificador)}/transicoes`,
        token,
        {
          method: "POST",
          body: JSON.stringify({
            estado: corpo.estado,
            justificativa: corpo.justificativa,
          }),
        },
      ));
    }
    if (acao === "AUTORIZAR_DESTINATARIO") {
      return NextResponse.json(await requisitarNucleoAutenticado(
        "/api/v1/relatorios/acessos",
        token,
        {
          method: "POST",
          body: JSON.stringify({
            identificador_da_organizacao: corpo.identificador_da_organizacao,
            email_do_usuario: corpo.email_do_usuario,
            papel: corpo.papel,
            identificador_do_participante: corpo.identificador_do_participante,
            justificativa: corpo.justificativa,
          }),
        },
      ), { status: 201 });
    }
    if (acao === "REVOGAR_ACESSO") {
      return NextResponse.json(await requisitarNucleoAutenticado(
        "/api/v1/relatorios/acessos/revogar",
        token,
        {
          method: "POST",
          body: JSON.stringify({
            identificador_da_organizacao: corpo.identificador_da_organizacao,
            email_do_usuario: corpo.email_do_usuario,
            papel: corpo.papel,
            identificador_do_participante: corpo.identificador_do_participante,
            justificativa: corpo.justificativa,
          }),
        },
      ));
    }
    if (acao === "LIBERAR") {
      return NextResponse.json(await requisitarNucleoAutenticado(
        `/api/v1/relatorios/${encodeURIComponent(identificador)}/liberacoes`,
        token,
        {
          method: "POST",
          body: JSON.stringify({
            tipo_do_destinatario: corpo.tipo_do_destinatario,
            email_do_usuario: corpo.email_do_usuario,
            identificador_do_participante: corpo.identificador_do_participante,
            identificador_da_organizacao_destinataria:
              corpo.identificador_da_organizacao,
            justificativa: corpo.justificativa,
          }),
        },
      ), { status: 201 });
    }
    if (acao === "REVOGAR_LIBERACAO") {
      return NextResponse.json(await requisitarNucleoAutenticado(
        `/api/v1/relatorios/${encodeURIComponent(identificador)}/liberacoes/revogar`,
        token,
        {
          method: "POST",
          body: JSON.stringify({
            tipo_do_destinatario: corpo.tipo_do_destinatario,
            email_do_usuario: corpo.email_do_usuario,
            justificativa: corpo.justificativa,
          }),
        },
      ));
    }
    return NextResponse.json(
      { erro: { mensagem: "Ação documental não reconhecida." } },
      { status: 400 },
    );
  } catch (erro) {
    return responderErroDaApi(erro, {
      modulo: "GOVERNANCA_RELATORIOS",
      rota: "/api/v1/relatorios",
      mensagemDeAcessoNegado: (
        "Seu perfil não possui autorização para esta etapa documental."
      ),
    });
  }
}
