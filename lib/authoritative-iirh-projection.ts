type Registro = Record<string, unknown>;

export type ModoDaDisponibilidadeAutoritativa =
  | "ATUAL"
  | "SNAPSHOT_SELECIONADO"
  | "REFERENCIA_CONGELADA"
  | "AGUARDANDO_PRIMEIRA_REFERENCIA_VALIDA";

const ESTADOS_AUTORITATIVOS_CALCULADOS = new Set([
  "CALCULADO",
  "PARCIAL",
  "PLENO"
]);

function objeto(valor: unknown): Registro {
  return valor && typeof valor === "object" && !Array.isArray(valor)
    ? valor as Registro
    : {};
}

function textoAutoritativo(...valores: unknown[]) {
  for (const valor of valores) {
    if (typeof valor !== "string") continue;
    const texto = valor.trim();
    if (texto) return texto;
  }
  return null;
}

function normalizarEstado(valor: unknown) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function resolverIirhAutoritativo(valor: unknown) {
  const registro = objeto(valor);
  const estado = textoAutoritativo(registro.estado);
  const estadoNormalizado = normalizarEstado(estado);
  const valorRecebido = typeof registro.valor === "number"
    && Number.isFinite(registro.valor)
    ? registro.valor
    : null;
  const calculado = ESTADOS_AUTORITATIVOS_CALCULADOS.has(estadoNormalizado)
    && valorRecebido != null;
  const porQueEsteResultado = objeto(registro.por_que_este_resultado);

  return {
    registro,
    estado,
    estadoNormalizado,
    calculado,
    valor: calculado ? valorRecebido : null,
    unidade: textoAutoritativo(registro.unidade),
    motivo: textoAutoritativo(
      registro.motivo,
      porQueEsteResultado.resumo,
      registro.justificativa
    )
  };
}

const MODOS_AUTORITATIVOS = new Set<ModoDaDisponibilidadeAutoritativa>([
  "ATUAL",
  "SNAPSHOT_SELECIONADO",
  "REFERENCIA_CONGELADA",
  "AGUARDANDO_PRIMEIRA_REFERENCIA_VALIDA"
]);

function modoAutoritativo(valor: unknown): ModoDaDisponibilidadeAutoritativa {
  const normalizado = normalizarEstado(valor) as ModoDaDisponibilidadeAutoritativa;
  return MODOS_AUTORITATIVOS.has(normalizado)
    ? normalizado
    : "AGUARDANDO_PRIMEIRA_REFERENCIA_VALIDA";
}

function resolverOrigem(valor: unknown) {
  const origem = objeto(valor);
  return {
    registro: origem,
    identificadorDaSessao: textoAutoritativo(
      origem.identificador_da_sessao
    ),
    fase: textoAutoritativo(origem.fase),
    momento: textoAutoritativo(origem.momento),
    origem: textoAutoritativo(origem.origem),
    integridade: textoAutoritativo(origem.integridade_sha256),
    elegibilidade: textoAutoritativo(origem.elegibilidade)
  };
}

function resolverZonaAutoritativa(valor: unknown) {
  const registro = objeto(valor);
  const estado = textoAutoritativo(registro.estado);
  const estadoNormalizado = normalizarEstado(estado);
  const codigo = textoAutoritativo(registro.codigo);
  const nome = textoAutoritativo(registro.nome);
  const classificada = Boolean(codigo || nome)
    && ![
      "",
      "AUSENTE",
      "NAO_CALCULAVEL",
      "NAO_CLASSIFICAVEL",
      "NAO_DETERMINAVEL",
      "NAO_INFERIVEL"
    ].includes(estadoNormalizado);
  const porQueEsteResultado = objeto(registro.por_que_este_resultado);
  return {
    registro,
    estado,
    estadoNormalizado,
    classificada,
    codigo: classificada ? codigo : null,
    nome: classificada ? nome : null,
    motivo: textoAutoritativo(
      registro.motivo,
      porQueEsteResultado.resumo,
      registro.justificativa
    )
  };
}

function indicadorContinuo<T>(
  valor: unknown,
  resolver: (registro: unknown) => T
) {
  const indicador = objeto(valor);
  const modo = modoAutoritativo(indicador.modo);
  const registro = indicador.registro;
  return {
    modo,
    registroDoContrato: indicador,
    projecao: resolver(registro),
    origem: resolverOrigem(indicador.origem),
    referenciaCongelada: modo === "REFERENCIA_CONGELADA",
    atual: modo === "ATUAL",
    snapshotSelecionado: modo === "SNAPSHOT_SELECIONADO",
    aguardandoPrimeiraReferencia:
      modo === "AGUARDANDO_PRIMEIRA_REFERENCIA_VALIDA"
  };
}

/**
 * Consome exclusivamente a seleção já realizada pelo Núcleo. O Portal não
 * escolhe referência, não calcula IIRH e não deriva Zona a partir do índice.
 */
export function resolverDisponibilidadeContinuaIirhZona(
  leituraCientifica: unknown
) {
  const leitura = objeto(leituraCientifica);
  const contrato = objeto(
    leitura.disponibilidade_continua_iirh_zona
  );
  const janelaAtual = objeto(contrato.janela_atual);
  const contratoAutoritativo = contrato.autoridade === "NUCLEO_HUMANEXUS"
    && contrato.portal_autorizado_a_calcular === false
    && contrato.zona_derivada_do_iirh === false;

  if (!contratoAutoritativo) {
    return {
      contrato,
      contratoAutoritativo: false,
      janelaAtual,
      iirh: indicadorContinuo(
        { modo: "AGUARDANDO_PRIMEIRA_REFERENCIA_VALIDA", registro: null },
        resolverIirhAutoritativo
      ),
      zona: indicadorContinuo(
        { modo: "AGUARDANDO_PRIMEIRA_REFERENCIA_VALIDA", registro: null },
        resolverZonaAutoritativa
      )
    };
  }

  return {
    contrato,
    contratoAutoritativo: true,
    janelaAtual,
    iirh: indicadorContinuo(contrato.iirh, resolverIirhAutoritativo),
    zona: indicadorContinuo(contrato.zona, resolverZonaAutoritativa)
  };
}

export function rotuloDaDisponibilidadeAutoritativa(
  modo: ModoDaDisponibilidadeAutoritativa
) {
  if (modo === "ATUAL") return "ATUAL";
  if (modo === "SNAPSHOT_SELECIONADO") {
    return "SNAPSHOT OFICIAL DA FASE SELECIONADA";
  }
  if (modo === "REFERENCIA_CONGELADA") return "REFERÊNCIA CONGELADA";
  return "AGUARDANDO PRIMEIRA REFERÊNCIA VÁLIDA";
}
