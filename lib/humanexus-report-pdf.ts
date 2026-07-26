import PDFDocument from "pdfkit";

type Registro = Record<string, unknown>;

const PDF = {
  ink: "#172126",
  muted: "#667579",
  line: "#d9dfdd",
  panel: "#f4f6f5",
  gold: "#9a7533",
  cyan: "#318b91",
  green: "#477f55",
  red: "#a24f4b",
  white: "#ffffff"
} as const;

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
    return convertido && typeof convertido === "object" && !Array.isArray(convertido) ? convertido : {};
  } catch {
    return {};
  }
}

function data(valor: unknown) {
  if (!valor) return "não registrado";
  const instante = new Date(String(valor));
  return Number.isNaN(instante.getTime())
    ? String(valor)
    : new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "medium",
        timeZone: "America/Manaus"
      }).format(instante);
}

function caixa(doc: PDFKit.PDFDocument, x: number, y: number, width: number, height: number) {
  doc.roundedRect(x, y, width, height, 4).fillAndStroke(PDF.panel, PDF.line);
}

function tituloPagina(doc: PDFKit.PDFDocument, secao: string, titulo: string, pagina: string) {
  doc.fillColor(PDF.gold).font("Helvetica-Bold").fontSize(7).text(secao, 42, 35, { characterSpacing: 1.8 });
  doc.fillColor(PDF.ink).font("Helvetica-Bold").fontSize(20).text(titulo, 42, 53, {
    width: 511,
    height: 28,
    lineBreak: false
  });
  doc.fillColor(PDF.muted).font("Helvetica").fontSize(7).text(pagina, 506, 38, { width: 46, align: "right" });
  doc.moveTo(42, 88).lineTo(553, 88).lineWidth(.6).strokeColor(PDF.line).stroke();
}

function metadado(doc: PDFKit.PDFDocument, x: number, y: number, label: string, value: string, width = 150) {
  doc.fillColor(PDF.muted).font("Helvetica-Bold").fontSize(6.5).text(label, x, y, { width, characterSpacing: 1.1 });
  doc.fillColor(PDF.ink).font("Helvetica").fontSize(9).text(value, x, y + 12, { width, height: 30 });
}

function graficoLinha(
  doc: PDFKit.PDFDocument,
  titulo: string,
  unidade: string,
  valores: number[],
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
  vazio: string
) {
  caixa(doc, x, y, width, height);
  doc.fillColor(PDF.ink).font("Helvetica-Bold").fontSize(8.5).text(titulo, x + 13, y + 12);
  doc.fillColor(PDF.muted).font("Helvetica").fontSize(6.5).text(unidade, x + width - 62, y + 13, { width: 48, align: "right" });
  const gx = x + 34;
  const gy = y + 38;
  const gw = width - 49;
  const gh = height - 60;
  doc.moveTo(gx, gy).lineTo(gx, gy + gh).lineTo(gx + gw, gy + gh).lineWidth(.5).strokeColor(PDF.line).stroke();
  for (let linha = 1; linha < 4; linha += 1) {
    const yy = gy + (gh * linha) / 4;
    doc.moveTo(gx, yy).lineTo(gx + gw, yy).lineWidth(.35).strokeColor("#e8eceb").stroke();
  }
  if (!valores.length) {
    doc.fillColor(PDF.muted).font("Helvetica").fontSize(7).text(vazio, gx + 10, gy + gh / 2 - 4, { width: gw - 20, align: "center" });
    return;
  }
  const minimo = Math.min(...valores);
  const maximo = Math.max(...valores);
  const amplitude = Math.max(1, maximo - minimo);
  valores.forEach((valor, indice) => {
    const px = gx + (gw * indice) / Math.max(1, valores.length - 1);
    const py = gy + gh - ((valor - minimo) / amplitude) * gh;
    if (!indice) doc.moveTo(px, py);
    else doc.lineTo(px, py);
  });
  doc.lineWidth(1.5).strokeColor(color).stroke();
  valores.forEach((valor, indice) => {
    if (valores.length > 35 && indice % Math.ceil(valores.length / 35) !== 0 && indice !== valores.length - 1) return;
    const px = gx + (gw * indice) / Math.max(1, valores.length - 1);
    const py = gy + gh - ((valor - minimo) / amplitude) * gh;
    doc.circle(px, py, 1.6).fillColor(PDF.white).fillAndStroke(PDF.white, color);
  });
  doc.fillColor(PDF.muted).font("Courier").fontSize(5.5).text(maximo.toFixed(1), x + 7, gy - 2, { width: 24, align: "right" });
  doc.text(minimo.toFixed(1), x + 7, gy + gh - 4, { width: 24, align: "right" });
}

function graficoFases(doc: PDFKit.PDFDocument, momentos: Registro[], x: number, y: number, width: number, height: number) {
  caixa(doc, x, y, width, height);
  doc.fillColor(PDF.ink).font("Helvetica-Bold").fontSize(9).text("PRÉ / TREINO / PÓS — qualidade e cobertura", x + 15, y + 14);
  doc.fillColor(PDF.muted).font("Helvetica").fontSize(6.5).text("Mesma escala · valores preservados por fase", x + 15, y + 28);
  const fases = ["PRE", "TREINO", "POS"];
  const base = y + height - 34;
  const top = y + 53;
  const chartHeight = base - top;
  const group = (width - 80) / 3;
  doc.moveTo(x + 42, base).lineTo(x + width - 20, base).strokeColor(PDF.line).lineWidth(.5).stroke();
  fases.forEach((fase, indice) => {
    const momento = momentos.find((item) => item.momento === fase);
    const qualidade = momento ? Number(momento.confiabilidade ?? 0) * 100 : null;
    const cobertura = momento ? Number(momento.cobertura ?? 0) * 100 : null;
    const cx = x + 54 + indice * group;
    if (qualidade != null) {
      const altura = chartHeight * qualidade / 100;
      doc.roundedRect(cx, base - altura, 22, altura, 2).fill(PDF.green);
    }
    if (cobertura != null) {
      const py = base - chartHeight * cobertura / 100;
      doc.circle(cx + 41, py, 3).fillColor(PDF.white).fillAndStroke(PDF.white, PDF.cyan);
      doc.moveTo(cx + 41, py).lineTo(cx + 41, base).dash(2, { space: 2 }).strokeColor(PDF.cyan).lineWidth(.7).stroke().undash();
    }
    doc.fillColor(PDF.ink).font("Helvetica-Bold").fontSize(7).text(fase === "POS" ? "PÓS" : fase, cx - 8, base + 9, { width: 72, align: "center" });
  });
  doc.fillColor(PDF.green).rect(x + width - 156, y + 16, 6, 6).fill();
  doc.fillColor(PDF.muted).font("Helvetica").fontSize(6).text("Qualidade", x + width - 146, y + 15);
  doc.fillColor(PDF.cyan).circle(x + width - 83, y + 19, 3).fill();
  doc.fillColor(PDF.muted).text("Cobertura", x + width - 76, y + 15);
}

function rodape(doc: PDFKit.PDFDocument, texto: string) {
  // Keep the footer inside PDFKit's printable area. Text below the bottom
  // margin triggers an automatic overflow page even when the content fits.
  const y = 790;
  doc.moveTo(42, y - 9).lineTo(553, y - 9).lineWidth(.5).strokeColor(PDF.line).stroke();
  doc.fillColor(PDF.muted).font("Helvetica").fontSize(6.5).text(texto, 42, y, { width: 511, align: "center" });
}

export async function gerarPdfVisualHumanexus({
  usuario,
  participante,
  sessao,
  execucao,
  ciclo,
  telemetria,
  eventos,
  relatorio
}: {
  usuario: Registro;
  participante: Registro;
  sessao: Registro;
  execucao: Registro | null;
  ciclo: Registro | null;
  telemetria: Registro[];
  eventos: Registro[];
  relatorio: Registro;
}) {
  const doc = new PDFDocument({
    size: "A4",
    margin: 42,
    info: {
      Title: String(relatorio.titulo ?? "Relatório HUMANEXUS"),
      Author: "HUMANEXUS",
      Subject: "Relatório técnico de homologação"
    }
  });
  const blocos: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => blocos.push(chunk));
  const finalizado = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(blocos)));
    doc.on("error", reject);
  });

  const momentos = Array.isArray(ciclo?.momentos) ? ciclo.momentos as Registro[] : [];
  const ordenada = [...telemetria].sort((a, b) => Number(a.sequencia) - Number(b.sequencia));
  const latencia = ordenada.map((item) => Number(item.latencia_ms)).filter(Number.isFinite);
  const buffer = ordenada.map((item) => Number(objeto(objeto(item.dado_normalizado_json).valor).buffer)).filter(Number.isFinite);
  const frequencia = ordenada.map((item, indice) => {
    if (!indice) return null;
    const atual = new Date(String(item.timestamp_de_origem)).getTime();
    const anterior = new Date(String(ordenada[indice - 1].timestamp_de_origem)).getTime();
    return atual > anterior ? 1000 / (atual - anterior) : null;
  }).filter((valor): valor is number => valor != null && Number.isFinite(valor));
  const perdas = ordenada.reduce((total, item) => total + Number(item.perda_detectada ?? 0), 0);
  const foraDeOrdem = ordenada.filter((item) => Boolean(item.fora_de_ordem)).length;

  tituloPagina(doc, "HUMANEXUS / RELATÓRIO GOVERNADO", String(relatorio.titulo ?? "Sessão regulatória"), "01 / 02");
  metadado(doc, 42, 106, "PARTICIPANTE", String(participante.referencia_externa ?? participante.identificador ?? "não identificado"), 245);
  metadado(doc, 308, 106, "SESSÃO", String(sessao.identificador ?? "não identificada"), 245);
  metadado(doc, 42, 151, "ESTADO", String(sessao.estado ?? "não registrado"), 150);
  metadado(doc, 212, 151, "PROFISSIONAL", String(usuario.nome ?? "não registrado"), 170);
  metadado(doc, 402, 151, "DATA", data(sessao.finalizado_em ?? sessao.iniciado_em), 150);
  graficoFases(doc, momentos, 42, 201, 511, 246);
  graficoLinha(doc, "Latência técnica", "ms", latencia, 42, 465, 247, 205, PDF.gold, "Nenhum pacote técnico recebido.");
  graficoLinha(doc, "Buffer técnico", "pacotes", buffer, 306, 465, 247, 205, PDF.green, "Nenhum buffer técnico registrado.");
  caixa(doc, 42, 688, 511, 87);
  doc.fillColor(PDF.gold).font("Helvetica-Bold").fontSize(7).text("LIMITES E GOVERNANÇA", 56, 702, { characterSpacing: 1.2 });
  doc.fillColor(PDF.ink).font("Helvetica").fontSize(8.2).text(
    "SIMULAÇÃO TÉCNICA — NÃO É RESULTADO HUMANO. IIRH e Zona oficiais não foram calculados. Qualidade e cobertura pertencem aos snapshots preservados; telemetria representa somente o teste técnico do Bridge.",
    56,
    719,
    { width: 480, lineGap: 3 }
  );
  rodape(doc, `Relatório ${String(relatorio.identificador ?? "").slice(0, 12)} · visualização HUMANEXUS 1.0 · dados originais preservados`);

  doc.addPage({ size: "A4", margin: 42 });
  tituloPagina(doc, "HUMANEXUS / TELEMETRIA BRIDGE", "Saúde técnica, eventos e rastreabilidade.", "02 / 02");
  graficoLinha(doc, "Frequência de recepção", "Hz", frequencia, 42, 108, 511, 190, PDF.cyan, "Frequência não calculável com a amostra disponível.");
  graficoLinha(doc, "Latência de recepção", "ms", latencia, 42, 316, 247, 188, PDF.gold, "Latência não disponível.");
  graficoLinha(doc, "Buffer técnico", "pacotes", buffer, 306, 316, 247, 188, PDF.green, "Buffer não disponível.");
  caixa(doc, 42, 523, 511, 118);
  doc.fillColor(PDF.gold).font("Helvetica-Bold").fontSize(7).text("INDICADORES TÉCNICOS", 56, 538, { characterSpacing: 1.2 });
  const indicadores = [
    ["Pacotes", `${ordenada.length}`],
    ["Perdas", `${perdas}`],
    ["Fora de ordem", `${foraDeOrdem}`],
    ["Eventos da sessão", `${eventos.length}`],
    ["Execução THX", String(execucao?.estado ?? "não registrada")],
    ["Integridade", ordenada.every((item) => item.hash_do_dado_bruto) ? "PRESERVADA" : "INCOMPLETA"]
  ];
  indicadores.forEach(([rotulo, valor], indice) => {
    const coluna = indice % 3;
    const linha = Math.floor(indice / 3);
    metadado(doc, 56 + coluna * 164, 559 + linha * 42, rotulo.toUpperCase(), valor, 145);
  });
  caixa(doc, 42, 660, 511, 115);
  doc.fillColor(PDF.gold).font("Helvetica-Bold").fontSize(7).text("FONTES, UNIDADES E LIMITAÇÕES", 56, 675, { characterSpacing: 1.2 });
  doc.fillColor(PDF.ink).font("Helvetica").fontSize(7.8).text(
    [
      "Fonte: núcleo HUMANEXUS, snapshots da execução e pacotes técnicos do Bridge.",
      "Unidades: qualidade/cobertura em %, frequência em Hz, latência em ms e buffer em pacotes.",
      "Lacunas não são preenchidas nem conectadas. Sinais humanos ausentes não recebem linha zero.",
      `Ausências declaradas: ${momentos.flatMap((item) => lista(item.ausencias_json ?? item.ausencias)).length}.`
    ].join("\n"),
    56,
    694,
    { width: 480, lineGap: 4 }
  );
  rodape(doc, "Versão clara para impressão A4 · legenda, período, fonte, unidade e limitações preservados");

  doc.end();
  return finalizado;
}
