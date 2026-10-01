export type RegistroOperacional = Record<string, unknown>;

export type ItemDePreflight = {
  codigo: string;
  rotulo: string;
  estado: "READY" | "PENDING" | "UNAVAILABLE";
  motivo: string;
  resolucao: "AUTOMATICA" | "PROFISSIONAL" | "NAO_APLICAVEL";
};

export type PreflightTirh = {
  estado: "READY" | "NOT_READY";
  inicio: {
    estado: "READY" | "BLOCKED";
    bloqueios: ItemDePreflight[];
    avisos: ItemDePreflight[];
  };
  fontes: ItemDePreflight[];
  vetores: ItemDePreflight[];
  resultante: ItemDePreflight;
  tendencia: ItemDePreflight;
};

const VETORES_MOMENTANEOS = [
  "VH", "VT", "VS", "VSI", "VAM", "VJ", "VE", "VR", "VAR"
] as const;

function objeto(valor: unknown): RegistroOperacional {
  return valor && typeof valor === "object" && !Array.isArray(valor)
    ? valor as RegistroOperacional
    : {};
}

function texto(valor: unknown, padrao: string) {
  const resultado = String(valor ?? "").trim();
  return resultado || padrao;
}

function fontePorCodigo(fontes: RegistroOperacional[], codigo: string) {
  return fontes.find((fonte) => String(fonte.codigo ?? "").toUpperCase() === codigo);
}

function fontePronta(
  fontes: RegistroOperacional[],
  codigo: string,
  rotulo: string
): ItemDePreflight {
  const fonte = fontePorCodigo(fontes, codigo);
  const estado = String(fonte?.estado ?? "").toUpperCase();
  const pronta = fonte?.ao_vivo === true || ["CONECTADO", "CAPTURANDO"].includes(estado);
  return {
    codigo,
    rotulo,
    estado: pronta ? "READY" : "UNAVAILABLE",
    motivo: pronta
      ? "Fonte física atual confirmada pelo Núcleo."
      : "Fonte física não está fornecendo uma leitura atual.",
    resolucao: pronta ? "NAO_APLICAVEL" : "AUTOMATICA"
  };
}

function entradaHidratada(
  entradas: RegistroOperacional,
  codigo: string,
  rotulo: string
): ItemDePreflight {
  const entrada = objeto(entradas[codigo]);
  const estadoDaEntrada = String(entrada.estado ?? "AUSENTE").toUpperCase();
  const pronta = !["", "AUSENTE", "EXPIRADA", "SUBSTITUÍDA", "SUBSTITUIDA"].includes(estadoDaEntrada);
  return {
    codigo: codigo.toUpperCase(),
    rotulo,
    estado: pronta ? "READY" : "PENDING",
    motivo: texto(entrada.motivo, "Fonte oficial ainda não disponível."),
    resolucao: entrada.exige_acao_profissional === true
      ? "PROFISSIONAL"
      : "AUTOMATICA"
  };
}

function motivoExigeProfissional(motivo: string) {
  return /(evid[eê]ncia profissional|observa[cç][aã]o|decis[aã]o|perfil expl[ií]cito|autoridade profissional)/i
    .test(motivo);
}

export function resolverPreflightTirh({
  autoHidratacao,
  fontes,
  vetores,
  resultante,
  tendencia
}: {
  autoHidratacao: RegistroOperacional;
  fontes: RegistroOperacional[];
  vetores: RegistroOperacional[];
  resultante: RegistroOperacional;
  tendencia: RegistroOperacional;
}): PreflightTirh {
  const entradas = objeto(autoHidratacao.entradas);
  const fontesEstruturais = [
    entradaHidratada(entradas, "anamnese", "Anamnese"),
    entradaHidratada(entradas, "baseline", "Referência inicial"),
    entradaHidratada(entradas, "perfil_tarefa", "Perfil da tarefa")
  ];
  const fontesFisicas = [
    fontePronta(fontes, "POLAR_H10", "Polar H10"),
    fontePronta(fontes, "EMOTIV_EPOC_X", "EEG / EPOC X")
  ];
  const fontesDeContexto = [...fontesEstruturais, ...fontesFisicas];

  const porCodigo = new Map(
    vetores.map((vetor) => [String(vetor.code ?? vetor.codigo ?? "").toUpperCase(), vetor])
  );
  const itensVetoriais = VETORES_MOMENTANEOS.map((codigo) => {
    const vetor = porCodigo.get(codigo) ?? {};
    const valor = vetor.value ?? vetor.valor ?? vetor.magnitude;
    const calculado = typeof valor === "number" && Number.isFinite(valor);
    const motivo = texto(
      vetor.reason ?? vetor.motivo,
      calculado
        ? "Vetor autoritativo disponível."
        : "Janela ou requisito científico ainda não atendido."
    );
    return {
      codigo,
      rotulo: codigo,
      estado: calculado ? "READY" : "PENDING",
      motivo,
      resolucao: calculado
        ? "NAO_APLICAVEL"
        : motivoExigeProfissional(motivo)
          ? "PROFISSIONAL"
          : "AUTOMATICA"
    } satisfies ItemDePreflight;
  });

  const estadoDaResultante = String(resultante.estado ?? "").toUpperCase();
  const resultantePronta = ["PLENA", "PARCIAL", "CONFLITANTE", "CALCULAVEL"]
    .includes(estadoDaResultante);
  const estadoDaTendencia = String(
    tendencia.estado ?? tendencia.status ?? ""
  ).toUpperCase();
  const tendenciaPronta = Boolean(
    tendencia.tendencia
    ?? tendencia.sentido
    ?? tendencia.direcao
    ?? (estadoDaTendencia && !/AUSENTE|NAO_CALCUL|NÃO_CALCUL/.test(estadoDaTendencia))
  );
  const itemResultante: ItemDePreflight = {
    codigo: "RESULTANTE",
    rotulo: "Resultante",
    estado: resultantePronta ? "READY" : "PENDING",
    motivo: texto(
      resultante.motivo ?? resultante.reason,
      resultantePronta
        ? "Resultante autoritativa disponível."
        : "A Resultante aguarda os requisitos científicos do Núcleo."
    ),
    resolucao: "AUTOMATICA"
  };
  const itemTendencia: ItemDePreflight = {
    codigo: "TENDENCIA",
    rotulo: "Tendência",
    estado: tendenciaPronta ? "READY" : "PENDING",
    motivo: texto(
      tendencia.motivo ?? tendencia.reason,
      tendenciaPronta
        ? "Tendência autoritativa disponível."
        : "A tendência aguarda série temporal canônica suficiente."
    ),
    resolucao: "AUTOMATICA"
  };

  const gate = objeto(autoHidratacao.gate_de_inicio);
  const bloqueiosCanonicos = Array.isArray(gate.bloqueios) ? gate.bloqueios.map((valor) => {
    const item = objeto(valor);
    const codigo = texto(item.codigo, "CONTEXTO");
    return { codigo, rotulo: fontesEstruturais.find((f) => f.codigo === codigo)?.rotulo ?? codigo,
      estado: "PENDING", motivo: texto(item.motivo, "Preparação pendente no Núcleo."),
      resolucao: item.resolucao === "PROFISSIONAL" ? "PROFISSIONAL" : "AUTOMATICA" } satisfies ItemDePreflight;
  }) : [];
  const gateDisponivel = typeof gate.bloqueia_inicio === "boolean";
  return {
    estado: [...fontesDeContexto, ...itensVetoriais, itemResultante, itemTendencia]
      .every((item) => item.estado === "READY")
      ? "READY"
      : "NOT_READY",
    inicio: {
      estado: (gateDisponivel ? !gate.bloqueia_inicio : fontesEstruturais.every((item) => item.estado === "READY"))
        ? "READY"
        : "BLOCKED",
      bloqueios: gateDisponivel ? bloqueiosCanonicos : fontesEstruturais.filter((item) => item.estado !== "READY"),
      // Fonte física ausente limita a ciência, mas não é convertida em valor
      // nem bloqueia universalmente uma sessão autorizada sem aquela fonte.
      avisos: fontesFisicas.filter((item) => item.estado !== "READY")
    },
    fontes: fontesDeContexto,
    vetores: itensVetoriais,
    resultante: itemResultante,
    tendencia: itemTendencia
  };
}
