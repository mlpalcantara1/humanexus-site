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
  const participante = participantes.find(
    (item) => item.identificador === selecao.identificador_do_participante
  ) ?? encontrar(participantes, "PARTICIPANTE FICTÍCIO") ?? participantes[0];
  if (!participante) throw new Error("Nenhum participante autorizado está disponível para o contexto.");
  const participanteId = String(participante.identificador);
  const sessoes = await consultar<Registro[]>(`/api/v1/participantes/${encodeURIComponent(participanteId)}/sessoes`, token);
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
    gravacao
  ] = await Promise.all([
    consultar<Registro[]>(`/api/v1/sessoes/${encodeURIComponent(sessaoId)}/fases`, token),
    consultar<Registro[]>("/api/v1/ctrs", token),
    consultar<Registro>("/api/v1/ctr/catalogo", token),
    consultar<Registro[]>(`/api/v1/participantes/${encodeURIComponent(participanteId)}/execucoes-thx`, token),
    consultar<Registro[]>(`/api/v1/conectores?identificador_da_sessao=${encodeURIComponent(sessaoId)}`, token),
    consultar<Registro[]>("/api/v1/fontes-telemetria", token),
    consultar<Registro[]>(`/api/v1/telemetria/sessoes/${encodeURIComponent(sessaoId)}`, token),
    consultar<Registro[]>(`/api/v1/telemetria/sessoes/${encodeURIComponent(sessaoId)}/eventos`, token),
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
    })
  ]);
  const ctr = ctrs.find((item) => item.identificador_da_sessao === sessao.identificador) ?? null;
  const execucao = execucoes.find((item) => item.identificador_da_sessao === sessao.identificador) ?? null;
  const [usuariosDisponiveis, vinculosOficiais] = await Promise.all([
    consultarSeDisponivel<Registro[]>("/api/v1/usuarios", token, []),
    consultarSeDisponivel<Registro[]>("/api/v1/ctr-thx/vinculos-validados-operacionais", token, [])
  ]);
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
    linhas.length ? consultar<Registro>(`/api/v1/linhas-temporais/${encodeURIComponent(String(linhas.at(-1)?.identificador))}`, token) : null,
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
    participante,
    sessao,
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
      dados_humanos_reais: false,
      iirh_oficial: null,
      zona_oficial: null
    }
  };
}

export async function GET(request: Request) {
  try {
    const { token } = await tokenAtual();
    const url = new URL(request.url);
    return NextResponse.json(await estado(token, {
      identificador_da_organizacao: url.searchParams.get("organizacao") ?? undefined,
      identificador_do_participante: url.searchParams.get("participante") ?? undefined,
      identificador_da_sessao: url.searchParams.get("sessao") ?? undefined
    }));
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

async function preservarSnapshot(token: string, contexto: Contexto, momento: "PRE" | "TREINO" | "POS") {
  const execucao = contexto.execucao;
  const fase = contexto.fases.find((item) => item.fase === momento);
  const momentos = Array.isArray(contexto.ciclo?.momentos) ? contexto.ciclo.momentos as Registro[] : [];
  if (momentos.some((item) => item.momento === momento)) return;
  if (!execucao || !fase) throw new Error("Execução ou fase de homologação indisponível.");
  const fim = new Date();
  const inicio = new Date(fim.getTime() - 60_000);
  await consultar(`/api/v1/execucoes-thx/${encodeURIComponent(String(execucao.identificador))}/ciclo/momentos`, token, {
    method: "POST",
    body: JSON.stringify({
      identificador_da_fase: fase.identificador,
      momento,
      coletado_em: fim.toISOString(),
      inicio_da_janela: inicio.toISOString(),
      fim_da_janela: fim.toISOString(),
      cobertura: null,
      confiabilidade: null,
      identificadores_das_evidencias: [],
      sensores_utilizados: [],
      identificadores_dos_calculos: [],
      contexto: { marcacao: MARCACAO, dados_humanos_reais: false },
      ausencias: [
        "DADOS_HUMANOS_AUSENTES_NESTA_HOMOLOGACAO_OPERACIONAL",
        "SENSORES_NAO_UTILIZADOS",
        "IIRH_ZONA_RESULTANTE_E_TRAJETORIA_NAO_CALCULADOS"
      ]
    })
  });
}

async function assegurarFase(token: string, contexto: Contexto, momento: "PRE" | "TREINO" | "POS") {
  const existente = contexto.fases.find((item) => item.fase === momento);
  if (existente) return existente;
  return consultar<Registro>(`/api/v1/sessoes/${encodeURIComponent(String(contexto.sessao.identificador))}/fases`, token, {
    method: "POST",
    body: JSON.stringify({ fase: momento })
  });
}

function hashPayload(payload: Registro) {
  return createHash("sha256").update(JSON.stringify(payload, Object.keys(payload).sort())).digest("hex");
}

async function gerarTelemetriaTecnica(token: string, contexto: Contexto) {
  const fonte = contexto.fontes[0];
  const segredo = process.env.HXP_HOMOLOGACAO_TELEMETRIA_SEGREDO;
  if (!fonte || !segredo) throw new Error("Fonte ou segredo local de telemetria de homologação indisponível.");
  if (contexto.telemetria.length) return;
  const sessaoId = String(contexto.sessao.identificador);
  const base = Date.now() - 12_000;
  const sequencias = [1, 2, 4, 3, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
  const pacotes = sequencias.map((sequencia, indice) => {
    const payload = { amostra_tecnica: indice + 1, buffer: (indice * 3) % 11, dados_humanos_reais: false };
    return {
      identificador_da_sessao: sessaoId,
      identificador_da_fonte: fonte.identificador,
      tipo: "TECNICO",
      canal: "BRIDGE_TESTE",
      versao: "1.0",
      timestamp_de_origem: new Date(base + indice * 500).toISOString(),
      sequencia,
      unidade: "pacote",
      qualidade: 1,
      integridade: hashPayload(payload),
      payload,
      metadados: { marcacao: MARCACAO }
    };
  });
  await consultar("/api/v1/telemetria/pacotes", token, {
    method: "POST",
    body: JSON.stringify({ identificador_da_fonte: fonte.identificador, segredo_da_fonte: segredo, pacotes })
  });
  await consultar("/api/v1/telemetria/pacotes", token, {
    method: "POST",
    body: JSON.stringify({ identificador_da_fonte: fonte.identificador, segredo_da_fonte: segredo, pacotes: [pacotes[4]] })
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
        fases: "PRE, TREINO e POS"
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
    };
    const selecao = {
      identificador_da_organizacao: corpo.identificador_da_organizacao,
      identificador_do_participante: corpo.identificador_do_participante,
      identificador_da_sessao: corpo.identificador_da_sessao
    };
    const contexto = await estado(token, selecao);
    if (corpo.acao === "iniciar-execucao") {
      if (!contexto.execucao) throw new Error("Execução técnica não localizada.");
      if (contexto.execucao.estado === "AUTORIZADA") {
        await consultar(`/api/v1/execucoes-thx/${encodeURIComponent(String(contexto.execucao.identificador))}/iniciar`, token, { method: "POST", body: JSON.stringify({}) });
      }
    } else if (corpo.acao === "evento") {
      await registrarEvento(token, contexto, { momento: corpo.momento, tipo: "MARCADOR", dados: { tipo: "MARCADOR_PROFISSIONAL" } });
    } else if (corpo.acao === "intervencao") {
      await registrarEvento(token, contexto, { momento: "TREINO", tipo: "MARCADOR", dados: { tipo: "INTERVENCAO_PROFISSIONAL", intervencao: true } });
    } else if (corpo.acao === "fase") {
      const mapa: Record<string, string> = { iniciar: "INICIO", pausar: "PAUSA", retomar: "RETOMADA", encerrar: "ENCERRAMENTO" };
      if (!corpo.momento || !mapa[String(corpo.conector)]) throw new Error("Comando de fase inválido.");
      if (corpo.conector === "iniciar") await assegurarFase(token, contexto, corpo.momento);
      const atualizado = await estado(token, selecao);
      const jaExiste = atualizado.eventos.some((item) => item.momento === corpo.momento && item.tipo === mapa[String(corpo.conector)]);
      if (!jaExiste) await registrarEvento(token, atualizado, { momento: corpo.momento, tipo: mapa[String(corpo.conector)] });
      if (corpo.conector === "encerrar") await preservarSnapshot(token, await estado(token, selecao), corpo.momento);
    } else if (corpo.acao === "concluir-execucao-thx") {
      if (contexto.execucao?.estado !== "INICIADA") throw new Error("Execução THX não está iniciada.");
      await consultar(`/api/v1/execucoes-thx/${encodeURIComponent(String(contexto.execucao.identificador))}/concluir`, token, {
        method: "POST",
        body: JSON.stringify({
          etapas: ["TREINO_OPERACIONAL_CONCLUIDO"],
          resposta_observada: null,
          justificativa: "Conclusão operacional sem dado humano, sem eficácia e sem produto científico."
        })
      });
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
    } else if (corpo.acao === "telemetria") {
      await gerarTelemetriaTecnica(token, contexto);
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
    } else if (corpo.acao === "concluir") {
      const momentos = Array.isArray(contexto.ciclo?.momentos) ? contexto.ciclo.momentos as Registro[] : [];
      if (!["PRE", "TREINO", "POS"].every((momento) => momentos.some((item) => item.momento === momento))) {
        throw new Error("A conclusão exige snapshots preservados de PRÉ, TREINO e PÓS.");
      }
      if (contexto.execucao?.estado !== "CONCLUIDA") {
        throw new Error("A sessão exige conclusão operacional prévia da execução THX.");
      }
      await consultar(`/api/v1/sessoes/${encodeURIComponent(String(contexto.sessao.identificador))}/operacoes`, token, {
        method: "POST",
        body: JSON.stringify({ acao: "ENCERRAR", justificativa: "Homologação operacional concluída sem dados humanos reais." })
      });
    } else if (corpo.acao === "relatorio") {
      await gerarRelatorio(token, contexto);
    } else {
      throw new Error("Ação operacional inválida.");
    }
    return NextResponse.json(await estado(token, selecao));
  } catch (erro) {
    return NextResponse.json({ erro: { mensagem: erro instanceof Error ? erro.message : "Comando operacional recusado." } }, { status: 400 });
  }
}
