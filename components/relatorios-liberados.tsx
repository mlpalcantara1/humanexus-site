import Link from "next/link";
import { HxPageHeader, HxSurface } from "@/components/hx-design-system";
import type { RelatorioLiberado, SecaoDoRelatorio } from "@/lib/relatorios-liberados";

const ESTADOS: Record<string, string> = {
  LIBERADO: "Liberado",
  SUBSTITUIDO: "Versão anterior preservada",
  RETIFICADO: "Retificado",
};

const DESTINATARIOS: Record<string, string> = {
  PARTICIPANTE: "Cliente particular",
  GESTOR_AUTORIZADO: "Organização autorizada",
};

const EXECUTIVAS = new Set([
  "IDENTIFICACAO", "OBJETIVO", "CONTEXTO", "RESULTADOS_AUTORIZADOS",
  "RESULTADOS_COLETIVOS", "INTERPRETACAO", "PROXIMOS_PASSOS",
]);

function dataHumana(valor?: string | null) {
  if (!valor) return "Não registrado";
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return valor;
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(data);
}

function tituloDaArea(organizacional: boolean) {
  return organizacional ? "Relatórios da organização" : "Meus Relatórios";
}

function Secoes({ itens }: { itens: SecaoDoRelatorio[] }) {
  if (!itens.length) return null;
  return (
    <div className="hx-released-report__sections">
      {itens.map((secao) => (
        <HxSurface as="section" key={secao.codigo}>
          <small>{secao.codigo.replaceAll("_", " ")}</small>
          <h3>{secao.titulo}</h3>
          {secao.itens.map((item, indice) => <p key={`${secao.codigo}-${indice}`}>{item}</p>)}
        </HxSurface>
      ))}
    </div>
  );
}

export function ListaDeRelatoriosLiberados({
  relatorios,
  organizacional,
}: {
  relatorios: RelatorioLiberado[];
  organizacional: boolean;
}) {
  const base = organizacional ? "/organizacao/relatorios" : "/meus-relatorios";
  return (
    <section className="hx-released-reports">
      <HxPageHeader
        eyebrow="ÁREA AUTENTICADA / DOCUMENTOS LIBERADOS"
        title={tituloDaArea(organizacional)}
        description={organizacional
          ? "Somente documentos coletivos ou executivos explicitamente liberados à sua organização aparecem aqui."
          : "Consulte apenas os documentos que foram concluídos e liberados especificamente para você."}
      />
      {organizacional ? <Link className="hx-released-reports__access" href="/organizacao/relatorios/acessos">Gerenciar destinatários autorizados →</Link> : null}
      {relatorios.length ? (
        <div className="hx-released-reports__grid">
          {relatorios.map((relatorio) => (
            <HxSurface as="article" key={relatorio.identificador}>
              <div className="hx-released-reports__status">
                <span>{ESTADOS[relatorio.estado_documental] ?? relatorio.estado_documental}</span>
                <small>Versão {relatorio.numero_da_versao}</small>
              </div>
              <p className="hx-released-reports__code">{relatorio.codigo_publico}</p>
              <h2>{relatorio.titulo}</h2>
              <p>{relatorio.objetivo}</p>
              <dl>
                <div><dt>Destinatário</dt><dd>{DESTINATARIOS[relatorio.destinatario] ?? relatorio.destinatario}</dd></div>
                <div><dt>Liberado em</dt><dd>{dataHumana(relatorio.liberado_em)}</dd></div>
                <div><dt>Responsável</dt><dd>{relatorio.profissional}</dd></div>
              </dl>
              <Link href={`${base}/${encodeURIComponent(relatorio.identificador)}`}>
                Abrir relatório <span aria-hidden="true">→</span>
              </Link>
            </HxSurface>
          ))}
        </div>
      ) : (
        <HxSurface as="article" className="hx-released-reports__empty">
          <small>NENHUM DOCUMENTO LIBERADO</small>
          <h2>Ainda não há relatórios disponíveis nesta área.</h2>
          <p>Rascunhos e documentos em validação não são exibidos. Um relatório aparecerá aqui somente após conclusão profissional e liberação explícita.</p>
        </HxSurface>
      )}
    </section>
  );
}

export function DetalheDoRelatorioLiberado({
  relatorio,
  organizacional,
}: {
  relatorio: RelatorioLiberado;
  organizacional: boolean;
}) {
  const base = organizacional ? "/organizacao/relatorios" : "/meus-relatorios";
  const executivas = relatorio.secoes.filter((item) => EXECUTIVAS.has(item.codigo));
  const tecnicas = relatorio.secoes.filter((item) => !EXECUTIVAS.has(item.codigo));
  return (
    <article className="hx-released-report">
      <Link className="hx-released-report__back" href={base}>← Voltar aos relatórios</Link>
      <header className="hx-released-report__cover">
        <p>HUMANEXUS / DOCUMENTO LIBERADO</p>
        <span>{relatorio.codigo_publico}</span>
        <h1>{relatorio.titulo}</h1>
        <p>{relatorio.objetivo}</p>
        <dl>
          <div><dt>Versão</dt><dd>{relatorio.numero_da_versao}</dd></div>
          <div><dt>Estado</dt><dd>{ESTADOS[relatorio.estado_documental] ?? relatorio.estado_documental}</dd></div>
          <div><dt>Liberado em</dt><dd>{dataHumana(relatorio.liberado_em)}</dd></div>
          <div><dt>Responsável</dt><dd>{relatorio.profissional}</dd></div>
        </dl>
        <a href={`/api/relatorios-liberados/${encodeURIComponent(relatorio.identificador)}/pdf`}>
          Baixar PDF <span aria-hidden="true">↓</span>
        </a>
      </header>

      <section className="hx-released-report__layer">
        <small>LEITURA 01</small>
        <h2>Leitura executiva</h2>
        <p>O que foi observado, seu significado operacional e os próximos passos registrados.</p>
        <Secoes itens={executivas} />
      </section>
      <section className="hx-released-report__layer">
        <small>LEITURA 02</small>
        <h2>Leitura técnica · Fatores Humanos</h2>
        <p>Detalhamento TIRH, qualidade das evidências, limitações e sustentação da interpretação.</p>
        <Secoes itens={tecnicas} />
      </section>

      <section className="hx-released-report__lineage">
        <header><small>LINHAGEM DOCUMENTAL</small><h2>Origem, validação e versões preservadas</h2></header>
        <dl>
          <div><dt>Organização</dt><dd>{relatorio.linhagem.origem.organizacao ?? "Não se aplica"}</dd></div>
          <div><dt>Participante</dt><dd>{relatorio.linhagem.origem.participante ?? "Documento coletivo"}</dd></div>
          <div><dt>Ciclo</dt><dd>{relatorio.linhagem.origem.ciclo_de_treinamento ?? "Não informado"}</dd></div>
          <div><dt>Validação profissional</dt><dd>{dataHumana(relatorio.linhagem.responsabilidade_profissional.validado_em)}</dd></div>
        </dl>
        <div className="hx-released-report__versions">
          {relatorio.linhagem.versoes.map((versao) => (
            <article key={versao.codigo}>
              <small>{versao.codigo}</small>
              <strong>Versão {versao.numero}</strong>
              <span>{ESTADOS[versao.estado] ?? versao.estado}</span>
              <time>{dataHumana(versao.liberado_em ?? versao.criado_em)}</time>
            </article>
          ))}
        </div>
        <p className="hx-released-report__method">{relatorio.linhagem.metodologia.referencia}. {relatorio.linhagem.metodologia.observacao}</p>
      </section>
    </article>
  );
}
