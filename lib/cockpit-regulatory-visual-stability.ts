export const JANELA_VISUAL_REGULATORIA_MS = 4_000;
export const CADENCIA_VISUAL_REGULATORIA_MS = 1_000;
export const PERSISTENCIA_VISUAL_DA_ZONA_MS = 3_000;

export type VetorRegulatorioVisual = {
  code: string;
  name: string;
  value: number | null;
  macrofield?: string | null;
  trend?: string | null;
};

export type RevisaoRegulatoriaVisual = {
  contexto: string;
  ordemCanonica: number;
  ativo: boolean;
  vetores: VetorRegulatorioVisual[];
  iirh: number | null;
  zona: string | null;
};

type RevisaoNaJanela = {
  recebidaEm: number;
  revisao: RevisaoRegulatoriaVisual;
};

function vetoresIguais(
  esquerda: VetorRegulatorioVisual[],
  direita: VetorRegulatorioVisual[]
): boolean {
  return esquerda.length === direita.length && esquerda.every((vetor, indice) => {
    const comparado = direita[indice];
    return vetor.code === comparado?.code
      && vetor.name === comparado?.name
      && vetor.value === comparado?.value
      && vetor.macrofield === comparado?.macrofield
      && vetor.trend === comparado?.trend;
  });
}

function revisoesIguais(
  esquerda: RevisaoRegulatoriaVisual,
  direita: RevisaoRegulatoriaVisual
): boolean {
  return esquerda.contexto === direita.contexto
    && esquerda.ordemCanonica === direita.ordemCanonica
    && esquerda.ativo === direita.ativo
    && esquerda.iirh === direita.iirh
    && esquerda.zona === direita.zona
    && vetoresIguais(esquerda.vetores, direita.vetores);
}

export type EstadoDaApresentacaoRegulatoria = {
  contexto: string;
  maiorOrdemCanonica: number;
  apresentadaEm: number;
  vetores: VetorRegulatorioVisual[];
  iirh: number | null;
  zona: string | null;
  zonaCanonica: string | null;
  candidataDaZona: string | null;
  candidataDesde: number | null;
  divergenciaDaZonaVisivel: boolean;
  revisoesNaJanela: RevisaoNaJanela[];
};

function novoEstado(
  revisao: RevisaoRegulatoriaVisual,
  agora: number
): EstadoDaApresentacaoRegulatoria {
  return {
    contexto: revisao.contexto,
    maiorOrdemCanonica: revisao.ordemCanonica,
    apresentadaEm: agora,
    vetores: revisao.vetores,
    iirh: revisao.iirh,
    zona: revisao.zona,
    zonaCanonica: revisao.zona,
    candidataDaZona: null,
    candidataDesde: null,
    divergenciaDaZonaVisivel: false,
    revisoesNaJanela: [{ recebidaEm: agora, revisao }]
  };
}

/**
 * Consolida apenas a apresentação. Nenhum valor é interpolado, calculado ou
 * persistido: cada valor exibido pertence integralmente a uma revisão canônica.
 */
export function estabilizarApresentacaoRegulatoria(
  estado: EstadoDaApresentacaoRegulatoria | null,
  revisao: RevisaoRegulatoriaVisual,
  agora: number,
  opcoes: { forcarCanonico?: boolean } = {}
): EstadoDaApresentacaoRegulatoria {
  if (
    !estado
    || estado.contexto !== revisao.contexto
    || revisao.ativo === false
    || opcoes.forcarCanonico === true
  ) {
    return novoEstado(revisao, agora);
  }

  // Uma resposta atrasada nunca regressa a apresentação nem a janela recente.
  if (revisao.ordemCanonica < estado.maiorOrdemCanonica) return estado;

  const janelaRetida = estado.revisoesNaJanela.filter(
    (item) => agora - item.recebidaEm <= JANELA_VISUAL_REGULATORIA_MS
  );
  const ultimaRevisao = janelaRetida.at(-1)?.revisao;
  const revisoesNaJanela = ultimaRevisao && revisoesIguais(ultimaRevisao, revisao)
    ? janelaRetida
    : [...janelaRetida, { recebidaEm: agora, revisao }];
  const maiorOrdemCanonica = Math.max(
    estado.maiorOrdemCanonica,
    revisao.ordemCanonica
  );
  const podeAtualizarLeitura =
    agora - estado.apresentadaEm >= CADENCIA_VISUAL_REGULATORIA_MS;

  let zona = estado.zona;
  let candidataDaZona = estado.candidataDaZona;
  let candidataDesde = estado.candidataDesde;
  if (revisao.zona === estado.zona) {
    candidataDaZona = null;
    candidataDesde = null;
  } else if (revisao.zona !== candidataDaZona) {
    candidataDaZona = revisao.zona;
    candidataDesde = agora;
  } else if (
    candidataDesde != null
    && agora - candidataDesde >= PERSISTENCIA_VISUAL_DA_ZONA_MS
  ) {
    zona = revisao.zona;
    candidataDaZona = null;
    candidataDesde = null;
  }

  const proximo = {
    ...estado,
    maiorOrdemCanonica,
    apresentadaEm: podeAtualizarLeitura ? agora : estado.apresentadaEm,
    vetores: podeAtualizarLeitura ? revisao.vetores : estado.vetores,
    iirh: podeAtualizarLeitura ? revisao.iirh : estado.iirh,
    zona,
    zonaCanonica: revisao.zona,
    candidataDaZona,
    candidataDesde,
    divergenciaDaZonaVisivel: zona !== revisao.zona,
    revisoesNaJanela
  };

  const semMudanca =
    proximo.maiorOrdemCanonica === estado.maiorOrdemCanonica
    && proximo.apresentadaEm === estado.apresentadaEm
    && proximo.zona === estado.zona
    && proximo.zonaCanonica === estado.zonaCanonica
    && proximo.iirh === estado.iirh
    && vetoresIguais(proximo.vetores, estado.vetores)
    && proximo.candidataDaZona === estado.candidataDaZona
    && proximo.candidataDesde === estado.candidataDesde
    && proximo.revisoesNaJanela.length === estado.revisoesNaJanela.length;
  return semMudanca ? estado : proximo;
}
