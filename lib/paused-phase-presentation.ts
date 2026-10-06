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
