const ESTADOS_TERMINAIS = new Set([
  "CANCELADA",
  "CANCELADO",
  "CONCLUIDA",
  "CONCLUIDO",
  "ENCERRADA",
  "ENCERRADO",
  "FINALIZADA",
  "FINALIZADO",
  "REALIZADA",
  "REALIZADO"
]);

function normalizarEstado(valor: unknown) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();
}

export function estadoOperacionalTerminal(valor: unknown) {
  return ESTADOS_TERMINAIS.has(normalizarEstado(valor));
}

export function operacaoCanonicaTerminal({
  estadoDaSessao,
  fluxoIndependente,
  estadoDaFaseIndependente
}: {
  estadoDaSessao: unknown;
  fluxoIndependente: boolean;
  estadoDaFaseIndependente: unknown;
}) {
  return estadoOperacionalTerminal(estadoDaSessao)
    || (
      fluxoIndependente
      && estadoOperacionalTerminal(estadoDaFaseIndependente)
    );
}
