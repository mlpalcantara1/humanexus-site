export type ComandoDeRegistro = Record<string, unknown> & { acao: string; chave: string };
export type RascunhoLocal = {
  texto: string; fase: string | null; faseId: string | null;
  fila: ComandoDeRegistro[]; campos: Record<string, string>; revisaoBase: number;
};
export function novoRascunho(): RascunhoLocal {
  return { texto: "", fase: null, faseId: null, fila: [], campos: {}, revisaoBase: 0 };
}
export function chaveDoRegistro(org: string, participante: string, sessao: string, usuario: string) {
  return `humanexus:registro:v1:${[org, participante, sessao, usuario].map(encodeURIComponent).join(":")}`;
}
export function aceitarResposta(revisaoAtual: number, resposta: { revisao: number }) {
  return Number.isInteger(resposta.revisao) && resposta.revisao >= revisaoAtual;
}
export const MARCADORES = ["Observação", "Intervenção", "Resposta", "Ponto de atenção", "Limitação", "Recomendação", "Próximo passo", "Devolutiva"];
export function recuperarRascunho(serializado: string | null): RascunhoLocal {
  if (!serializado) return novoRascunho();
  const item = JSON.parse(serializado);
  if (!item || typeof item.texto !== "string" || !Array.isArray(item.fila)
      || typeof item.campos !== "object" || !Number.isInteger(item.revisaoBase)) throw new Error("Rascunho local incompatível; preserve uma cópia antes de retomar.");
  return item;
}
