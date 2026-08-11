import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ErroDoNucleo, requisitarNucleoAutenticado } from "@/lib/humanexus-core";
import { COOKIE_CSRF, COOKIE_SESSAO } from "@/lib/portal-session";
import { exigirCsrf } from "@/lib/request-security";
import { responderErroDaApi } from "@/lib/api-route-error";

type Registro = Record<string, unknown>;

async function contexto(
  token: string,
  organizacaoSolicitada?: string,
  modulo = "governanca",
  filtros?: URLSearchParams
) {
  const parametros = new URLSearchParams({ modulo });
  if (organizacaoSolicitada) {
    parametros.set("organizacao", organizacaoSolicitada);
  }
  for (const chave of [
    "empresa",
    "base",
    "funcao",
    "qualificacao",
    "status",
    "periodo_inicio",
    "periodo_fim",
    "treinamento",
    "dominio"
  ]) {
    const valor = filtros?.get(chave)?.trim();
    if (valor) parametros.set(chave, valor);
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
        url.searchParams.get("modulo") ?? "governanca",
        url.searchParams
      )
    );
  } catch (erro) {
    return responderErroDaApi(erro, {
      modulo: "GESTAO_OPERACIONAL",
      rota: "/api/v1/gestao/contexto",
      mensagemDeAcessoNegado: "Este perfil pode consultar o módulo, mas não executar ações profissionais."
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
    } else if (acao === "historico-sessao") {
      caminho = `/api/v1/sessoes/${encodeURIComponent(String(corpo.identificador))}/operacoes`;
      metodo = "GET";
      dados = undefined;
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
    } else if (acao === "atualizar-programacao") {
      caminho = `/api/v1/treinamentos/programacoes/${encodeURIComponent(String(corpo.identificador))}`;
      metodo = "PUT";
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
        body: metodo === "GET" ? undefined : JSON.stringify(dados)
      }
    );
    return NextResponse.json(resultado, { status: metodo === "POST" ? 201 : 200 });
  } catch (erro) {
    if (erro instanceof ErroDoNucleo) {
      return responderErroDaApi(erro, {
        modulo: "GESTAO_OPERACIONAL",
        rota: "COMANDO_DE_GESTAO",
        mensagemDeAcessoNegado: "A ação exige um perfil profissional autorizado."
      });
    }
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
