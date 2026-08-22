"use client";

import styles from "./parametrizacao-prospectiva.module.css";

type CandidatoPHP = {
  codigo_do_thx: string;
  nome_do_thx: string;
  pontuacao: number;
  classificacao: string;
  criterios: Record<string, boolean>;
  fundamento: Record<string, unknown>;
  incompatibilidades: string[];
};

type AvaliacaoPHP = {
  identificador_do_registro: string;
  codigo_do_ctr: string;
  nome_do_ctr: string;
  papel: string;
  estado: string;
  candidatos: CandidatoPHP[];
};

export type DadosPHP = {
  parametrizacao?: {
    codigo?: string;
    situacao?: string;
    confianca?: string;
    pesos_dos_campos?: Record<string, number>;
    vetores?: Record<
      string,
      {
        nome: string;
        campo: string;
        peso_interno: number;
        peso_global: number;
        faixa_funcional: number[];
      }
    >;
  };
  validacao_prospectiva?: {
    vinculos_ctr_thx?: {
      vinculos_validados_preservados: number;
      vinculos_pendentes_avaliados: number;
      comparacoes_executadas: number;
      registros_com_candidatos: number;
      sem_candidato_prospectivo_compativel: number;
      avaliacoes: AvaliacaoPHP[];
    };
  };
  seguranca?: { autorizacao_backend?: string };
};

const CAMPOS: Record<string, string> = {
  MCH: "Campo Humano",
  MCT: "Campo da Tarefa",
  MCE: "Campo Estruturante",
  MCN: "Campo Neuroregulatório"
};

function humanizar(valor: string) {
  return valor.replaceAll("_", " ");
}

function apresentar(valor: unknown, padrao: string) {
  return valor == null || valor === ""
    ? padrao
    : String(valor).replaceAll("_", " ");
}

export function ParametrizacaoProspectiva({
  dados
}: {
  dados: DadosPHP | null;
}) {
  if (!dados) {
    return (
      <p className={styles.loading}>
        Consultando a camada prospectiva restrita…
      </p>
    );
  }
  const parametros = dados.parametrizacao;
  const vinculos = dados.validacao_prospectiva?.vinculos_ctr_thx;
  const vetores = Object.entries(parametros?.vetores ?? {});
  return (
    <section
      className={styles.root}
      aria-label="Parametrização Hipotética Prospectiva"
    >
      <header className={styles.head}>
        <div>
          <p>CAMADA PROSPECTIVA AUTORAL</p>
          <h2>{parametros?.codigo ?? "Versão restrita"}</h2>
          <span>
            {apresentar(parametros?.situacao, "Situação restrita")} ·{" "}
            {apresentar(parametros?.confianca, "Confiança restrita")} · decisão
            profissional obrigatória
          </span>
        </div>
        <span className={styles.state}>
          {dados.seguranca?.autorizacao_backend ===
          "ADMINISTRADOR_PROPRIETARIO_CONFIRMADO"
            ? "restrição validada no backend"
            : "acesso restrito"}
        </span>
      </header>
      <div className={styles.guard}>
        <strong>NÃO É RESULTANTE OFICIAL, IIRH OU ZONA OPERACIONAL</strong>
        <span>
          Não altera os Algoritmos 0.1 e 0.2, não autoriza ação automática e não
          transforma simulação em evidência humana.
        </span>
      </div>
      <section className={styles.fields}>
        {Object.entries(parametros?.pesos_dos_campos ?? {}).map(
          ([codigo, peso]) => (
            <article key={codigo}>
              <small>{codigo}</small>
              <strong>{CAMPOS[codigo] ?? codigo}</strong>
              <b>{peso.toFixed(2)}</b>
            </article>
          )
        )}
      </section>
      <section className={styles.vectors}>
        {vetores.map(([codigo, vetor]) => (
          <article key={codigo}>
            <div>
              <small>
                {codigo} · {vetor.campo}
              </small>
              <strong>{vetor.nome}</strong>
            </div>
            <p>
              <span>peso interno {vetor.peso_interno.toFixed(3)}</span>
              <span>peso global {vetor.peso_global.toFixed(3)}</span>
              <span>faixa {vetor.faixa_funcional.join("–")}</span>
            </p>
          </article>
        ))}
      </section>
      <section className={styles.compat}>
        <header>
          <div>
            <p>COMPATIBILIDADE CTR–THX</p>
            <h3>151 pendências confrontadas com os 400 protocolos oficiais.</h3>
          </div>
          <div>
            <strong>{vinculos?.comparacoes_executadas ?? 0}</strong>
            <span>comparações prospectivas</span>
          </div>
        </header>
        <div className={styles.stats}>
          <article>
            <strong>{vinculos?.vinculos_validados_preservados ?? 0}</strong>
            <span>validados intocados</span>
          </article>
          <article>
            <strong>{vinculos?.vinculos_pendentes_avaliados ?? 0}</strong>
            <span>pendentes avaliados</span>
          </article>
          <article>
            <strong>{vinculos?.registros_com_candidatos ?? 0}</strong>
            <span>com candidatos ≥ 40</span>
          </article>
          <article>
            <strong>
              {vinculos?.sem_candidato_prospectivo_compativel ?? 0}
            </strong>
            <span>sem candidato compatível</span>
          </article>
        </div>
        <div className={styles.links}>
          {(vinculos?.avaliacoes ?? []).map((avaliacao) => (
            <details key={avaliacao.identificador_do_registro}>
              <summary>
                <span>
                  {avaliacao.codigo_do_ctr} · {avaliacao.papel}
                </span>
                <strong>
                  {avaliacao.candidatos.length
                    ? `${avaliacao.candidatos.length} candidatos`
                    : "SEM CANDIDATO PROSPECTIVO COMPATÍVEL"}
                </strong>
              </summary>
              <p>
                {avaliacao.nome_do_ctr} · {humanizar(avaliacao.estado)}
              </p>
              {avaliacao.candidatos.map((candidato) => (
                <article key={candidato.codigo_do_thx}>
                  <div>
                    <small>{candidato.codigo_do_thx}</small>
                    <strong>{candidato.nome_do_thx}</strong>
                    <b>{candidato.pontuacao} / 100</b>
                  </div>
                  <p>{humanizar(candidato.classificacao)}</p>
                  <ul>
                    {Object.entries(candidato.criterios).map(
                      ([criterio, confirmado]) => (
                        <li
                          key={criterio}
                          className={confirmado ? styles.confirmed : undefined}
                        >
                          {confirmado ? "✓" : "—"} {humanizar(criterio)}
                        </li>
                      )
                    )}
                  </ul>
                  <details>
                    <summary>Fundamento e incompatibilidades</summary>
                    <pre>
                      {JSON.stringify(
                        {
                          fundamento: candidato.fundamento,
                          incompatibilidades: candidato.incompatibilidades
                        },
                        null,
                        2
                      )}
                    </pre>
                  </details>
                </article>
              ))}
            </details>
          ))}
        </div>
      </section>
      <details className={styles.trace}>
        <summary>
          Inspecionar parâmetros autorais e rastreabilidade completa
        </summary>
        <pre>{JSON.stringify(dados, null, 2)}</pre>
      </details>
    </section>
  );
}
