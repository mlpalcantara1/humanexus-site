type Registro = Record<string, unknown>;

/** Seleção explícita; nunca infere recomendação, evidência ou início de coleta. */
export function prepararSelecaoOperacionalThx(
  participante: string,
  sessao: Registro | undefined,
  vinculos: Registro[],
  profissional: string,
  codigoCtr: string,
  codigoThx: string,
  justificativa: string
) {
  if (!participante || !sessao?.identificador
    || sessao.identificador_do_participante !== participante) {
    throw new Error("Selecione explicitamente uma sessão deste participante.");
  }
  if (!profissional || !justificativa.trim()) {
    throw new Error("Informe responsável e justificativa da seleção operacional.");
  }
  if (!vinculos.some((item) => item.codigo_do_ctr === codigoCtr
    && item.codigo_do_thx === codigoThx)) {
    throw new Error("Selecione um par CTR–THX oficial e validado.");
  }
  return {
    identificador_da_sessao: String(sessao.identificador),
    dados: {
      identificador_do_profissional: profissional,
      codigo_do_ctr: codigoCtr,
      codigo_do_thx: codigoThx,
      justificativa: justificativa.trim()
    }
  };
}
