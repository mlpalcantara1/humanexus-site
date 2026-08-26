import {
  LINGUAGEM_DE_PREVISIBILIDADE_CONDICIONAL,
  MENSAGEM_DE_CONFIABILIDADE_PENDENTE,
  MENSAGEM_UNICA_DE_INDISPONIBILIDADE,
  type EtapaNarrativa,
  type MicrotrajetoriaRegulatoria
} from "@/lib/projecao-narrativa-relatorio";

function BlocoNarrativo({
  titulo,
  etapas
}: {
  titulo: string;
  etapas: EtapaNarrativa[];
}) {
  return (
    <article>
      <h4>{titulo}</h4>
      {etapas.length ? etapas.map((etapa) => (
        <div key={etapa.codigo} data-narrative-stage={etapa.codigo}>
          {etapa.rotulo === titulo ? null : <small>{etapa.rotulo}</small>}
          {etapa.itens.map((item) => <p key={item}>{item}</p>)}
        </div>
      )) : <p>{MENSAGEM_UNICA_DE_INDISPONIBILIDADE}</p>}
    </article>
  );
}

function SecaoProfissional({
  rotulo,
  titulo,
  itens,
  pendente
}: {
  rotulo: string;
  titulo: string;
  itens: string[];
  pendente?: string;
}) {
  return (
    <section className="hx-session-result-summary__professional-section">
      <small>{rotulo}</small>
      <h3>{titulo}</h3>
      {itens.length
        ? itens.map((item) => <p key={item}>{item}</p>)
        : <p className="hx-session-result-summary__absence">{pendente ?? MENSAGEM_UNICA_DE_INDISPONIBILIDADE}</p>}
    </section>
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

  return (
    <section
      className="hx-report-canonical__section hx-session-result-summary"
      aria-label="Relatório preventivo de confiabilidade operacional humana"
      data-shared-session-result="PRESENTATION_ONLY"
    >
      <small>MICROTRAJETÓRIA REGULATÓRIA DA SESSÃO</small>
      <h3>Síntese de confiabilidade operacional</h3>
      <p className="hx-session-result-summary__conditional">
        {LINGUAGEM_DE_PREVISIBILIDADE_CONDICIONAL}
      </p>

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

      <section className="hx-session-result-summary__preventive-map">
        <small>MAPA PREVENTIVO DO FUNCIONAMENTO</small>
        <h3>Registros que antecedem, organizam e sucedem a resposta observada</h3>
        {microtrajetoria.mapaPreventivo.length ? (
          <ol>
            {microtrajetoria.mapaPreventivo.map((etapa) => (
              <li key={etapa.codigo}>
                <small>{etapa.rotulo}</small>
                {etapa.itens.map((item) => <p key={item}>{item}</p>)}
              </li>
            ))}
          </ol>
        ) : <p>{MENSAGEM_UNICA_DE_INDISPONIBILIDADE}</p>}
      </section>

      <div className="hx-session-result-summary__three-moments">
        <BlocoNarrativo titulo="Como chegou" etapas={microtrajetoria.comoChegou} />
        <BlocoNarrativo titulo="O que mudou" etapas={microtrajetoria.oQueMudou} />
        <BlocoNarrativo titulo="Como saiu" etapas={microtrajetoria.comoSaiu} />
      </div>

      <SecaoProfissional
        rotulo="SINAIS PRECURSORES"
        titulo="O que antecedeu a mudança de organização"
        itens={microtrajetoria.sinaisPrecursores}
      />
      <SecaoProfissional
        rotulo="LIMITE REGULATÓRIO OBSERVADO"
        titulo="Condições em que a estabilidade se modificou"
        itens={microtrajetoria.limiteRegulatorio}
      />
      <SecaoProfissional
        rotulo="EFEITO DO TREINAMENTO"
        titulo="Resposta observada após o THX ou intervenção"
        itens={microtrajetoria.efeitoDoTreinamento}
      />
      <SecaoProfissional
        rotulo="CONFIABILIDADE OPERACIONAL HUMANA"
        titulo="Implicação validada pelo profissional"
        itens={microtrajetoria.confiabilidadeOperacional}
        pendente={MENSAGEM_DE_CONFIABILIDADE_PENDENTE}
      />
      <SecaoProfissional
        rotulo="LEITURA PREVENTIVA PROFISSIONAL"
        titulo="Condições de alerta, suporte, progressão e próximo passo"
        itens={microtrajetoria.leituraPreventiva}
      />

      <section className="hx-session-result-summary__evidence-status">
        <small>ESTADO DA MUDANÇA</small>
        <h3>Resposta aguda não equivale automaticamente a consolidação</h3>
        <div>
          {microtrajetoria.estadosDaMudanca.map((etapa) => (
            <article key={etapa.codigo}>
              <small>{etapa.rotulo}</small>
              {etapa.itens.length
                ? etapa.itens.map((item) => <p key={item}>{item}</p>)
                : <p>Não demonstrável com os registros profissionais disponíveis.</p>}
            </article>
          ))}
        </div>
      </section>

      {microtrajetoria.conclusaoProfissional ? (
        <div className="hx-session-result-summary__professional">
          <article>
            <small>Conclusão registrada pelo profissional</small>
            <strong>{microtrajetoria.conclusaoProfissional}</strong>
          </article>
        </div>
      ) : null}
      {microtrajetoria.devolutiva ? (
        <div className="hx-session-result-summary__feedback">
          <small>DEVOLUTIVA PROFISSIONAL AUTORIZADA</small>
          <p>{microtrajetoria.devolutiva}</p>
        </div>
      ) : null}
    </section>
  );
}
