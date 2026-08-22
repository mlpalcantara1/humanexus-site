import Link from "next/link";
import { BotaoImprimirRelatorio } from "@/components/botao-imprimir-relatorio";
import { HxSurface } from "@/components/hx-design-system";
import type { RelatorioEmGovernanca } from "@/lib/governanca-relatorios";

function dataHumana(valor?: string | null) {
  if (!valor) return "Não registrado";
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return valor;
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(data);
}

export function DetalheDoRelatorioEmGovernanca({
  relatorio,
  organizacao,
}: {
  relatorio: RelatorioEmGovernanca;
  organizacao: string;
}) {
  const retorno = organizacao
    ? `/profissional/relatorios?organizacao=${encodeURIComponent(organizacao)}`
    : "/profissional/relatorios";
  return (
    <article className="hx-released-report">
      <Link className="hx-released-report__back" href={retorno}>
        ← Voltar à governança documental
      </Link>
      <header className="hx-released-report__cover">
        <p>HUMANEXUS / DOCUMENTO PROFISSIONAL</p>
        <span>{relatorio.codigo_publico}</span>
        <h1>{relatorio.titulo}</h1>
        <p>{relatorio.objetivo}</p>
        <dl>
          <div><dt>Versão</dt><dd>{relatorio.numero_da_versao}</dd></div>
          <div><dt>Estado</dt><dd>{relatorio.estado_documental}</dd></div>
          <div><dt>Criado em</dt><dd>{dataHumana(relatorio.criado_em)}</dd></div>
          <div><dt>Validado em</dt><dd>{dataHumana(relatorio.validado_em)}</dd></div>
        </dl>
        <div className="hx-released-report__cover-actions">
          <a href={`/api/governanca-relatorios/${encodeURIComponent(relatorio.identificador)}/pdf`}>
            Baixar PDF <span aria-hidden="true">↓</span>
          </a>
          <BotaoImprimirRelatorio />
        </div>
      </header>
      <section className="hx-released-report__layer">
        <small>CONTEÚDO PRESERVADO</small>
        <h2>Leitura profissional</h2>
        <p>Conteúdo versionado, rastreável e sujeito à governança documental.</p>
        <div className="hx-released-report__sections">
          {(relatorio.secoes ?? []).map((secao) => (
            <HxSurface as="section" key={secao.codigo}>
              <small>{secao.codigo.replaceAll("_", " ")}</small>
              <h3>{secao.titulo}</h3>
              {secao.itens.map((item, indice) => (
                <p key={`${secao.codigo}-${indice}`}>{item}</p>
              ))}
            </HxSurface>
          ))}
        </div>
      </section>
      <section className="hx-released-report__lineage">
        <header>
          <small>LINHAGEM DOCUMENTAL</small>
          <h2>Origem e versões preservadas</h2>
        </header>
        <dl>
          <div><dt>Organização</dt><dd>{relatorio.linhagem.origem.organizacao ?? "Não informada"}</dd></div>
          <div><dt>Participante</dt><dd>{relatorio.linhagem.origem.participante ?? "Documento coletivo"}</dd></div>
          <div><dt>Criador</dt><dd>{relatorio.linhagem.responsabilidade_profissional.criador ?? "Não informado"}</dd></div>
          <div><dt>Validador</dt><dd>{relatorio.linhagem.responsabilidade_profissional.validador ?? "Não informado"}</dd></div>
        </dl>
        <div className="hx-released-report__versions">
          {(relatorio.linhagem.versoes ?? []).map((versao) => (
            <article key={versao.codigo}>
              <small>{versao.codigo}</small>
              <strong>Versão {versao.numero}</strong>
              <span>{versao.estado}</span>
              <time>{dataHumana(versao.liberado_em ?? versao.criado_em)}</time>
            </article>
          ))}
        </div>
      </section>
    </article>
  );
}
