import {
  MENSAGEM_UNICA_DE_INDISPONIBILIDADE,
  type MicrotrajetoriaRegulatoria
} from "@/lib/projecao-narrativa-relatorio";

export function ResultadoRegulatorioDaSessao({
  microtrajetoria
}: {
  microtrajetoria: MicrotrajetoriaRegulatoria;
}) {
  return (
    <section
      className="hx-report-canonical__section hx-session-result-summary"
      aria-label="Microtrajetória regulatória da sessão"
      data-shared-session-result="PRESENTATION_ONLY"
    >
      <small>MICROTRAJETÓRIA REGULATÓRIA DA SESSÃO</small>
      <h3>Como chegou, o que foi trabalhado, o que aconteceu e como saiu</h3>
      {microtrajetoria.etapas.length ? (
        <ol className="hx-session-result-summary__timeline">
          {microtrajetoria.etapas.map((etapa) => (
            <li key={etapa.codigo} data-narrative-stage={etapa.codigo}>
              <small>{etapa.rotulo}</small>
              {etapa.itens.map((item) => <p key={item}>{item}</p>)}
            </li>
          ))}
        </ol>
      ) : (
        <p className="hx-session-result-summary__absence">
          {MENSAGEM_UNICA_DE_INDISPONIBILIDADE}
        </p>
      )}
      <div className="hx-session-result-summary__professional">
        <article className={microtrajetoria.classificacaoProfissional ? "" : "is-pending"}>
          <small>O objetivo foi alcançado?</small>
          <strong>{microtrajetoria.classificacaoProfissional || "AGUARDANDO CONCLUSÃO PROFISSIONAL"}</strong>
          {!microtrajetoria.classificacaoProfissional ? (
            <span>A plataforma não conclui automaticamente a partir da variação dos indicadores.</span>
          ) : null}
        </article>
        {microtrajetoria.conclusaoProfissional ? (
          <article>
            <small>Conclusão registrada pelo profissional</small>
            <strong>{microtrajetoria.conclusaoProfissional}</strong>
          </article>
        ) : null}
      </div>
      {microtrajetoria.devolutiva ? (
        <div className="hx-session-result-summary__feedback">
          <small>DEVOLUTIVA PROFISSIONAL AUTORIZADA</small>
          <p>{microtrajetoria.devolutiva}</p>
        </div>
      ) : null}
    </section>
  );
}
