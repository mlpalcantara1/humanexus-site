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
    } else if (acao === "criar-participante") {
      if (!(dados as Registro).identificador_da_organizacao) {
        throw new Error("Organização autorizada é obrigatória.");
      }
      caminho = "/api/v1/participantes";
    } else if (acao === "atualizar-participante") {
      caminho = `/api/v1/participantes/${encodeURIComponent(String(corpo.identificador))}`;
      metodo = "PUT";
    } else if (
      acao === "inativar-participante"
      || acao === "reativar-participante"
    ) {
      caminho = `/api/v1/participantes/${encodeURIComponent(String(corpo.identificador))}/${acao.startsWith("inativar") ? "inativar" : "reativar"}`;
    } else if (acao === "criar-contexto-participante") {
      caminho = `/api/v1/participantes/${encodeURIComponent(String(corpo.identificador))}/contextos`;
    } else if (acao === "criar-sessao-com-vinculo") {
      const payload = dados as Registro;
      const contextoOperacional = await contexto(
        token,
        undefined,
        "sessoes"
      );
      const sessaoPendente = (
        Array.isArray(contextoOperacional.sessoes)
          ? contextoOperacional.sessoes
          : []
      )
        .find((item) => {
          const sessao = item as Registro;
          const detalhes = (sessao.detalhes_operacionais ?? {}) as Registro;
          return (
            String(sessao.identificador_do_participante ?? "") ===
              String(payload.identificador_do_participante ?? "") &&
            String(detalhes.identificador_da_anamnese ?? "") ===
              String(payload.identificador_da_anamnese ?? "") &&
            String(detalhes.finalidade ?? "") === String(payload.finalidade ?? "") &&
            String(detalhes.estado_operacional ?? "") === "CRIADA" &&
            !detalhes.identificador_do_ctr &&
            !detalhes.identificador_do_thx
          );
        }) as Registro | undefined;
      const sessao = sessaoPendente ?? await requisitarNucleoAutenticado<Registro>(
          "/api/v1/sessoes-operacionais",
          token,
          {
            method: "POST",
            body: JSON.stringify({
              identificador_do_participante: payload.identificador_do_participante,
              finalidade: payload.finalidade,
              modalidade: payload.modalidade,
              data_programada: payload.data_programada,
              duracao_planejada_minutos: payload.duracao_planejada_minutos,
              identificador_do_profissional: payload.identificador_do_profissional,
              identificador_da_anamnese: payload.identificador_da_anamnese
            })
          }
        );
      const vinculo = await requisitarNucleoAutenticado(
        `/api/v1/sessoes/${encodeURIComponent(String(sessao.identificador))}/vinculo-operacional-ctr-thx`,
        token,
        {
          method: "POST",
          body: JSON.stringify({
            identificador_do_profissional: payload.identificador_do_profissional,
            codigo_do_ctr: payload.codigo_do_ctr,
            codigo_do_thx: payload.codigo_do_thx,
            justificativa: payload.justificativa
          })
        }
      );
      return NextResponse.json({ sessao, vinculo }, { status: 201 });
    } else if (acao === "criar-sessao") {
      caminho = "/api/v1/sessoes-operacionais";
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
    const resultado = await requisitarNucleoAutenticado(
      caminho,
      token,
      { method: metodo, body: JSON.stringify(dados) }
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
