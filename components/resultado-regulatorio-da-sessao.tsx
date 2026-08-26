type ValorDoRelatorio = unknown;

export type ConteudoDoResultadoRegulatorio = {
  objetivo?: ValorDoRelatorio;
  treinamento?: ValorDoRelatorio;
  intervencao?: ValorDoRelatorio;
  respostaEsperada?: ValorDoRelatorio;
  respostaObservada?: ValorDoRelatorio;
  classificacaoDoResultado?: ValorDoRelatorio;
  conclusaoProfissional?: ValorDoRelatorio;
  evidencias?: string[];
  limitacoes?: ValorDoRelatorio;
  oQuePrecisaSerDesenvolvido?: ValorDoRelatorio;
  proximoPasso?: ValorDoRelatorio;
  devolutiva?: ValorDoRelatorio;
};

function texto(valor: ValorDoRelatorio): string {
  if (valor == null) return "";
  if (Array.isArray(valor)) {
    return valor.map(texto).filter(Boolean).join(" · ");
  }
  if (typeof valor === "object") {
    const registro = valor as Record<string, unknown>;
    return texto(
      registro.descricao
      ?? registro.resposta
      ?? registro.resultado
      ?? registro.valor
      ?? registro.estado
    );
  }
  return String(valor).trim();
}

function CampoDeResultado({
  rotulo,
  valor
}: {
  rotulo: string;
  valor: ValorDoRelatorio;
}) {
  const conteudo = texto(valor);
  if (!conteudo) return null;
  return (
    <article>
      <small>{rotulo}</small>
      <strong>{conteudo}</strong>
    </article>
  );
}

export function ResultadoRegulatorioDaSessao({
  conteudo
}: {
  conteudo: ConteudoDoResultadoRegulatorio;
}) {
  const classificacao = texto(conteudo.classificacaoDoResultado);
  return (
    <section
      className="hx-report-canonical__section hx-session-result-summary"
      aria-label="Resultado regulatório da sessão"
      data-shared-session-result="PRESENTATION_ONLY"
    >
      <small>RESULTADO REGULATÓRIO DA SESSÃO</small>
      <h3>Objetivo, intervenção, resposta e próximo passo</h3>
      <div className="hx-session-result-summary__grid">
        <CampoDeResultado rotulo="Objetivo da sessão ou treinamento" valor={conteudo.objetivo} />
        <CampoDeResultado rotulo="Treinamento ou THX realizado" valor={conteudo.treinamento} />
        <CampoDeResultado rotulo="Intervenção aplicada" valor={conteudo.intervencao} />
        <CampoDeResultado rotulo="Resposta ou resultado esperado" valor={conteudo.respostaEsperada} />
        <CampoDeResultado rotulo="O que efetivamente aconteceu" valor={conteudo.respostaObservada} />
        <article className={classificacao ? "" : "is-pending"}>
          <small>O objetivo foi alcançado?</small>
          <strong>{classificacao || "AINDA NÃO FOI POSSÍVEL DETERMINAR"}</strong>
          {!classificacao ? (
            <span>A autoridade não forneceu uma classificação profissional estruturada para este campo. A plataforma não a deduz da variação dos indicadores.</span>
          ) : null}
        </article>
        <CampoDeResultado rotulo="Conclusão profissional" valor={conteudo.conclusaoProfissional} />
        <CampoDeResultado rotulo="Principal limitação registrada" valor={conteudo.limitacoes} />
        <CampoDeResultado rotulo="O que ainda precisa ser desenvolvido" valor={conteudo.oQuePrecisaSerDesenvolvido} />
        <CampoDeResultado rotulo="Próximo passo registrado pelo profissional" valor={conteudo.proximoPasso} />
      </div>
      {conteudo.evidencias?.length ? (
        <div className="hx-session-result-summary__evidence">
          <strong>Indicadores e evidências selecionados pelo profissional</strong>
          <ul>
            {conteudo.evidencias.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
      ) : null}
      {texto(conteudo.devolutiva) ? (
        <div className="hx-session-result-summary__feedback">
          <small>DEVOLUTIVA PROFISSIONAL AUTORIZADA</small>
          <p>{texto(conteudo.devolutiva)}</p>
        </div>
      ) : null}
    </section>
  );
}
