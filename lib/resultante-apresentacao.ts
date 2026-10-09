type Registro = Record<string, unknown>;

const finito = (valor: unknown): number | null =>
  typeof valor === "number" && Number.isFinite(valor) ? valor : null;

/** Apresenta propriedades recebidas do núcleo, sem calcular uma Resultante. */
export function apresentarResultante(registro: Registro) {
  const magnitude = finito(registro.magnitude_global ?? registro.valor ?? registro.magnitude);
  const direcao = registro.direcao_funcional ?? registro.direcao;
  const objeto = direcao && typeof direcao === "object" && !Array.isArray(direcao)
    ? direcao as Registro : {};
  const coordenadas = objeto.coordenadas_unitarias;
  const eixos = coordenadas && typeof coordenadas === "object" && !Array.isArray(coordenadas)
    ? Object.entries(coordenadas).filter((item): item is [string, number] => finito(item[1]) != null)
    : [];
  const graus = finito(registro.direcao_graus ?? (typeof direcao === "number" ? direcao : null));
  const direcaoTexto = typeof direcao === "string" && direcao.trim()
    ? direcao
    : eixos.length ? eixos.map(([codigo, valor]) => `${codigo} ${valor.toFixed(3)}`).join(" · ")
    : graus != null ? `${graus.toFixed(1)}°` : "NÃO DETERMINÁVEL";
  const sentido = registro.sentido_contextual ?? registro.sentido;
  return {
    magnitude,
    graus,
    eixos,
    direcaoTexto,
    sentidoTexto: typeof sentido === "string" && sentido.trim()
      ? ({ NAO_DETERMINAVEL: "Não determinável", COMPENSATORIO: "Compensatório", AMBIVALENTE: "Ambivalente" } as Record<string, string>)[sentido] ?? sentido.replaceAll("_", " ")
      : "Não determinável"
  };
}
