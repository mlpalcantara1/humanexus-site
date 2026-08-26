type Registro = Record<string, unknown>;

export const MENSAGEM_UNICA_DE_INDISPONIBILIDADE =
  "Este aspecto ainda não possui consolidação profissional suficiente para integrar o resultado.";

const MARCADORES_DE_AUSENCIA = new Set([
  "Não determinável com as evidências disponíveis nesta sessão.",
  "Não materializada nesta sessão.",
  "Validação profissional específica não registrada nesta emissão.",
]);

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
  return MARCADORES_DE_AUSENCIA.has(convertido) ? "" : convertido;
}

export function valoresNarrativos(...valores: unknown[]): string[] {
  return [...new Set(
    valores
      .flatMap((valor) => Array.isArray(valor) ? valor : [valor])
      .map(textoNarrativo)
      .filter(Boolean)
  )];
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
  conclusaoProfissional: string;
  classificacaoProfissional: string;
  devolutiva: string;
};

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

  const etapas: EtapaNarrativa[] = [
    {
      codigo: "OBJETIVO_DA_SESSAO",
      rotulo: "Objetivo da sessão ou treinamento",
      itens: valoresNarrativos(
        execucao.objetivo,
        objeto(relatorio).objetivo,
        ...itensDeSecoesAutorizadas(relatorio, "FINALIDADE_DO_TREINAMENTO")
      )
    },
    {
      codigo: "COMO_CHEGOU",
      rotulo: "Como chegou",
      itens: valoresNarrativos(
        consolidacao.contexto_e_objetivo,
        ...itensDeSecoesAutorizadas(
          relatorio,
          "CONTEXTO_OPERACIONAL_HUMANO",
          "CONDICAO_REGULATORIA_OBSERVADA"
        )
      )
    },
    {
      codigo: "DEMANDA_GATILHO",
      rotulo: "Demanda ou gatilho registrado",
      itens: itensDeSecoesAutorizadas(
        relatorio,
        "GATILHOS_E_CONTEXTO_DOCUMENTADOS"
      )
    },
    {
      codigo: "ROTA_PREDOMINANTE",
      rotulo: "Rota predominante registrada",
      itens: itensDeSecoesAutorizadas(relatorio, "ROTA_DOMINANTE")
    },
    {
      codigo: "GANHO_CUSTO",
      rotulo: "Ganho ou custo registrado",
      itens: valoresNarrativos(
        ...itensDeSecoesAutorizadas(relatorio, "CUSTO_REGULATORIO"),
        ...rotasRegistradas.filter((item) => /ganho|custo/i.test(item))
      )
    },
    {
      codigo: "RESPOSTA_ALTERNATIVA",
      rotulo: "Resposta alternativa trabalhada",
      itens: valoresNarrativos(
        ...itensDeSecoesAutorizadas(relatorio, "AQUISICAO_E_CONSOLIDACAO"),
        ...rotasRegistradas.filter((item) => /adaptativ|alternativ/i.test(item))
      )
    },
    {
      codigo: "THX_INTERVENCAO",
      rotulo: "THX ou intervenção",
      itens: valoresNarrativos(
        treinamento,
        consolidacao.intervencao,
        ...itensDeSecoesAutorizadas(relatorio, "CTR_THX_THX_AER")
      )
    },
    {
      codigo: "PRE_TREINO_POS",
      rotulo: "Resposta PRÉ / TREINO / PÓS",
      itens: valoresNarrativos(
        textoNarrativo(observacoes.PRE) ? `PRÉ — ${textoNarrativo(observacoes.PRE)}` : "",
        textoNarrativo(observacoes.TREINO) ? `TREINO — ${textoNarrativo(observacoes.TREINO)}` : "",
        textoNarrativo(observacoes.POS ?? observacoes["PÓS"])
          ? `PÓS — ${textoNarrativo(observacoes.POS ?? observacoes["PÓS"])}`
          : ""
      )
    },
    {
      codigo: "INDICADORES_DA_LEITURA",
      rotulo: "Indicadores que sustentam a leitura",
      itens: valoresNarrativos(...indicadores)
    },
    {
      codigo: "COMO_SAIU",
      rotulo: "Como saiu",
      itens: valoresNarrativos(
        consolidacao.resposta_observada,
        execucao.resposta_observada_json,
        ...itensDeSecoesAutorizadas(relatorio, "RESPOSTA_AO_TREINAMENTO")
      )
    },
    {
      codigo: "MUDANCA_OBSERVADA",
      rotulo: "Mudança observada",
      itens: valoresNarrativos(
        consolidacao.interpretacao_profissional,
        consolidacao.recursos_regulatorios_observados
      )
    },
    {
      codigo: "NAO_CONSOLIDADO",
      rotulo: "O que ainda não se consolidou",
      itens: valoresNarrativos(
        consolidacao.pontos_de_atencao,
        consolidacao.limitacoes
      )
    },
    {
      codigo: "PROXIMO_PASSO",
      rotulo: "Próximo passo profissional",
      itens: valoresNarrativos(
        consolidacao.recomendacao,
        consolidacao.proximo_passo_regulatorio,
        ...itensDeSecoesAutorizadas(relatorio, "PROXIMO_CICLO")
      )
    }
  ].filter((etapa) => etapa.itens.length);

  return {
    etapas,
    conclusaoProfissional: textoNarrativo(consolidacao.conclusao),
    classificacaoProfissional: classificacao,
    devolutiva: textoNarrativo(
      consolidacao.conteudo_da_devolutiva_ao_participante
    )
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
  const primeiro = linha.at(0);
  const ultimo = linha.at(-1);

  return [
    {
      codigo: "FUNCIONAMENTO_INICIAL",
      rotulo: "Funcionamento inicial",
      itens: valoresNarrativos(
        resumoDeRegistro(primeiro),
        ...itensDeRegistros(fontes.linhas_de_referencia)
      )
    },
    {
      codigo: "GATILHOS_ROTAS_RECORRENTES",
      rotulo: "Gatilhos e rotas recorrentes",
      itens: valoresNarrativos(
        ...itensDeRegistros(fontes.arr),
        sinais.recorrencia
      ).filter((item) => item !== "NAO_DETERMINADA")
    },
    {
      codigo: "TREINAMENTOS_REALIZADOS",
      rotulo: "Treinamentos realizados",
      itens: valoresNarrativos(
        ...itensDeRegistros(fontes.execucoes_thx),
        ...itensDeRegistros(fontes.recomendacoes_thx)
      )
    },
    {
      codigo: "OSCILACOES_RETORNOS",
      rotulo: "Oscilações e retornos",
      itens: valoresNarrativos(sinais.oscilacao, sinais.recorrencia, sinais.regressao)
        .filter((item) => !item.startsWith("NAO_DETERMINADA"))
    },
    {
      codigo: "AQUISICAO",
      rotulo: "Aquisição",
      itens: valoresNarrativos(...itensDeRegistros(fontes.nra))
    },
    {
      codigo: "CONSOLIDACAO",
      rotulo: "Consolidação",
      itens: valoresNarrativos(sinais.sustentacao)
    },
    {
      codigo: "TRANSFERENCIA",
      rotulo: "Transferência",
      itens: valoresNarrativos(sinais.transferencia)
    },
    {
      codigo: "ESTADO_ATUAL",
      rotulo: "Estado atual",
      itens: valoresNarrativos(
        resumoDeRegistro(ultimo),
        longitudinal.estado_da_evidencia,
        atual.estado_da_evidencia
      )
    }
  ].filter((etapa) => etapa.itens.length);
}
