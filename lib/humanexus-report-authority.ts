export type RegistroDeRelatorio = Record<string, unknown>;

export const CAMPOS_PROFISSIONAIS_DO_RELATORIO = [
  ["contexto_e_objetivo", "Contexto e objetivo"],
  ["evidencias_utilizadas", "Evidências efetivamente utilizadas"],
  ["observacoes_por_fase", "Observações por fase"],
  ["intervencao", "Intervenção realizada"],
  ["resposta_observada", "Resposta observada"],
  ["interpretacao_profissional", "Interpretação profissional"],
  ["recursos_regulatorios_observados", "Recursos regulatórios observados"],
  ["pontos_de_atencao", "Pontos de atenção"],
  ["limitacoes", "Limitações"],
  ["conclusao", "Conclusão profissional"],
  ["justificativa", "Justificativa da conclusão"],
  ["recomendacao", "Recomendação"],
  ["proximo_passo_regulatorio", "Próximo passo regulatório"],
  ["conteudo_da_devolutiva_ao_participante", "Conteúdo da devolutiva ao participante"]
] as const;

export type CampoProfissional = typeof CAMPOS_PROFISSIONAIS_DO_RELATORIO[number][0];

function objeto(valor: unknown): RegistroDeRelatorio {
  if (valor && typeof valor === "object" && !Array.isArray(valor)) {
    return valor as RegistroDeRelatorio;
  }
  if (typeof valor !== "string" || !valor) return {};
  try {
    const convertido = JSON.parse(valor);
    return convertido && typeof convertido === "object" && !Array.isArray(convertido)
      ? convertido as RegistroDeRelatorio
      : {};
  } catch {
    return {};
  }
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

function possuiConteudo(valor: unknown): boolean {
  if (typeof valor === "string") return Boolean(valor.trim());
  if (Array.isArray(valor)) return valor.some(possuiConteudo);
  if (valor && typeof valor === "object") {
    return Object.values(valor as RegistroDeRelatorio).some(possuiConteudo);
  }
  return valor != null;
}

export function formatarCpfDocumental(valor: unknown): string | null {
  const digitos = String(valor ?? "").replace(/\D/g, "");
  if (digitos.length !== 11) return null;
  return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-${digitos.slice(9)}`;
}

export function resolverIdentidadeDocumental(
  participante: RegistroDeRelatorio,
  organizacao: RegistroDeRelatorio
) {
  const participanteId = String(participante.identificador ?? "").trim();
  const organizacaoDoParticipante = String(
    participante.identificador_da_organizacao ?? ""
  ).trim();
  const organizacaoSelecionada = String(
    organizacao.identificador ?? organizacao.id ?? ""
  ).trim();
  if (
    organizacaoDoParticipante
    && organizacaoSelecionada
    && organizacaoDoParticipante !== organizacaoSelecionada
  ) {
    throw new Error("IDENTIDADE_INDIVIDUAL_FORA_DO_ESCOPO_ORGANIZACIONAL");
  }

  const autoridade = objeto(
    participante.identidade_individual_autoritativa
  );
  const participanteDaAutoridade = String(
    autoridade.identificador_do_participante ?? ""
  ).trim();
  const organizacaoDaAutoridade = String(
    autoridade.identificador_da_organizacao ?? ""
  ).trim();
  if (
    autoridade.escopo_validado === false
    || (participanteDaAutoridade && participanteDaAutoridade !== participanteId)
    || (
      organizacaoDaAutoridade
      && organizacaoDoParticipante
      && organizacaoDaAutoridade !== organizacaoDoParticipante
    )
    || (
      organizacaoDaAutoridade
      && organizacaoSelecionada
      && organizacaoDaAutoridade !== organizacaoSelecionada
    )
  ) {
    throw new Error("IDENTIDADE_INDIVIDUAL_AUTORITATIVA_DIVERGENTE");
  }

  const perfil = objeto(participante.perfil_operacional);
  const cadastrais = objeto(perfil.dados_cadastrais);
  const minimizados = objeto(perfil.dados_minimizados);
  const documentos = lista(perfil.documentos).map(objeto);
  const nomeCompleto = String(
    autoridade.nome_completo
    ?? cadastrais.nome_completo
    ?? cadastrais.nome_civil_completo
    ?? ""
  ).trim();
  const documentoCpf = documentos.find(
    (item) => String(item.tipo ?? "").toUpperCase() === "CPF"
  );
  const cpf = formatarCpfDocumental(
    autoridade.cpf
    ?? cadastrais.cpf
    ?? cadastrais.documento_cpf
    ?? cadastrais.numero_do_cpf
    ?? documentoCpf?.numero
  );
  const referenciaOperacional = String(
    autoridade.referencia_operacional
    ?? minimizados.referencia_operacional
    ?? ""
  ).trim();
  return {
    nomeCompleto: nomeCompleto || "NOME CIVIL NÃO INFORMADO NO CADASTRO",
    cpf: cpf || "CPF NÃO INFORMADO NO CADASTRO",
    referenciaOperacional:
      referenciaOperacional || "REFERÊNCIA OPERACIONAL NÃO INFORMADA NO CADASTRO",
    organizacao: String(organizacao.nome ?? "ORGANIZAÇÃO NÃO INFORMADA"),
    fonte: String(
      autoridade.fonte
      ?? "PERFIL_CADASTRAL_DO_PARTICIPANTE_NO_ESCOPO"
    ),
    completa: Boolean(nomeCompleto && cpf),
    escopoValidado: true,
    origemDoNome: "PARTICIPANT_ONLY",
    origemDoCpf: "PARTICIPANT_ONLY",
    origemDaReferencia: "REFERENCE_ONLY"
  };
}

export function consolidacaoDoRelatorio(relatorio: RegistroDeRelatorio) {
  const contexto = objeto(relatorio.contexto ?? relatorio.contexto_json);
  return objeto(
    relatorio.consolidacao_profissional
    ?? contexto.consolidacao_profissional
  );
}

export function projetarEstadoFuncionalDoRelatorio(
  relatorio: RegistroDeRelatorio | undefined
) {
  if (!relatorio) {
    return {
      estado: "RASCUNHO_TECNICO",
      consolidacao: {} as RegistroDeRelatorio,
      camposAusentes: CAMPOS_PROFISSIONAIS_DO_RELATORIO.map(([campo]) => campo),
      rotulosAusentes: CAMPOS_PROFISSIONAIS_DO_RELATORIO.map(([, rotulo]) => rotulo),
      completa: false,
      finalDisponivel: false
    };
  }
  const consolidacao = consolidacaoDoRelatorio(relatorio);
  const camposAusentes = CAMPOS_PROFISSIONAIS_DO_RELATORIO
    .filter(([campo]) => !possuiConteudo(consolidacao[campo]))
    .map(([campo]) => campo);
  const rotulosAusentes = CAMPOS_PROFISSIONAIS_DO_RELATORIO
    .filter(([campo]) => camposAusentes.includes(campo))
    .map(([, rotulo]) => rotulo);
  const completa = camposAusentes.length === 0;
  const estadoDocumental = String(relatorio.estado_documental ?? "RASCUNHO").toUpperCase();
  const estadoDoCore = String(relatorio.estado_funcional ?? "").toUpperCase();
  const estado = estadoDoCore || (
    completa && ["CONCLUIDO", "LIBERADO", "SUBSTITUIDO", "RETIFICADO"].includes(estadoDocumental)
      ? "RELATORIO_FINAL_VALIDADO"
      : completa
        ? "PRONTO_PARA_VALIDACAO"
        : Object.keys(consolidacao).length || relatorio.identificador
          ? "AGUARDANDO_CONSOLIDACAO_PROFISSIONAL"
          : "RASCUNHO_TECNICO"
  );
  return {
    estado,
    consolidacao,
    camposAusentes,
    rotulosAusentes,
    completa,
    finalDisponivel: estado === "RELATORIO_FINAL_VALIDADO"
  };
}

export function tituloHumanoDoRelatorio(
  participante: RegistroDeRelatorio,
  organizacao: RegistroDeRelatorio
) {
  return `Relatório Operacional TIRH — ${resolverIdentidadeDocumental(
    participante,
    organizacao
  ).nomeCompleto}`;
}

export const MAPA_DE_FONTES_DO_RELATORIO = {
  identidade: "perfil_operacional + organização selecionada",
  sessao: "sessão e detalhes operacionais preservados",
  fases: "ciclo PRÉ / TREINO / PÓS e evidências por fase",
  vetores: "projeção canônica TIRH V1",
  resultante_iirh_zona: "síntese operacional TIRH V1",
  rotas: "cadeia científica ARR / RRD / GRI / CRL / NRA",
  consolidacao: "versão autoral append-only do relatório",
  validacao: "claims e decisões profissionais preservadas",
  longitudinal: "histórico comparável autorizado"
} as const;
