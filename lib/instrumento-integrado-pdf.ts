import PDFDocument from "pdfkit";

type Registro = Record<string, unknown>;

function objeto(valor: unknown): Registro {
  if (valor && typeof valor === "object" && !Array.isArray(valor)) {
    return valor as Registro;
  }
  if (typeof valor === "string") {
    try {
      return JSON.parse(valor) as Registro;
    } catch {
      return {};
    }
  }
  return {};
}

function data(valor: unknown) {
  const instante = new Date(String(valor ?? ""));
  if (Number.isNaN(instante.getTime())) return "Não registrado";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Manaus"
  }).format(instante);
}

function valor(texto: unknown) {
  return String(texto ?? "—").replaceAll("_", " ");
}

function cabecalho(doc: PDFKit.PDFDocument, pagina: number) {
  doc.fillColor("#a17c3e").font("Helvetica-Bold").fontSize(8)
    .text("HX  HUMANEXUS", 46, 34, { characterSpacing: 1.6 });
  doc.fillColor("#667579").font("Helvetica").fontSize(7)
    .text(`CÓPIA INTEGRAL · PÁGINA ${pagina}`, 390, 35, {
      width: 160,
      align: "right"
    });
  doc.moveTo(46, 55).lineTo(550, 55).lineWidth(.6).strokeColor("#d7dedb").stroke();
}

function rodape(doc: PDFKit.PDFDocument) {
  doc.moveTo(46, 757).lineTo(550, 757).lineWidth(.5).strokeColor("#d7dedb").stroke();
  doc.fillColor("#75817e").font("Helvetica").fontSize(6.4)
    .text(
      "Instituto Humanexus de Performance Operacional LTDA",
      46,
      766,
      { width: 504, align: "center", lineBreak: false }
    );
}

export async function gerarPdfInstrumentoIntegrado(copia: Registro) {
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 72, right: 46, bottom: 62, left: 46 },
    info: {
      Title: "Instrumento Integrado HUMANEXUS",
      Author: "Instituto HUMANEXUS",
      Subject: "Cópia integral da resposta operacional única"
    },
    autoFirstPage: false,
    compress: true
  });
  const partes: Buffer[] = [];
  doc.on("data", (parte) => partes.push(Buffer.from(parte)));
  const concluido = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(partes)));
    doc.on("error", reject);
  });
  let pagina = 0;
  function novaPagina() {
    if (pagina > 0) rodape(doc);
    doc.addPage();
    pagina += 1;
    cabecalho(doc, pagina);
    doc.x = 46;
    doc.y = 76;
  }
  function garantir(altura: number) {
    if (doc.y + altura > 744) novaPagina();
  }

  novaPagina();
  const instrumento = objeto(copia.instrumento);
  const manifestacao = objeto(copia.manifestacao);
  const secoes = Array.isArray(instrumento.secoes)
    ? instrumento.secoes as Registro[]
    : [];
  const decisoes = Array.isArray(copia.decisoes)
    ? copia.decisoes as Registro[]
    : [];
  const simplificado = Boolean(copia.fluxo_simplificado);
  const consolidado = objeto(manifestacao.estado_consolidado_json);
  const respostaUnica = String(
    copia.resposta_operacional_unica
    ?? consolidado.resposta_operacional_unica
    ?? ""
  );
  const porCodigo = new Map(
    decisoes.map((item) => [String(item.codigo_da_decisao), item])
  );

  doc.fillColor("#a17c3e").font("Helvetica-Bold").fontSize(7)
    .text("DOCUMENTO ÚNICO · CÓPIA INTEGRAL", { characterSpacing: 1.5 });
  doc.moveDown(.8);
  doc.fillColor("#172126").font("Times-Roman").fontSize(25)
    .text(valor(instrumento.titulo), { width: 480, lineGap: 2 });
  doc.moveDown(.8);
  doc.fillColor("#52615f").font("Helvetica").fontSize(9)
    .text(
      `${valor(instrumento.codigo)} · versão ${valor(instrumento.versao)}`,
      { lineGap: 2 }
    );
  doc.moveDown(1.5);
  const yResumo = doc.y;
  doc.roundedRect(46, yResumo, 504, 94, 4).fillAndStroke("#f4f6f5", "#d7dedb");
  const metadados = [
    ["CONFIRMADO EM", data(manifestacao.confirmado_em)],
    ["POLÍTICA DE RETENÇÃO", valor(manifestacao.politica_de_retencao)],
    ["SINCRONIZAÇÃO", valor(manifestacao.sincronizacao)]
  ];
  metadados.forEach(([rotulo, conteudo], indice) => {
    const x = 60 + (indice % 2) * 247;
    const y = yResumo + 15 + Math.floor(indice / 2) * 40;
    doc.fillColor("#73807d").font("Helvetica-Bold").fontSize(6.2)
      .text(rotulo, x, y, { width: 220, characterSpacing: 1 });
    doc.fillColor("#172126").font("Helvetica").fontSize(8.2)
      .text(conteudo, x, y + 11, { width: 220 });
  });
  doc.x = 46;
  doc.y = yResumo + 115;
  doc.fillColor("#172126").font("Helvetica-Bold").fontSize(12)
    .text("Registro de integridade");
  doc.moveDown(.5);
  [
    ["Hash do documento", manifestacao.hash_do_documento],
    ["Hash das decisões", manifestacao.hash_das_decisoes],
    ["Integridade SHA-256", manifestacao.integridade_sha256]
  ].forEach(([rotulo, conteudo]) => {
    doc.fillColor("#73807d").font("Helvetica-Bold").fontSize(6.2)
      .text(String(rotulo));
    doc.fillColor("#34413f").font("Courier").fontSize(6.7)
      .text(valor(conteudo), { width: 500 });
    doc.moveDown(.55);
  });

  novaPagina();
  doc.fillColor("#172126").font("Times-Roman").fontSize(22)
    .text(
      simplificado
        ? "Texto integral do instrumento"
        : "Seções e decisões registradas"
    );
  doc.moveDown(1);
  secoes.forEach((secao, indice) => {
    const decisao = porCodigo.get(String(secao.codigo));
    garantir(122);
    const inicio = doc.y;
    doc.fillColor("#a17c3e").font("Helvetica-Bold").fontSize(7)
      .text(String(indice + 1).padStart(2, "0"), 46, inicio + 2, { width: 24 });
    doc.fillColor("#172126").font("Helvetica-Bold").fontSize(11)
      .text(valor(secao.titulo), 78, inicio, { width: 355 });
    doc.fillColor("#60706c").font("Helvetica-Bold").fontSize(6.2)
      .text(
        `${valor(secao.natureza)} · ${valor(secao.classificacao)}`,
        438,
        inicio + 2,
        { width: 112, align: "right" }
      );
    doc.y = inicio + 24;
    doc.fillColor("#4f5d5a").font("Helvetica").fontSize(8.2)
      .text(valor(secao.texto), 78, doc.y, { width: 472, lineGap: 2 });
    doc.moveDown(.5);
    doc.fillColor("#6d7775").font("Helvetica-Oblique").fontSize(7.2)
      .text(`Consequência: ${valor(secao.consequencia)}`, 78, doc.y, {
        width: 472
      });
    if (decisao && !simplificado) {
      doc.moveDown(.55);
      const cor = ["NAO_AUTORIZO", "NAO_CONCORDO"].includes(String(decisao.decisao))
        ? "#9b4e47"
        : String(decisao.decisao) === "NAO_SE_APLICA"
          ? "#687673"
          : "#477f55";
      doc.fillColor(cor).font("Helvetica-Bold").fontSize(8)
        .text(
          `DECISÃO: ${valor(decisao.decisao)} · ${valor(decisao.estado)}`,
          78,
          doc.y,
          { width: 472 }
        );
    } else {
      doc.moveDown(.55);
      doc.fillColor("#73807d").font("Helvetica").fontSize(7.5)
        .text(
          simplificado
            ? "Finalidade incluída no documento único; não houve resposta individual."
            : "Seção informativa sem decisão independente.",
          78,
          doc.y
        );
    }
    doc.moveDown(.9);
    doc.moveTo(78, doc.y).lineTo(550, doc.y).lineWidth(.45).strokeColor("#e0e5e3").stroke();
    doc.moveDown(.8);
  });

  novaPagina();
  doc.fillColor("#172126").font("Times-Roman").fontSize(22)
    .text(simplificado ? "Resposta única e escopo" : "Resumo das manifestações");
  doc.moveDown(1);
  if (simplificado) {
    doc.fillColor("#a17c3e").font("Helvetica-Bold").fontSize(7)
      .text("RESPOSTA ESCOLHIDA", { characterSpacing: 1.1 });
    doc.moveDown(.55);
    doc.fillColor("#25322f").font("Helvetica-Bold").fontSize(13)
      .text(valor(respostaUnica || "NÃO REGISTRADA"));
    doc.moveDown(.6);
    doc.fillColor("#52615f").font("Helvetica").fontSize(8.5)
      .text(
        respostaUnica === "AUTORIZO"
          ? "Autorizo, de forma livre, informada e inequívoca, as modalidades operacionais opcionais especificamente descritas neste instrumento."
          : "Não autorizo as modalidades operacionais opcionais descritas neste instrumento, sem impedir as atividades que possam ser realizadas legitimamente sem essas modalidades.",
        { width: 500, lineGap: 3 }
      );
    doc.moveDown(1.3);
    doc.fillColor("#a17c3e").font("Helvetica-Bold").fontSize(7)
      .text("MODALIDADES ABRANGIDAS", { characterSpacing: 1.1 });
    doc.moveDown(.55);
    const modalidades = Array.isArray(copia.modalidades_abrangidas)
      ? copia.modalidades_abrangidas as Registro[]
      : [];
    modalidades.forEach((item) => {
      doc.fillColor("#25322f").font("Helvetica").fontSize(8.3)
        .text(`• ${valor(item.titulo ?? item.codigo)}`, {
          indent: 4,
          lineGap: 2
        });
    });
    doc.moveDown(1.1);
    doc.fillColor("#a17c3e").font("Helvetica-Bold").fontSize(7)
      .text("MODALIDADES EXCLUÍDAS", { characterSpacing: 1.1 });
    doc.moveDown(.55);
    const excluidas = Array.isArray(copia.modalidades_excluidas)
      ? copia.modalidades_excluidas
      : [];
    excluidas.forEach((item) => {
      doc.fillColor("#52615f").font("Helvetica").fontSize(8.1)
        .text(`• ${valor(item)}`, { indent: 4, lineGap: 2 });
    });
    doc.moveDown(1.2);
    doc.fillColor("#73807d").font("Helvetica").fontSize(8)
      .text(
        "Ciência do Aviso de Privacidade, ciência do TCLE e concordância com os Termos de Uso foram preservadas internamente na mesma transação e não constituíram respostas adicionais visíveis.",
        { width: 500, lineGap: 3 }
      );
    doc.moveDown(1.2);
  }
  const grupos = [
    ["CIÊNCIAS REGISTRADAS", ["LI_E_ESTOU_CIENTE"]],
    ["CONCORDÂNCIAS", ["CONCORDO", "NAO_CONCORDO"]],
    ["AUTORIZAÇÕES CONCEDIDAS", ["AUTORIZO"]],
    ["AUTORIZAÇÕES RECUSADAS", ["NAO_AUTORIZO"]],
    ["ITENS NÃO APLICÁVEIS", ["NAO_SE_APLICA"]],
    ["AUTORIZAÇÕES REVOGADAS", ["REVOGADO"]]
  ] as const;
  if (!simplificado) grupos.forEach(([titulo, valores]) => {
    const itens = decisoes.filter((item) =>
      valores.includes(
        (String(item.estado) === "REVOGADO"
          ? "REVOGADO"
          : String(item.decisao)) as never
      )
    );
    garantir(62 + itens.length * 18);
    doc.fillColor("#a17c3e").font("Helvetica-Bold").fontSize(7)
      .text(titulo, { characterSpacing: 1.1 });
    doc.moveDown(.55);
    if (!itens.length) {
      doc.fillColor("#788582").font("Helvetica").fontSize(8)
        .text("Nenhum item.");
    } else {
      itens.forEach((item) => {
        doc.fillColor("#25322f").font("Helvetica").fontSize(8.5)
          .text(
            `• ${valor(item.codigo_da_decisao)} — ${valor(item.decisao)} / ${valor(item.estado)}`,
            { indent: 4, lineGap: 2 }
          );
      });
    }
    doc.moveDown(1.1);
  });

  garantir(150);
  doc.x = 46;
  doc.roundedRect(46, doc.y, 504, 118, 4).fillAndStroke("#f4f6f5", "#d7dedb");
  const yEstado = doc.y + 15;
  doc.fillColor("#172126").font("Helvetica-Bold").fontSize(10)
    .text("Estado operacional consolidado", 62, yEstado);
  doc.fillColor("#50605c").font("Helvetica").fontSize(8)
    .text(
      `Essenciais válidos: ${consolidado.consentimentos_essenciais_validos ? "SIM" : "NÃO"}\n`
      + `Autorizadas: ${valor(
        Array.isArray(consolidado.modalidades_opcionais_autorizadas)
          ? consolidado.modalidades_opcionais_autorizadas.join(", ")
          : ""
      )}\n`
      + `Recusadas: ${valor(
        Array.isArray(consolidado.modalidades_recusadas)
          ? consolidado.modalidades_recusadas.join(", ")
          : ""
      )}`,
      62,
      yEstado + 21,
      { width: 470, lineGap: 5 }
    );
  doc.y += 136;
  doc.fillColor("#172126").font("Helvetica-Bold").fontSize(10)
    .text("Direitos e contato");
  doc.moveDown(.5);
  doc.fillColor("#52615f").font("Helvetica").fontSize(8.3)
    .text(
      "A alteração ou revogação posterior permanece disponível na área separada "
      + "MINHAS AUTORIZAÇÕES. Ela não apaga silenciosamente registros "
      + "históricos necessários à integridade e à auditoria. Utilize o canal "
      + "institucional do Instituto HUMANEXUS para esclarecimentos.",
      { width: 500, lineGap: 3 }
    );

  rodape(doc);
  doc.end();
  return concluido;
}
