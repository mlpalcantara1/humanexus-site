type Registro = Record<string, unknown>;
const objeto = (valor: unknown): Registro => valor && typeof valor === "object" && !Array.isArray(valor) ? valor as Registro : {};

export function registroDaReferenciaIndividual(referencia: unknown, gravacao: unknown): Registro {
  const r = objeto(referencia);
  const atual = objeto(r.baseline);
  if (Object.keys(atual).length) return atual;
  const elegibilidade = objeto(r.elegibilidade_individual);
  const anterior = objeto(elegibilidade.baseline);
  const decisao = objeto(r.decisao);
  if (decisao.tipo === "UTILIZAR_BASELINE_ANTERIOR"
      && elegibilidade.valida_para_inicio === true
      && anterior.identificador
      && anterior.identificador === decisao.identificador_do_baseline_de_referencia) return anterior;
  return objeto(objeto(gravacao).registro);
}
