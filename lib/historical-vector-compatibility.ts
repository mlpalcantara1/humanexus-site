type Registro = Record<string, unknown>;

export const VETORES_MOMENTANEOS_CANONICOS = [
  "VH",
  "VT",
  "VS",
  "VSI",
  "VAR",
  "VAM",
  "VJ",
  "VE",
  "VR"
] as const;

export const VETOR_LONGITUDINAL_CANONICO = "VEV";
export const VERSAO_DA_COMPATIBILIDADE_HISTORICA =
  "HXP-SNAPSHOT-HISTORICO-VETORES-1.0.0";

const CAMPOS_HISTORICOS_DA_CHAVE_TECNICA = [
  "codigo",
  "code",
  "definicao"
] as const;

const ALIASES_HISTORICOS_DOS_VETORES: Record<string, string> = {
  VH: "VH",
  VETOR_HUMANO: "VH",
  VT: "VT",
  VETOR_TAREFA: "VT",
  VS: "VS",
  VETOR_SOCIAL: "VS",
  VSI: "VSI",
  VETOR_SIMBOLICO: "VSI",
  VAR: "VAR",
  VETOR_AUTONOMICO: "VAR",
  VAM: "VAM",
  VETOR_ACAO_MOTOR: "VAM",
  VETOR_ACAO: "VAM",
  VJ: "VJ",
  VETOR_JULGAMENTO: "VJ",
  VE: "VE",
  VETOR_ESTABILIDADE: "VE",
  VR: "VR",
  VETOR_RECUPERACAO: "VR",
  VEV: "VEV",
  VETOR_LONGITUDINAL: "VEV"
};

function objeto(valor: unknown): Registro {
  return valor && typeof valor === "object" && !Array.isArray(valor)
    ? valor as Registro
    : {};
}

function normalizarToken(valor: unknown) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function entradasDoContainer(valor: unknown): Registro[] {
  if (Array.isArray(valor)) {
    return valor.map((item) => ({ ...objeto(item) }));
  }
  return Object.entries(objeto(valor)).map(([chave, conteudo]) => {
    const entrada = { ...objeto(conteudo) };
    if (!CAMPOS_HISTORICOS_DA_CHAVE_TECNICA.some((campo) => entrada[campo])) {
      entrada.codigo = chave;
    }
    return entrada;
  });
}

function chaveTecnica(registro: Registro) {
  for (const campo of CAMPOS_HISTORICOS_DA_CHAVE_TECNICA) {
    if (registro[campo] == null || registro[campo] === "") continue;
    const token = normalizarToken(registro[campo]);
    return {
      codigo: ALIASES_HISTORICOS_DOS_VETORES[token] ?? token,
      campo
    };
  }
  return { codigo: "", campo: "" };
}

export function compatibilizarVetoresDoSnapshotHistorico(vetores: unknown) {
  const entradas = entradasDoContainer(vetores);
  const canonicos = new Map<string, Registro>();
  let longitudinal: Registro | null = null;
  const adicionais: Registro[] = [];
  const diagnosticos: Registro[] = [];

  entradas.forEach((entradaOriginal, indice) => {
    const entrada = { ...entradaOriginal };
    const { codigo, campo } = chaveTecnica(entrada);
    if (!codigo) {
      adicionais.push({
        classificacao: "METADADO_HISTORICO",
        indice_original: indice,
        entrada
      });
      return;
    }
    if (codigo === VETOR_LONGITUDINAL_CANONICO) {
      if (!longitudinal) {
        longitudinal = {
          ...entrada,
          codigo,
          campo_historico_da_chave: campo
        };
      } else {
        adicionais.push({
          classificacao: "ALIAS_HISTORICO_DUPLICADO",
          codigo_canonico: codigo,
          indice_original: indice,
          entrada
        });
        diagnosticos.push({
          codigo: "ALIAS_HISTORICO_DUPLICADO",
          entrada: codigo,
          bloqueia_recalculo: true
        });
      }
      return;
    }
    if ((VETORES_MOMENTANEOS_CANONICOS as readonly string[]).includes(codigo)) {
      if (canonicos.has(codigo)) {
        adicionais.push({
          classificacao: "ALIAS_HISTORICO_DUPLICADO",
          codigo_canonico: codigo,
          indice_original: indice,
          entrada
        });
        diagnosticos.push({
          codigo: "ALIAS_HISTORICO_DUPLICADO",
          entrada: codigo,
          bloqueia_recalculo: true
        });
        return;
      }
      canonicos.set(codigo, {
        ...entrada,
        codigo,
        campo_historico_da_chave: campo
      });
      return;
    }
    adicionais.push({
      classificacao: "ENTRADA_HISTORICA_DESCONHECIDA",
      chave_tecnica: codigo,
      indice_original: indice,
      entrada
    });
    diagnosticos.push({
      codigo: "ENTRADA_HISTORICA_DESCONHECIDA",
      entrada: codigo,
      bloqueia_recalculo: true
    });
  });

  const vetoresMomentaneosCanonicos = VETORES_MOMENTANEOS_CANONICOS
    .flatMap((codigo) => canonicos.has(codigo) ? [canonicos.get(codigo)!] : []);

  return {
    versaoDaCompatibilidade: VERSAO_DA_COMPATIBILIDADE_HISTORICA,
    quantidadeBrutaDeEntradas: entradas.length,
    vetoresMomentaneosCanonicos,
    vetoresMomentaneosAusentes: VETORES_MOMENTANEOS_CANONICOS.filter(
      (codigo) => !canonicos.has(codigo)
    ),
    vetorLongitudinal: longitudinal,
    entradasHistoricasAdicionais: adicionais,
    diagnosticos,
    bloqueadorExato: diagnosticos.length
      ? "ENTRADA_HISTORICA_DESCONHECIDA_OU_DUPLICADA"
      : null,
    calculoCientificoExecutado: false,
    entradaDesconhecidaIncluidaNoCalculo: false
  };
}

function instante(valor: unknown) {
  const resultado = new Date(String(valor ?? "")).getTime();
  return Number.isFinite(resultado) ? resultado : 0;
}

function detalhesDoReplay(valor: unknown) {
  if (typeof valor !== "string") return objeto(valor);
  try {
    return objeto(JSON.parse(valor));
  } catch {
    return {};
  }
}

export function itensCanonicosDaLinhaHistorica({
  itensReplay,
  eventos,
  registroBaseline
}: {
  itensReplay: Registro[];
  eventos: Registro[];
  registroBaseline?: Registro | null;
}) {
  const replay = itensReplay.flatMap((item) => {
    const time = instante(item.timestamp_original);
    if (!time) return [];
    const detalhes = detalhesDoReplay(item.dados_de_inspecao_json);
    return [{
      time,
      track: String(item.modalidade ?? "REGISTRO"),
      label: String(detalhes.tipo ?? "REGISTRO"),
      event: String(detalhes.tipo ?? ""),
      source: String(item.origem ?? "NÚCLEO OFICIAL")
    }];
  });
  const operacionais = eventos.flatMap((item) => {
    const time = instante(item.ocorrido_em ?? item.criado_em);
    const fase = normalizarToken(item.momento);
    if (!time || !["PRE", "TREINO", "POS"].includes(fase)) return [];
    return [{
      time,
      track: fase === "PRE" ? "PRÉ" : fase === "POS" ? "PÓS" : "TREINO",
      label: String(item.tipo ?? "EVENTO OPERACIONAL"),
      event: String(item.tipo ?? ""),
      source: "NÚCLEO OFICIAL · EVENTO OPERACIONAL"
    }];
  });
  const baseline = registroBaseline ? [
    registroBaseline.iniciado_em ? {
      time: instante(registroBaseline.iniciado_em),
      track: "REFERÊNCIA INICIAL",
      label: "REFERÊNCIA INICIAL INICIADA",
      event: "BASELINE_INICIADO",
      source: "NÚCLEO OFICIAL · REGISTRO DE REFERÊNCIA INICIAL"
    } : null,
    registroBaseline.finalizado_em ? {
      time: instante(registroBaseline.finalizado_em),
      track: "REFERÊNCIA INICIAL",
      label: "REFERÊNCIA INICIAL ENCERRADA",
      event: "BASELINE_ENCERRADO",
      source: "NÚCLEO OFICIAL · REGISTRO DE REFERÊNCIA INICIAL"
    } : null
  ].filter((item): item is NonNullable<typeof item> => Boolean(item?.time)) : [];

  const vistos = new Set<string>();
  return [...replay, ...operacionais, ...baseline]
    .sort((a, b) => a.time - b.time)
    .filter((item) => {
      const chave = `${item.time}|${item.track}|${item.event}`;
      if (vistos.has(chave)) return false;
      vistos.add(chave);
      return true;
    });
}
