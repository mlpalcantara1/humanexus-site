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
  const participantesBasicos = await requisitarNucleoAutenticado<Registro[]>(
    `/api/v1/organizacoes/${encodeURIComponent(organizacaoId)}/participantes`,
    token
  );
  const participantes = await Promise.all(
    participantesBasicos.map(async (participante) => {
      const detalhes = await requisitarNucleoAutenticado<Registro>(
        `/api/v1/participantes/${encodeURIComponent(String(participante.identificador))}`,
        token
      ).catch(() => ({}));
      return { ...participante, ...detalhes };
    })
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
  const [usuariosConsultados, vinculosValidados, modelosConsentimento] = await Promise.all([
    requisitarNucleoAutenticado<Registro[]>("/api/v1/usuarios", token)
      .catch(() => []),
    requisitarNucleoAutenticado<Registro[]>(
      "/api/v1/ctr-thx/vinculos-validados-operacionais",
      token
    ).catch(() => []),
    requisitarNucleoAutenticado<Registro[]>(
      "/api/v1/consentimentos/modelos",
      token
    ).catch(() => [])
  ]);
  const usuarios = (
    usuario.perfil === "PROFISSIONAL_HUMANEXUS"
    && usuario.identificador_da_organizacao === organizacaoId
    && !usuariosConsultados.some((item) => item.identificador === usuario.identificador)
  )
    ? [{ ...usuario, ativo: true }, ...usuariosConsultados]
    : usuariosConsultados;
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
      (item) => (
        item.perfil === "PROFISSIONAL_HUMANEXUS"
        && item.ativo
        && item.identificador_da_organizacao === organizacaoId
      ) || (
        item.identificador === usuario.identificador
        && item.perfil === "ADMINISTRADOR_DO_SISTEMA"
        && item.ativo
      )
    )
    ,vinculos_ctr_thx_validados: vinculosValidados
    ,modelos_consentimento: modelosConsentimento
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
      const escopo = await contexto(
        token,
        String((dados as Registro).identificador_da_organizacao ?? "")
      );
      if (!escopo.organizacao?.identificador) {
        throw new Error("Organização autorizada é obrigatória.");
      }
      dados = {
        ...(dados as Registro),
        identificador_da_organizacao: escopo.organizacao.identificador
      };
      caminho = "/api/v1/participantes";
    } else if (acao === "atualizar-participante") {
      caminho = `/api/v1/participantes/${encodeURIComponent(String(corpo.identificador))}`;
      metodo = "PUT";
    } else if (acao === "criar-contexto-participante") {
      caminho = `/api/v1/participantes/${encodeURIComponent(String(corpo.identificador))}/contextos`;
    } else if (acao === "criar-sessao-com-vinculo") {
      const payload = dados as Registro;
      const contextoOperacional = await contexto(token);
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
