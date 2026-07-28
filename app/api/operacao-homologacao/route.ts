import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { requisitarNucleoAutenticado } from "@/lib/humanexus-core";
import { COOKIE_CSRF, COOKIE_SESSAO } from "@/lib/portal-session";
import { exigirCsrf } from "@/lib/request-security";

type Registro = Record<string, unknown>;
type SelecaoDeContexto = {
  identificador_da_organizacao?: string;
  identificador_do_participante?: string;
  identificador_da_sessao?: string;
};
type Contexto = Awaited<ReturnType<typeof estado>>;

const MARCACAO = "SIMULAÇÃO TÉCNICA — NÃO É RESULTADO HUMANO";

async function tokenAtual() {
  const armazenamento = await cookies();
  const token = armazenamento.get(COOKIE_SESSAO)?.value;
  if (!token) throw new Error("Sessão ausente.");
  return { armazenamento, token };
}

function consultar<T>(caminho: string, token: string, init: RequestInit = {}) {
  return requisitarNucleoAutenticado<T>(caminho, token, init);
}

function consultarSeDisponivel<T>(caminho: string, token: string, padrao: T) {
  return consultar<T>(caminho, token).catch(() => padrao);
}

function encontrar<T extends Registro>(itens: T[], termo: string) {
  return itens.find((item) => String(item.nome ?? item.referencia_externa ?? "").includes(termo));
}

function lista(valor: unknown): unknown[] {
  if (Array.isArray(valor)) return valor;
  if (typeof valor !== "string" || !valor) return [];
  try {
    const convertido = JSON.parse(valor);
    return Array.isArray(convertido) ? convertido : [];
  } catch {
    return [];
  }
}

function registro(valor: unknown): Registro {
  if (valor && typeof valor === "object" && !Array.isArray(valor)) return valor as Registro;
  if (typeof valor !== "string" || !valor) return {};
  try {
    const convertido = JSON.parse(valor);
    return convertido && typeof convertido === "object" && !Array.isArray(convertido)
      ? convertido as Registro
      : {};
  } catch {
    return {};
  }
}

async function estado(token: string, selecao: SelecaoDeContexto = {}) {
  const usuario = await consultar<Registro>("/api/v1/autenticacao/usuario-atual", token);
  const organizacoes = usuario.identificador_da_organizacao
    ? [await consultar<Registro>(
        `/api/v1/organizacoes/${encodeURIComponent(String(usuario.identificador_da_organizacao))}`,
        token
      )]
    : await consultar<Registro[]>("/api/v1/organizacoes", token);
  const organizacao = organizacoes.find(
    (item) => item.identificador === selecao.identificador_da_organizacao
  ) ?? organizacoes[0];
  const organizacaoId = String(organizacao?.identificador ?? "");
  if (!organizacaoId) throw new Error("Nenhuma organização autorizada está disponível para o contexto.");
  const participantes = await consultar<Registro[]>(`/api/v1/organizacoes/${encodeURIComponent(organizacaoId)}/participantes`, token);
  const participanteSolicitado = participantes.find(
    (item) => item.identificador === selecao.identificador_do_participante
  );
  const candidatos = participanteSolicitado
    ? [participanteSolicitado]
    : [
        encontrar(participantes, "PARTICIPANTE FICTÍCIO"),
        ...participantes
      ].filter(
        (item, indice, itens): item is Registro =>
          Boolean(item)
          && itens.findIndex(
            (candidato) => candidato?.identificador === item?.identificador
          ) === indice
      );
  let participante: Registro | undefined;
  let sessoes: Registro[] = [];
  for (const candidato of candidatos) {
    const candidatas = await consultar<Registro[]>(
      `/api/v1/participantes/${encodeURIComponent(String(candidato.identificador))}/sessoes`,
      token
    );
    if (candidatas.length) {
      participante = candidato;
      sessoes = candidatas;
      break;
    }
  }
  if (!participante) throw new Error("Nenhuma sessão autorizada está disponível para os participantes.");
  const participanteId = String(participante.identificador);
  const sessao = sessoes.find(
    (item) => item.identificador === selecao.identificador_da_sessao
  ) ?? sessoes[0];
  if (!sessao) throw new Error("Nenhuma sessão autorizada está disponível para o participante.");
  const sessaoId = String(sessao.identificador);
  const [
    fases,
    ctrs,
    catalogoCtr,
    execucoes,
    conectores,
    fontes,
    telemetria,
    eventosTecnicos,
    linhas,
    relatorios,
    formulacoes,
    longitudinal,
    perfilMovel,
    comandosMoveis,
    postulados,
    macrocampos,
    definicoesVetoriais,
    versaoCientifica,
    evidencias,
    estadosVetoriais,
    configuracoesRegulatorias,
    avaliacoesRegulatorias,
    decisoesProfissionais,
    trajetorias,
    analisesArr,
    registrosRro,
    anamneses,
    evidenciasAnamnese,
    evidenciasAnamneseNoEscopo,
    sessaoOperacional,
    gravacao,
    configuracaoCortex,
    estadoOperacional,
    cockpitOperacional
  ] = await Promise.all([
    consultar<Registro[]>(`/api/v1/sessoes/${encodeURIComponent(sessaoId)}/fases`, token),
    consultar<Registro[]>("/api/v1/ctrs", token),
    consultar<Registro>("/api/v1/ctr/catalogo", token),
    consultar<Registro[]>(`/api/v1/participantes/${encodeURIComponent(participanteId)}/execucoes-thx`, token),
    consultar<Registro[]>(`/api/v1/conectores?identificador_da_sessao=${encodeURIComponent(sessaoId)}`, token),
    consultar<Registro[]>("/api/v1/fontes-telemetria", token),
    consultar<Registro[]>(`/api/v1/telemetria/sessoes/${encodeURIComponent(sessaoId)}?limite=1200`, token),
    consultar<Registro[]>(`/api/v1/telemetria/sessoes/${encodeURIComponent(sessaoId)}/eventos?limite=240`, token),
    consultar<Registro[]>(`/api/v1/sessoes/${encodeURIComponent(sessaoId)}/linhas-temporais`, token),
    consultar<Registro[]>(`/api/v1/participantes/${encodeURIComponent(participanteId)}/relatorios`, token),
    consultar<Registro[]>(`/api/v1/participantes/${encodeURIComponent(participanteId)}/formulacoes`, token),
    consultar<Registro>(`/api/v1/participantes/${encodeURIComponent(participanteId)}/longitudinal`, token).catch(() => ({ historico: [] })),
    consultar<Registro>("/api/v1/movel/perfil", token),
    consultar<Registro[]>("/api/v1/movel/comandos", token),
    consultarSeDisponivel<Registro>("/api/v1/cientifico/postulados", token, { quantidade: 0, regras: [] }),
    consultarSeDisponivel<Registro[]>("/api/v1/cientifico/macrocampos", token, []),
    consultarSeDisponivel<Registro[]>("/api/v1/cientifico/vetores", token, []),
    consultarSeDisponivel<Registro>("/api/v1/cientifico/versoes/ativa", token, {}),
    consultarSeDisponivel<Registro[]>(`/api/v1/sessoes/${encodeURIComponent(sessaoId)}/evidencias`, token, []),
    consultarSeDisponivel<Registro[]>(`/api/v1/sessoes/${encodeURIComponent(sessaoId)}/estados-vetoriais`, token, []),
    consultarSeDisponivel<Registro[]>(`/api/v1/sessoes/${encodeURIComponent(sessaoId)}/configuracoes-regulatorias`, token, []),
    consultarSeDisponivel<Registro[]>(`/api/v1/sessoes/${encodeURIComponent(sessaoId)}/avaliacao-regulatoria`, token, []),
    consultarSeDisponivel<Registro[]>(`/api/v1/sessoes/${encodeURIComponent(sessaoId)}/decisoes-profissionais`, token, []),
    consultarSeDisponivel<Registro[]>(`/api/v1/participantes/${encodeURIComponent(participanteId)}/trajetorias`, token, []),
    consultarSeDisponivel<Registro[]>(`/api/v1/participantes/${encodeURIComponent(participanteId)}/arr`, token, []),
    consultarSeDisponivel<Registro[]>(`/api/v1/sessoes/${encodeURIComponent(sessaoId)}/rro`, token, []),
    consultarSeDisponivel<Registro[]>(`/api/v1/participantes/${encodeURIComponent(participanteId)}/anamneses`, token, []),
    consultarSeDisponivel<Registro[]>(`/api/v1/participantes/${encodeURIComponent(participanteId)}/anamneses/evidencias`, token, []),
    consultarSeDisponivel<Registro[]>("/api/v1/anamneses/evidencias", token, []),
    consultarSeDisponivel<Registro>(`/api/v1/sessoes/${encodeURIComponent(sessaoId)}/operacoes`, token, {}),
    consultarSeDisponivel<Registro>(`/api/v1/sessoes/${encodeURIComponent(sessaoId)}/gravacao`, token, {
      configuracoes: [], dispositivos: [], segmentos: [], eventos: [], diagnostico: {}
    }),
    consultarSeDisponivel<Registro>(
      "/api/v1/pontes-fisicas/cortex/configuracao-local",
      token,
      { permitido: false, configurado: false, segredo_retornado: false }
    ),
    consultar<Registro>(
      `/api/v1/sessoes/${encodeURIComponent(sessaoId)}/estado-operacional`,
      token
    ),
    consultar<Registro>(
      `/api/v1/sessoes/${encodeURIComponent(sessaoId)}/cockpit-operacional`,
      token
    )
  ]);
  const ctr = ctrs.find((item) => item.identificador_da_sessao === sessao.identificador) ?? null;
  const execucao = execucoes.find((item) => item.identificador_da_sessao === sessao.identificador) ?? null;
  const [usuariosDisponiveis, vinculosOficiais] = await Promise.all([
    consultarSeDisponivel<Registro[]>("/api/v1/usuarios", token, []),
    consultarSeDisponivel<Registro[]>("/api/v1/ctr-thx/vinculos-validados-operacionais", token, [])
  ]);
  const nomeDoParticipante = anamneses
    .map((item) => item.nome_do_participante)
    .find((item) => typeof item === "string" && item.trim());
  const detalhesOperacionais = registro(sessaoOperacional.detalhes);
  const relatoriosDaSessao = relatorios.filter(
    (item) => registro(item.contexto_json).sessao === sessaoId
  );
  const profissionalResponsavel = usuariosDisponiveis.find(
    (item) => item.identificador === detalhesOperacionais.identificador_do_profissional
  ) ?? usuario;
  const criteriosCatalogo = Array.isArray(catalogoCtr.criterios) ? catalogoCtr.criterios as Registro[] : [];
  const contextoCtr = registro(ctr?.contexto_json);
  const codigosCtr = lista(ctr?.criterios_atendidos_json).length
    ? lista(ctr?.criterios_atendidos_json)
    : [contextoCtr.codigo_do_ctr_selecionado].filter(Boolean);
  const criteriosIndividuais = codigosCtr.map((codigo) => {
    const criterio = criteriosCatalogo.find((item) => item.codigo === codigo)
      ?? vinculosOficiais.find((item) => item.codigo_do_ctr === codigo);
    return {
      codigo,
      nome: criterio?.nome ?? criterio?.nome_do_ctr ?? "Critério oficial não localizado",
      estado: ctr?.estado_da_recomendacao ?? criterio?.estado ?? "INDISPONÍVEL"
    };
  });
  const protocolo = execucao
    ? await consultar<Registro>(`/api/v1/thx/protocolos/${encodeURIComponent(String(execucao.identificador_do_protocolo))}`, token)
    : null;
  const recomendacaoId = execucao ? String(execucao.identificador_da_recomendacao ?? "") : "";
  const rastreabilidade = recomendacaoId
    ? await consultar<Registro>(`/api/v1/recomendacoes-thx/${encodeURIComponent(recomendacaoId)}/rastreabilidade`, token)
    : null;
  const [ciclo, eventos, historicoExecucao, replay, historicosConectores] = await Promise.all([
    execucao ? consultar<Registro>(`/api/v1/execucoes-thx/${encodeURIComponent(String(execucao.identificador))}/ciclo`, token) : null,
    execucao ? consultar<Registro[]>(`/api/v1/execucoes-thx/${encodeURIComponent(String(execucao.identificador))}/ciclo/eventos`, token) : [],
    execucao ? consultar<Registro>(`/api/v1/execucoes-thx/${encodeURIComponent(String(execucao.identificador))}/historico`, token) : null,
    linhas.length ? consultar<Registro>(`/api/v1/linhas-temporais/${encodeURIComponent(String(linhas.at(-1)?.identificador))}?limite=1200`, token) : null,
    Promise.all(conectores.map(async (conector) => ({
      identificador: conector.identificador,
      eventos: await consultar<Registro[]>(`/api/v1/conectores/${encodeURIComponent(String(conector.identificador))}/historico`, token)
    })))
  ]);
  const formulacoesNoEscopo = (
    await Promise.all(
      participantes.map((item) => consultarSeDisponivel<Registro[]>(
        `/api/v1/participantes/${encodeURIComponent(String(item.identificador))}/formulacoes`,
        token,
        []
      ))
    )
  ).flat();
  return {
    aviso: MARCACAO,
    usuario,
    organizacao,
    participante: {
      ...participante,
      nome: nomeDoParticipante ?? participante.referencia_externa
    } as Registro,
    sessao,
    estado_operacional: estadoOperacional,
    cockpit_operacional: cockpitOperacional,
    contrato_cientifico: registro(
      estadoOperacional.contrato_cientifico
    ),
    sessao_operacional: sessaoOperacional,
    contextos: {
      organizacoes: organizacoes.map((item) => ({
        identificador: item.identificador,
        nome: item.nome,
        ativa: Boolean(item.ativa)
      })),
      participantes: participantes.map((item) => ({
        identificador: item.identificador,
        referencia_externa: item.referencia_externa,
        rotulo: item.identificador === participanteId
          ? nomeDoParticipante ?? item.referencia_externa
          : item.referencia_externa,
        ativo: Boolean(item.ativo)
      })),
      sessoes: sessoes.map((item) => ({
        identificador: item.identificador,
        estado: item.estado,
        identificador_do_participante: item.identificador_do_participante,
        identificador_da_versao_cientifica: item.identificador_da_versao_cientifica,
        criado_em: item.criado_em,
        iniciado_em: item.iniciado_em,
        finalizado_em: item.finalizado_em
      })),
      profissionais: [{
        identificador: profissionalResponsavel.identificador,
        nome: profissionalResponsavel.nome,
        perfil: profissionalResponsavel.perfil
      }],
      selecao: {
        identificador_da_organizacao: organizacaoId,
        identificador_do_participante: participanteId,
        identificador_da_sessao: sessaoId,
        identificador_do_profissional: profissionalResponsavel.identificador
      }
    },
    fases,
    ctr_individual: ctr ? {
      identificador: ctr.identificador,
      codigo: criteriosIndividuais[0]?.codigo ?? null,
      nome: criteriosIndividuais[0]?.nome ?? null,
      criterios: criteriosIndividuais,
      situacao: ctr.estado_da_recomendacao,
      origem_do_vinculo: `Avaliação individual da sessão ${sessaoId}`,
      condicao_de_validacao: lista(ctr.bloqueios_json).length
        ? `BLOQUEADA: ${lista(ctr.bloqueios_json).join(", ")}`
        : "APTA À DECISÃO PROFISSIONAL",
      validacao_profissional_necessaria: Boolean(ctr.validacao_profissional_necessaria)
    } : null,
    thx_individual: protocolo && execucao ? {
      identificador: protocolo.identificador,
      codigo: protocolo.codigo,
      nome: protocolo.nome,
      estado_do_protocolo: protocolo.estado,
      situacao_da_execucao: execucao.estado,
      ctr_vinculado: criteriosIndividuais[0]?.codigo ?? ctr?.identificador ?? null,
      profissional_que_autorizou: profissionalResponsavel.nome,
      executavel_como_protocolo_humano: Boolean(protocolo.executavel),
      restricoes: lista(protocolo.conteudo_json && typeof protocolo.conteudo_json === "object"
        ? (protocolo.conteudo_json as Registro).restricoes
        : null)
    } : null,
    ctr,
    execucao,
    ciclo,
    eventos,
    historico_execucao: historicoExecucao,
    conectores,
    historicos_conectores: historicosConectores,
    fontes,
    telemetria,
    eventos_tecnicos: eventosTecnicos,
    linhas,
    replay,
    gravacao,
    configuracao_cortex: configuracaoCortex,
    rastreabilidade,
    relatorios: relatoriosDaSessao.map((item) => ({
      identificador: item.identificador,
      tipo: item.tipo,
      titulo: item.titulo,
      criado_em: item.criado_em
    })),
    formulacoes,
    longitudinal,
    movel: { perfil: perfilMovel, comandos: comandosMoveis },
    ciencia: {
      postulados,
      macrocampos,
      vetores: definicoesVetoriais,
      versao: versaoCientifica
    },
    leitura_regulatoria: {
      evidencias,
      estados_vetoriais: estadosVetoriais,
      configuracoes: configuracoesRegulatorias,
      avaliacoes: avaliacoesRegulatorias,
      decisoes: decisoesProfissionais,
      trajetorias,
      arr: analisesArr,
      rro: registrosRro,
      anamneses,
      evidencias_anamnese: evidenciasAnamnese,
      evidencias_anamnese_no_escopo: evidenciasAnamneseNoEscopo,
      formulacoes_no_escopo: formulacoesNoEscopo
    },
    governanca: {
      interpretacao_cientifica_executada: false,
      dados_fisicos_reais_preservados: Array.isArray(cockpitOperacional.fontes)
        && (cockpitOperacional.fontes as Registro[]).some(
          (fonte) => Number(registro(fonte.metricas).amostras ?? 0) > 0
        ),
      dados_fisicos_convertidos_automaticamente_em_evidencia: false,
      iirh_oficial: null,
      zona_oficial: null
    }
  };
}

export async function GET(request: Request) {
  try {
    const { token } = await tokenAtual();
    const url = new URL(request.url);
    return NextResponse.json(
      await estado(token, {
        identificador_da_organizacao:
          url.searchParams.get("organizacao") ?? undefined,
        identificador_do_participante:
          url.searchParams.get("participante") ?? undefined,
        identificador_da_sessao:
          url.searchParams.get("sessao") ?? undefined
      }),
      { headers: { "cache-control": "private, no-store" } }
    );
  } catch (erro) {
    return NextResponse.json({ erro: { mensagem: erro instanceof Error ? erro.message : "Consulta operacional indisponível." } }, { status: 403 });
  }
}

async function registrarEvento(token: string, contexto: Contexto, dados: Registro) {
  const execucao = contexto.execucao;
  const fase = contexto.fases.find((item) => item.fase === dados.momento);
  if (!execucao || !fase) throw new Error("Execução ou fase de homologação indisponível.");
  return consultar(`/api/v1/execucoes-thx/${encodeURIComponent(String(execucao.identificador))}/ciclo/eventos`, token, {
    method: "POST",
    body: JSON.stringify({
      identificador_da_fase: fase.identificador,
      momento: dados.momento,
      tipo: dados.tipo,
      ocorrido_em: new Date().toISOString(),
      origem: "PORTAL_HXP_SIMULACAO_TECNICA",
      dados: { marcacao: MARCACAO, ...((dados.dados as Registro) ?? {}) }
    })
  });
}

async function gerarRelatorio(token: string, contexto: Contexto) {
  if (contexto.relatorios.length) return;
  await consultar(`/api/v1/participantes/${encodeURIComponent(String(contexto.participante.identificador))}/relatorios`, token, {
    method: "POST",
    body: JSON.stringify({
      tipo: "PRE_TREINO_POS",
      destinatario: "PROFISSIONAL",
      titulo: "Homologação operacional PRÉ / TREINO / PÓS",
      objetivo: "Documentar a sessão técnica preservada sem convertê-la em resultado humano.",
      contexto: {
        sessao: contexto.sessao.identificador,
        natureza: MARCACAO,
        fases: "PRE, TREINO e POS",
        referencia_de_baseline: contexto.gravacao?.baseline ?? {
          referencia: {
            estado: "SESSÃO SEM REFERÊNCIA DE BASELINE"
          }
        }
      },
      qualidade_dos_dados: {
        cobertura: "registrada separadamente por fase",
        confiabilidade: "registrada separadamente por fase",
        dados_humanos_reais: false
      },
      interpretacao_profissional: "Registro técnico de homologação; não há interpretação científica nem resultado humano.",
      limites: [
        "Simulação técnica não equivale a evidência humana.",
        "IIRH e zona oficiais não foram calculados.",
        "A decisão profissional permanece obrigatória."
      ],
      proximos_passos: ["Homologação visual pelo Administrador Proprietário."]
    })
  });
}

export async function POST(request: Request) {
  try {
    const { armazenamento, token } = await tokenAtual();
    exigirCsrf(request, armazenamento.get(COOKIE_CSRF)?.value);
    const corpo = await request.json() as {
      acao?: string;
      momento?: "PRE" | "TREINO" | "POS";
      conector?: string;
      inicio_percentual?: number;
      fim_percentual?: number;
      identificador_da_organizacao?: string;
      identificador_do_participante?: string;
      identificador_da_sessao?: string;
      comando?: string;
      justificativa?: string;
      categoria?: string;
      texto?: string;
      client_id?: string;
      client_secret?: string;
    };
    const selecao = {
      identificador_da_organizacao: corpo.identificador_da_organizacao,
      identificador_do_participante: corpo.identificador_do_participante,
      identificador_da_sessao: corpo.identificador_da_sessao
    };
    const contexto = await estado(token, selecao);
    if (corpo.acao === "configurar-cortex") {
      await consultar("/api/v1/pontes-fisicas/cortex/configuracao-local", token, {
        method: "POST",
        body: JSON.stringify({
          client_id: corpo.client_id,
          client_secret: corpo.client_secret
        })
      });
    } else if (corpo.acao === "evento") {
      await registrarEvento(token, contexto, { momento: corpo.momento, tipo: "MARCADOR", dados: { tipo: "MARCADOR_PROFISSIONAL" } });
    } else if (corpo.acao === "intervencao") {
      await registrarEvento(token, contexto, { momento: "TREINO", tipo: "MARCADOR", dados: { tipo: "INTERVENCAO_PROFISSIONAL", intervencao: true } });
    } else if (corpo.acao === "registro-profissional") {
      const estadoCanonico = registro(contexto.estado_operacional);
      const momento = String(estadoCanonico.fase_cientifica_atual ?? "");
      const categoria = String(corpo.categoria ?? "").trim().toUpperCase();
      const texto = String(corpo.texto ?? "").trim();
      const categoriasPermitidas = new Set([
        "EVENTO",
        "INTERVENCAO",
        "RESPOSTA",
        "OBSERVACAO",
        "DECISAO_PROFISSIONAL"
      ]);
      if (!["PRE", "TREINO", "POS"].includes(momento)) {
        throw new Error("Registro profissional exige uma fase científica ativa.");
      }
      if (!categoriasPermitidas.has(categoria) || !texto || texto.length > 500) {
        throw new Error("Registro profissional inválido.");
      }
      await registrarEvento(token, contexto, {
        momento,
        tipo: "MARCADOR",
        dados: {
          tipo: categoria,
          texto,
          origem: "REGISTRO_PROFISSIONAL_RAPIDO",
          participante: contexto.participante.identificador,
          organizacao: contexto.organizacao.identificador,
          sessao: contexto.sessao.identificador,
          fase: momento,
          protocolo: contexto.ctr_individual?.codigo,
          thx: contexto.thx_individual?.codigo,
          fontes: contexto.cockpit_operacional?.fontes,
          cobertura: registro(contexto.estado_operacional).cobertura
        }
      });
    } else if (
      corpo.acao === "acao-operacional"
      || corpo.acao === "acao-principal"
    ) {
      const comando = String(
        corpo.comando
        ?? registro(contexto.estado_operacional).proxima_acao_principal
        ?? ""
      ).toUpperCase();
      if (!comando) {
        throw new Error("O estado canônico não possui ação operacional disponível.");
      }
      const estadoCanonico = registro(contexto.estado_operacional);
      const chaveDeIdempotencia = createHash("sha256")
        .update([
          String(contexto.sessao.identificador),
          comando,
          String(estadoCanonico.ultima_atualizacao ?? "SEM_ATUALIZACAO")
        ].join("|"))
        .digest("hex");
      await consultar(
        `/api/v1/sessoes/${encodeURIComponent(String(contexto.sessao.identificador))}/comandos-operacionais`,
        token,
        {
          method: "POST",
          body: JSON.stringify({
            comando,
            chave_de_idempotencia: chaveDeIdempotencia,
            justificativa: corpo.justificativa
          })
        }
      );
    } else if (corpo.acao === "desconectar" || corpo.acao === "reconectar") {
      const conector = contexto.conectores[0];
      if (!conector) throw new Error("Conector técnico não localizado.");
      const destino = corpo.acao === "desconectar" ? "ERRO" : "RECONECTANDO";
      await consultar(`/api/v1/conectores/${encodeURIComponent(String(conector.identificador))}/transicoes`, token, { method: "POST", body: JSON.stringify({ estado: destino, detalhes: corpo.acao === "desconectar" ? { codigo: "SIMULACAO_DESCONECTADA" } : {} }) });
      if (corpo.acao === "reconectar") await consultar(`/api/v1/conectores/${encodeURIComponent(String(conector.identificador))}/transicoes`, token, { method: "POST", body: JSON.stringify({ estado: "TRANSMITINDO", detalhes: {} }) });
    } else if (corpo.acao === "comparar") {
      if (!contexto.execucao) throw new Error("Execução técnica não localizada.");
      if (!contexto.ciclo?.comparacao) {
        await consultar(`/api/v1/execucoes-thx/${encodeURIComponent(String(contexto.execucao.identificador))}/ciclo/comparar`, token, { method: "POST", body: JSON.stringify({}) });
      }
    } else if (corpo.acao === "replay") {
      await consultar(`/api/v1/sessoes/${encodeURIComponent(String(contexto.sessao.identificador))}/linha-temporal`, token, { method: "POST", body: JSON.stringify({}) });
    } else if (corpo.acao === "exportar-replay") {
      const linha = contexto.linhas.at(-1);
      if (!linha?.inicio || !linha?.fim) throw new Error("Linha temporal com intervalo válido não localizada.");
      const inicioDaLinha = new Date(String(linha.inicio)).getTime();
      const fimDaLinha = new Date(String(linha.fim)).getTime();
      const duracao = fimDaLinha - inicioDaLinha;
      const inicioPercentual = Math.max(0, Math.min(99, Number(corpo.inicio_percentual ?? 0)));
      const fimPercentual = Math.max(inicioPercentual + 1, Math.min(100, Number(corpo.fim_percentual ?? 100)));
      const inicioDaExportacao = Number.isFinite(duracao) && duracao > 0
        ? new Date(inicioDaLinha + duracao * inicioPercentual / 100).toISOString()
        : String(linha.inicio);
      const fimDaExportacao = Number.isFinite(duracao) && duracao > 0
        ? new Date(inicioDaLinha + duracao * fimPercentual / 100).toISOString()
        : String(linha.fim);
      await consultar(`/api/v1/linhas-temporais/${encodeURIComponent(String(linha.identificador))}/exportar`, token, {
        method: "POST",
        body: JSON.stringify({
          inicio: inicioDaExportacao,
          fim: fimDaExportacao,
          finalidade: "RELATORIO_AUTORIZADO"
        })
      });
    } else if (corpo.acao === "relatorio") {
      await gerarRelatorio(token, contexto);
    } else {
      throw new Error("Ação operacional inválida.");
    }
    return NextResponse.json(
      await estado(token, selecao),
      { headers: { "cache-control": "private, no-store" } }
    );
  } catch (erro) {
    return NextResponse.json({ erro: { mensagem: erro instanceof Error ? erro.message : "Comando operacional recusado." } }, { status: 400 });
  }
}
