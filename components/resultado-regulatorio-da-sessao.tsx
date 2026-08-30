import {
  MENSAGEM_UNICA_DE_INDISPONIBILIDADE,
  type MicrotrajetoriaRegulatoria
} from "@/lib/projecao-narrativa-relatorio";

function BlocoPratico({
  titulo,
  itens
}: {
  titulo: string;
  itens: string[];
}) {
  if (!itens.length) return null;
  return (
    <article data-practical-report-section={titulo}>
      <h4>{titulo}</h4>
      {itens.map((item) => <p key={item}>{item}</p>)}
    </article>
  );
}

export function ResultadoRegulatorioDaSessao({
  microtrajetoria
}: {
  microtrajetoria: MicrotrajetoriaRegulatoria;
}) {
  const objetivo = microtrajetoria.etapas.find(
    (etapa) => etapa.codigo === "OBJETIVO_DA_SESSAO"
  );
  const intervencao = microtrajetoria.etapas.find(
    (etapa) => etapa.codigo === "THX_INTERVENCAO"
  );
  const proximoPasso = microtrajetoria.etapas.find(
    (etapa) => etapa.codigo === "PROXIMO_PASSO"
  );
  const leitura = microtrajetoria.leituraPratica;
  const estadosRegistrados = microtrajetoria.estadosDaMudanca.filter(
    (etapa) => etapa.itens.length
  );

  return (
    <section
      className="hx-report-canonical__section hx-session-result-summary"
      aria-label="Leitura prática dos resultados da sessão"
      data-shared-session-result="PRESENTATION_ONLY"
    >
      <small>RESULTADOS E DEVOLUTIVA DA SESSÃO</small>
      <h3>O que os resultados mostram</h3>
      {leitura.resultados.length
        ? leitura.resultados.map((item) => <p key={item}>{item}</p>)
        : <p className="hx-session-result-summary__absence">{MENSAGEM_UNICA_DE_INDISPONIBILIDADE}</p>}

      <div className="hx-session-result-summary__executive">
        {objetivo?.itens.length ? (
          <article><small>Capacidade trabalhada</small><p>{objetivo.itens[0]}</p></article>
        ) : null}
        {intervencao?.itens.length ? (
          <article><small>THX ou intervenção realizada</small><p>{intervencao.itens.join(" · ")}</p></article>
        ) : null}
        <article className={microtrajetoria.classificacaoProfissional ? "" : "is-pending"}>
          <small>O objetivo foi alcançado?</small>
          <strong>{microtrajetoria.classificacaoProfissional || "AGUARDANDO CONCLUSÃO PROFISSIONAL"}</strong>
          {!microtrajetoria.classificacaoProfissional ? (
            <span>A plataforma não conclui automaticamente a partir da variação dos indicadores.</span>
          ) : null}
        </article>
        {proximoPasso?.itens.length ? (
          <article><small>Próximo passo profissional</small><p>{proximoPasso.itens.join(" · ")}</p></article>
        ) : null}
      </div>

      <div className="hx-session-result-summary__three-moments">
        <BlocoPratico titulo="Como chegou" itens={leitura.comoChegou} />
        <BlocoPratico titulo="Pontos fortes e capacidades observadas" itens={leitura.pontosFortes} />
        <BlocoPratico titulo="Pontos de atenção" itens={leitura.pontosDeAtencao} />
        <BlocoPratico titulo="Resposta ao treinamento" itens={leitura.respostaAoTreinamento} />
        <BlocoPratico titulo="O que isso significa na prática" itens={leitura.significadoPratico} />
        <BlocoPratico titulo="O que precisa ser desenvolvido" itens={leitura.desenvolvimento} />
        <BlocoPratico titulo="Recomendações" itens={leitura.recomendacoes} />
      </div>

      {leitura.devolutivaAoParticipante.length ? (
        <section className="hx-session-result-summary__feedback">
          <small>DEVOLUTIVA AO PARTICIPANTE</small>
          <h3>Mensagem registrada pelo profissional</h3>
          {leitura.devolutivaAoParticipante.map((item) => <p key={item}>{item}</p>)}
        </section>
      ) : null}

      {estadosRegistrados.length ? (
        <section className="hx-session-result-summary__evidence-status">
          <small>CONTINUIDADE DA MUDANÇA OBSERVADA</small>
          <h3>O que já apareceu e o que ainda precisa ser confirmado</h3>
          <div>
            {estadosRegistrados.map((etapa) => (
              <article key={etapa.codigo}>
                <small>{etapa.rotulo}</small>
                {etapa.itens.map((item) => <p key={item}>{item}</p>)}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="hx-session-result-summary__professional-section">
        <small>LIMITES DA LEITURA</small>
        <h3>O que estes resultados não permitem afirmar</h3>
        {leitura.limitesDaLeitura.map((item) => <p key={item}>{item}</p>)}
      </section>
    </section>
  );
}
