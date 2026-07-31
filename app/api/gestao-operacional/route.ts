import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { requisitarNucleoAutenticado } from "@/lib/humanexus-core";
import { COOKIE_CSRF, COOKIE_SESSAO } from "@/lib/portal-session";
import { exigirCsrf } from "@/lib/request-security";

type Registro = Record<string, unknown>;

async function contexto(
  token: string,
  organizacaoSolicitada?: string,
  modulo = "governanca"
) {
  const parametros = new URLSearchParams({ modulo });
  if (organizacaoSolicitada) {
    parametros.set("organizacao", organizacaoSolicitada);
  }
  return requisitarNucleoAutenticado<Registro>(
    `/api/v1/gestao/contexto?${parametros}`,
    token
  );
}

export async function GET(request: Request) {
  const token = (await cookies()).get(COOKIE_SESSAO)?.value;
  if (!token) {
    return NextResponse.json(
      { erro: { mensagem: "Sessão ausente." } },
      { status: 401 }
    );
  }
  try {
    const url = new URL(request.url);
    return NextResponse.json(
      await contexto(
        token,
        url.searchParams.get("organizacao") ?? undefined,
        url.searchParams.get("modulo") ?? "governanca"
      )
    );
  } catch (erro) {
    return NextResponse.json(
      {
        erro: {
          mensagem: erro instanceof Error
            ? erro.message
            : "Gestão operacional indisponível."
        }
      },
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
    let caminho = "";
    let metodo = "POST";
    let dados: unknown = corpo.dados ?? {};
    if (acao === "criar-organizacao") {
      caminho = "/api/v1/organizacoes";
    } else if (acao === "atualizar-organizacao") {
      caminho = `/api/v1/organizacoes/${encodeURIComponent(String(corpo.identificador))}`;
      metodo = "PUT";
    } else if (acao === "impacto-exclusao-organizacao") {
      caminho = `/api/v1/organizacoes/${encodeURIComponent(String(corpo.identificador))}/exclusao/impacto`;
    } else if (acao === "excluir-organizacao") {
      caminho = `/api/v1/organizacoes/${encodeURIComponent(String(corpo.identificador))}/excluir`;
    } else if (acao === "criar-participante") {
      if (!(dados as Registro).identificador_da_organizacao) {
        throw new Error("Organização autorizada é obrigatória.");
      }
      caminho = "/api/v1/participantes";
    } else if (acao === "atualizar-participante") {
      caminho = `/api/v1/participantes/${encodeURIComponent(String(corpo.identificador))}`;
      metodo = "PUT";
    } else if (acao === "impacto-exclusao-participante") {
      caminho = `/api/v1/participantes/${encodeURIComponent(String(corpo.identificador))}/exclusao/impacto`;
    } else if (acao === "transferir-participante") {
      caminho = `/api/v1/participantes/${encodeURIComponent(String(corpo.identificador))}/transferir`;
    } else if (acao === "excluir-participante") {
      caminho = `/api/v1/participantes/${encodeURIComponent(String(corpo.identificador))}/excluir`;
    } else if (
      acao === "inativar-participante"
      || acao === "reativar-participante"
    ) {
      caminho = `/api/v1/participantes/${encodeURIComponent(String(corpo.identificador))}/${acao.startsWith("inativar") ? "inativar" : "reativar"}`;
    } else if (acao === "criar-contexto-participante") {
      caminho = `/api/v1/participantes/${encodeURIComponent(String(corpo.identificador))}/contextos`;
    } else if (acao === "criar-sessao-com-vinculo") {
      caminho = "/api/v1/sessoes-operacionais";
    } else if (acao === "criar-sessao") {
      caminho = "/api/v1/sessoes-operacionais";
    } else if (acao === "atualizar-sessao") {
      caminho = `/api/v1/sessoes/${encodeURIComponent(String(corpo.identificador))}/configuracao-operacional`;
      metodo = "PUT";
    } else if (acao === "operar-sessao") {
      caminho = `/api/v1/sessoes/${encodeURIComponent(String(corpo.identificador))}/operacoes`;
    } else if (acao === "apresentar-consentimento") {
      caminho = "/api/v1/consentimentos/apresentacoes";
    } else if (acao === "apresentar-instrumento-integrado") {
      caminho = "/api/v1/instrumento-integrado/apresentacoes";
    } else if (acao === "criar-treinamento") {
      caminho = "/api/v1/treinamentos/catalogo";
    } else if (
      acao === "inativar-treinamento"
      || acao === "reativar-treinamento"
    ) {
      caminho = `/api/v1/treinamentos/catalogo/${encodeURIComponent(String(corpo.identificador))}/${acao.startsWith("inativar") ? "inativar" : "reativar"}`;
    } else if (acao === "programar-treinamento") {
      caminho = "/api/v1/treinamentos/programacoes";
    } else if (acao === "materializar-sugestao-pre-baseline") {
      caminho = `/api/v1/sessoes/${encodeURIComponent(String(corpo.identificador))}/sugestoes-pre-baseline`;
    } else if (acao === "decidir-recomendacao-thx") {
      caminho = `/api/v1/recomendacoes-thx/${encodeURIComponent(String(corpo.identificador))}/decidir`;
    } else if (acao === "operar-programacao") {
      caminho = `/api/v1/treinamentos/programacoes/${encodeURIComponent(String(corpo.identificador))}/operacoes`;
    } else if (acao === "criar-contrato") {
      caminho = "/api/v1/contratos";
    } else if (acao === "atualizar-contrato") {
      caminho = `/api/v1/contratos/${encodeURIComponent(String(corpo.identificador))}`;
      metodo = "PUT";
    } else {
      throw new Error("Ação operacional inválida.");
    }
    const organizacao = String(
      corpo.identificador_da_organizacao
      ?? (dados as Registro).identificador_da_organizacao
      ?? ""
    );
    const resultado = await requisitarNucleoAutenticado(
      caminho,
      token,
      {
        method: metodo,
        headers: organizacao
          ? { "x-humanexus-organization-id": organizacao }
          : undefined,
        body: JSON.stringify(dados)
      }
    );
    return NextResponse.json(resultado, { status: metodo === "POST" ? 201 : 200 });
  } catch (erro) {
    return NextResponse.json(
      {
        erro: {
          mensagem: erro instanceof Error
            ? erro.message
            : "Operação recusada."
        }
      },
      { status: 400 }
    );
  }
}
