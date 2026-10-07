type Registro = Record<string, unknown>;
const objeto = (valor: unknown): Registro => valor && typeof valor === "object" && !Array.isArray(valor) ? valor as Registro : {};

export function textoDoCriterioEeg(janela: unknown): string {
  const dados = objeto(janela);
  const minimo = dados.qualidade_eeg_minima_inclusiva;
  if (typeof minimo !== "number" || !Number.isFinite(minimo)) return "Critério EEG não informado pelo Núcleo.";
  return `Qualidade EEG mínima: ≥${minimo * 100}% (inclusive). Contato e amostragem são medidas distintas; pacote, horário, fase e sessão também precisam ser válidos. Regra ${String(dados.politica ?? "não informada")}.`;
}

export function textoDaReavaliacaoEeg(leitura: unknown): string[] {
  const revisao = objeto(objeto(leitura).reprocessamento_eeg);
  if (!Object.keys(revisao).length) return [];
  const pacotes = objeto(revisao.pacotes);
  const contagens = Object.entries(pacotes).map(([canal, valor]) => {
    const p = objeto(valor);
    return `${canal}: ${String(p.elegiveis)} de ${String(p.recebidos)} pacotes elegíveis`;
  });
  return [
    `Reavaliação histórica EEG — ${String(revisao.politica)} · qualidade mínima maior ou igual a ${Number(revisao.limiar) * 100}%, inclusive. ${contagens.join("; ")}.`,
    `${String(revisao.janelas_elegiveis)} de ${String(revisao.janelas_avaliadas)} janelas de 15 segundos elegíveis. Captura de ${String(revisao.inicio)} a ${String(revisao.fim)}. Reavaliado em ${String(revisao.reprocessado_em)}; não é leitura atual.`,
    String(revisao.efeito ?? ""),
    "Dados brutos, respostas e documentos anteriores preservados. TESTE — SEM VALIDADE CLÍNICA OU CIENTÍFICA."
  ].filter(Boolean);
}
