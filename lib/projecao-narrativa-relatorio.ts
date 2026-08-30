type Registro = Record<string, unknown>;

export const MENSAGEM_UNICA_DE_INDISPONIBILIDADE =
  "Este aspecto ainda não possui consolidação profissional suficiente para integrar o resultado.";

export const LINGUAGEM_DE_PREVISIBILIDADE_CONDICIONAL =
  "Diante de demanda comparável, os registros indicam uma tendência contextual de organização regulatória, os recursos disponíveis e as condições em que uma resposta adaptativa foi ou não mobilizada. Esta leitura não prevê comportamento específico nem resultado futuro.";

export const MENSAGEM_DE_CONFIABILIDADE_PENDENTE =
  "AGUARDANDO CONSOLIDAÇÃO PROFISSIONAL DA CONFIABILIDADE OPERACIONAL.";

const MARCADORES_DE_AUSENCIA = new Set([
  "Não determinável com as evidências disponíveis nesta sessão.",
  "Não materializada nesta sessão.",
  "Validação profissional específica não registrada nesta emissão."
]);

const LINGUAGEM_TECNICA_INTERNA = /\b(?:fixture|pipeline|contrato\s+(?:legado|cient[ií]fico)|legacy_historico|vers[aã]o\s+de\s+schema|migra[cç][aã]o|proveni[eê]ncia\s+computacional|dado\s+sint[eé]tico|sem\s+pessoa\s+real|cobertura\s+t[eé]cnica|confian[cç]a\s+computacional|m[ií]nimo\s+autoral\s+migrado)\b/i;

function objeto(valor: unknown): Registro {
  if (valor && typeof valor === "object" && !Array.isArray(valor)) {
    return valor as Registro;
  }
  if (typeof valor !== "string" || !valor.trim()) return {};
  try {
    const convertido = JSON.parse(valor);
    return convertido && typeof convertido === "object" && !Array.isArray(convertido)
      ? convertido as Registro
      : {};
  } catch {
    return {};
  }
}

function lista(valor: unknown): unknown[] {
  if (Array.isArray(valor)) return valor;
  if (typeof valor !== "string" || !valor.trim()) return [];
  try {
    const convertido = JSON.parse(valor);
    return Array.isArray(convertido) ? convertido : [];
  } catch {
    return [];
  }
}

export function textoNarrativo(valor: unknown): string {
  if (valor == null) return "";
  if (Array.isArray(valor)) {
    return valor.map(textoNarrativo).filter(Boolean).join(" · ");
  }
  if (typeof valor === "object") {
    const registro = valor as Registro;
    return textoNarrativo(
      registro.descricao
      ?? registro.resposta
      ?? registro.resultado
      ?? registro.texto
      ?? registro.valor
      ?? registro.estado
      ?? registro.nome
      ?? registro.rotulo
    );
  }
  const convertido = String(valor).trim();
  if (!convertido) return "";
  if (/^[\[{]/.test(convertido)) {
    try {
      return textoNarrativo(JSON.parse(convertido));
    } catch {
      return "";
    }
  }
  return MARCADORES_DE_AUSENCIA.has(convertido) ? "" : convertido;
}

function chaveNarrativa(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/^(?:como chegou|como saiu|objetivo|resposta observada|interven[cç][aã]o|recomenda[cç][aã]o|pr[oó]ximo passo)\s*[:—-]\s*/i, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function limparParaCliente(valor: unknown) {
  const convertido = textoNarrativo(valor)
    .replace(/\b[A-Z0-9_-]*FIXTURE[A-Z0-9_-]*\b/gi, "")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:])/g, "$1")
    .replace(/^[\s·,.;:—-]+/, "")
    .trim();
  if (!convertido || LINGUAGEM_TECNICA_INTERNA.test(convertido)) return "";
  return convertido;
}

export function valoresNarrativos(...valores: unknown[]): string[] {
  const vistos = new Set<string>();
  const resultado: string[] = [];
  for (const bruto of valores.flatMap((valor) => Array.isArray(valor) ? valor : [valor])) {
    const item = limparParaCliente(bruto);
    const chave = chaveNarrativa(item);
    if (!item || !chave || vistos.has(chave)) continue;
    vistos.add(chave);
    resultado.push(item);
  }
  return resultado;
}

export function itensDeSecoesAutorizadas(
  relatorio: unknown,
  ...codigos: string[]
): string[] {
  const registro = objeto(relatorio);
  const secoes = lista(registro.secoes ?? registro.secoes_json).map(objeto);
  return valoresNarrativos(...secoes.flatMap((secao) => (
    codigos.includes(String(secao.codigo ?? "")) ? lista(secao.itens) : []
  )));
}

function primeiros(valores: unknown[], limite = 2) {
  return valoresNarrativos(...valores).slice(0, limite);
}

export type EtapaNarrativa = {
  codigo: string;
  rotulo: string;
  itens: string[];
};

export type EntradaDaMicrotrajetoria = {
  relatorio: unknown;
  consolidacao: unknown;
  execucao: unknown;
  treinamento?: unknown;
  indicadores?: unknown[];
};

export type MicrotrajetoriaRegulatoria = {
  etapas: EtapaNarrativa[];
  mapaPreventivo: EtapaNarrativa[];
  comoChegou: EtapaNarrativa[];
  oQueMudou: EtapaNarrativa[];
  comoSaiu: EtapaNarrativa[];
  sinaisPrecursores: string[];
  limiteRegulatorio: string[];
  efeitoDoTreinamento: string[];
  confiabilidadeOperacional: string[];
  leituraPreventiva: string[];
  estadosDaMudanca: EtapaNarrativa[];
  conclusaoProfissional: string;
  classificacaoProfissional: string;
  devolutiva: string;
  leituraPratica: LeituraPraticaDaSessao;
};

export type LeituraPraticaDaSessao = {
  resultados: string[];
  comoChegou: string[];
  pontosFortes: string[];
  pontosDeAtencao: string[];
  respostaAoTreinamento: string[];
  significadoPratico: string[];
  desenvolvimento: string[];
  recomendacoes: string[];
  devolutivaAoParticipante: string[];
  limitesDaLeitura: string[];
};

function comIntroducao(introducao: string, valores: unknown[], limite = 2) {
  return primeiros(valores, limite).map((item) => `${introducao}: ${item}`);
}

function porCodigo(etapas: EtapaNarrativa[], ...codigos: string[]) {
  return etapas.filter((etapa) => codigos.includes(etapa.codigo));
}

export function projetarMicrotrajetoriaRegulatoria({
  relatorio,
  consolidacao: consolidacaoBruta,
  execucao: execucaoBruta,
  treinamento,
  indicadores = []
}: EntradaDaMicrotrajetoria): MicrotrajetoriaRegulatoria {
  const consolidacao = objeto(consolidacaoBruta);
  const execucao = objeto(execucaoBruta);
  const observacoes = objeto(consolidacao.observacoes_por_fase);
  const rotasRegistradas = itensDeSecoesAutorizadas(
    relatorio,
    "ROTAS_REGULATORIAS_HUMANAS"
  );
  const classificacao = textoNarrativo(
    consolidacao.classificacao_do_resultado
    ?? consolidacao.resultado_do_objetivo
  );
  const objetivo = primeiros([
    execucao.objetivo,
    objeto(relatorio).objetivo,
    ...itensDeSecoesAutorizadas(relatorio, "FINALIDADE_DO_TREINAMENTO")
  ], 1);
  const chegada = primeiros([
    ...itensDeSecoesAutorizadas(
      relatorio,
      "CONTEXTO_OPERACIONAL_HUMANO",
      "CONDICAO_REGULATORIA_OBSERVADA"
    ),
    consolidacao.contexto_e_objetivo
  ], 1);
  const gatilho = primeiros(itensDeSecoesAutorizadas(
    relatorio,
    "GATILHOS_E_CONTEXTO_DOCUMENTADOS"
  ), 2);
  const rota = primeiros(itensDeSecoesAutorizadas(relatorio, "ROTA_DOMINANTE"), 2);
  const ganhoCusto = primeiros([
    ...itensDeSecoesAutorizadas(relatorio, "CUSTO_REGULATORIO"),
    ...rotasRegistradas.filter((item) => /ganho|custo/i.test(item))
  ], 2);
  const respostaAlternativa = primeiros([
    ...itensDeSecoesAutorizadas(relatorio, "AQUISICAO_E_CONSOLIDACAO"),
    ...rotasRegistradas.filter((item) => /adaptativ|alternativ/i.test(item))
  ], 2);
  const respostaPorFase = valoresNarrativos(
    textoNarrativo(observacoes.PRE) ? `PRÉ — ${textoNarrativo(observacoes.PRE)}` : "",
    textoNarrativo(observacoes.TREINO) ? `TREINO — ${textoNarrativo(observacoes.TREINO)}` : "",
    textoNarrativo(observacoes.POS ?? observacoes["PÓS"])
      ? `PÓS — ${textoNarrativo(observacoes.POS ?? observacoes["PÓS"])}`
      : ""
  );
  const resposta = primeiros([
    consolidacao.resposta_observada,
    execucao.resposta_observada_json,
    ...itensDeSecoesAutorizadas(relatorio, "RESPOSTA_AO_TREINAMENTO")
  ], 2);
  const mudanca = primeiros([
    consolidacao.mudanca_de_rota_observada,
    consolidacao.interpretacao_profissional,
    consolidacao.recursos_regulatorios_observados,
    ...itensDeSecoesAutorizadas(relatorio, "MUDANCA_DE_ROTA")
  ], 2);
  const desenvolvimentoRegistrado = primeiros([
    consolidacao.o_que_ainda_precisa_ser_desenvolvido,
    consolidacao.o_que_ainda_nao_se_consolidou,
    consolidacao.what_is_not_consolidated,
    consolidacao.nao_consolidado,
    ...itensDeSecoesAutorizadas(relatorio, "NAO_CONSOLIDADO")
  ], 2);
  const naoConsolidado = primeiros([
    ...desenvolvimentoRegistrado,
    consolidacao.pontos_de_atencao,
    consolidacao.limitacoes
  ], 2);
  const proximoPasso = primeiros([
    consolidacao.recomendacao,
    consolidacao.proximo_passo_regulatorio,
    ...itensDeSecoesAutorizadas(relatorio, "PROXIMO_CICLO")
  ], 1);
  const conclusaoProfissional = limparParaCliente(consolidacao.conclusao);
  const interpretacaoProfissional = primeiros([
    consolidacao.interpretacao_profissional
  ], 1);
  const recursosObservados = primeiros([
    consolidacao.recursos_regulatorios_observados,
    ...itensDeSecoesAutorizadas(relatorio, "RECURSOS_REGULATORIOS_OBSERVADOS")
  ], 3);
  const recomendacoesRegistradas = primeiros([
    consolidacao.recomendacao,
    consolidacao.proximo_passo_regulatorio,
    ...itensDeSecoesAutorizadas(relatorio, "PROXIMO_CICLO")
  ], 2);
  const devolutivaAoParticipante = primeiros([
    consolidacao.conteudo_da_devolutiva_ao_participante
  ], 1);
  const limitacoesRegistradas = primeiros([
    consolidacao.limitacoes
  ], 2);
  const resultadoRegistrado = primeiros([
    conclusaoProfissional,
    classificacao
  ], 2);
  const capacidadesRegistradas = recursosObservados.length
    ? recursosObservados
    : respostaAlternativa;

  const etapas: EtapaNarrativa[] = [
    { codigo: "OBJETIVO_DA_SESSAO", rotulo: "Objetivo da sessão ou treinamento", itens: objetivo },
    { codigo: "COMO_CHEGOU", rotulo: "Como chegou", itens: chegada },
    { codigo: "DEMANDA_GATILHO", rotulo: "Demanda ou gatilho registrado", itens: gatilho },
    { codigo: "ROTA_PREDOMINANTE", rotulo: "Rota predominante registrada", itens: rota },
    { codigo: "GANHO_CUSTO", rotulo: "Ganho ou custo registrado", itens: ganhoCusto },
    { codigo: "RESPOSTA_ALTERNATIVA", rotulo: "Resposta alternativa trabalhada", itens: respostaAlternativa },
    { codigo: "THX_INTERVENCAO", rotulo: "THX ou intervenção", itens: primeiros([treinamento, consolidacao.intervencao, ...itensDeSecoesAutorizadas(relatorio, "CTR_THX_THX_AER")], 2) },
    { codigo: "PRE_TREINO_POS", rotulo: "Resposta PRÉ / TREINO / PÓS", itens: respostaPorFase },
    { codigo: "INDICADORES_DA_LEITURA", rotulo: "Indicadores que sustentam a leitura", itens: primeiros(indicadores, 4) },
    { codigo: "COMO_SAIU", rotulo: "Como saiu", itens: resposta },
    { codigo: "MUDANCA_OBSERVADA", rotulo: "Mudança observada", itens: mudanca },
    { codigo: "NAO_CONSOLIDADO", rotulo: "O que ainda não se consolidou", itens: naoConsolidado },
    { codigo: "PROXIMO_PASSO", rotulo: "Próximo passo profissional", itens: proximoPasso }
  ].filter((etapa) => etapa.itens.length);

  const sinaisPrecursores = primeiros([
    consolidacao.sinais_precursores,
    consolidacao.sinais_de_alerta,
    ...itensDeSecoesAutorizadas(relatorio, "SINAIS_PRECURSORES")
  ], 3);
  const limiteRegulatorio = primeiros([
    consolidacao.limite_regulatorio_observado,
    ...itensDeSecoesAutorizadas(relatorio, "LIMITE_REGULATORIO_OBSERVADO")
  ], 3);
  const efeitoDoTreinamento = primeiros([
    ...resposta,
    ...mudanca,
    consolidacao.recuperacao_observada
  ], 4);
  const confiabilidadeOperacional = primeiros([
    consolidacao.confiabilidade_operacional,
    consolidacao.implicacao_para_confiabilidade_operacional,
    ...itensDeSecoesAutorizadas(relatorio, "CONFIABILIDADE_OPERACIONAL_HUMANA")
  ], 4);
  const leituraPreventiva = primeiros([
    consolidacao.leitura_preventiva,
    consolidacao.intervencao_preventiva_indicada,
    consolidacao.condicao_para_interrupcao,
    consolidacao.condicao_para_progressao,
    ...itensDeSecoesAutorizadas(relatorio, "LEITURA_PREVENTIVA_PROFISSIONAL")
  ], 5);
  const leituraPratica: LeituraPraticaDaSessao = {
    resultados: comIntroducao(
      "Os resultados mostram",
      resultadoRegistrado.length ? resultadoRegistrado : resposta,
      2
    ),
    comoChegou: comIntroducao(
      "Durante a condição observada",
      [...chegada, ...gatilho],
      2
    ),
    pontosFortes: comIntroducao(
      "Capacidades e recursos observados",
      capacidadesRegistradas,
      3
    ),
    pontosDeAtencao: comIntroducao(
      "Pontos de atenção registrados",
      [
        consolidacao.pontos_de_atencao,
        ...sinaisPrecursores,
        ...limiteRegulatorio
      ],
      3
    ),
    respostaAoTreinamento: valoresNarrativos(
      ...objetivo.map((item) => `Objetivo registrado: ${item}`),
      ...primeiros([
        treinamento,
        consolidacao.intervencao,
        ...itensDeSecoesAutorizadas(relatorio, "CTR_THX_THX_AER")
      ], 2).map((item) => `Intervenção realizada: ${item}`),
      ...resposta.map((item) => `Resposta observada: ${item}`),
      ...respostaPorFase
    ).slice(0, 8),
    significadoPratico: comIntroducao(
      "Na prática, a leitura profissional indica",
      [...interpretacaoProfissional, ...confiabilidadeOperacional],
      2
    ),
    desenvolvimento: comIntroducao(
      "O que ainda precisa ser desenvolvido ou confirmado",
      desenvolvimentoRegistrado,
      2
    ),
    recomendacoes: comIntroducao(
      "O próximo passo recomendado é",
      [...recomendacoesRegistradas, ...leituraPreventiva],
      3
    ),
    devolutivaAoParticipante,
    limitesDaLeitura: valoresNarrativos(
      ...limitacoesRegistradas,
      LINGUAGEM_DE_PREVISIBILIDADE_CONDICIONAL
    )
  };
  const estadosDaMudanca: EtapaNarrativa[] = [
    { codigo: "RESPOSTA_AGUDA", rotulo: "Resposta aguda", itens: resposta },
    { codigo: "AQUISICAO", rotulo: "Aquisição", itens: primeiros([consolidacao.aquisicao, ...itensDeSecoesAutorizadas(relatorio, "AQUISICAO")], 2) },
    { codigo: "CONSOLIDACAO", rotulo: "Consolidação", itens: primeiros([consolidacao.consolidacao, ...itensDeSecoesAutorizadas(relatorio, "CONSOLIDACAO")], 2) },
    { codigo: "TRANSFERENCIA", rotulo: "Transferência", itens: primeiros([consolidacao.transferencia, ...itensDeSecoesAutorizadas(relatorio, "TRANSFERENCIA")], 2) },
    { codigo: "MANUTENCAO", rotulo: "Manutenção", itens: primeiros([consolidacao.manutencao, ...itensDeSecoesAutorizadas(relatorio, "MANUTENCAO")], 2) }
  ];

  return {
    etapas,
    mapaPreventivo: porCodigo(etapas, "DEMANDA_GATILHO", "ROTA_PREDOMINANTE", "GANHO_CUSTO", "RESPOSTA_ALTERNATIVA", "COMO_SAIU", "PROXIMO_PASSO"),
    comoChegou: porCodigo(etapas, "COMO_CHEGOU", "DEMANDA_GATILHO", "ROTA_PREDOMINANTE"),
    oQueMudou: porCodigo(etapas, "THX_INTERVENCAO", "PRE_TREINO_POS", "MUDANCA_OBSERVADA", "INDICADORES_DA_LEITURA"),
    comoSaiu: porCodigo(etapas, "COMO_SAIU", "NAO_CONSOLIDADO", "PROXIMO_PASSO"),
    sinaisPrecursores,
    limiteRegulatorio,
    efeitoDoTreinamento,
    confiabilidadeOperacional,
    leituraPreventiva,
    estadosDaMudanca,
    conclusaoProfissional,
    classificacaoProfissional: limparParaCliente(classificacao),
    devolutiva: limparParaCliente(
      consolidacao.conteudo_da_devolutiva_ao_participante
    ),
    leituraPratica
  };
}

function resumoDeRegistro(valor: unknown): string {
  const registro = objeto(valor);
  return textoNarrativo(
    registro.descricao
    ?? registro.resumo
    ?? registro.movimento
    ?? registro.classificacao
    ?? registro.estado
    ?? registro.resultado
  );
}

function itensDeRegistros(valor: unknown): string[] {
  return valoresNarrativos(...lista(valor).map(resumoDeRegistro));
}

export function projetarMacrotrajetoriaRegulatoria(longitudinalBruto: unknown): EtapaNarrativa[] {
  const longitudinal = objeto(longitudinalBruto);
  const atual = objeto(longitudinal.atual ?? longitudinal.projecao_atual ?? longitudinal);
  const sinais = objeto(atual.sinais_longitudinais);
  const fontes = objeto(longitudinal.fontes_atuais);
  const linha = lista(atual.linha_do_tempo ?? longitudinal.linha_do_tempo).map(objeto);
  const comparabilidade = objeto(atual.comparabilidade ?? longitudinal.comparabilidade);
  const comparavel = comparabilidade.comparavel === true
    || atual.sessoes_comparaveis === true
    || longitudinal.sessoes_comparaveis === true;
  const primeiro = linha.at(0);
  const ultimo = linha.at(-1);

  if (linha.length > 1 && !comparavel) {
    return [{
      codigo: "COMPARABILIDADE_LONGITUDINAL",
      rotulo: "Comparabilidade longitudinal",
      itens: ["Os registros disponíveis não declaram comparabilidade metodológica suficiente. Não é apresentada evolução entre sessões."]
    }];
  }

  return [
    {
      codigo: "FUNCIONAMENTO_INICIAL",
      rotulo: "Funcionamento inicial",
      itens: valoresNarrativos(resumoDeRegistro(primeiro), ...itensDeRegistros(fontes.linhas_de_referencia))
    },
    {
      codigo: "GATILHOS_ROTAS_RECORRENTES",
      rotulo: "Gatilhos e rotas recorrentes",
      itens: valoresNarrativos(...itensDeRegistros(fontes.arr), sinais.recorrencia)
        .filter((item) => item !== "NAO_DETERMINADA")
    },
    {
      codigo: "TREINAMENTOS_REALIZADOS",
      rotulo: "Treinamentos realizados",
      itens: valoresNarrativos(...itensDeRegistros(fontes.execucoes_thx), ...itensDeRegistros(fontes.recomendacoes_thx))
    },
    {
      codigo: "OSCILACOES_RETORNOS",
      rotulo: "Oscilações, recuperações e retornos",
      itens: valoresNarrativos(sinais.oscilacao, sinais.recorrencia, sinais.regressao, sinais.recuperacao)
        .filter((item) => !item.startsWith("NAO_DETERMINADA"))
    },
    { codigo: "RESPOSTA_AGUDA", rotulo: "Resposta aguda", itens: valoresNarrativos(sinais.resposta_aguda) },
    { codigo: "AQUISICAO", rotulo: "Aquisição", itens: valoresNarrativos(...itensDeRegistros(fontes.nra), sinais.aquisicao) },
    { codigo: "CONSOLIDACAO", rotulo: "Consolidação", itens: valoresNarrativos(sinais.sustentacao, sinais.consolidacao) },
    { codigo: "TRANSFERENCIA", rotulo: "Transferência", itens: valoresNarrativos(sinais.transferencia) },
    { codigo: "MANUTENCAO", rotulo: "Manutenção", itens: valoresNarrativos(sinais.manutencao) },
    {
      codigo: "ESTADO_ATUAL",
      rotulo: "Estado atual",
      itens: valoresNarrativos(resumoDeRegistro(ultimo), longitudinal.estado_da_evidencia, atual.estado_da_evidencia)
    }
  ].filter((etapa) => etapa.itens.length);
}
