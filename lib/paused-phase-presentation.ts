type Registro = Record<string, unknown>;

const objeto = (valor: unknown): Registro =>
  valor && typeof valor === "object" && !Array.isArray(valor)
    ? valor as Registro
    : {};

/** A pausa canônica impede apresentar uma projeção recebida como resultado atual. */
export function faseCientificaPausada(estado: unknown): boolean {
  const registro = objeto(estado);
  const sessao = objeto(registro.sessao);
  const operacional = objeto(registro.estado_operacional);
  const leitura = objeto(objeto(registro.cockpit_operacional).leitura_cientifica);
  const janelaPausada = objeto(leitura.estado_da_janela_cientifica).estado
    === "PAUSADA_SEM_RESULTADO_ATUAL";
  const fase = String(
    sessao.fase_atual ?? operacional.fase_cientifica_atual ?? ""
  ).toUpperCase();
  const estadoDaFase = String(
    objeto(sessao.estados_das_fases)[fase] ?? ""
  ).toUpperCase();
  const estadoDaSessao = String(
    operacional.estado_da_sessao ?? sessao.estado ?? ""
  ).toUpperCase();
  return janelaPausada || estadoDaFase === "PAUSADA"
    || estadoDaFase === "PAUSADO"
    || estadoDaSessao === "PAUSADA"
    || estadoDaSessao === "PAUSADO";
}

/** A paleta não pode autorizar captura a partir de um estado científico anterior à pausa. */
export function capturaProfissionalPermitida(estado: unknown, faseDaPaleta: unknown): boolean {
  const registro = objeto(estado);
  const sessao = objeto(registro.sessao);
  const operacional = objeto(registro.estado_operacional);
  if (faseCientificaPausada(estado)) return false;
  const terminal = String(operacional.estado_da_sessao ?? sessao.estado ?? "").toUpperCase();
  if (["FINALIZADA", "ENCERRADA", "CONCLUIDA", "CANCELADA"].includes(terminal)) return false;
  const paleta = objeto(faseDaPaleta);
  const codigo = String(sessao.fase_atual ?? operacional.fase_cientifica_atual ?? paleta.codigo ?? "").toUpperCase();
  const estadoCanonico = objeto(sessao.estados_das_fases)[codigo];
  const estadoDaFase = String(estadoCanonico ?? paleta.estado ?? "").toUpperCase();
  return ["INICIADA", "INICIADO"].includes(estadoDaFase);
}
