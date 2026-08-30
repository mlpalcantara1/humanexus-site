import PDFDocument from "pdfkit";

import { decisoesProfissionaisPreservadasTirhV1 } from "./validacao-profissional-tirh-v1.ts";
import {
  projetarEstadoFuncionalDoRelatorio,
  resolverIdentidadeDocumental
} from "./humanexus-report-authority.ts";
import {
  resolverIirhAutoritativo,
  resolverDisponibilidadeContinuaIirhZona,
  resolverZonaAutoritativa,
  rotuloDaDisponibilidadeAutoritativa
} from "./authoritative-iirh-projection.ts";
import { portuguesVisivel } from "./portugues-visivel.ts";
import {
  MENSAGEM_UNICA_DE_INDISPONIBILIDADE,
  projetarMicrotrajetoriaRegulatoria
} from "./projecao-narrativa-relatorio.ts";
import { compatibilizarVetoresDoSnapshotHistorico } from "./historical-vector-compatibility.ts";

export const VERSAO_DOCUMENTAL_TIRH = "TIRH-DOCUMENTOS-3.0";

export type TipoDocumentoTirh =
  | "OPERACIONAL_TIRH"
  | "CIENTIFICO_TIRH"
  | "EXECUTIVO"
  | "TECNICO"
  | "FORMULACAO_REGULATORIA";

type Registro = Record<string, unknown>;
type Vetor = {
  codigo: string;
  nome: string;
  macrocampo: string;
  magnitude: number | null;
  confianca: number | null;
  estado: string;
  motivo?: string;
};
type PontoTrajetoria = {
  rotulo: string;
  valor: number | null;
  zona: string;
};

export type EntradaRelatorioHumanexus = {
  usuario: Registro;
  organizacao?: Registro;
  participante: Registro;
  sessao: Registro;
  execucao: Registro | null;
  protocoloThx?: Registro | null;
  ciclo: Registro | null;
  telemetria: Registro[];
  eventos: Registro[];
  relatorio: Registro;
  gravacao: Registro;
  contratoCientifico: Registro;
  tirhV1?: Registro;
  cockpitOperacional?: Registro;
  contratoDocumental?: "TIRH_V1" | "LEGACY_HISTORICO";
  tipoDocumento?: TipoDocumentoTirh;
};

const CORES = {
  noite: "#0b1011",
  carbono: "#151b1c",
  tinta: "#202829",
  texto: "#3e494b",
  suave: "#6f797a",
  linha: "#dadbd5",
  papel: "#fbfaf6",
  ouro: "#a78440",
  ouroClaro: "#dcc178",
  petroleo: "#285e5d",
  verde: "#4f7d65",
  vermelho: "#9a5752",
  azul: "#466f7a",
  cinza: "#a7acab",
  branco: "#ffffff"
} as const;

const ROTULOS: Record<TipoDocumentoTirh, string> = {
  OPERACIONAL_TIRH: "Relatório Operacional TIRH",
  CIENTIFICO_TIRH: "Relatório Científico TIRH",
  EXECUTIVO: "Relatório Executivo",
  TECNICO: "Relatório Técnico do Sistema",
  FORMULACAO_REGULATORIA: "Formulação Regulatória"
};

const SUBTITULOS: Record<TipoDocumentoTirh, string> = {
  OPERACIONAL_TIRH: "Leitura preventiva da resposta regulatória e da confiabilidade operacional humana.",
  CIENTIFICO_TIRH: "Método, admissibilidade, incerteza e rastreabilidade das evidências.",
  EXECUTIVO: "Evolução, tendências e recomendações para decisão organizacional responsável.",
  TECNICO: "Integridade, transporte, sincronização e saúde da infraestrutura de aquisição.",
  FORMULACAO_REGULATORIA: "Síntese autoral para compreensão e condução da rota regulatória."
};

const VETORES_OFICIAIS = [
  ["VH", "Vetor Humano", "Campo Humano"],
  ["VT", "Vetor Tarefa", "Campo da Tarefa"],
  ["VS", "Vetor Social", "Campo Estruturante"],
  ["VSI", "Vetor Simbólico", "Campo Estruturante"],
  ["VAR", "Vetor Autonômico", "Campo Neuroregulatório"],
  ["VAM", "Vetor Ação/Motor", "Campo Neuroregulatório"],
  ["VJ", "Vetor Julgamento", "Campo Neuroregulatório"],
  ["VE", "Vetor Estabilidade", "Campo Humano"],
  ["VR", "Vetor Recuperação", "Campo Humano"]
] as const;

const VETOR_LONGITUDINAL = ["VEV", "Vetor Evolução", "Longitudinal"] as const;

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

function objeto(valor: unknown): Registro {
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

function texto(valor: unknown, ausencia = "Não registrado") {
  const convertido = String(valor ?? "").trim();
  return portuguesVisivel(convertido || ausencia, ausencia);
}

function numero(valor: unknown): number | null {
  if (valor == null || valor === "") return null;
  const convertido = Number(valor);
  return Number.isFinite(convertido) ? convertido : null;
}

function proporcao(valor: unknown): number | null {
  const convertido = numero(valor);
  if (convertido == null) return null;
  return Math.max(0, Math.min(1, convertido > 1 ? convertido / 100 : convertido));
}

function data(valor: unknown) {
  if (!valor) return "Data não registrada";
  const instante = new Date(String(valor));
  return Number.isNaN(instante.getTime())
    ? String(valor)
    : new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "long",
        timeStyle: "short",
        timeZone: "America/Manaus"
      }).format(instante);
}

function aparar(valor: string, limite = 165) {
  return valor.length <= limite ? valor : `${valor.slice(0, limite - 1).trim()}…`;
}

function normalizarZona(valor: unknown) {
  const zona = texto(valor, "Não classificada").toUpperCase();
  const mapa: Record<string, string> = {
    ZO: "Zona Ótima",
    ZA: "Zona Adaptativa",
    ZI: "Zona de Instabilidade",
    ZCF: "Zona de Comprometimento Funcional"
  };
  return mapa[zona] ?? texto(valor, "Não classificada");
}

function tipoPeloRegistro(relatorio: Registro): TipoDocumentoTirh {
  const tipo = texto(relatorio.tipo, "").toUpperCase();
  const destinatario = texto(relatorio.destinatario, "").toUpperCase();
  if (tipo === "FORMULACAO_REGULATORIA") return "FORMULACAO_REGULATORIA";
  if (["EXECUTIVO", "COLETIVO", "ORGANIZACIONAL"].includes(tipo)) return "EXECUTIVO";
  if (tipo === "TECNICO_PROFISSIONAL") {
    return destinatario === "ADMINISTRADOR_TECNICO" ? "TECNICO" : "CIENTIFICO_TIRH";
  }
  return "OPERACIONAL_TIRH";
}

function desenharMarca(doc: PDFKit.PDFDocument, x: number, y: number, escala = 1) {
  const w = 30 * escala;
  const h = 37 * escala;
  doc.save().translate(x, y).fillColor(CORES.ouroClaro);
  doc.polygon([0, h * .18], [w * .42, 0], [w * .42, h * .38], [0, h * .56]).fill();
  doc.polygon([w, h * .18], [w * .58, 0], [w * .58, h * .47], [w, h * .67]).fill();
  doc.polygon([0, h * .64], [w * .42, h * .45], [w * .42, h], [0, h * .82]).fill();
  doc.polygon([w, h * .75], [w * .58, h * .56], [w * .58, h], [w, h * .82]).fill();
  doc.restore();
}

function capa(
  doc: PDFKit.PDFDocument,
  tipo: TipoDocumentoTirh,
  entrada: EntradaRelatorioHumanexus
) {
  const { relatorio, participante, sessao, usuario } = entrada;
  const identificacao = identificacaoDocumental(entrada);
  const relatorioColetivo = tipo === "EXECUTIVO";
  doc.rect(0, 0, 595.28, 841.89).fill(CORES.noite);
  doc.circle(515, 90, 170).fillOpacity(.08).fill(CORES.ouro).fillOpacity(1);
  doc.circle(508, 98, 112).lineWidth(.6).strokeColor(CORES.ouro).strokeOpacity(.25).stroke().strokeOpacity(1);
  desenharMarca(doc, 47, 47, .88);
  doc.fillColor(CORES.branco).font("Helvetica-Bold").fontSize(13).text("H U M A N E X U S", 91, 53, {
    characterSpacing: 2.2
  });
  doc.fillColor(CORES.ouroClaro).font("Helvetica-Bold").fontSize(8).text(ROTULOS[tipo].toUpperCase(), 47, 247, {
    width: 470,
    characterSpacing: 1.55
  });
  const tituloDaCapa = texto(
    relatorio.titulo_humano,
    relatorioColetivo
      ? texto(relatorio.titulo, ROTULOS[tipo])
      : `${ROTULOS.OPERACIONAL_TIRH} — ${identificacao.nomeCompleto}`
  );
  doc.fillColor(CORES.branco).font("Helvetica-Bold").fontSize(34).text(tituloDaCapa, 47, 278, {
    width: 470,
    lineGap: 3
  });
  const alturaDoTitulo = doc.heightOfString(tituloDaCapa, { width: 470, lineGap: 3 });
  doc.fillColor("#c7cecc").font("Helvetica").fontSize(12).text(SUBTITULOS[tipo], 47, 278 + alturaDoTitulo + 18, {
    width: 425,
    lineGap: 4
  });
  doc.moveTo(47, 489).lineTo(548, 489).lineWidth(.7).strokeColor(CORES.ouro).strokeOpacity(.55).stroke().strokeOpacity(1);
  const metadados: Array<[string, unknown]> = [
    [
      relatorioColetivo ? "ESCOPO" : "PARTICIPANTE",
      relatorioColetivo
        ? identificacao.organizacao
        : `${identificacao.nomeCompleto} · CPF ${identificacao.cpf}`
    ],
    ["SESSÃO", sessao.nome_operacional ?? sessao.nome ?? "Sessão registrada"],
    ["ORGANIZAÇÃO", identificacao.organizacao],
    ["RESPONSABILIDADE PROFISSIONAL", usuario.nome ?? "Profissional responsável registrado"],
    ["DATA", data(sessao.finalizado_em ?? sessao.iniciado_em ?? relatorio.criado_em)],
    ["VERSÃO DOCUMENTAL", relatorio.numero_da_versao ?? "Não registrada"]
  ];
  metadados.forEach(([rotulo, valor], indice) => {
    const coluna = indice % 2;
    const linha = Math.floor(indice / 2);
    const x = 47 + coluna * 255;
    const y = 516 + linha * 68;
    doc.fillColor(CORES.ouroClaro).font("Helvetica-Bold").fontSize(6.4).text(rotulo, x, y, {
      width: 220,
      characterSpacing: 1.1
    });
    doc.fillColor("#e3e7e5").font("Helvetica").fontSize(9).text(aparar(texto(valor), 88), x, y + 14, {
      width: 220,
      height: 38
    });
  });
  doc.fillColor("#8f9997").font("Helvetica").fontSize(7).text(
    tipo === "CIENTIFICO_TIRH" || tipo === "TECNICO"
      ? `Rastreabilidade científica e técnica preservada · ${VERSAO_DOCUMENTAL_TIRH}`
      : `Documento versionado pela HUMANEXUS · ${VERSAO_DOCUMENTAL_TIRH}`,
    47,
    779,
    { width: 500, height: 9, lineBreak: false }
  );
}

function novaPagina(
  doc: PDFKit.PDFDocument,
  secao: string,
  titulo: string,
  subtitulo?: string
) {
  doc.addPage({ size: "A4", margin: 42 });
  doc.rect(0, 0, 595.28, 841.89).fill(CORES.papel);
  const margemX = 42;
  const larguraUtil = 511;
  const tituloY = 61;
  doc.fillColor(CORES.ouro).font("Helvetica-Bold").fontSize(7).text(secao.toUpperCase(), 42, 38, {
    width: 420,
    characterSpacing: 1.35
  });
  doc.fillColor(CORES.tinta).font("Helvetica-Bold").fontSize(23).text(titulo, margemX, tituloY, {
    width: larguraUtil,
    lineGap: 2
  });
  const alturaDoTitulo = doc.heightOfString(titulo, { width: larguraUtil, lineGap: 2 });
  let baseY = tituloY + alturaDoTitulo;
  if (subtitulo) {
    const subtituloY = baseY + 10;
    doc.fillColor(CORES.suave).font("Helvetica").fontSize(9).text(subtitulo, margemX, subtituloY, {
      width: larguraUtil,
      lineGap: 3
    });
    baseY = subtituloY + doc.heightOfString(subtitulo, { width: larguraUtil, lineGap: 3 });
  }
  const linhaY = Math.max(128, baseY + 17);
  doc.moveTo(margemX, linhaY).lineTo(553, linhaY).lineWidth(.6).strokeColor(CORES.linha).stroke();
  return linhaY + 22;
}

function tituloSecao(doc: PDFKit.PDFDocument, titulo: string, y: number, numeroSecao?: string) {
  if (numeroSecao) {
    doc.fillColor(CORES.ouro).font("Helvetica-Bold").fontSize(7).text(numeroSecao, 42, y + 4, {
      width: 35,
      characterSpacing: 1
    });
  }
  doc.fillColor(CORES.tinta).font("Helvetica-Bold").fontSize(14).text(titulo, numeroSecao ? 83 : 42, y, {
    width: numeroSecao ? 470 : 511
  });
  return y + 25;
}

function paragrafo(doc: PDFKit.PDFDocument, conteudo: string, y: number, opcoes?: { x?: number; width?: number; cor?: string; tamanho?: number }) {
  const x = opcoes?.x ?? 42;
  const width = opcoes?.width ?? 511;
  const tamanho = opcoes?.tamanho ?? 9.2;
  doc.fillColor(opcoes?.cor ?? CORES.texto).font("Helvetica").fontSize(tamanho).text(conteudo, x, y, {
    width,
    lineGap: 3
  });
  return y + doc.heightOfString(conteudo, { width, lineGap: 3 }) + 11;
}

function etiqueta(doc: PDFKit.PDFDocument, rotulo: string, valor: string, x: number, y: number, width: number) {
  doc.fillColor(CORES.ouro).font("Helvetica-Bold").fontSize(6.2).text(rotulo.toUpperCase(), x, y, {
    width,
    characterSpacing: .9
  });
  doc.fillColor(CORES.tinta).font("Helvetica").fontSize(9).text(valor, x, y + 13, { width, height: 30 });
}

function ausencia(doc: PDFKit.PDFDocument, titulo: string, motivo: string, x: number, y: number, width: number, height = 70) {
  doc.save().roundedRect(x, y, width, height, 4).lineWidth(.7).dash(3, { space: 3 }).strokeColor(CORES.cinza).stroke().undash();
  doc.fillColor(CORES.suave).font("Helvetica-Bold").fontSize(8).text(titulo, x + 13, y + 13, { width: width - 26 });
  doc.fillColor(CORES.suave).font("Helvetica").fontSize(7.5).text(motivo, x + 13, y + 31, { width: width - 26, lineGap: 2 });
  doc.restore();
}

function documentoTirh(entrada: EntradaRelatorioHumanexus) {
  return objeto(
    entrada.relatorio.documento_tirh
    ?? entrada.relatorio.conteudo_tirh
    ?? objeto(entrada.relatorio.contexto_json).documento_tirh
  );
}

function projecaoTirhV1(entrada: EntradaRelatorioHumanexus) {
  const resposta = objeto(entrada.tirhV1);
  const sintese = objeto(resposta.sintese);
  return Object.keys(sintese).length
    ? {
        ...sintese,
        versao_cientifica: sintese.versao_cientifica ?? resposta.versao_cientifica,
        claims: sintese.claims ?? resposta.claims,
        validacao_profissional:
          sintese.validacao_profissional ?? resposta.validacao_profissional
      }
    : resposta;
}

function projecaoCanonicaTirhV1Disponivel(entrada: EntradaRelatorioHumanexus) {
  const projecao = projecaoTirhV1(entrada);
  const codigos = new Set(
    vetoresDaProjecaoTirhV1(entrada)
      .map((item) => texto(item.codigo, "").toUpperCase())
      .filter((codigo) => codigo !== VETOR_LONGITUDINAL[0])
  );
  return VETORES_OFICIAIS.every(([codigo]) => codigos.has(codigo))
    && Object.keys(objeto(projecao.resultante)).length > 0
    && Object.keys(objeto(projecao.iirh)).length > 0
    && Object.keys(objeto(projecao.zona)).length > 0;
}

function vetoresDaProjecaoTirhV1(entrada: EntradaRelatorioHumanexus): Registro[] {
  const vetores = projecaoTirhV1(entrada).vetores;
  if (Array.isArray(vetores)) return vetores.map(objeto);
  return Object.entries(objeto(vetores)).map(([codigo, valor]) => ({
    ...objeto(valor),
    codigo: objeto(valor).codigo ?? codigo
  }));
}

function vetoresDoContratoHistorico(entrada: EntradaRelatorioHumanexus): Registro[] {
  if (entrada.contratoDocumental !== "LEGACY_HISTORICO") return [];
  const leituraCientifica = objeto(
    objeto(entrada.cockpitOperacional).leitura_cientifica
  );
  return compatibilizarVetoresDoSnapshotHistorico(
    leituraCientifica.vetores
  ).vetoresMomentaneosCanonicos;
}

function extrairVetores(entrada: EntradaRelatorioHumanexus): Vetor[] {
  const origem = documentoTirh(entrada);
  const canonicos = vetoresDaProjecaoTirhV1(entrada);
  const historicos = vetoresDoContratoHistorico(entrada);
  const registros = canonicos.length
    ? canonicos
    : entrada.contratoDocumental === "LEGACY_HISTORICO"
      ? historicos
      : lista(origem.vetores ?? entrada.relatorio.vetores_json).map((item) => objeto(item));
  return VETORES_OFICIAIS.map(([codigo, nome, macrocampo]) => {
    const registro = registros.find((item) => texto(item.codigo, "").toUpperCase() === codigo) ?? {};
    return {
      codigo,
      nome,
      macrocampo,
      magnitude: numero(registro.magnitude ?? registro.valor),
      confianca: proporcao(registro.confianca),
      estado: texto(registro.estado, numero(registro.magnitude ?? registro.valor) == null ? "AUSENTE" : "CALCULÁVEL"),
      motivo: texto(registro.motivo, "Evidência ou cobertura não registrada.")
    };
  });
}

function extrairTrajetoria(entrada: EntradaRelatorioHumanexus): PontoTrajetoria[] {
  const projecaoV1 = projecaoTirhV1(entrada);
  if (Object.keys(projecaoV1).length) {
    return lista(projecaoV1.trajetoria).map((item, indice) => {
      const registro = objeto(item);
      return {
        rotulo: texto(registro.rotulo ?? registro.fase, `Ponto ${indice + 1}`),
        valor: numero(registro.valor ?? registro.iirh ?? registro.magnitude),
        zona: normalizarZona(registro.zona)
      };
    });
  }
  const origem = documentoTirh(entrada);
  const explicita = lista(origem.trajetoria).map((item) => objeto(item));
  if (explicita.length) {
    return explicita.map((item, indice) => ({
      rotulo: texto(item.rotulo ?? item.fase, `Ponto ${indice + 1}`),
      valor: numero(item.valor ?? item.iirh ?? item.magnitude),
      zona: normalizarZona(item.zona)
    }));
  }
  const momentos = Array.isArray(entrada.ciclo?.momentos) ? entrada.ciclo.momentos as Registro[] : [];
  return momentos.map((momento) => {
    const dados = objeto(momento.dados_preservados_json);
    return {
      rotulo: texto(momento.momento, "Momento"),
      valor: numero(dados.iirh ?? momento.iirh),
      zona: normalizarZona(dados.zona ?? momento.zona)
    };
  });
}

function extrairItens(entrada: EntradaRelatorioHumanexus, chave: string): Registro[] {
  const origem = documentoTirh(entrada);
  return lista(origem[chave]).map((item) => objeto(item));
}

function valorResultante(entrada: EntradaRelatorioHumanexus) {
  const canonica = objeto(projecaoTirhV1(entrada).resultante);
  if (Object.keys(canonica).length) return canonica;
  const origem = documentoTirh(entrada);
  return objeto(origem.resultante ?? entrada.relatorio.resultante_json);
}

function estadoZona(entrada: EntradaRelatorioHumanexus) {
  const canonica = objeto(projecaoTirhV1(entrada).zona);
  if (Object.keys(canonica).length) return canonica;
  const origem = documentoTirh(entrada);
  return objeto(origem.zona ?? entrada.relatorio.zona_json);
}

function disponibilidadeContinuaDoRelatorio(
  entrada: EntradaRelatorioHumanexus
) {
  return resolverDisponibilidadeContinuaIirhZona(
    objeto(entrada.cockpitOperacional).leitura_cientifica
  );
}

function itensDeSecao(entrada: EntradaRelatorioHumanexus, codigo: string) {
  const secoes = lista(
    entrada.relatorio.secoes ?? entrada.relatorio.secoes_json
  ).map((item) => objeto(item));
  const secao = secoes.find((item) => texto(item.codigo, "") === codigo);
  return lista(secao?.itens).map((item) => texto(item, "")).filter(Boolean);
}

function textoDeSecao(entrada: EntradaRelatorioHumanexus, codigo: string, ausenciaTexto: string) {
  const itens = itensDeSecao(entrada, codigo);
  return itens.length ? itens.join(" ") : ausenciaTexto;
}

function identificacaoDocumental(entrada: EntradaRelatorioHumanexus) {
  const identidadeDoCore = objeto(entrada.relatorio.identidade_documental);
  return resolverIdentidadeDocumental(
    entrada.participante,
    Object.keys(objeto(entrada.organizacao)).length
      ? objeto(entrada.organizacao)
      : {
          identificador: entrada.participante.identificador_da_organizacao,
          nome: identidadeDoCore.organizacao
        }
  );
}

function desenharRadarVetorial(doc: PDFKit.PDFDocument, vetores: Vetor[], x: number, y: number, raio: number) {
  const centroX = x + raio;
  const centroY = y + raio;
  const validos = vetores.filter((item) => item.magnitude != null);
  for (let nivel = 1; nivel <= 4; nivel += 1) {
    const r = raio * nivel / 4;
    const pontos = vetores.map((_, indice) => {
      const angulo = -Math.PI / 2 + indice * Math.PI * 2 / vetores.length;
      return [centroX + Math.cos(angulo) * r, centroY + Math.sin(angulo) * r];
    });
    doc.polygon(...pontos).lineWidth(.45).strokeColor(nivel === 4 ? CORES.cinza : CORES.linha).stroke();
  }
  vetores.forEach((vetor, indice) => {
    const angulo = -Math.PI / 2 + indice * Math.PI * 2 / vetores.length;
    const ax = centroX + Math.cos(angulo) * raio;
    const ay = centroY + Math.sin(angulo) * raio;
    doc.moveTo(centroX, centroY).lineTo(ax, ay).lineWidth(.35).strokeColor(CORES.linha).stroke();
    const lx = centroX + Math.cos(angulo) * (raio + 15) - 16;
    const ly = centroY + Math.sin(angulo) * (raio + 15) - 3;
    doc.fillColor(CORES.suave).font("Helvetica-Bold").fontSize(6).text(vetor.codigo, lx, ly, { width: 32, align: "center" });
  });
  if (validos.length) {
    const pontos = vetores.map((vetor, indice): [number, number] | null => {
      if (vetor.magnitude == null) return null;
      const valor = Math.max(0, Math.min(100, vetor.magnitude)) / 100;
      const angulo = -Math.PI / 2 + indice * Math.PI * 2 / vetores.length;
      return [
        centroX + Math.cos(angulo) * raio * valor,
        centroY + Math.sin(angulo) * raio * valor
      ];
    });
    if (validos.length === vetores.length) {
      doc.save()
        .polygon(...pontos.filter((item): item is [number, number] => item != null))
        .fillOpacity(.13)
        .fillAndStroke(CORES.petroleo, CORES.petroleo)
        .fillOpacity(1)
        .restore();
    } else {
      pontos.forEach((ponto, indice) => {
        const proximo = pontos[indice + 1];
        if (!ponto || !proximo) return;
        doc.moveTo(ponto[0], ponto[1]).lineTo(proximo[0], proximo[1])
          .lineWidth(1.2).strokeColor(CORES.petroleo).stroke();
      });
    }
    pontos.forEach((ponto) => {
      if (!ponto) return;
      doc.circle(ponto[0], ponto[1], 2.4)
        .fillColor(CORES.papel).fillAndStroke(CORES.papel, CORES.petroleo);
    });
  } else {
    doc.circle(centroX, centroY, 3).fill(CORES.cinza);
    doc.fillColor(CORES.suave).font("Helvetica").fontSize(7).text("Configuração multivetorial ainda ausente", x, centroY + raio + 30, {
      width: raio * 2,
      align: "center"
    });
  }
}

function tabelaVetores(doc: PDFKit.PDFDocument, vetores: Vetor[], x: number, y: number, width: number) {
  const linha = 32;
  doc.fillColor(CORES.suave).font("Helvetica-Bold").fontSize(5.5).text("VETOR", x, y, { width: 30, characterSpacing: .6 });
  doc.text("MAG.", x + 35, y, { width: 45 });
  doc.text("CONF.", x + 86, y, { width: 43 });
  doc.text("ESTADO", x + 134, y, { width: width - 134 });
  vetores.forEach((vetor, indice) => {
    const yy = y + 15 + indice * linha;
    doc.moveTo(x, yy - 5).lineTo(x + width, yy - 5).lineWidth(.35).strokeColor(CORES.linha).stroke();
    doc.fillColor(CORES.ouro).font("Helvetica-Bold").fontSize(6.8).text(vetor.codigo, x, yy, { width: 30 });
    doc.fillColor(CORES.tinta).font("Helvetica").fontSize(6.8).text(
      vetor.magnitude == null ? "—" : vetor.magnitude.toFixed(1),
      x + 35,
      yy,
      { width: 45 }
    );
    doc.text(vetor.confianca == null ? "—" : `${Math.round(vetor.confianca * 100)}%`, x + 86, yy, { width: 43 });
    doc.fillColor(vetor.magnitude == null ? CORES.suave : CORES.petroleo).fontSize(6.2).text(aparar(vetor.estado, 24), x + 134, yy, {
      width: width - 134
    });
  });
}

function desenharResultante(doc: PDFKit.PDFDocument, resultante: Registro, x: number, y: number, width: number, height: number) {
  const magnitude = numero(resultante.magnitude);
  const direcao = numero(resultante.direcao_graus ?? resultante.direcao);
  const cx = x + width * .42;
  const cy = y + height * .52;
  const raio = Math.min(width * .28, height * .36);
  doc.circle(cx, cy, raio).lineWidth(.6).strokeColor(CORES.linha).stroke();
  doc.circle(cx, cy, raio * .55).lineWidth(.35).strokeColor(CORES.linha).stroke();
  doc.moveTo(cx - raio, cy).lineTo(cx + raio, cy).moveTo(cx, cy - raio).lineTo(cx, cy + raio).lineWidth(.35).strokeColor(CORES.linha).stroke();
  if (magnitude != null && direcao != null) {
    const angulo = (direcao - 90) * Math.PI / 180;
    const comprimento = raio * Math.max(0, Math.min(100, magnitude)) / 100;
    const px = cx + Math.cos(angulo) * comprimento;
    const py = cy + Math.sin(angulo) * comprimento;
    doc.moveTo(cx, cy).lineTo(px, py).lineWidth(3).strokeColor(CORES.ouro).stroke();
    doc.circle(px, py, 4).fill(CORES.ouroClaro);
  } else {
    doc.circle(cx, cy, 4).fill(CORES.cinza);
  }
  const tx = x + width * .73;
  etiqueta(doc, "MAGNITUDE", magnitude == null ? "Ausente" : magnitude.toFixed(1), tx, y + 28, width * .24);
  etiqueta(doc, "DIREÇÃO", direcao == null ? "Não determinada" : `${direcao.toFixed(0)}°`, tx, y + 78, width * .24);
  etiqueta(doc, "SENTIDO", texto(resultante.sentido, "Não determinado"), tx, y + 128, width * .24);
  etiqueta(doc, "CONFIANÇA", proporcao(resultante.confianca) == null ? "Não registrada" : `${Math.round((proporcao(resultante.confianca) ?? 0) * 100)}%`, tx, y + 178, width * .24);
}

function desenharTrajetoria(doc: PDFKit.PDFDocument, pontos: PontoTrajetoria[], x: number, y: number, width: number, height: number) {
  [0, 25, 50, 75, 100].forEach((marco) => {
    const py = y + height - height * marco / 100;
    doc.moveTo(x, py).lineTo(x + width, py)
      .lineWidth(.35).strokeColor(CORES.linha).stroke();
    doc.fillColor(CORES.suave).font("Helvetica").fontSize(5.5)
      .text(`${marco}`, x - 22, py - 3, { width: 18, align: "right" });
  });
  const validos = pontos.filter((item) => item.valor != null);
  if (validos.length) {
    pontos.forEach((ponto, indice) => {
      if (ponto.valor == null) return;
      const px = x + 18 + (width - 36) * indice / Math.max(1, pontos.length - 1);
      const py = y + height - height * Math.max(0, Math.min(100, ponto.valor)) / 100;
      const anterior = pontos.slice(0, indice).reverse().find((item) => item.valor != null);
      if (anterior) {
        const anteriorIndice = pontos.indexOf(anterior);
        const ax = x + 18 + (width - 36) * anteriorIndice / Math.max(1, pontos.length - 1);
        const ay = y + height - height * Math.max(0, Math.min(100, Number(anterior.valor))) / 100;
        doc.moveTo(ax, ay).lineTo(px, py).lineWidth(1.5).strokeColor(CORES.petroleo).stroke();
      }
      doc.circle(px, py, 3).fillColor(CORES.papel).fillAndStroke(CORES.papel, CORES.petroleo);
      doc.fillColor(CORES.suave).font("Helvetica").fontSize(6).text(ponto.rotulo, px - 30, y + height + 8, { width: 60, align: "center" });
      doc.fillColor(CORES.ouro).font("Helvetica-Bold").fontSize(5.4)
        .text(ponto.zona, px - 42, py - 14, { width: 84, align: "center" });
    });
  } else {
    doc.fillColor(CORES.suave).font("Helvetica").fontSize(8).text("Trajetória não inferível com os pontos preservados.", x + 25, y + height / 2 - 5, {
      width: width - 50,
      align: "center"
    });
  }
}

function desenharRotas(doc: PDFKit.PDFDocument, entrada: EntradaRelatorioHumanexus, x: number, y: number, width: number) {
  const origem = documentoTirh(entrada);
  const cadeia = objeto(objeto(entrada.cockpitOperacional).cadeia_cientifica);
  const usarCadeiaV1 = entrada.contratoDocumental === "TIRH_V1";
  const rotas = [
    ["ARR", objeto(usarCadeiaV1 ? cadeia.arr : origem.arr), "Análise das Rotas Regulatórias"],
    ["RRD", objeto(usarCadeiaV1 ? cadeia.rota_dominante : origem.rota_dominante), "Rota Regulatória Dominante"],
    ["GRI / CRL", objeto(usarCadeiaV1 ? cadeia.arr : origem.arr), "Ganho imediato / custo longitudinal"],
    ["NRA", objeto(usarCadeiaV1 ? cadeia.nra : origem.nra), "Nova Rota Adaptativa"]
  ] as const;
  const cardWidth = (width - 18) / 2;
  const cardHeight = 91;
  rotas.forEach(([codigo, registro, nome], indice) => {
    const coluna = indice % 2;
    const linha = Math.floor(indice / 2);
    const xx = x + coluna * (cardWidth + 18);
    const yy = y + linha * (cardHeight + 13);
    doc.roundedRect(xx, yy, cardWidth, cardHeight, 3).lineWidth(.45).strokeColor(CORES.linha).stroke();
    doc.fillColor(CORES.ouro).font("Helvetica-Bold").fontSize(7.4).text(codigo, xx + 12, yy + 11, { width: cardWidth - 24, characterSpacing: .8 });
    doc.fillColor(CORES.tinta).font("Helvetica-Bold").fontSize(8.4).text(nome, xx + 12, yy + 27, { width: cardWidth - 24, height: 22 });
    doc.fillColor(CORES.petroleo).font("Helvetica-Bold").fontSize(6.5).text(texto(registro.estado, "NÃO CALCULÁVEL"), xx + 12, yy + 50, { width: cardWidth - 24 });
    doc.fillColor(CORES.suave).font("Helvetica").fontSize(7).text(
      aparar(texto(registro.descricao ?? registro.motivo, "Sem registro autorizado para esta sessão."), 120),
      xx + 12,
      yy + 66,
      { width: cardWidth - 24, height: 18, lineGap: 1 }
    );
  });
}

function listaEditorial(doc: PDFKit.PDFDocument, itens: string[], x: number, y: number, width: number, maximo = 8) {
  let atual = y;
  const visiveis = itens.slice(0, maximo);
  if (!visiveis.length) {
    doc.fillColor(CORES.suave).font("Helvetica").fontSize(8).text("Nenhum registro autorizado para esta seção.", x, atual, { width });
    return atual + 28;
  }
  visiveis.forEach((item) => {
    doc.circle(x + 3, atual + 4, 1.7).fill(CORES.ouro);
    doc.fillColor(CORES.texto).font("Helvetica").fontSize(8.2).text(item, x + 14, atual, { width: width - 14, lineGap: 2 });
    atual += doc.heightOfString(item, { width: width - 14, lineGap: 2 }) + 9;
  });
  return atual;
}

function barrasHorizontais(doc: PDFKit.PDFDocument, itens: Registro[], x: number, y: number, width: number, height: number) {
  const validos = itens.slice(0, 7);
  if (!validos.length) {
    ausencia(doc, "Evolução não disponível", "Não há agregados comparáveis preservados.", x, y, width, height);
    return;
  }
  const linha = Math.min(38, height / validos.length);
  validos.forEach((item, indice) => {
    const yy = y + indice * linha;
    const valorRegistrado = numero(item.valor ?? item.ganho ?? item.magnitude);
    doc.fillColor(CORES.texto).font("Helvetica").fontSize(7).text(texto(item.rotulo ?? item.nome, `Indicador ${indice + 1}`), x, yy, { width: 116 });
    doc.roundedRect(x + 122, yy + 1, width - 155, 7, 3.5).fill("#e7e6df");
    if (valorRegistrado != null) {
      const valor = Math.max(0, Math.min(100, valorRegistrado));
      doc.roundedRect(x + 122, yy + 1, (width - 155) * valor / 100, 7, 3.5).fill(CORES.petroleo);
      doc.fillColor(CORES.suave).font("Helvetica").fontSize(6.5).text(valor.toFixed(0), x + width - 28, yy, { width: 28, align: "right" });
    } else {
      doc.fillColor(CORES.suave).font("Helvetica").fontSize(6.5).text("—", x + width - 28, yy, { width: 28, align: "right" });
    }
  });
}

function metricasTecnicas(entrada: EntradaRelatorioHumanexus) {
  const ordenada = [...entrada.telemetria].sort((a, b) => Number(a.sequencia) - Number(b.sequencia));
  const latencias = ordenada.map((item) => numero(item.latencia_ms)).filter((item): item is number => item != null);
  const buffers = ordenada.map((item) => numero(objeto(objeto(item.dado_normalizado_json).valor).buffer)).filter((item): item is number => item != null);
  const frequencias = ordenada.map((item, indice) => {
    if (!indice) return null;
    const atual = new Date(String(item.timestamp_de_origem)).getTime();
    const anterior = new Date(String(ordenada[indice - 1].timestamp_de_origem)).getTime();
    return atual > anterior ? 1000 / (atual - anterior) : null;
  }).filter((item): item is number => item != null && Number.isFinite(item));
  const media = (itens: number[]) => itens.length ? itens.reduce((soma, item) => soma + item, 0) / itens.length : null;
  return {
    pacotes: ordenada.length,
    perdas: ordenada.reduce((total, item) => total + Number(item.perda_detectada ?? 0), 0),
    foraDeOrdem: ordenada.filter((item) => Boolean(item.fora_de_ordem)).length,
    latenciaMedia: media(latencias),
    bufferMedio: media(buffers),
    frequenciaMedia: media(frequencias),
    latencias,
    buffers,
    frequencias
  };
}

function linhaTecnica(doc: PDFKit.PDFDocument, valores: number[], x: number, y: number, width: number, height: number, cor: string) {
  doc.moveTo(x, y + height).lineTo(x + width, y + height).lineWidth(.4).strokeColor(CORES.linha).stroke();
  if (!valores.length) {
    doc.fillColor(CORES.suave).font("Helvetica").fontSize(7).text("Sem série técnica disponível.", x, y + height / 2, { width, align: "center" });
    return;
  }
  const minimo = Math.min(...valores);
  const maximo = Math.max(...valores);
  const amplitude = Math.max(1, maximo - minimo);
  valores.forEach((valor, indice) => {
    const px = x + width * indice / Math.max(1, valores.length - 1);
    const py = y + height - (valor - minimo) / amplitude * height;
    if (!indice) doc.moveTo(px, py);
    else doc.lineTo(px, py);
  });
  doc.lineWidth(1.25).strokeColor(cor).stroke();
}

function fecharDocumento(doc: PDFKit.PDFDocument, tipo: TipoDocumentoTirh, entrada: EntradaRelatorioHumanexus) {
  const intervalo = doc.bufferedPageRange();
  for (let pagina = intervalo.start; pagina < intervalo.start + intervalo.count; pagina += 1) {
    if (pagina === 0) continue;
    doc.switchToPage(pagina);
    doc.moveTo(42, 774).lineTo(553, 774).lineWidth(.45).strokeColor(CORES.linha).stroke();
    doc.fillColor(CORES.suave).font("Helvetica").fontSize(6.2).text(
      `${ROTULOS[tipo]} · ${VERSAO_DOCUMENTAL_TIRH} · documento versionado HUMANEXUS`,
      42,
      782,
      { width: 420, height: 8, lineBreak: false }
    );
    doc.text(`${pagina.toString().padStart(2, "0")} / ${(intervalo.count - 1).toString().padStart(2, "0")}`, 468, 782, {
      width: 85,
      height: 8,
      align: "right",
      lineBreak: false
    });
  }
}

function renderNarrativaTirh(doc: PDFKit.PDFDocument, entrada: EntradaRelatorioHumanexus) {
  let y = novaPagina(
    doc,
    "TIRH · Fundamentos",
    "Inteligência Regulatória Humana",
    "Lacuna científica, postulados, macrocampos, Vetores, Resultante, Zonas e Trajetórias Adaptativas."
  );
  y = listaEditorial(
    doc,
    itensDeSecao(entrada, "FUNDAMENTOS_TIRH"),
    83,
    y + 5,
    455,
    8
  );
  y = tituloSecao(doc, "Como o funcionamento se sustentou", y + 8, "01");
  listaEditorial(
    doc,
    itensDeSecao(entrada, "SUSTENTACAO_DO_FUNCIONAMENTO"),
    83,
    y,
    455,
    13
  );

  y = novaPagina(
    doc,
    "TIRH · Funcionamento",
    "Gatilhos, exigências e Rotas Regulatórias",
    "O relatório distingue evidência registrada, ausência legítima e interpretação profissional."
  );
  y = tituloSecao(doc, "Gatilhos, exigências e custo regulatório", y, "01");
  y = listaEditorial(doc, itensDeSecao(entrada, "GATILHOS_E_EXIGENCIAS"), 83, y, 455, 6);
  y = tituloSecao(doc, "Rotas Regulatórias", y + 8, "02");
  y = listaEditorial(doc, itensDeSecao(entrada, "ROTAS_REGULATORIAS"), 83, y, 455, 7);
  y = tituloSecao(doc, "Condições regulatórias", y + 8, "03");
  listaEditorial(doc, itensDeSecao(entrada, "CONDICOES_REGULATORIAS"), 83, y, 455, 7);

  y = novaPagina(
    doc,
    "TIRH · Treinamento",
    "Aquisição e consolidação de Rotas Adaptativas",
    "Direcionamento do treinamento cognitivo operacional apoiado somente em evidências preservadas."
  );
  y = tituloSecao(doc, "CTR, THX, resposta e mudança regulatória", y, "01");
  y = listaEditorial(
    doc,
    itensDeSecao(entrada, "TREINAMENTO_COGNITIVO_OPERACIONAL"),
    83,
    y,
    455,
    9
  );
  y = tituloSecao(doc, "Evolução longitudinal", y + 8, "02");
  listaEditorial(
    doc,
    itensDeSecao(entrada, "EVOLUCAO_LONGITUDINAL"),
    83,
    y,
    455,
    6
  );
}

function renderOperacional(doc: PDFKit.PDFDocument, entrada: EntradaRelatorioHumanexus) {
  const origem = documentoTirh(entrada);
  const projecaoV1 = projecaoTirhV1(entrada);
  const vetores = extrairVetores(entrada);
  const vev = vetoresDaProjecaoTirhV1(entrada).find(
    (item) => texto(item.codigo, "").toUpperCase() === VETOR_LONGITUDINAL[0]
  );
  const resultante = valorResultante(entrada);
  const disponibilidadeContinua = disponibilidadeContinuaDoRelatorio(entrada);
  const iirhV1Autoritativo = disponibilidadeContinua.iirh.projecao;
  const zona = disponibilidadeContinua.zona.projecao;
  const trajetoria = extrairTrajetoria(entrada);
  const gatilhos = extrairItens(entrada, "gatilhos");
  const ganhos = extrairItens(entrada, "ganhos_regulatorios");
  const intervencoes = extrairItens(entrada, "intervencoes");
  const respostas = extrairItens(entrada, "respostas");
  const validacaoProfissional = objeto(projecaoV1.validacao_profissional);
  const claimsElegiveis = lista(validacaoProfissional.itens).map(objeto);
  const decisoesProfissionaisPreservadas = decisoesProfissionaisPreservadasTirhV1(
    lista(projecaoV1.claims).map(objeto)
  );

  let y = novaPagina(doc, "01 · Síntese", "A história regulatória da sessão", "Estado inicial, evidências admissíveis e objetivo profissional.");
  y = tituloSecao(doc, "Contexto e objetivo", y, "01");
  y = paragrafo(doc, texto(entrada.relatorio.objetivo, "Objetivo profissional não registrado."), y, { x: 83, width: 470 });
  etiqueta(doc, "ESTADO INICIAL", texto(origem.estado_inicial, "Não inferível com as evidências preservadas"), 83, y + 4, 220);
  etiqueta(doc, "FASE", texto(entrada.sessao.fase_atual ?? entrada.sessao.tipo_de_sessao, "Não registrada"), 333, y + 4, 190);
  y += 58;
  y = tituloSecao(doc, "Evidências utilizadas", y, "02");
  y = listaEditorial(doc, lista(origem.evidencias).map((item) => {
    const evidencia = objeto(item);
    return `${texto(evidencia.nome ?? evidencia.origem, "Evidência")} — ${texto(evidencia.estado, "estado não registrado")}`;
  }), 83, y, 455, 7);
  y = tituloSecao(doc, "Interpretação profissional", y + 6, "03");
  y = paragrafo(doc, texto(entrada.relatorio.interpretacao_profissional, "Interpretação ainda não registrada pelo profissional."), y, { x: 83, width: 455 });
  y = tituloSecao(doc, "Princípio de leitura", y + 6, "04");
  paragrafo(doc, "As evidências sustentam hipóteses regulatórias contextualizadas. Nenhum indicador isolado equivale a vetor, Resultante, Zona ou decisão profissional.", y, { x: 83, width: 455, cor: CORES.suave });

  y = novaPagina(doc, "02 · Arquitetura Vetorial", "Nove Vetores Momentâneos", "Magnitude, confiança e ausência preservadas sem preenchimento artificial; VEV permanece longitudinal e separado.");
  doc.fillColor(CORES.petroleo).font("Helvetica-Bold").fontSize(7).text(
    `VETORES MOMENTÂNEOS V1 · ${vetores.length}/9 PROJETADOS`,
    42,
    y,
    { width: 511, characterSpacing: .65 }
  );
  desenharRadarVetorial(doc, vetores, 42, y + 34, 120);
  tabelaVetores(doc, vetores, 320, y + 22, 233);
  paragrafo(doc, `A configuração momentânea representa interação contextual entre campos. Pontos ausentes não são conectados nem convertidos em zero. VEV — ${texto(vev?.estado_epistemico, "LONGITUDINAL NÃO ELEGÍVEL")} — não integra a Resultante momentânea.`, y + 338, { x: 42, width: 511, cor: CORES.suave, tamanho: 7.8 });

  y = novaPagina(doc, "03 · Configuração", "Resultante, Zona e Trajetória", "Produtos distintos, liberados somente sob seus próprios critérios de admissibilidade.");
  y = tituloSecao(doc, "Resultante Regulatória", y, "01");
  doc.fillColor(CORES.ouro).font("Helvetica-Bold").fontSize(6.4).text(
    texto(projecaoV1.versao_cientifica ?? resultante.versao, "HIPÓTESE OPERACIONAL v0.1 — EM VALIDAÇÃO EMPÍRICA"),
    83,
    y,
    { width: 455, characterSpacing: .75 }
  );
  y += 18;
  if (Object.keys(projecaoV1).length) {
    etiqueta(doc, "ESTADO ESTRUTURAL", texto(resultante.estado, "Não materializada"), 83, y, 205);
    etiqueta(doc, "MAGNITUDE ESCALAR", "Não aplicável na TIRH V1", 308, y, 230);
    y = paragrafo(doc, "A Resultante V1 é uma configuração emergente multivetorial estruturada. Sua admissibilidade não depende da fabricação de um escalar global.", y + 68, { x: 83, width: 455, cor: CORES.suave });
  } else if (numero(resultante.magnitude) == null) {
    ausencia(doc, "Resultante ausente", texto(resultante.motivo, "Configuração multivetorial integral não disponível."), 83, y, 455, 95);
    y += 115;
  } else {
    desenharResultante(doc, resultante, 83, y - 5, 455, 240);
    y += 255;
  }
  y += 12;
  etiqueta(doc, "ZONA OPERACIONAL", zona.classificada
    ? normalizarZona(zona.codigo ?? zona.nome)
    : rotuloDaDisponibilidadeAutoritativa(disponibilidadeContinua.zona.modo), 83, y, 200);
  etiqueta(doc, "IIRH OPERACIONAL V1", iirhV1Autoritativo.calculado
    ? `${iirhV1Autoritativo.valor!.toFixed(1)} · ${rotuloDaDisponibilidadeAutoritativa(disponibilidadeContinua.iirh.modo)}`
    : rotuloDaDisponibilidadeAutoritativa(disponibilidadeContinua.iirh.modo), 303, y, 120);
  etiqueta(doc, "CONFIANÇA", proporcao(zona.registro.confianca) == null ? "Não registrada" : `${Math.round((proporcao(zona.registro.confianca) ?? 0) * 100)}%`, 443, y, 95);
  y += 62;
  y = tituloSecao(doc, "Trajetória Regulatória", y, "02");
  desenharTrajetoria(doc, trajetoria, 83, y + 6, 430, 185);

  y = novaPagina(doc, "04 · Rotas", "ARR, RRD, GRI / CRL e NRA", "Análise, rota dominante, ganhos, custos e mudança adaptativa com validação profissional.");
  desenharRotas(doc, entrada, 42, y + 6, 511);
  y += 220;
  y = tituloSecao(doc, "Gatilhos regulatórios", y, "01");
  y = listaEditorial(doc, gatilhos.map((item) => `${texto(item.nome ?? item.rotulo, "Gatilho")} — ${texto(item.contexto ?? item.descricao, "contexto não registrado")}`), 83, y, 455, 6);
  y = tituloSecao(doc, "Ganhos regulatórios", y + 4, "02");
  barrasHorizontais(doc, ganhos, 83, y + 4, 430, 160);

  y = novaPagina(doc, "05 · Decisão", "Intervenções, respostas e conclusão", "Registro profissional, justificativa e recomendação sem decisão automática.");
  y = tituloSecao(doc, "Intervenções registradas", y, "01");
  y = listaEditorial(doc, intervencoes.map((item) => `${texto(item.nome ?? item.tipo, "Intervenção")} — ${texto(item.justificativa ?? item.descricao, "sem descrição")}`), 83, y, 455, 5);
  y = tituloSecao(doc, "Respostas observadas", y + 4, "02");
  y = listaEditorial(doc, respostas.map((item) => `${texto(item.momento ?? item.tipo, "Resposta")} — ${texto(item.descricao ?? item.resultado, "sem descrição")}`), 83, y, 455, 5);
  y = tituloSecao(doc, "Conclusão operacional", y + 6, "03");
  y = paragrafo(doc, texto(origem.conclusao_operacional ?? entrada.relatorio.interpretacao_profissional, "Conclusão profissional pendente."), y, { x: 83, width: 455 });
  y = tituloSecao(doc, "Justificativa e recomendação", y + 6, "04");
  y = paragrafo(doc, texto(origem.justificativa_profissional, "Justificativa profissional não registrada."), y, { x: 83, width: 455 });
  y = paragrafo(doc, texto(origem.recomendacao, "Recomendação não registrada."), y, { x: 83, width: 455 });
  y = tituloSecao(doc, "Validação Profissional V1", y + 5, "05");
  etiqueta(doc, "ESTADO", texto(validacaoProfissional.estado, claimsElegiveis.length ? "PENDENTE" : "COMPLETA"), 83, y, 205);
  etiqueta(doc, "AFIRMAÇÕES CIENTÍFICAS ELEGÍVEIS", String(validacaoProfissional.quantidade ?? claimsElegiveis.length), 308, y, 230);
  const itensDaValidacao = decisoesProfissionaisPreservadas.length
    ? decisoesProfissionaisPreservadas.map((validacao) => (
        `Decisão preservada: ${texto(validacao.decisao)} · `
        + `Estado efetivo: ${texto(validacao.estado)} · `
        + `Versão ${texto(validacao.versao_da_validacao)} · `
        + `Registrada em ${texto(validacao.criado_em, "data não exposta")}`
      ))
    : claimsElegiveis.map((claim) => (
        `${texto(claim.claim_id)} · ${texto(claim.tipo)} · `
        + `${texto(claim.estado_da_validacao_profissional, "PENDENTE")}`
      ));
  listaEditorial(
    doc,
    itensDaValidacao,
    83,
    y + 45,
    455,
    4
  );
  doc.moveTo(83, 724).lineTo(350, 724).lineWidth(.55).strokeColor(CORES.cinza).stroke();
  doc.fillColor(CORES.suave).font("Helvetica").fontSize(7).text("Assinatura do profissional responsável", 83, 733);
  renderNarrativaTirh(doc, entrada);
}

function renderCientifico(doc: PDFKit.PDFDocument, entrada: EntradaRelatorioHumanexus) {
  const origem = documentoTirh(entrada);
  const vetores = extrairVetores(entrada);
  const resultante = valorResultante(entrada);
  const fontes = extrairItens(entrada, "fontes");
  const evidencias = extrairItens(entrada, "evidencias");
  const limitacoes = lista(origem.limitacoes).map((item) => texto(item));

  let y = novaPagina(doc, "01 · Método", "Desenho científico e critérios de leitura", "Proveniência, admissibilidade e limites da inferência regulatória.");
  y = tituloSecao(doc, "Objeto de observação", y, "01");
  y = paragrafo(doc, "O objeto é o processo regulatório contextualizado. Desempenho, comportamento e sensores constituem manifestações ou fontes parciais, nunca equivalentes isolados da TIRH.", y, { x: 83, width: 455 });
  y = tituloSecao(doc, "Método", y + 7, "02");
  y = paragrafo(doc, texto(origem.metodologia, "Método não descrito no registro desta sessão."), y, { x: 83, width: 455 });
  y = tituloSecao(doc, "Critérios de admissibilidade", y + 7, "03");
  y = listaEditorial(doc, lista(origem.criterios_admissibilidade).map((item) => texto(item)), 83, y, 455, 8);
  y = tituloSecao(doc, "Versões", y + 7, "04");
  etiqueta(doc, "BIBLIOTECA", texto(origem.versao_biblioteca, "Não registrada"), 83, y, 205);
  etiqueta(doc, "MOTOR", texto(origem.versao_motor, "Não registrada"), 313, y, 205);
  const indicadoresContratados = lista(entrada.contratoCientifico.indicadores)
    .map((item) => texto(objeto(item).nome ?? objeto(item).codigo ?? item))
    .filter(Boolean)
    .slice(0, 5);
  if (indicadoresContratados.length) {
    y = tituloSecao(doc, "Indicadores contratados", y + 55, "05");
    listaEditorial(doc, indicadoresContratados, 83, y, 455, 5);
  }

  y = novaPagina(doc, "02 · Evidências", "Matriz de evidências e fontes", "Qualidade, cobertura e confiança por origem autorizada.");
  const linhas = evidencias.length ? evidencias : fontes;
  if (!linhas.length) {
    ausencia(doc, "Matriz não disponível", "Nenhuma fonte ou evidência foi referenciada no documento.", 42, y + 8, 511, 100);
  } else {
    doc.fillColor(CORES.suave).font("Helvetica-Bold").fontSize(6).text("EVIDÊNCIA / FONTE", 42, y, { width: 205, characterSpacing: .7 });
    doc.text("QUALIDADE", 270, y, { width: 75 });
    doc.text("COBERTURA", 360, y, { width: 75 });
    doc.text("ESTADO", 450, y, { width: 95 });
    linhas.slice(0, 13).forEach((item, indice) => {
      const yy = y + 22 + indice * 39;
      doc.moveTo(42, yy - 7).lineTo(553, yy - 7).lineWidth(.35).strokeColor(CORES.linha).stroke();
      doc.fillColor(CORES.tinta).font("Helvetica").fontSize(7.5).text(texto(item.nome ?? item.origem, "Evidência"), 42, yy, { width: 205 });
      doc.text(proporcao(item.qualidade) == null ? "—" : `${Math.round((proporcao(item.qualidade) ?? 0) * 100)}%`, 270, yy, { width: 75 });
      doc.text(proporcao(item.cobertura) == null ? "—" : `${Math.round((proporcao(item.cobertura) ?? 0) * 100)}%`, 360, yy, { width: 75 });
      doc.fillColor(CORES.petroleo).text(texto(item.estado, "Não avaliada"), 450, yy, { width: 95 });
    });
  }

  y = novaPagina(doc, "03 · Inferência", "Vetores e Resultante", "Resultados somente quando a Biblioteca autoriza; incerteza preservada.");
  desenharRadarVetorial(doc, vetores, 46, y + 8, 122);
  tabelaVetores(doc, vetores, 315, y + 4, 238);
  y = 515;
  y = tituloSecao(doc, "Resultante Regulatória", y, "01");
  if (numero(resultante.magnitude) == null) {
    ausencia(doc, "Não calculável", texto(resultante.motivo, "Admissibilidade integral não satisfeita."), 83, y, 455, 90);
  } else {
    etiqueta(doc, "MAGNITUDE", numero(resultante.magnitude)!.toFixed(1), 83, y, 120);
    etiqueta(doc, "DIREÇÃO", texto(resultante.direcao_graus ?? resultante.direcao, "Não determinada"), 223, y, 120);
    etiqueta(doc, "CONFIANÇA", proporcao(resultante.confianca) == null ? "—" : `${Math.round((proporcao(resultante.confianca) ?? 0) * 100)}%`, 363, y, 120);
  }
  y += 72;
  y = tituloSecao(doc, "Separações ontológicas", y, "02");
  paragrafo(doc, "Resultante, IIRH, Zona Operacional, Trajetória e Vetor Evolução permanecem produtos distintos. Nenhuma equivalência automática é aplicada.", y, { x: 83, width: 455, cor: CORES.suave });

  y = novaPagina(doc, "04 · Auditoria", "Limitações e rastreabilidade científica", "O documento declara o que sustenta cada leitura e o que permanece ausente.");
  y = tituloSecao(doc, "Limitações", y, "01");
  y = listaEditorial(doc, limitacoes, 83, y, 455, 9);
  y = tituloSecao(doc, "Rastreabilidade", y + 8, "02");
  y = listaEditorial(doc, [
    `Relatório: ${texto(entrada.relatorio.identificador)}`,
    `Sessão: ${texto(entrada.sessao.identificador)}`,
    `Contrato científico: ${texto(entrada.contratoCientifico.versao ?? entrada.relatorio.versao_do_contrato)}`,
    `Profissional responsável: ${texto(entrada.usuario.nome ?? entrada.usuario.identificador)}`,
    "Ausência de evidência permanece nula e não é interpretada como normalidade, neutralidade ou zero."
  ], 83, y, 455, 8);
  y = tituloSecao(doc, "Conclusão científica", y + 8, "03");
  paragrafo(doc, texto(origem.conclusao_cientifica, "Conclusão científica não registrada."), y, { x: 83, width: 455 });
  renderNarrativaTirh(doc, entrada);
}

function renderExecutivo(doc: PDFKit.PDFDocument, entrada: EntradaRelatorioHumanexus) {
  const origem = documentoTirh(entrada);
  const tendencias = extrairItens(entrada, "tendencias");
  const ganhos = extrairItens(entrada, "ganhos_regulatorios");
  const riscos = extrairItens(entrada, "riscos");
  const recomendacoes = extrairItens(entrada, "recomendacoes");

  let y = novaPagina(doc, "01 · Visão Executiva", "Estado, evolução e tendência", "Leitura agregada para decisão organizacional sem exposição de dados sensíveis.");
  etiqueta(doc, "EVOLUÇÃO", texto(origem.evolucao_executiva, "Não determinada"), 42, y + 7, 150);
  etiqueta(doc, "ESTABILIDADE", texto(origem.estabilidade_executiva, "Não determinada"), 213, y + 7, 150);
  etiqueta(doc, "TENDÊNCIA", texto(origem.tendencia_executiva, "Não determinada"), 384, y + 7, 150);
  y += 75;
  y = tituloSecao(doc, "Síntese para decisão", y, "01");
  y = paragrafo(doc, texto(origem.sintese_executiva ?? entrada.relatorio.interpretacao_profissional, "Síntese executiva não registrada."), y, { x: 83, width: 455 });
  y = tituloSecao(doc, "Indicadores e tendências", y + 7, "02");
  barrasHorizontais(doc, tendencias, 83, y + 5, 430, 200);
  y += 220;
  y = tituloSecao(doc, "Ganhos regulatórios", y, "03");
  barrasHorizontais(doc, ganhos, 83, y + 5, 430, 150);

  y = novaPagina(doc, "02 · Decisão", "Riscos, recomendações e próximos passos", "Recomendações apoiam o julgamento; não constituem decisão automática.");
  y = tituloSecao(doc, "Riscos e pontos de atenção", y, "01");
  y = listaEditorial(doc, riscos.map((item) => `${texto(item.nome ?? item.rotulo, "Ponto de atenção")} — ${texto(item.descricao ?? item.contexto, "sem descrição")}`), 83, y, 455, 7);
  y = tituloSecao(doc, "Recomendações", y + 8, "02");
  y = listaEditorial(doc, recomendacoes.map((item) => `${texto(item.nome ?? item.rotulo, "Recomendação")} — ${texto(item.descricao ?? item.justificativa, "sem descrição")}`), 83, y, 455, 7);
  y = tituloSecao(doc, "Limites de leitura", y + 8, "03");
  paragrafo(doc, "Este documento apresenta tendências autorizadas e agregadas segundo a TIRH, sem inferência permanente ou decisão profissional automática.", y, { x: 83, width: 455, cor: CORES.suave });
  renderNarrativaTirh(doc, entrada);
}

function renderTecnico(doc: PDFKit.PDFDocument, entrada: EntradaRelatorioHumanexus) {
  const metricas = metricasTecnicas(entrada);
  let y = novaPagina(doc, "01 · Saúde Técnica", "Aquisição e transporte", "Documento restrito à auditoria do sistema; não destinado ao profissional ou cliente.");
  const cards = [
    ["PACOTES", `${metricas.pacotes}`], ["PERDAS", `${metricas.perdas}`],
    ["FORA DE ORDEM", `${metricas.foraDeOrdem}`], ["LATÊNCIA MÉDIA", metricas.latenciaMedia == null ? "—" : `${metricas.latenciaMedia.toFixed(1)} ms`],
    ["BUFFER MÉDIO", metricas.bufferMedio == null ? "—" : `${metricas.bufferMedio.toFixed(1)}`], ["FREQUÊNCIA", metricas.frequenciaMedia == null ? "—" : `${metricas.frequenciaMedia.toFixed(1)} Hz`]
  ];
  cards.forEach(([rotulo, valor], indice) => etiqueta(doc, rotulo, valor, 42 + (indice % 3) * 171, y + Math.floor(indice / 3) * 56, 150));
  y += 135;
  y = tituloSecao(doc, "Latência", y, "01");
  linhaTecnica(doc, metricas.latencias, 83, y + 4, 430, 92, CORES.ouro);
  y += 120;
  y = tituloSecao(doc, "Buffer", y, "02");
  linhaTecnica(doc, metricas.buffers, 83, y + 4, 430, 92, CORES.petroleo);
  y += 120;
  y = tituloSecao(doc, "Frequência de recepção", y, "03");
  linhaTecnica(doc, metricas.frequencias, 83, y + 4, 430, 92, CORES.azul);

  y = novaPagina(doc, "02 · Integridade", "Fontes, eventos e sincronização", "Rastreabilidade da infraestrutura preservada sem interpretação científica.");
  y = tituloSecao(doc, "Fontes e bridges", y, "01");
  const fontes = extrairItens(entrada, "fontes_tecnicas");
  y = listaEditorial(doc, fontes.map((item) => `${texto(item.nome ?? item.fonte, "Fonte")} — ${texto(item.estado, "não registrada")} · sincronização ${texto(item.sincronizacao, "não avaliada")}`), 83, y, 455, 8);
  y = tituloSecao(doc, "Eventos técnicos", y + 7, "02");
  y = listaEditorial(doc, entrada.eventos.map((item) => `${data(item.criado_em ?? item.timestamp)} — ${texto(item.tipo, "evento")} · ${texto(item.estado ?? item.detalhe, "sem detalhe")}`), 83, y, 455, 9);
  y = tituloSecao(doc, "Integridade", y + 7, "03");
  paragrafo(doc, entrada.telemetria.every((item) => item.hash_do_dado_bruto) ? "Hashes presentes nos registros técnicos inspecionados." : "Integridade técnica incompleta ou não informada na amostra.", y, { x: 83, width: 455 });
}

function renderFormulacao(doc: PDFKit.PDFDocument, entrada: EntradaRelatorioHumanexus) {
  const origem = documentoTirh(entrada);
  const hipoteses = extrairItens(entrada, "hipoteses_regulatorias");
  const gatilhos = extrairItens(entrada, "gatilhos");
  const intervencoes = extrairItens(entrada, "propostas_intervencao");
  let y = novaPagina(doc, "01 · Formulação", "Síntese regulatória contextual", "Documento próprio da TIRH para orientar o treinamento cognitivo operacional.");
  y = tituloSecao(doc, "Questão regulatória", y, "01");
  y = paragrafo(doc, texto(origem.questao_regulatoria, "Questão regulatória não registrada."), y, { x: 83, width: 455 });
  y = tituloSecao(doc, "Configuração inicial", y + 7, "02");
  y = paragrafo(doc, texto(origem.configuracao_inicial, "Configuração inicial não inferível."), y, { x: 83, width: 455 });
  y = tituloSecao(doc, "Gatilhos e contexto", y + 7, "03");
  y = listaEditorial(doc, gatilhos.map((item) => `${texto(item.nome ?? item.rotulo, "Gatilho")} — ${texto(item.contexto ?? item.descricao, "sem contexto")}`), 83, y, 455, 7);
  y = tituloSecao(doc, "Hipóteses regulatórias", y + 7, "04");
  listaEditorial(doc, hipoteses.map((item) => `${texto(item.nome ?? item.rotulo, "Hipótese")} — ${texto(item.fundamento ?? item.descricao, "fundamento não registrado")}`), 83, y, 455, 7);

  y = novaPagina(doc, "02 · Condução", "Rotas e propostas de intervenção", "A plataforma sugere; o profissional aceita, recusa, substitui e justifica.");
  desenharRotas(doc, entrada, 42, y + 4, 511);
  y += 185;
  y = tituloSecao(doc, "Propostas", y, "01");
  y = listaEditorial(doc, intervencoes.map((item) => `${texto(item.nome ?? item.protocolo, "Proposta")} — ${texto(item.justificativa ?? item.descricao, "sem justificativa")}`), 83, y, 455, 7);
  y = tituloSecao(doc, "Decisão profissional", y + 8, "02");
  y = paragrafo(doc, texto(origem.decisao_profissional, "Decisão profissional pendente."), y, { x: 83, width: 455 });
  y = tituloSecao(doc, "Justificativa", y + 8, "03");
  paragrafo(doc, texto(origem.justificativa_profissional, "Justificativa profissional pendente."), y, { x: 83, width: 455 });
  doc.moveTo(83, 724).lineTo(350, 724).lineWidth(.55).strokeColor(CORES.cinza).stroke();
  doc.fillColor(CORES.suave).font("Helvetica").fontSize(7).text("Assinatura do profissional responsável", 83, 733);
  renderNarrativaTirh(doc, entrada);
}

function renderOperacionalFinalConsolidado(
  doc: PDFKit.PDFDocument,
  entrada: EntradaRelatorioHumanexus
) {
  const identidade = identificacaoDocumental(entrada);
  const projecao = projecaoTirhV1(entrada);
  const resultante = objeto(projecao.resultante);
  const disponibilidadeContinua = disponibilidadeContinuaDoRelatorio(entrada);
  const iirhDoDocumento = resolverIirhAutoritativo(projecao.iirh);
  const zonaDoDocumento = resolverZonaAutoritativa(projecao.zona);
  const iirhAutoritativo = iirhDoDocumento.estado
    ? iirhDoDocumento
    : disponibilidadeContinua.iirh.projecao;
  const zona = zonaDoDocumento.estado
    ? zonaDoDocumento
    : disponibilidadeContinua.zona.projecao;
  const rotuloIirh = iirhDoDocumento.calculado
    ? "valor oficial do documento"
    : iirhDoDocumento.estado
      ? "estado oficial do documento"
      : rotuloDaDisponibilidadeAutoritativa(disponibilidadeContinua.iirh.modo);
  const rotuloZona = zonaDoDocumento.classificada
    ? "classificação oficial do documento"
    : zonaDoDocumento.estado
      ? "estado oficial do documento"
      : rotuloDaDisponibilidadeAutoritativa(disponibilidadeContinua.zona.modo);
  const vev = vetoresDaProjecaoTirhV1(entrada).find(
    (item) => texto(item.codigo, "").toUpperCase() === "VEV"
  );
  const vetores = extrairVetores(entrada);
  const cicloDocumental = projetarEstadoFuncionalDoRelatorio(
    entrada.relatorio
  );
  const consolidacao = cicloDocumental.consolidacao;
  const cadeia = objeto(objeto(entrada.cockpitOperacional).cadeia_cientifica);
  const protocoloThx = objeto(entrada.protocoloThx);
  const treinamentoThx = [
    texto(protocoloThx.codigo, ""),
    texto(protocoloThx.nome, "")
  ].filter(Boolean).join(" · ");
  const claims = lista(projecao.claims).map(objeto);
  const decisoes = decisoesProfissionaisPreservadasTirhV1(claims);
  const momentos = lista(entrada.ciclo?.momentos).map(objeto);
  const trajetoria = extrairTrajetoria(entrada);
  const fontesDoCockpit = lista(objeto(entrada.cockpitOperacional).fontes).map(objeto);
  const leiturasFisiologicasRecebidas = fontesDoCockpit.flatMap((fonte) => {
    const ultima = objeto(fonte.ultima_leitura_registrada);
    const valores = objeto(ultima.valores);
    const timestamp = ultima.timestamp;
    if (!timestamp) return [];
    if (fonte.codigo === "POLAR_H10") {
      return [
        ["Frequência cardíaca", valores.hr_bpm, "bpm"],
        ["Intervalo RR médio", valores.rr_ms, "ms"],
        ["RMSSD técnico recebido", valores.rmssd_tecnico_ms, "ms"]
      ].flatMap(([rotulo, valor, unidade]) => (
        numero(valor) == null
          ? []
          : [`${rotulo}: ${numero(valor)} ${unidade} · última leitura registrada em ${data(timestamp)} · dado recebido do Polar H10, sem interpretação fisiológica automática.`]
      ));
    }
    if (fonte.codigo === "EMOTIV_EPOC_X") {
      const metricasAdmissiveis = lista(fonte.metricas_de_desempenho)
        .map(objeto)
        .filter((item) => item.admissivel_para_motor_regulatorio === true);
      return metricasAdmissiveis.flatMap((item) => (
        numero(item.valor_atual) == null
          ? []
          : [`${texto(item.nome ?? item.identificador_de_apresentacao, "Indicador EEG")}: ${numero(item.valor_atual)} · EMOTIV EPOC X · admissível conforme o estado fornecido pelo Núcleo.`]
      ));
    }
    return [];
  });
  const microtrajetoria = projetarMicrotrajetoriaRegulatoria({
    relatorio: entrada.relatorio,
    consolidacao,
    execucao: entrada.execucao,
    treinamento: treinamentoThx,
    indicadores: [
      `IIRH: ${iirhAutoritativo.calculado ? `${iirhAutoritativo.valor} / 100 · ${rotuloIirh}` : texto(iirhAutoritativo.motivo, rotuloIirh)}.`,
      `Zona: ${zona.classificada ? `${texto(zona.codigo ?? zona.nome)} · ${rotuloZona}` : texto(zona.motivo, rotuloZona)}.`,
      `Resultante: ${texto(resultante.estado, "não materializada")}.`,
      `Vetores momentâneos calculáveis: ${vetores.filter((vetor) => vetor.magnitude != null).length}/9. VEV: ${texto(vev?.estado_epistemico ?? vev?.estado, "não elegível")}.`
    ]
  });
  let pagina = 1;
  let y = novaPagina(
    doc,
    "RELATÓRIO OPERACIONAL TIRH",
    "Prevenção adaptativa e confiabilidade operacional humana",
    "Resultados, capacidades, pontos de atenção, resposta ao treinamento, significado prático e próximos passos registrados."
  );

  const novaContinuacao = () => {
    pagina += 1;
    y = novaPagina(
      doc,
      `RELATÓRIO OPERACIONAL TIRH · ${String(pagina).padStart(2, "0")}`,
      "Continuação do documento final validado"
    );
  };

  const bloco = (codigo: string, titulo: string, itens: string[]) => {
    const limpos = itens
      .map((item) => item.trim().replace(/([.!?])\.+$/, "$1"))
      .filter(Boolean);
    if (!limpos.length) return;
    doc.font("Helvetica").fontSize(8.2);
    const altura = 38 + limpos.reduce(
      (total, item) => total + doc.heightOfString(item, {
        width: 455,
        lineGap: 2
      }) + 9,
      0
    );
    if (y + Math.min(altura, 530) > 690) novaContinuacao();
    y = tituloSecao(doc, titulo, y, codigo);
    for (const item of limpos) {
      doc.font("Helvetica").fontSize(8.2);
      const alturaDoItem = doc.heightOfString(item, {
        width: 440,
        lineGap: 2
      }) + 16;
      if (y + alturaDoItem > 690) novaContinuacao();
      doc.circle(87, y + 5, 1.7).fill(CORES.ouro);
      doc.fillColor(CORES.texto).font("Helvetica").fontSize(8.2)
        .text(item, 97, y, { width: 440, lineGap: 2 });
      y += alturaDoItem;
    }
    y += 12;
  };

  const vetoresCalculados = vetores.filter((vetor) => vetor.magnitude != null);
  const pontosDaTrajetoria = trajetoria.filter((item) => item.valor != null).length;
  const possuiRadarVetorialLegivel = vetoresCalculados.length >= 3;
  const possuiTrajetoriaLegivel = pontosDaTrajetoria >= 2;
  const possuiGraficoOficial = possuiRadarVetorialLegivel || possuiTrajetoriaLegivel;

  const leituraPratica = microtrajetoria.leituraPratica;
  bloco("01", "O que os resultados mostram", leituraPratica.resultados.length
    ? leituraPratica.resultados
    : [MENSAGEM_UNICA_DE_INDISPONIBILIDADE]);
  bloco("02", "Como chegou", leituraPratica.comoChegou);
  bloco("03", "Pontos fortes e capacidades observadas", leituraPratica.pontosFortes);
  bloco("04", "Pontos de atenção", leituraPratica.pontosDeAtencao);
  bloco("05", "Resposta ao treinamento", leituraPratica.respostaAoTreinamento);
  bloco("06", "O que isso significa na prática", leituraPratica.significadoPratico);
  bloco("07", "O que precisa ser desenvolvido", leituraPratica.desenvolvimento);
  bloco("08", "Recomendações", leituraPratica.recomendacoes);
  bloco("09", "Devolutiva ao participante", leituraPratica.devolutivaAoParticipante);
  bloco("10", "Limites da leitura", leituraPratica.limitesDaLeitura);
  bloco("11", "O que já apareceu e o que ainda precisa ser confirmado",
    microtrajetoria.estadosDaMudanca.flatMap((etapa) => (
      etapa.itens.map((item) => `${etapa.rotulo}: ${item}`)
    ))
  );

  bloco("12", "Indicadores oficiais integrados à leitura", [
    `Resultante estrutural: ${texto(resultante.estado, "não materializada")}. Magnitude escalar: não aplicável na TIRH V1.`,
    `IIRH: ${iirhAutoritativo.calculado ? `${iirhAutoritativo.valor} / 100 · ${rotuloIirh}` : texto(iirhAutoritativo.motivo, rotuloIirh).replace(/\.+$/, "")}. Zona: ${zona.classificada ? `${texto(zona.codigo ?? zona.nome)} · ${rotuloZona}` : texto(zona.motivo, rotuloZona).replace(/\.+$/, "")}.`,
    trajetoria.length
      ? `Trajetória: ${trajetoria.map((item) => `${item.rotulo} — ${item.valor == null ? "ausente" : item.valor} — ${item.zona}`).join(" · ")}.`
      : "Trajetória não inferível: ainda não há pontos válidos e comparáveis suficientes.",
    "Nenhum indicador isolado produz conclusão profissional."
  ]);

  if (possuiGraficoOficial) {
    const alturaDosGraficos = (possuiRadarVetorialLegivel ? 350 : 0)
      + (possuiTrajetoriaLegivel ? 220 : 0);
    if (y + alturaDosGraficos > 690) novaContinuacao();
    y = tituloSecao(doc, "Gráficos regulatórios da sessão", y, "13");
    doc.fillColor(CORES.suave).font("Helvetica").fontSize(7.8).text(
      "Somente pontos oficiais disponíveis são desenhados. Ausências não fecham o radar, não completam a série e não são convertidas em zero.",
      83,
      y,
      { width: 455, lineGap: 2 }
    );
    if (possuiRadarVetorialLegivel) {
      desenharRadarVetorial(doc, vetores, 42, y + 38, 112);
      tabelaVetores(doc, vetores, 305, y + 26, 248);
      y += 315;
    }
    if (possuiTrajetoriaLegivel) {
      y = tituloSecao(doc, "Evolução oficialmente preservada", y, "14");
      desenharTrajetoria(doc, trajetoria, 92, y + 8, 420, 155);
      y += 205;
    }
  }

  bloco("15", "Nove Vetores momentâneos", [
    `${vetoresCalculados.length}/9 Vetores momentâneos possuem valor oficial neste recorte. ${9 - vetoresCalculados.length} permanecem sem valor; nenhuma ausência foi convertida em zero.`,
    ...vetoresCalculados.map((vetor) => (
    `${vetor.codigo} · ${vetor.nome} · ${vetor.macrocampo}: `
    + `valor ${vetor.magnitude?.toFixed(1)}; `
    + `confiança ${vetor.confianca == null ? "não registrada" : `${Math.round(vetor.confianca * 100)}%`}.`
  ))]);

  bloco("16", "VEV longitudinal", [
    `Estado: ${texto(vev?.estado_epistemico ?? vev?.estado, "não elegível")}.`,
    "O VEV permanece separado dos nove Vetores momentâneos e exige uma referência inicial mais quatro sessões válidas e comparáveis."
  ]);

  bloco("17", "EEG e indicadores autonômicos recebidos", leiturasFisiologicasRecebidas);

  bloco("18", "Registro profissional e medidas complementares", [
    "As observações e decisões profissionais usadas nesta leitura permanecem vinculadas ao documento validado.",
    texto(cadeia.tcr, "") ? `TCR: ${texto(cadeia.tcr, "")}.` : "",
    texto(cadeia.icr, "") ? `ICR: ${texto(cadeia.icr, "")}.` : ""
  ]);

  bloco("19", "Rastreabilidade técnica", [
    `Participante: ${identidade.nomeCompleto} · CPF ${identidade.cpf} · organização ${identidade.organizacao}. Sessão: ${texto(entrada.sessao.nome_operacional, "sessão registrada")} · ${data(entrada.sessao.finalizado_em ?? entrada.sessao.criado_em)}.`,
    `Documento: ${texto(entrada.relatorio.codigo_publico, texto(entrada.relatorio.identificador))} · versão ${texto(entrada.relatorio.numero_da_versao, "não registrada")} · responsável ${texto(entrada.usuario.nome, "profissional registrado")} · ciência ${texto(projecao.versao_cientifica, "TIRH V1")} · estado ${cicloDocumental.estado.replaceAll("_", " ")}.`,
    texto(consolidacao.limitacoes, "")
      ? `Momentos documentais: ${momentos.length} · decisões profissionais preservadas: ${decisoes.length}. Limitações registradas: ${texto(consolidacao.limitacoes, "")}. Fontes, integridade, autoria e estados permanecem vinculados ao documento.`
      : `Momentos documentais: ${momentos.length} · decisões profissionais preservadas: ${decisoes.length}. Fontes, integridade, autoria, limites e estados permanecem vinculados ao documento.`
  ]);
}

export async function gerarPdfVisualHumanexus(entrada: EntradaRelatorioHumanexus) {
  const tipo = entrada.tipoDocumento ?? tipoPeloRegistro(entrada.relatorio);
  if (
    entrada.contratoDocumental === "TIRH_V1"
    && !projecaoCanonicaTirhV1Disponivel(entrada)
  ) {
    throw new Error(
      "PDF TIRH V1 não gerado: projeção canônica V1 ausente ou incompleta."
    );
  }
  const doc = new PDFDocument({
    size: "A4",
    margin: 42,
    bufferPages: true,
    info: {
      Title: texto(entrada.relatorio.titulo, ROTULOS[tipo]),
      Author: "HUMANEXUS",
      Subject: ROTULOS[tipo],
      Keywords: "TIRH, HUMANEXUS, inteligência regulatória humana"
    }
  });
  const blocos: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => blocos.push(chunk));
  const finalizado = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(blocos)));
    doc.on("error", reject);
  });
  capa(doc, tipo, entrada);
  if (
    tipo === "OPERACIONAL_TIRH"
    && projetarEstadoFuncionalDoRelatorio(entrada.relatorio).finalDisponivel
  ) {
    renderOperacionalFinalConsolidado(doc, entrada);
  } else if (tipo === "OPERACIONAL_TIRH") renderOperacional(doc, entrada);
  else if (tipo === "CIENTIFICO_TIRH") renderCientifico(doc, entrada);
  else if (tipo === "EXECUTIVO") renderExecutivo(doc, entrada);
  else if (tipo === "TECNICO") renderTecnico(doc, entrada);
  else renderFormulacao(doc, entrada);
  fecharDocumento(doc, tipo, entrada);
  doc.end();
  return finalizado;
}
