import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { requisitarNucleoAutenticado } from "@/lib/humanexus-core";
import { COOKIE_CSRF, COOKIE_SESSAO } from "@/lib/portal-session";
import { exigirCsrf } from "@/lib/request-security";

type Registro = Record<string, unknown>;

async function contexto(token: string, organizacaoSolicitada?: string) {
  const usuario = await requisitarNucleoAutenticado<Registro>(
    "/api/v1/autenticacao/usuario-atual",
    token
  );
  const organizacoes = usuario.identificador_da_organizacao
    ? [await requisitarNucleoAutenticado<Registro>(
        `/api/v1/organizacoes/${encodeURIComponent(String(usuario.identificador_da_organizacao))}`,
        token
      )]
    : await requisitarNucleoAutenticado<Registro[]>("/api/v1/organizacoes", token);
  const organizacao = organizacoes.find(
    (item) => item.identificador === organizacaoSolicitada
  ) ?? organizacoes[0];
  if (!organizacao?.identificador) {
    return {
      usuario,
      organizacoes,
      organizacao: null,
      participantes: [],
      sessoes: [],
      catalogo_treinamentos: [],
      programacoes: [],
      contratos: []
    };
  }
  const organizacaoId = String(organizacao.identificador);
  const participantes = await requisitarNucleoAutenticado<Registro[]>(
    `/api/v1/organizacoes/${encodeURIComponent(organizacaoId)}/participantes`,
    token
  );
  const sessoesBasicas = (
    await Promise.all(
      participantes.map((participante) =>
        requisitarNucleoAutenticado<Registro[]>(
          `/api/v1/participantes/${encodeURIComponent(String(participante.identificador))}/sessoes`,
          token
        ).catch(() => [])
      )
    )
  ).flat();
  const sessoes = await Promise.all(
    sessoesBasicas.map(async (sessao) => {
      const operacional = await requisitarNucleoAutenticado<{
        detalhes?: Registro;
        eventos?: Registro[];
      }>(
        `/api/v1/sessoes/${encodeURIComponent(String(sessao.identificador))}/operacoes`,
        token
      ).catch(() => ({ detalhes: undefined, eventos: [] }));
      return {
        ...sessao,
        detalhes_operacionais: operacional.detalhes,
        eventos_operacionais: operacional.eventos
      };
    })
  );
  const [catalogoTreinamentos, programacoes, contratos] = await Promise.all([
    requisitarNucleoAutenticado<Registro[]>(
      "/api/v1/treinamentos/catalogo",
      token
    ).catch(() => []),
    requisitarNucleoAutenticado<Registro[]>(
      "/api/v1/treinamentos/programacoes",
      token
    ).catch(() => []),
    requisitarNucleoAutenticado<Registro[]>(
      "/api/v1/contratos",
      token
    ).catch(() => [])
  ]);
  const [usuarios, vinculosValidados] = await Promise.all([
    requisitarNucleoAutenticado<Registro[]>("/api/v1/usuarios", token)
      .catch(() => []),
    requisitarNucleoAutenticado<Registro[]>(
      "/api/v1/ctr-thx/vinculos-validados-operacionais",
      token
    ).catch(() => [])
  ]);
  return {
    usuario,
    organizacoes,
    organizacao,
    participantes,
    sessoes,
    catalogo_treinamentos: catalogoTreinamentos,
    programacoes,
    contratos
    ,profissionais: usuarios.filter(
      (item) => item.perfil === "PROFISSIONAL_HUMANEXUS"
        && item.ativo
        && item.identificador_da_organizacao === organizacaoId
    )
    ,vinculos_ctr_thx_validados: vinculosValidados
  };
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
      await contexto(token, url.searchParams.get("organizacao") ?? undefined)
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
      caminho = "/api/v1/participantes";
    } else if (acao === "atualizar-participante") {
      caminho = `/api/v1/participantes/${encodeURIComponent(String(corpo.identificador))}`;
      metodo = "PUT";
    } else if (acao === "criar-contexto-participante") {
      caminho = `/api/v1/participantes/${encodeURIComponent(String(corpo.identificador))}/contextos`;
    } else if (acao === "criar-sessao-com-vinculo") {
      const payload = dados as Registro;
      const sessao = await requisitarNucleoAutenticado<Registro>(
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
            identificador_do_profissional: payload.identificador_do_profissional
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
    } else if (acao === "criar-treinamento") {
      caminho = "/api/v1/treinamentos/catalogo";
    } else if (acao === "programar-treinamento") {
      caminho = "/api/v1/treinamentos/programacoes";
    } else if (acao === "criar-contrato") {
      caminho = "/api/v1/contratos";
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
