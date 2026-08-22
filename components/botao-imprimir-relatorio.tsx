"use client";

export function BotaoImprimirRelatorio() {
  return (
    <button type="button" onClick={() => window.print()}>
      Imprimir relatório <span aria-hidden="true">↗</span>
    </button>
  );
}
