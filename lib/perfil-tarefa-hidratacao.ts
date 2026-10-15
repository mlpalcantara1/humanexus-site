type Perfil = Record<string, unknown>;
export const EXIGENCIAS_PROGRAMADAS = [
  "complexity", "ambiguity", "error_consequence", "coordination", "communication", "symbolic_context"
] as const;
const objeto = (v: unknown): Perfil => v && typeof v === "object" && !Array.isArray(v) ? v as Perfil : {};

/** Sugestões descrevem o cenário, nunca o desempenho ou a fisiologia. */
export function hidratarPerfilDaTarefa(atual: Perfil, programado: Perfil) {
  const tarefaAtual = String(atual.identificador_da_tarefa ?? "");
  const tarefaProgramada = String(programado.identificador_da_tarefa ?? "");
  const compativel = !tarefaAtual || tarefaAtual === tarefaProgramada;
  const sugestoes = Object.fromEntries(EXIGENCIAS_PROGRAMADAS
    .filter((codigo) => compativel && typeof objeto(programado.task)[codigo] === "number")
    .map((codigo) => [codigo, objeto(programado.task)[codigo]]));
  return {
    identificador: tarefaAtual || tarefaProgramada,
    metricas: Object.fromEntries(Object.entries({...sugestoes, ...objeto(atual.task)})
      .map(([codigo, valor]) => [codigo, valor == null ? "" : String(valor)]))
  };
}
