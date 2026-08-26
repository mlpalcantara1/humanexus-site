import { projetarEstadoFuncionalDoRelatorio } from "./humanexus-report-authority.ts";

type Registro = Record<string, unknown>;

export const MENSAGEM_DE_SNAPSHOT_HISTORICO_REPRODUZIVEL =
  "O snapshot foi emitido sob contrato anterior e permanece reproduzível como LEGACY.";

export type ContratoDocumentalResolvido = {
  contratoDocumental: "TIRH_V1" | "LEGACY_HISTORICO";
  tirhV1: Registro;
  documentoReproduzivel: boolean;
  ausenciaCientifica: boolean;
  ausenciaDocumental: boolean;
  origem: "CONTRATO_ATUAL_TIRH_V1" | "DOCUMENTO_FINAL_LEGADO_PERSISTIDO";
  registroBrutoPreservado: true;
};

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

export function erroIndicaSnapshotHistoricoReproduzivel(erro: unknown) {
  return erro instanceof Error
    && erro.message === MENSAGEM_DE_SNAPSHOT_HISTORICO_REPRODUZIVEL;
}

export function resolverContratoDocumentalSomenteLeitura({
  relatorio,
  tirhV1,
  cockpitOperacional,
  contratoLegadoDeclarado
}: {
  relatorio: Registro;
  tirhV1: unknown;
  cockpitOperacional: unknown;
  contratoLegadoDeclarado: boolean;
}): ContratoDocumentalResolvido {
  const respostaTirhV1 = objeto(tirhV1);
  const leituraCientifica = objeto(objeto(cockpitOperacional).leitura_cientifica);
  const tirhV1DoCockpit = objeto(leituraCientifica.tirh_operacional_v1);
  const projecaoAtual = Object.keys(respostaTirhV1).length
    ? respostaTirhV1
    : tirhV1DoCockpit;
  const documentoFinal = projetarEstadoFuncionalDoRelatorio(relatorio);

  if (Object.keys(projecaoAtual).length) {
    return {
      contratoDocumental: "TIRH_V1",
      tirhV1: projecaoAtual,
      documentoReproduzivel: documentoFinal.finalDisponivel,
      ausenciaCientifica: false,
      ausenciaDocumental: !documentoFinal.finalDisponivel,
      origem: "CONTRATO_ATUAL_TIRH_V1",
      registroBrutoPreservado: true
    };
  }

  if (contratoLegadoDeclarado && documentoFinal.finalDisponivel) {
    return {
      contratoDocumental: "LEGACY_HISTORICO",
      tirhV1: {},
      documentoReproduzivel: true,
      ausenciaCientifica: true,
      ausenciaDocumental: false,
      origem: "DOCUMENTO_FINAL_LEGADO_PERSISTIDO",
      registroBrutoPreservado: true
    };
  }

  if (contratoLegadoDeclarado) {
    throw new Error(
      "O snapshot científico é histórico, mas o documento final reproduzível não está disponível."
    );
  }

  throw new Error(
    "A projeção científica atual não foi recebida e nenhum contrato histórico reproduzível foi declarado."
  );
}
