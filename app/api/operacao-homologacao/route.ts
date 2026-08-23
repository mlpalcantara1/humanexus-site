import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ErroDoNucleo,
  requisitarNucleoAutenticado
} from "@/lib/humanexus-core";
import { ErroDaRota, responderErroDaApi } from "@/lib/api-route-error";
import { COOKIE_CSRF, COOKIE_SESSAO } from "@/lib/portal-session";
import { exigirCsrf } from "@/lib/request-security";
import { normalizarComandoOperacional } from "@/lib/cockpit-operational-command";
import {
  CAMPOS_PROFISSIONAIS_DO_RELATORIO,
  resolverIdentidadeDocumental,
  tituloHumanoDoRelatorio
} from "@/lib/humanexus-report-authority";

type Registro = Record<string, unknown>;
type SelecaoDeContexto = {
  identificador_da_organizacao?: string;
  identificador_do_participante?: string;
  identificador_da_sessao?: string;
};
type Contexto = Awaited<ReturnType<typeof estado>>;

async function tokenAtual() {
  const armazenamento = await cookies();
  const token = armazenamento.get(COOKIE_SESSAO)?.value;
  if (!token) {
    throw new ErroDoNucleo("Sessão ausente.", 401, "SESSAO_AUSENTE");
  }
  return { armazenamento, token };
}

function consultar<T>(
  caminho: string,
  token: string,
  init: RequestInit = {},
  organizacao?: string,
  opcoes: { tentativas?: number; tempoLimiteMs?: number } = {}
) {
  const headers = new Headers(init.headers);
  if (organizacao) {
    headers.set("x-humanexus-organization-id", organizacao);
  }
  return requisitarNucleoAutenticado<T>(
    caminho,
    token,
    { ...init, headers },
    opcoes
  );
}

type ConsultaEmLote = {
  chave: string;
  caminho: string;
  opcional?: boolean;
  padrao?: unknown;
};

async function consultarLote(
  token: string,
  consultas: ConsultaEmLote[],
  organizacao?: string
) {
  const resultados: Array<{
    chave: string;
    disponivel: boolean;
    dados: unknown;
  }> = [];
  for (let inicio = 0; inicio < consultas.length; inicio += 64) {
    const grupo = consultas.slice(inicio, inicio + 64);
    const resposta = await consultar<{
      resultados: Array<{
        chave: string;
        disponivel: boolean;
        dados: unknown;
      }>;
    }>("/api/v1/consultas-em-lote", token, {
      method: "POST",
      body: JSON.stringify({
        consultas: grupo.map(({ chave, caminho, opcional }) => ({
          chave,
          caminho,
          opcional: Boolean(opcional)
        }))
      })
    }, organizacao);
    resultados.push(...resposta.resultados);
  }
  const porChave = new Map(
    resultados.map((item) => [item.chave, item])
  );
  return Object.fromEntries(
    consultas.map((consulta) => {
      const resultado = porChave.get(consulta.chave);
      if (!resultado?.disponivel && !consulta.opcional) {
        throw new ErroDaRota(
          "Uma informação obrigatória do Cockpit está temporariamente indisponível.",
          502,
          `CONSULTA_OBRIGATORIA_${consulta.chave.toUpperCase()}_INDISPONIVEL`
        );
      }
      return [
        consulta.chave,
        resultado?.disponivel ? resultado.dados : consulta.padrao
      ];
    })
  );
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

function sanitizarDtoDaPopulacaoColetiva(valor: unknown): Registro {
  const populacao = registro(valor);
  const pertencimento = registro(populacao.pertencimento);
  const elegibilidade = registro(populacao.elegibilidade_cientifica);
  const exposicao = registro(populacao.exposicao);
  const membrosAutorizados = lista(populacao.membros_autorizados)
    .map(registro)
    .map((item) => String(item.referencia_operacional ?? "").trim())
    .filter(Boolean)
    .map((referenciaOperacional) => ({
      referencia_operacional: referenciaOperacional
    }));
  return {
    estado: populacao.estado,
    pertencimento: {
      participantes_ativos_na_organizacao:
        pertencimento.participantes_ativos_na_organizacao,
      membros_organizacionais_automaticos:
        pertencimento.membros_organizacionais_automaticos,
      participantes_particulares_fora_do_coletivo:
        pertencimento.participantes_particulares_fora_do_coletivo,
      regra: pertencimento.regra
    },
    elegibilidade_cientifica: {
      participantes_com_sessao_elegivel:
        elegibilidade.participantes_com_sessao_elegivel,
      sessoes_individuais_elegiveis:
        elegibilidade.sessoes_individuais_elegiveis,
      limiar_minimo_autorizado:
        elegibilidade.limiar_minimo_autorizado,
      agregacao_permitida: Boolean(elegibilidade.agregacao_permitida)
    },
    exposicao: {
      participantes_com_permissao_explicita:
        exposicao.participantes_com_permissao_explicita,
      dados_pessoais_expostos: false,
      cpf_exposto: false,
      identificador_individual_permitido:
        "REFERENCIA_OPERACIONAL_ONLY"
    },
    membros_autorizados: membrosAutorizados,
    cobertura: populacao.cobertura,
    requisitos_nao_atendidos: lista(populacao.requisitos_nao_atendidos),
    limites: lista(populacao.limites)
  };
}

async function atualizacaoLeve(
  token: string,
  selecao: SelecaoDeContexto,
  desdeVersao?: string,
  medirLatencia = false
) {
  const sessaoId = String(selecao.identificador_da_sessao ?? "");
  if (!sessaoId) {
    throw new ErroDaRota(
      "Selecione uma sessão antes de atualizar o Cockpit.",
      400,
      "SESSAO_NAO_INFORMADA"
    );
  }
  const parametros = new URLSearchParams();
  if (desdeVersao) parametros.set("desde_versao", desdeVersao);
  const inicioDaConsultaAoNucleo = Date.now();
  const dados = await consultar<{
    contrato: string;
    modo: "SNAPSHOT" | "DELTA" | "SEM_ALTERACAO";
    versao: string;
    revisao: number;
    escopo_da_revisao: "INSTANCIA_LOCAL_NAO_ORDENAVEL";
    sequencias_por_fonte: Record<string, number>;
    geracoes_por_fonte?: Record<string, string>;
    campos_alterados: {
      estado_operacional?: Registro;
      cockpit_operacional?: Registro;
    };
    limites: {
      contextos: number;
      registros_por_fonte: number;
      registros_residentes: number;
    };
  }>(
    `/api/v1/sessoes/${encodeURIComponent(sessaoId)}/cockpit-operacional-vivo${parametros.size ? `?${parametros}` : ""}`,
    token,
    {},
    selecao.identificador_da_organizacao,
    {
      // O navegador já coordena backoff e mantém a última projeção marcada
      // como não atual. Repetir a mesma leitura no proxy multiplicava
      // invocações serverless após um timeout e ampliava a saturação.
      tentativas: 1,
      tempoLimiteMs: 10_000
    }
  );
  const latenciaDoNucleoMs = Date.now() - inicioDaConsultaAoNucleo;
  return {
    atualizacao_parcial: true,
    sem_alteracao: dados.modo === "SEM_ALTERACAO",
    modo_da_atualizacao: dados.modo,
    versao_do_cockpit: dados.versao,
    revisao_do_cockpit: dados.revisao,
    escopo_da_revisao_do_cockpit: dados.escopo_da_revisao,
    sequencias_do_cockpit: dados.sequencias_por_fonte,
    geracoes_do_cockpit: dados.geracoes_por_fonte,
    limites_da_memoria_viva: dados.limites,
    estado_operacional: dados.campos_alterados.estado_operacional,
    cockpit_operacional: dados.campos_alterados.cockpit_operacional,
    diagnostico_de_latencia: medirLatencia
      ? { nucleo_ms: latenciaDoNucleoMs }
      : undefined
  };
}

async function estado(
  token: string,
  selecao: SelecaoDeContexto = {},
  opcoes: {
    incluirFormulacoesNoEscopo?: boolean;
    carregamentoInicial?: boolean;
    prepararComando?: boolean;
  } = {}
) {
  const parametrosDoContexto = new URLSearchParams({ modulo: "sessoes" });
  if (selecao.identificador_da_organizacao) {
    parametrosDoContexto.set(
      "organizacao",
      selecao.identificador_da_organizacao
    );
  }
  const contextoBase = await consultar<{
    usuario: Registro;
    organizacoes: Registro[];
    organizacao: Registro | null;
    participantes: Registro[];
    sessoes: Registro[];
    profissionais: Registro[];
    vinculos_ctr_thx_validados: Registro[];
    populacao_coletiva: Registro;
  }>(
    `/api/v1/gestao/contexto?${parametrosDoContexto}`,
    token,
    {},
    selecao.identificador_da_organizacao
  );
  const usuario = contextoBase.usuario;
  const organizacoes = contextoBase.organizacoes;
  const organizacao = contextoBase.organizacao;
  if (!organizacao?.identificador) {
    throw new ErroDaRota(
      "Nenhuma organização autorizada está disponível para o contexto.",
      403,
      "ORGANIZACAO_NAO_AUTORIZADA"
    );
  }
  const organizacaoId = String(organizacao.identificador);
  const participantes = contextoBase.participantes;
  if (!selecao.identificador_do_participante) {
    throw new ErroDaRota(
      "Selecione explicitamente o participante antes de abrir o Cockpit.",
      400,
      "PARTICIPANTE_NAO_INFORMADO"
    );
  }
  const participanteSolicitado = participantes.find(
    (item) => item.identificador === selecao.identificador_do_participante
  );
  const participante = participanteSolicitado;
  const sessoes = (
    Array.isArray(participante?.sessoes)
      ? participante.sessoes
      : []
  ) as Registro[];
  if (!participante) {
    throw new ErroDaRota(
      "Participante não pertence ao contexto autorizado.",
      403,
      "PARTICIPANTE_FORA_DO_ESCOPO"
    );
  }
  const participanteId = String(participante.identificador);
  if (!selecao.identificador_da_sessao) {
    throw new ErroDaRota(
      "Selecione explicitamente uma sessão existente antes de abrir o Cockpit.",
      400,
      "SESSAO_NAO_INFORMADA"
    );
  }
  const sessao = sessoes.find(
    (item) => item.identificador === selecao.identificador_da_sessao
  );
  if (!sessao) {
    throw new ErroDaRota(
      "Sessão não pertence ao participante e à organização selecionados.",
      403,
      "SESSAO_FORA_DO_ESCOPO"
    );
  }
  const sessaoId = String(sessao.identificador);
  const consultasPrincipaisCompletas: ConsultaEmLote[] = [
    { chave: "fases", caminho: `/api/v1/sessoes/${encodeURIComponent(sessaoId)}/fases` },
    { chave: "ctrs", caminho: "/api/v1/ctrs" },
    { chave: "catalogoCtr", caminho: "/api/v1/ctr/catalogo" },
    { chave: "execucoes", caminho: `/api/v1/participantes/${encodeURIComponent(participanteId)}/execucoes-thx` },
    { chave: "conectores", caminho: `/api/v1/conectores?identificador_da_sessao=${encodeURIComponent(sessaoId)}` },
    { chave: "fontes", caminho: "/api/v1/fontes-telemetria" },
    { chave: "telemetria", caminho: `/api/v1/telemetria/sessoes/${encodeURIComponent(sessaoId)}?limite=1200` },
    { chave: "eventosTecnicos", caminho: `/api/v1/telemetria/sessoes/${encodeURIComponent(sessaoId)}/eventos?limite=240` },
    { chave: "linhas", caminho: `/api/v1/sessoes/${encodeURIComponent(sessaoId)}/linhas-temporais` },
    { chave: "relatorios", caminho: `/api/v1/participantes/${encodeURIComponent(participanteId)}/relatorios` },
    { chave: "formulacoes", caminho: `/api/v1/participantes/${encodeURIComponent(participanteId)}/formulacoes` },
    { chave: "longitudinal", caminho: `/api/v1/participantes/${encodeURIComponent(participanteId)}/longitudinal`, opcional: true, padrao: { historico: [] } },
    { chave: "perfilMovel", caminho: "/api/v1/movel/perfil" },
    { chave: "comandosMoveis", caminho: "/api/v1/movel/comandos" },
    { chave: "postulados", caminho: "/api/v1/cientifico/postulados", opcional: true, padrao: { quantidade: 0, regras: [] } },
    { chave: "macrocampos", caminho: "/api/v1/cientifico/macrocampos", opcional: true, padrao: [] },
    { chave: "definicoesVetoriais", caminho: "/api/v1/cientifico/vetores", opcional: true, padrao: [] },
    { chave: "versaoCientifica", caminho: "/api/v1/cientifico/versoes/ativa", opcional: true, padrao: {} },
    { chave: "evidencias", caminho: `/api/v1/sessoes/${encodeURIComponent(sessaoId)}/evidencias`, opcional: true, padrao: [] },
    { chave: "evidenciasProfissionais", caminho: `/api/v1/sessoes/${encodeURIComponent(sessaoId)}/evidencias-profissionais`, opcional: true, padrao: { catalogo: [], capturas: [], pendentes: [], qualificadas: [] } },
    { chave: "tirhV1", caminho: `/api/v1/sessoes/${encodeURIComponent(sessaoId)}/tirh-v1`, opcional: true, padrao: {} },
    { chave: "estadosVetoriais", caminho: `/api/v1/sessoes/${encodeURIComponent(sessaoId)}/estados-vetoriais`, opcional: true, padrao: [] },
    { chave: "configuracoesRegulatorias", caminho: `/api/v1/sessoes/${encodeURIComponent(sessaoId)}/configuracoes-regulatorias`, opcional: true, padrao: [] },
    { chave: "avaliacoesRegulatorias", caminho: `/api/v1/sessoes/${encodeURIComponent(sessaoId)}/avaliacao-regulatoria`, opcional: true, padrao: [] },
    { chave: "decisoesProfissionais", caminho: `/api/v1/sessoes/${encodeURIComponent(sessaoId)}/decisoes-profissionais`, opcional: true, padrao: [] },
    { chave: "trajetorias", caminho: `/api/v1/participantes/${encodeURIComponent(participanteId)}/trajetorias`, opcional: true, padrao: [] },
    { chave: "analisesArr", caminho: `/api/v1/participantes/${encodeURIComponent(participanteId)}/arr`, opcional: true, padrao: [] },
    { chave: "registrosRro", caminho: `/api/v1/sessoes/${encodeURIComponent(sessaoId)}/rro`, opcional: true, padrao: [] },
    { chave: "anamneses", caminho: `/api/v1/participantes/${encodeURIComponent(participanteId)}/anamneses`, opcional: true, padrao: [] },
    { chave: "evidenciasAnamnese", caminho: `/api/v1/participantes/${encodeURIComponent(participanteId)}/anamneses/evidencias`, opcional: true, padrao: [] },
    { chave: "evidenciasAnamneseNoEscopo", caminho: "/api/v1/anamneses/evidencias", opcional: true, padrao: [] },
    { chave: "sessaoOperacional", caminho: `/api/v1/sessoes/${encodeURIComponent(sessaoId)}/operacoes`, opcional: true, padrao: {} },
    {
      chave: "gravacao",
      caminho: `/api/v1/sessoes/${encodeURIComponent(sessaoId)}/gravacao`,
      opcional: true,
      padrao: {
        configuracoes: [],
        dispositivos: [],
        segmentos: [],
        eventos: [],
        diagnostico: {}
      }
    },
    {
      chave: "configuracaoCortex",
      caminho: "/api/v1/pontes-fisicas/cortex/configuracao-local",
      opcional: true,
      padrao: {
        permitido: false,
        configurado: false,
        segredo_retornado: false
      }
    },
    { chave: "estadoOperacional", caminho: `/api/v1/sessoes/${encodeURIComponent(sessaoId)}/estado-operacional` },
    { chave: "cockpitOperacional", caminho: `/api/v1/sessoes/${encodeURIComponent(sessaoId)}/cockpit-operacional` },
    ...(opcoes.incluirFormulacoesNoEscopo ? participantes : []).map((item) => ({
      chave: `formulacoes:${String(item.identificador)}`,
      caminho: `/api/v1/participantes/${encodeURIComponent(String(item.identificador))}/formulacoes`,
      opcional: true,
      padrao: []
    }))
  ];
  const consultasPrincipaisIniciais: ConsultaEmLote[] = [
    { chave: "ctrs", caminho: "/api/v1/ctrs" },
    { chave: "catalogoCtr", caminho: "/api/v1/ctr/catalogo" },
    {
      chave: "execucoes",
      caminho: `/api/v1/participantes/${encodeURIComponent(participanteId)}/execucoes-thx`
    },
    {
      chave: "definicoesVetoriais",
      caminho: "/api/v1/cientifico/vetores",
      opcional: true,
      padrao: []
    },
    {
      chave: "evidenciasProfissionais",
      caminho: `/api/v1/sessoes/${encodeURIComponent(sessaoId)}/evidencias-profissionais`,
      opcional: true,
      padrao: { catalogo: [], capturas: [], pendentes: [], qualificadas: [] }
    },
    {
      chave: "tirhV1",
      caminho: `/api/v1/sessoes/${encodeURIComponent(sessaoId)}/tirh-v1`,
      opcional: true,
      padrao: {}
    },
    {
      chave: "cockpitOperacional",
      caminho: `/api/v1/sessoes/${encodeURIComponent(sessaoId)}/cockpit-operacional?limite_de_amostras=120`
    },
    ...(opcoes.prepararComando ? [
      {
        chave: "fases",
        caminho: `/api/v1/sessoes/${encodeURIComponent(sessaoId)}/fases`
      },
      {
        chave: "conectores",
        caminho: `/api/v1/conectores?identificador_da_sessao=${encodeURIComponent(sessaoId)}`
      }
    ] : [])
  ];
  const consultasPrincipais = opcoes.carregamentoInicial
    ? consultasPrincipaisIniciais
    : consultasPrincipaisCompletas;
  const principaisConsultados = await consultarLote(
    token,
    consultasPrincipais,
    organizacaoId
  );
  const principais: Record<string, unknown> = {
    fases: [],
    ctrs: [],
    catalogoCtr: { criterios: [] },
    execucoes: [],
    conectores: [],
    fontes: [],
    telemetria: [],
    eventosTecnicos: [],
    linhas: [],
    relatorios: [],
    formulacoes: [],
    longitudinal: { historico: [] },
    perfilMovel: {},
    comandosMoveis: [],
    postulados: { quantidade: 0, regras: [] },
    macrocampos: [],
    definicoesVetoriais: [],
    versaoCientifica: {},
    evidencias: [],
    evidenciasProfissionais: { catalogo: [], capturas: [], pendentes: [], qualificadas: [] },
    tirhV1: {},
    estadosVetoriais: [],
    configuracoesRegulatorias: [],
    avaliacoesRegulatorias: [],
    decisoesProfissionais: [],
    trajetorias: [],
    analisesArr: [],
    registrosRro: [],
    anamneses: [],
    evidenciasAnamnese: [],
    evidenciasAnamneseNoEscopo: [],
    sessaoOperacional: {},
    gravacao: {
      configuracoes: [],
      dispositivos: [],
      segmentos: [],
      eventos: [],
      diagnostico: {}
    },
    configuracaoCortex: {
      permitido: false,
      configurado: false,
      segredo_retornado: false
    },
    estadoOperacional: {},
    cockpitOperacional: {},
    ...principaisConsultados
  };
  const fases = principais.fases as Registro[];
  const ctrs = principais.ctrs as Registro[];
  const catalogoCtr = principais.catalogoCtr as Registro;
  const execucoes = principais.execucoes as Registro[];
  const conectores = principais.conectores as Registro[];
  const fontes = principais.fontes as Registro[];
  const telemetria = principais.telemetria as Registro[];
  const eventosTecnicos = principais.eventosTecnicos as Registro[];
  const linhas = principais.linhas as Registro[];
  const relatorios = principais.relatorios as Registro[];
  const formulacoes = principais.formulacoes as Registro[];
  const longitudinal = principais.longitudinal as Registro;
  const perfilMovel = principais.perfilMovel as Registro;
  const comandosMoveis = principais.comandosMoveis as Registro[];
  const postulados = principais.postulados as Registro;
  const macrocampos = principais.macrocampos as Registro[];
  const definicoesVetoriais = principais.definicoesVetoriais as Registro[];
  const versaoCientifica = principais.versaoCientifica as Registro;
  const evidencias = principais.evidencias as Registro[];
  const evidenciasProfissionais = principais.evidenciasProfissionais as Registro;
  const tirhV1 = principais.tirhV1 as Registro;
  const estadosVetoriais = principais.estadosVetoriais as Registro[];
  const configuracoesRegulatorias = principais.configuracoesRegulatorias as Registro[];
  const avaliacoesRegulatorias = principais.avaliacoesRegulatorias as Registro[];
  const decisoesProfissionais = principais.decisoesProfissionais as Registro[];
  const trajetorias = principais.trajetorias as Registro[];
  const analisesArr = principais.analisesArr as Registro[];
  const registrosRro = principais.registrosRro as Registro[];
  const anamneses = principais.anamneses as Registro[];
  const evidenciasAnamnese = principais.evidenciasAnamnese as Registro[];
  const evidenciasAnamneseNoEscopo = principais.evidenciasAnamneseNoEscopo as Registro[];
  const sessaoOperacional = principais.sessaoOperacional as Registro;
  const gravacao = principais.gravacao as Registro;
  const configuracaoCortex = principais.configuracaoCortex as Registro;
  const cockpitOperacional = principais.cockpitOperacional as Registro;
  const estadoOperacional = (
    Object.keys(principais.estadoOperacional as Registro).length
      ? principais.estadoOperacional
      : registro(cockpitOperacional.estado_operacional)
  ) as Registro;
  const ctr = ctrs
    .filter((item) => item.identificador_da_sessao === sessao.identificador)
    .sort((a, b) => {
      const revisao = Number(b.numero_da_revisao ?? 0) - Number(a.numero_da_revisao ?? 0);
      if (revisao) return revisao;
      return String(b.atualizado_em ?? b.criado_em ?? "").localeCompare(
        String(a.atualizado_em ?? a.criado_em ?? "")
      );
    })[0] ?? null;
  const execucao = execucoes.find((item) => item.identificador_da_sessao === sessao.identificador) ?? null;
  const usuariosDisponiveis = contextoBase.profissionais;
  const vinculosOficiais = contextoBase.vinculos_ctr_thx_validados;
  const nomeDoParticipante = anamneses
    .map((item) => item.nome_do_participante)
    .find((item) => typeof item === "string" && item.trim());
  const identidadeDocumental = resolverIdentidadeDocumental(
    participante,
    organizacao
  );
  const detalhesOperacionaisConsultados = registro(sessaoOperacional.detalhes);
  const detalhesOperacionais = Object.keys(detalhesOperacionaisConsultados).length
    ? detalhesOperacionaisConsultados
    : registro(sessao.detalhes_operacionais);
  const relatoriosDaSessao = relatorios.filter(
    (item) => {
      const contextoDoRelatorio = registro(item.contexto_json);
      return String(
        contextoDoRelatorio.identificador_interno_da_sessao
        ?? contextoDoRelatorio.identificador_da_sessao
        ?? contextoDoRelatorio.sessao
        ?? ""
      ) === sessaoId;
    }
  );
  const profissionalResponsavel = usuariosDisponiveis.find(
    (item) => item.identificador === detalhesOperacionais.identificador_do_profissional
  );
  if (!profissionalResponsavel) {
    throw new ErroDaRota(
      "O profissional responsável da sessão não pertence ao contexto autorizado.",
      403,
      "PROFISSIONAL_FORA_DO_ESCOPO"
    );
  }
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
  const recomendacaoId = execucao ? String(execucao.identificador_da_recomendacao ?? "") : "";
  const consultasDependentesCompletas: ConsultaEmLote[] = [
    ...(execucao ? [
      {
        chave: "protocolo",
        caminho: `/api/v1/thx/protocolos/${encodeURIComponent(String(execucao.identificador_do_protocolo))}`
      },
      {
        chave: "ciclo",
        caminho: `/api/v1/execucoes-thx/${encodeURIComponent(String(execucao.identificador))}/ciclo`
      },
      {
        chave: "eventos",
        caminho: `/api/v1/execucoes-thx/${encodeURIComponent(String(execucao.identificador))}/ciclo/eventos`
      },
      {
        chave: "historicoExecucao",
        caminho: `/api/v1/execucoes-thx/${encodeURIComponent(String(execucao.identificador))}/historico`
      }
    ] : []),
    ...(recomendacaoId ? [{
      chave: "rastreabilidade",
      caminho: `/api/v1/recomendacoes-thx/${encodeURIComponent(recomendacaoId)}/rastreabilidade`
    }] : []),
    ...(linhas.length ? [{
      chave: "replay",
      caminho: `/api/v1/linhas-temporais/${encodeURIComponent(String(linhas.at(-1)?.identificador))}?limite=1200`
    }] : []),
    ...conectores.map((conector) => ({
      chave: `historicoConector:${String(conector.identificador)}`,
      caminho: `/api/v1/conectores/${encodeURIComponent(String(conector.identificador))}/historico`
    }))
  ];
  const consultasDependentes = opcoes.carregamentoInicial
    ? (
        execucao
          ? [{
              chave: "protocolo",
              caminho: `/api/v1/thx/protocolos/${encodeURIComponent(String(execucao.identificador_do_protocolo))}`
            }]
          : []
      )
    : consultasDependentesCompletas;
  const dependentes = consultasDependentes.length
    ? await consultarLote(token, consultasDependentes, organizacaoId)
    : {};
  const protocolo = (dependentes.protocolo ?? null) as Registro | null;
  const rastreabilidade = (dependentes.rastreabilidade ?? null) as Registro | null;
  const ciclo = (dependentes.ciclo ?? null) as Registro | null;
  const eventos = (dependentes.eventos ?? []) as Registro[];
  const historicoExecucao = (
    dependentes.historicoExecucao ?? null
  ) as Registro | null;
  const replay = (dependentes.replay ?? null) as Registro | null;
  const historicosConectores = conectores.map((conector) => ({
    identificador: conector.identificador,
    eventos: (
      dependentes[`historicoConector:${String(conector.identificador)}`] ?? []
    ) as Registro[]
  }));
  const formulacoesNoEscopo = opcoes.incluirFormulacoesNoEscopo
    ? participantes.flatMap(
        (item) => (
          principais[`formulacoes:${String(item.identificador)}`] ?? []
        ) as Registro[]
      )
    : formulacoes;
  return {
    carregamento_progressivo: Boolean(opcoes.carregamentoInicial),
    usuario,
    organizacao,
    participante: {
      ...participante,
      nome: identidadeDocumental.nomeCompleto,
      nome_documental: identidadeDocumental.nomeCompleto,
      cpf_documental: identidadeDocumental.cpf,
      fonte_da_identidade: identidadeDocumental.fonte,
      nome_de_anamnese: nomeDoParticipante ?? null
    } as Registro,
    sessao,
    estado_operacional: estadoOperacional,
    cockpit_operacional: cockpitOperacional,
    tirh_v1: tirhV1,
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
        rotulo: resolverIdentidadeDocumental(item, organizacao).nomeCompleto,
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
    populacao_coletiva: sanitizarDtoDaPopulacaoColetiva(
      contextoBase.populacao_coletiva
    ),
    relatorios: relatoriosDaSessao.map((item) => ({
      identificador: item.identificador,
      identificador_da_serie: item.identificador_da_serie,
      identificador_da_versao_anterior: item.identificador_da_versao_anterior,
      numero_da_versao: item.numero_da_versao,
      codigo_publico: item.codigo_publico,
      tipo: item.tipo,
      destinatario: item.destinatario,
      titulo: item.titulo,
      objetivo: item.objetivo,
      criado_em: item.criado_em,
      estado_documental: item.estado_documental,
      estado_funcional: item.estado_funcional,
      campos_profissionais_ausentes: lista(item.campos_profissionais_ausentes),
      consolidacao_profissional: registro(item.consolidacao_profissional),
      relatorio_final_disponivel: Boolean(item.relatorio_final_disponivel),
      contexto: registro(item.contexto_json),
      qualidade_dos_dados: registro(item.qualidade_dos_dados_json),
      interpretacao_profissional: item.interpretacao_profissional,
      limites: lista(item.limites_json),
      proximos_passos: lista(item.proximos_passos_json),
      secoes: lista(item.secoes_json)
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
    evidencias_profissionais: evidenciasProfissionais,
    leitura_regulatoria: {
      evidencias,
      estados_vetoriais: estadosVetoriais,
      configuracoes: configuracoesRegulatorias,
      avaliacoes: avaliacoesRegulatorias,
      decisoes: decisoesProfissionais,
      trajetorias,
      arr: analisesArr,
      rro_legacy: registrosRro,
      anamneses,
      evidencias_anamnese: evidenciasAnamnese,
      evidencias_anamnese_no_escopo: evidenciasAnamneseNoEscopo,
      formulacoes_no_escopo: formulacoesNoEscopo
    }
  };
}

export async function GET(request: Request) {
  try {
    const inicioDaRota = Date.now();
    const { token } = await tokenAtual();
    const url = new URL(request.url);
    const atualizacaoLeveSolicitada = url.searchParams.get("leve") === "1";
    const medirLatencia = url.searchParams.get("medir_latencia") === "1";
    const selecao = {
      identificador_da_organizacao:
        url.searchParams.get("organizacao") ?? undefined,
      identificador_do_participante:
        url.searchParams.get("participante") ?? undefined,
      identificador_da_sessao:
        url.searchParams.get("sessao") ?? undefined
    };
    const resultado = atualizacaoLeveSolicitada
        ? await atualizacaoLeve(
            token,
            selecao,
            url.searchParams.get("versao") ?? undefined,
            medirLatencia
          )
        : await estado(token, selecao, {
            carregamentoInicial:
              url.searchParams.get("inicial") === "1",
            incluirFormulacoesNoEscopo:
              url.searchParams.get("visao") === "formulacao"
          });
    if (atualizacaoLeveSolicitada && medirLatencia) {
      const resultadoLeve = resultado as Awaited<
        ReturnType<typeof atualizacaoLeve>
      >;
      const payloadBytes = Buffer.byteLength(JSON.stringify(resultado));
      console.info(JSON.stringify({
        evento: "HXP_LATENCIA_COCKPIT_VIVO",
        rota_total_ms: Date.now() - inicioDaRota,
        nucleo_ms: resultadoLeve.diagnostico_de_latencia?.nucleo_ms,
        payload_bytes: payloadBytes,
        modo: resultadoLeve.modo_da_atualizacao
      }));
    }
    return NextResponse.json(
      resultado,
      { headers: { "cache-control": "private, no-store" } }
    );
  } catch (erro) {
    return responderErroDaApi(erro, {
      modulo: "COCKPIT_VIVO",
      rota: "CONSULTA_OPERACIONAL"
    });
  }
}

export async function DELETE(request: Request) {
  try {
    const { token } = await tokenAtual();
    const url = new URL(request.url);
    const sessao = String(url.searchParams.get("sessao") ?? "");
    const organizacao = String(url.searchParams.get("organizacao") ?? "");
    if (!sessao || !organizacao) {
      throw new ErroDaRota(
        "Selecione organização, participante e sessão antes de liberar o Cockpit.",
        400,
        "CONTEXTO_NAO_INFORMADO"
      );
    }
    const resposta = await consultar<Registro>(
      `/api/v1/sessoes/${encodeURIComponent(sessao)}/cockpit-operacional-vivo`,
      token,
      { method: "DELETE" },
      organizacao
    );
    return NextResponse.json(resposta, {
      headers: { "cache-control": "private, no-store" }
    });
  } catch (erro) {
    return responderErroDaApi(erro, {
      modulo: "COCKPIT_VIVO",
      rota: "LIBERACAO_DO_CONTEXTO"
    });
  }
}

async function registrarEvento(token: string, contexto: Contexto, dados: Registro) {
  const execucao = contexto.execucao;
  const fase = contexto.fases.find((item) => item.fase === dados.momento);
  if (!execucao || !fase) {
    throw new ErroDaRota(
      "A execução ou a fase atual não está disponível para este registro.",
      409,
      "FASE_OPERACIONAL_INDISPONIVEL"
    );
  }
  return consultar(`/api/v1/execucoes-thx/${encodeURIComponent(String(execucao.identificador))}/ciclo/eventos`, token, {
    method: "POST",
    body: JSON.stringify({
      identificador_da_fase: fase.identificador,
      momento: dados.momento,
      tipo: dados.tipo,
      ocorrido_em: new Date().toISOString(),
      origem: "REGISTRO_PROFISSIONAL_CANONICO_HXP",
      dados: { ...((dados.dados as Registro) ?? {}) }
    })
  }, String(contexto.organizacao.identificador));
}

async function gerarRelatorio(token: string, contexto: Contexto) {
  if (contexto.relatorios.length) return;
  const detalhes = registro(contexto.sessao_operacional?.detalhes);
  const tipoDaSessao = String(
    contexto.sessao.tipo_de_sessao
    ?? detalhes.tipo_de_sessao
    ?? registro(contexto.estado_operacional).tipo_de_sessao
    ?? "PRE_TREINO_POS"
  ).toUpperCase();
  await consultar(`/api/v1/participantes/${encodeURIComponent(String(contexto.participante.identificador))}/relatorios`, token, {
    method: "POST",
    body: JSON.stringify({
      tipo: tipoDaSessao === "BASELINE" ? "INDIVIDUAL_DE_SESSAO" : "PRE_TREINO_POS",
      destinatario: "PROFISSIONAL",
      titulo: tituloHumanoDoRelatorio(
        contexto.participante,
        contexto.organizacao
      ),
      objetivo: "Consolidar os registros canônicos da sessão para análise profissional.",
      identificador_da_sessao: contexto.sessao.identificador,
      contexto: {
        nome_da_sessao: contexto.sessao.nome_operacional,
        identificador_interno_da_sessao: contexto.sessao.identificador,
        finalidade: contexto.sessao.finalidade,
        tipo_de_sessao: contexto.sessao.tipo_de_sessao,
        referencia_de_baseline: contexto.gravacao?.baseline ?? {
          referencia: {
            estado: "SESSÃO SEM REFERÊNCIA DE BASELINE"
          }
        }
      },
      qualidade_dos_dados: {
        cobertura: "Registrada pelo motor científico para cada fase.",
        confiabilidade: "Registrada pelo motor científico para cada fase.",
        origem: "Evidências canônicas persistidas da sessão."
      },
      interpretacao_profissional: "",
      limites: [
        "Indicadores ausentes permanecem sem valor.",
        "A decisão e a interpretação finais permanecem sob responsabilidade profissional."
      ],
      proximos_passos: []
    })
  }, String(contexto.organizacao.identificador));
}

function possuiConteudoProfissional(valor: unknown): boolean {
  if (typeof valor === "string") return Boolean(valor.trim());
  if (Array.isArray(valor)) return valor.some(possuiConteudoProfissional);
  if (valor && typeof valor === "object") {
    return Object.values(valor as Registro).some(possuiConteudoProfissional);
  }
  return valor != null;
}

async function consolidarRelatorio(
  token: string,
  contexto: Contexto,
  consolidacaoRecebida: unknown
) {
  const consolidacao = registro(consolidacaoRecebida);
  const ausentes = CAMPOS_PROFISSIONAIS_DO_RELATORIO
    .filter(([campo]) => !possuiConteudoProfissional(consolidacao[campo]))
    .map(([, rotulo]) => rotulo);
  if (ausentes.length) {
    throw new ErroDaRota(
      `A consolidação profissional ainda está incompleta: ${ausentes.join(", ")}.`,
      400,
      "CONSOLIDACAO_PROFISSIONAL_INCOMPLETA"
    );
  }
  const anterior = contexto.relatorios.at(-1);
  const contextoAnterior = registro(anterior?.contexto);
  const qualidadeAnterior = registro(anterior?.qualidade_dos_dados);
  const detalhes = registro(contexto.sessao_operacional?.detalhes);
  const tipoDaSessao = String(
    contexto.sessao.tipo_de_sessao
    ?? detalhes.tipo_de_sessao
    ?? "PRE_TREINO_POS"
  ).toUpperCase();
  await consultar(
    `/api/v1/participantes/${encodeURIComponent(String(contexto.participante.identificador))}/relatorios`,
    token,
    {
      method: "POST",
      body: JSON.stringify({
        tipo: anterior?.tipo
          ?? (tipoDaSessao === "BASELINE" ? "INDIVIDUAL_DE_SESSAO" : "PRE_TREINO_POS"),
        destinatario: anterior?.destinatario ?? "PROFISSIONAL",
        titulo: tituloHumanoDoRelatorio(
          contexto.participante,
          contexto.organizacao
        ),
        objetivo: String(consolidacao.contexto_e_objetivo),
        contexto: {
          ...contextoAnterior,
          identificador_interno_da_sessao: contexto.sessao.identificador,
          nome_da_sessao: contexto.sessao.nome_operacional,
          finalidade: contexto.sessao.finalidade,
          tipo_de_sessao: contexto.sessao.tipo_de_sessao
        },
        qualidade_dos_dados: Object.keys(qualidadeAnterior).length
          ? qualidadeAnterior
          : {
              origem: "Evidências canônicas preservadas da sessão.",
              limite: "Ausências permanecem ausências."
            },
        interpretacao_profissional: String(
          consolidacao.interpretacao_profissional
        ),
        limites: [String(consolidacao.limitacoes)],
        proximos_passos: [String(consolidacao.proximo_passo_regulatorio)],
        consolidacao_profissional: consolidacao,
        ...(anterior?.identificador_da_serie ? {
          identificador_da_serie: anterior.identificador_da_serie,
          justificativa_da_revisao: (
            "Consolidação profissional append-only da sessão preservada."
          )
        } : {})
      })
    },
    String(contexto.organizacao.identificador)
  );
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
      chave_de_idempotencia?: string;
      justificativa?: string;
      categoria?: string;
      texto?: string;
      payload?: Registro;
      client_id?: string;
      client_secret?: string;
    };
    const selecao = {
      identificador_da_organizacao: corpo.identificador_da_organizacao,
      identificador_do_participante: corpo.identificador_do_participante,
      identificador_da_sessao: corpo.identificador_da_sessao
    };
    const exigeEstadoCompleto = [
      "comparar",
      "replay",
      "exportar-replay",
      "consolidar-longitudinal",
      "materializar-entregas",
      "relatorio",
      "consolidar-relatorio",
      "transicionar-relatorio"
    ].includes(String(corpo.acao ?? ""));
    const contexto = await estado(token, selecao, {
      carregamentoInicial: !exigeEstadoCompleto,
      prepararComando: !exigeEstadoCompleto
    });
    const organizacaoId = String(contexto.organizacao.identificador);
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
        throw new ErroDaRota(
          "O registro profissional exige uma fase ativa.",
          409,
          "REGISTRO_SEM_FASE_ATIVA"
        );
      }
      if (!categoriasPermitidas.has(categoria) || !texto || texto.length > 500) {
        throw new ErroDaRota(
          "Informe um tipo permitido e um registro com até 500 caracteres.",
          400,
          "REGISTRO_PROFISSIONAL_INVALIDO"
        );
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
    } else if (corpo.acao === "evidencia-profissional") {
      await consultar(
        `/api/v1/sessoes/${encodeURIComponent(String(contexto.sessao.identificador))}/evidencias-profissionais`,
        token,
        { method: "POST", body: JSON.stringify(registro(corpo.payload)) },
        organizacaoId
      );
    } else if (corpo.acao === "validar-claim-tirh-v1") {
      await consultar(
        `/api/v1/sessoes/${encodeURIComponent(String(contexto.sessao.identificador))}/tirh-v1/validacoes`,
        token,
        { method: "POST", body: JSON.stringify(registro(corpo.payload)) },
        organizacaoId
      );
    } else if (
      corpo.acao === "acao-operacional"
      || corpo.acao === "acao-principal"
    ) {
      // A ação que o profissional confirmou precisa atravessar o contrato
      // HTTP. Derivá-la novamente de outra leitura do polling permite que
      // uma revisão anterior repita PREPARAR_SESSAO e neutralize um
      // INICIAR_PRE já visível. O núcleo continua sendo a autoridade que
      // valida a ação explícita sob lock e idempotência.
      const comando = normalizarComandoOperacional(corpo.comando);
      if (!comando) {
        throw new ErroDaRota(
          "O comando operacional confirmado não foi informado.",
          400,
          "COMANDO_OPERACIONAL_NAO_INFORMADO"
        );
      }
      const estadoCanonico = registro(contexto.estado_operacional);
      const chaveFornecida = String(corpo.chave_de_idempotencia ?? "").trim();
      const chaveDeIdempotencia = chaveFornecida || createHash("sha256")
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
        },
        organizacaoId
      );
    } else if (corpo.acao === "comparar") {
      if (!contexto.execucao) {
        throw new ErroDaRota(
          "A execução da sessão não foi localizada.",
          409,
          "EXECUCAO_NAO_LOCALIZADA"
        );
      }
      if (!contexto.ciclo?.comparacao) {
        await consultar(`/api/v1/execucoes-thx/${encodeURIComponent(String(contexto.execucao.identificador))}/ciclo/comparar`, token, { method: "POST", body: JSON.stringify({}) });
      }
    } else if (corpo.acao === "replay") {
      await consultar(`/api/v1/sessoes/${encodeURIComponent(String(contexto.sessao.identificador))}/linha-temporal`, token, { method: "POST", body: JSON.stringify({}) }, organizacaoId);
    } else if (corpo.acao === "consolidar-longitudinal") {
      await consultar(`/api/v1/participantes/${encodeURIComponent(String(contexto.participante.identificador))}/longitudinal/consolidar`, token, { method: "POST", body: JSON.stringify({}) }, organizacaoId);
    } else if (corpo.acao === "materializar-entregas") {
      await consultar(`/api/v1/sessoes/${encodeURIComponent(String(contexto.sessao.identificador))}/artefatos-finais/materializar`, token, { method: "POST", body: JSON.stringify({}) }, organizacaoId);
    } else if (corpo.acao === "exportar-replay") {
      const linha = contexto.linhas.at(-1);
      if (!linha?.inicio || !linha?.fim) {
        throw new ErroDaRota(
          "Não há intervalo temporal válido para exportar.",
          409,
          "INTERVALO_TEMPORAL_INDISPONIVEL"
        );
      }
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
    } else if (corpo.acao === "consolidar-relatorio") {
      await consolidarRelatorio(token, contexto, corpo.payload);
    } else if (corpo.acao === "transicionar-relatorio") {
      const payload = registro(corpo.payload);
      const relatorio = contexto.relatorios.find(
        (item) => String(item.identificador) === String(payload.identificador)
      );
      const destino = String(payload.estado ?? "").toUpperCase();
      const justificativa = String(payload.justificativa ?? "").trim();
      if (
        !relatorio
        || !["AGUARDANDO_VALIDACAO", "CONCLUIDO"].includes(destino)
        || justificativa.length < 8
      ) {
        throw new ErroDaRota(
          "A transição exige o relatório atual, destino permitido e justificativa profissional.",
          400,
          "TRANSICAO_DOCUMENTAL_INVALIDA"
        );
      }
      await consultar(
        `/api/v1/relatorios/${encodeURIComponent(String(relatorio.identificador))}/transicoes`,
        token,
        {
          method: "POST",
          body: JSON.stringify({ estado: destino, justificativa })
        },
        organizacaoId
      );
    } else {
      throw new ErroDaRota(
        "A ação solicitada não está disponível neste estado da sessão.",
        400,
        "ACAO_OPERACIONAL_INVALIDA"
      );
    }
    return NextResponse.json(
      await estado(token, selecao, { carregamentoInicial: true }),
      { headers: { "cache-control": "private, no-store" } }
    );
  } catch (erro) {
    return responderErroDaApi(erro, {
      modulo: "COCKPIT_VIVO",
      rota: "COMANDO_OPERACIONAL",
      mensagemDeAcessoNegado: "A ação exige um profissional autorizado para esta sessão."
    });
  }
}
