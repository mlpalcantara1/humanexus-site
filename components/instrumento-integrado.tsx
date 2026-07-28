"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type Registro = Record<string, unknown>;
type Secao = {
  codigo: string;
  titulo: string;
  texto: string;
  natureza: string;
  classificacao: string;
  consequencia: string;
};
type Modalidade = {
  codigo: string;
  titulo: string;
  consequencia: string;
};
type RespostaUnica = {
  codigo: "RESPOSTA_OPERACIONAL_UNICA";
  opcoes: ["AUTORIZO", "NAO_AUTORIZO"];
  autorizo: string;
  nao_autorizo: string;
  modalidades_abrangidas: Modalidade[];
  modalidades_excluidas: string[];
  consequencias: Record<"AUTORIZO" | "NAO_AUTORIZO", string>;
};
type Consulta = {
  apresentacao: {
    identificador: string;
    estado: string;
    finalidade: string;
    rascunho_json: Record<string, string> | string;
    revisao_do_rascunho: number;
    progresso: number;
    politica_de_retencao: string;
    expira_em: string;
  };
  instrumento: {
    codigo: string;
    versao: string;
    titulo: string;
    hash_do_documento: string;
    situacao_juridica: string;
    secoes: Secao[];
  };
  identificacao: {
    instituto: string;
    participante: string;
    organizacao?: string | null;
    finalidade: string;
  };
  opcoes_pre_marcadas: false;
  confirmacao_final_unica: true;
  fluxo_simplificado: boolean;
  resposta_unica: RespostaUnica | null;
};
type DecisaoRegistrada = {
  identificador: string;
  codigo_da_decisao: string;
  decisao: string;
  natureza: string;
  classificacao: string;
  estado: string;
  consequencia: string;
  decidido_em: string;
};
type Copia = {
  instrumento: Consulta["instrumento"];
  manifestacao: {
    confirmado_em: string;
    hash_do_documento: string;
    hash_das_decisoes: string;
    integridade_sha256: string;
    politica_de_retencao: string;
    situacao_juridica: string;
    estado_consolidado_json: Registro | string;
  };
  decisoes: DecisaoRegistrada[];
  historico_de_versoes: Array<{
    codigo: string;
    versao: string;
    confirmado_em: string;
    integridade_sha256: string;
    situacao_juridica: string;
  }>;
  resposta_operacional_unica?: "AUTORIZO" | "NAO_AUTORIZO" | null;
  modalidades_abrangidas?: Modalidade[];
  modalidades_excluidas?: string[];
  copia_integral: boolean;
  pdf_disponivel: boolean;
};

const TEXTO_AUTORIZO =
  "AUTORIZO, DE FORMA LIVRE, INFORMADA E INEQUÍVOCA, AS MODALIDADES " +
  "OPERACIONAIS OPCIONAIS ESPECIFICAMENTE DESCRITAS NESTE INSTRUMENTO.";
const TEXTO_NAO_AUTORIZO =
  "NÃO AUTORIZO AS MODALIDADES OPERACIONAIS OPCIONAIS DESCRITAS NESTE " +
  "INSTRUMENTO, SEM IMPEDIR AS ATIVIDADES QUE POSSAM SER REALIZADAS " +
  "LEGITIMAMENTE SEM ESSAS MODALIDADES.";

function json<T>(valor: T | string): T {
  return typeof valor === "string" ? JSON.parse(valor) as T : valor;
}

function dataLegivel(valor?: string | null) {
  if (!valor) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(valor));
}

function rotulo(codigo: string) {
  return codigo.replaceAll("_", " ");
}

export function InstrumentoIntegrado() {
  const params = useParams<{ id: string }>();
  const busca = useSearchParams();
  const identificador = String(params.id ?? "");
  const token = busca.get("token") ?? "";
  const areaAutorizacoes = busca.get("area") === "autorizacoes";
  const caminho =
    `/api/humanexus/instrumento-integrado/${encodeURIComponent(identificador)}`;
  const [consulta, setConsulta] = useState<Consulta | null>(null);
  const [copia, setCopia] = useState<Copia | null>(null);
  const [resposta, setResposta] =
    useState<"" | "AUTORIZO" | "NAO_AUTORIZO">("");
  const [revisao, setRevisao] = useState(0);
  const revisaoRef = useRef(0);
  const [sincronizacao, setSincronizacao] =
    useState("PERSISTIDO_NO_NUCLEO");
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  const obterCopia = useCallback(async () => {
    const retorno = await fetch(
      `${caminho}?token=${encodeURIComponent(token)}&copia=1`,
      { cache: "no-store" }
    );
    if (!retorno.ok) return null;
    return await retorno.json() as Copia;
  }, [caminho, token]);

  useEffect(() => {
    let ativo = true;
    async function carregar() {
      if (!token) throw new Error("Instrumento indisponível.");
      const retorno = await fetch(
        `${caminho}?token=${encodeURIComponent(token)}`,
        { cache: "no-store" }
      );
      const corpo = await retorno.json();
      if (!retorno.ok) {
        throw new Error(corpo?.erro?.mensagem ?? "Instrumento indisponível.");
      }
      if (!ativo) return;
      const dados = corpo as Consulta;
      const rascunho = json<Record<string, string>>(
        dados.apresentacao.rascunho_json ?? {}
      );
      const persistida = rascunho.RESPOSTA_OPERACIONAL_UNICA;
      setConsulta(dados);
      if (persistida === "AUTORIZO" || persistida === "NAO_AUTORIZO") {
        setResposta(persistida);
      }
      revisaoRef.current = Number(
        dados.apresentacao.revisao_do_rascunho ?? 0
      );
      setRevisao(revisaoRef.current);
      if (dados.apresentacao.estado === "CONFIRMADO") {
        const comprovante = await obterCopia();
        setCopia(comprovante);
        if (
          comprovante?.resposta_operacional_unica === "AUTORIZO"
          || comprovante?.resposta_operacional_unica === "NAO_AUTORIZO"
        ) {
          setResposta(comprovante.resposta_operacional_unica);
        }
      }
    }
    void carregar().catch((causa) => {
      if (ativo) setErro(causa instanceof Error ? causa.message : "Falha.");
    });
    return () => {
      ativo = false;
      if (temporizador.current) clearTimeout(temporizador.current);
    };
  }, [caminho, obterCopia, token]);

  async function enviar(
    acao: "salvar" | "confirmar" | "revogar",
    payload: Registro
  ) {
    const retorno = await fetch(caminho, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ acao, token, ...payload })
    });
    const corpo = await retorno.json();
    if (!retorno.ok) {
      throw new Error(
        corpo?.erro?.mensagem ?? "Não foi possível registrar a resposta."
      );
    }
    return corpo;
  }

  const salvar = useCallback(async (
    nova: "" | "AUTORIZO" | "NAO_AUTORIZO"
  ) => {
    setSincronizacao("SALVANDO_NO_NUCLEO");
    try {
      const resultado = await enviar("salvar", {
        resposta_operacional: nova,
        revisao: revisaoRef.current
      });
      revisaoRef.current = Number(resultado.revisao);
      setRevisao(revisaoRef.current);
      setSincronizacao("PERSISTIDO_NO_NUCLEO");
    } catch (causa) {
      setSincronizacao("NAO_PERSISTIDO");
      setErro(causa instanceof Error ? causa.message : "Falha ao salvar.");
    }
  // caminho e token permanecem estáveis nesta apresentação.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caminho, token]);

  function escolher(valor: "AUTORIZO" | "NAO_AUTORIZO") {
    if (copia) return;
    setResposta(valor);
    setErro("");
    setSincronizacao("ALTERACAO_PENDENTE");
    if (temporizador.current) clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => void salvar(valor), 350);
  }

  async function confirmar() {
    if (!resposta) {
      setErro("Escolha AUTORIZO ou NÃO AUTORIZO antes de confirmar.");
      document.getElementById("resposta-unica")?.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
      return;
    }
    setOcupado(true);
    setErro("");
    try {
      if (temporizador.current) clearTimeout(temporizador.current);
      await salvar(resposta);
      const resultado = await enviar("confirmar", {
        resposta_operacional: resposta,
        horario_do_dispositivo: new Date().toISOString(),
        fuso_horario: Intl.DateTimeFormat().resolvedOptions().timeZone,
        classe_do_dispositivo: /Mobi|Android/i.test(navigator.userAgent)
          ? "DISPOSITIVO_MOVEL"
          : "COMPUTADOR",
        agente_minimizado: navigator.userAgent
      });
      setCopia(resultado as Copia);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (causa) {
      setErro(causa instanceof Error ? causa.message : "Falha ao confirmar.");
    } finally {
      setOcupado(false);
    }
  }

  async function revogar(codigo: string) {
    if (!window.confirm(
      "Revogar esta modalidade para novas coletas e novos produtos?"
    )) return;
    setOcupado(true);
    try {
      await enviar("revogar", { codigo_da_decisao: codigo });
      setCopia(await obterCopia());
    } catch (causa) {
      setErro(causa instanceof Error ? causa.message : "Falha ao revogar.");
    } finally {
      setOcupado(false);
    }
  }

  if (erro && !consulta) {
    return (
      <main className="hxiicca hxiicca--erro">
        <section>
          <small>AMBIENTE SEGURO HUMANEXUS</small>
          <h1>Instrumento indisponível</h1>
          <p>{erro}</p>
        </section>
      </main>
    );
  }
  if (!consulta) {
    return (
      <main className="hxiicca hxiicca--carregando">
        Carregando instrumento…
      </main>
    );
  }

  const configuracao = consulta.resposta_unica;
  const confirmado = Boolean(copia);
  const textoEscolhido = resposta === "AUTORIZO"
    ? configuracao?.autorizo ?? TEXTO_AUTORIZO
    : resposta === "NAO_AUTORIZO"
      ? configuracao?.nao_autorizo ?? TEXTO_NAO_AUTORIZO
      : "Nenhuma resposta escolhida.";
  const consequencia = resposta
    ? configuracao?.consequencias[resposta]
    : "A consequência operacional será apresentada após sua escolha.";

  if (areaAutorizacoes) {
    return (
      <main className="hxiicca hxiicca--autorizacoes-separadas">
        <header className="hxiicca__hero">
          <div className="hxiicca__brand">
            <span>HX</span>
            <div><strong>HUMANEXUS</strong><small>ÁREA DO PARTICIPANTE</small></div>
          </div>
          <div className="hxiicca__hero-copy">
            <small>ÁREA SEPARADA</small>
            <h1>Minhas autorizações</h1>
            <p>Consulte ou altere modalidades futuras sem modificar o registro original.</p>
          </div>
        </header>
        <section className="hxiicca__autorizacoes">
          {!copia && <p>Área disponível após a confirmação do instrumento.</p>}
          {copia?.decisoes
            .filter((item) =>
              item.natureza === "AUTORIZACAO"
              && item.codigo_da_decisao !== "RESPOSTA_OPERACIONAL_UNICA"
            )
            .map((item) => (
              <article key={item.identificador}>
                <div>
                  <strong>{rotulo(item.codigo_da_decisao)}</strong>
                  <span>{rotulo(item.estado)} · {rotulo(item.decisao)}</span>
                </div>
                {item.estado === "VIGENTE" && item.decisao === "AUTORIZO" && (
                  <button
                    type="button"
                    disabled={ocupado}
                    onClick={() => void revogar(item.codigo_da_decisao)}
                  >
                    Revogar esta modalidade
                  </button>
                )}
              </article>
            ))}
          <a href={`?token=${encodeURIComponent(token)}`}>Voltar ao comprovante</a>
        </section>
      </main>
    );
  }

  return (
    <main className="hxiicca hxiicca--resposta-unica">
      <header className="hxiicca__hero">
        <div className="hxiicca__brand">
          <span>HX</span>
          <div><strong>HUMANEXUS</strong><small>ACESSO DO PARTICIPANTE</small></div>
        </div>
        <div className="hxiicca__hero-copy">
          <small>DOCUMENTO ÚNICO · {consulta.instrumento.codigo}</small>
          <h1>{consulta.instrumento.titulo}</h1>
          <p>
            Leia o instrumento completo, revise as finalidades, escolha uma
            única resposta e confirme uma única vez.
          </p>
        </div>
        <div className="hxiicca__legal">
          {consulta.instrumento.situacao_juridica}
        </div>
      </header>

      <section className="hxiicca__contexto" aria-label="Identificação">
        <article><small>PARTICIPANTE</small><strong>{consulta.identificacao.participante}</strong></article>
        <article><small>ORGANIZAÇÃO</small><strong>{consulta.identificacao.organizacao ?? "Não aplicável"}</strong></article>
        <article><small>FINALIDADE</small><strong>{consulta.identificacao.finalidade}</strong></article>
        <article><small>VERSÃO</small><strong>{consulta.instrumento.versao}</strong></article>
      </section>

      {!confirmado && (
        <aside className="hxiicca__progresso" aria-live="polite">
          <div><span style={{ width: resposta ? "100%" : "0%" }} /></div>
          <strong>{resposta ? "100%" : "0%"}</strong>
          <small>UMA RESPOSTA FINAL · {sincronizacao.replaceAll("_", " ")}</small>
        </aside>
      )}

      <div className="hxiicca__corpo">
        <nav className="hxiicca__sumario" aria-label="Sumário do instrumento">
          <small>SUMÁRIO NAVEGÁVEL</small>
          {consulta.instrumento.secoes.map((secao, indice) => (
            <a key={secao.codigo} href={`#secao-${secao.codigo}`}>
              <span>{String(indice + 1).padStart(2, "0")}</span>
              {secao.titulo}
            </a>
          ))}
          <a href="#resposta-unica"><span>•</span>Resposta única</a>
          <a href="#revisao"><span>•</span>Revisão final</a>
        </nav>

        <section className="hxiicca__documento">
          {consulta.instrumento.secoes.map((secao, indice) => (
            <details
              className="hxiicca__secao"
              id={`secao-${secao.codigo}`}
              key={secao.codigo}
              open={indice < 2}
            >
              <summary>
                <span>{String(indice + 1).padStart(2, "0")}</span>
                <div><h2>{secao.titulo}</h2><small>{rotulo(secao.natureza)}</small></div>
                <em data-classificacao={secao.classificacao}>{rotulo(secao.classificacao)}</em>
              </summary>
              <div className="hxiicca__secao-conteudo">
                <p>{secao.texto}</p>
              </div>
            </details>
          ))}

          {!consulta.fluxo_simplificado && !confirmado ? (
            <section className="hxiicca__revisao">
              <h2>Versão histórica preservada</h2>
              <p>Solicite ao profissional uma apresentação da versão simplificada vigente.</p>
            </section>
          ) : (
            <>
              <section className="hxiicca__resposta" id="resposta-unica">
                <header>
                  <small>UMA ÚNICA RESPOSTA</small>
                  <h2>Escolha livremente um dos dois caminhos</h2>
                  <p>
                    As opções possuem o mesmo peso visual e nenhuma está
                    previamente marcada.
                  </p>
                </header>
                <fieldset disabled={confirmado}>
                  <legend>Resposta operacional final</legend>
                  <label className={resposta === "AUTORIZO" ? "is-selected" : ""}>
                    <input
                      type="radio"
                      name="resposta-operacional-unica"
                      value="AUTORIZO"
                      checked={resposta === "AUTORIZO"}
                      onChange={() => escolher("AUTORIZO")}
                    />
                    <span><strong>AUTORIZO</strong>{configuracao?.autorizo ?? TEXTO_AUTORIZO}</span>
                  </label>
                  <label className={resposta === "NAO_AUTORIZO" ? "is-selected" : ""}>
                    <input
                      type="radio"
                      name="resposta-operacional-unica"
                      value="NAO_AUTORIZO"
                      checked={resposta === "NAO_AUTORIZO"}
                      onChange={() => escolher("NAO_AUTORIZO")}
                    />
                    <span><strong>NÃO AUTORIZO</strong>{configuracao?.nao_autorizo ?? TEXTO_NAO_AUTORIZO}</span>
                  </label>
                </fieldset>
              </section>

              <section className="hxiicca__revisao" id="revisao">
                <header>
                  <small>REVISÃO FINAL</small>
                  <h2>Revise sua resposta antes da confirmação única</h2>
                </header>
                <div className="hxiicca__revisao-grid">
                  <article>
                    <small>RESPOSTA ESCOLHIDA</small>
                    <strong>{resposta ? rotulo(resposta) : "PENDENTE"}</strong>
                    <span>{textoEscolhido}</span>
                  </article>
                  <article>
                    <small>MODALIDADES ABRANGIDAS</small>
                    {(configuracao?.modalidades_abrangidas ?? []).map(
                      (item) => <span key={item.codigo}>{item.titulo}</span>
                    )}
                  </article>
                  <article>
                    <small>MODALIDADES EXCLUÍDAS</small>
                    {(configuracao?.modalidades_excluidas ?? []).map(
                      (item) => <span key={item}>{rotulo(item)}</span>
                    )}
                  </article>
                  <article>
                    <small>CONSEQUÊNCIAS OPERACIONAIS</small>
                    <span>{consequencia}</span>
                    <small>PADRÃO DE MÍDIA</small>
                    <span>SEM GRAVAÇÃO</span>
                  </article>
                  <article>
                    <small>VERSÃO DO INSTRUMENTO</small>
                    <span>{consulta.instrumento.codigo} · {consulta.instrumento.versao}</span>
                    <small>ESTADO JURÍDICO</small>
                    <span>{consulta.instrumento.situacao_juridica}</span>
                  </article>
                </div>
                {!confirmado && (
                  <button
                    className="hxiicca__confirmar"
                    type="button"
                    disabled={ocupado || !resposta}
                    onClick={() => void confirmar()}
                  >
                    CONFIRMAR MINHA RESPOSTA
                  </button>
                )}
              </section>
            </>
          )}

          {erro && <p className="hxiicca__erro" role="alert">{erro}</p>}

          {copia && (
            <section className="hxiicca__copia" aria-live="polite">
              <header>
                <small>REGISTRO INTEGRAL PRESERVADO</small>
                <h2>Resposta confirmada</h2>
                <p>{dataLegivel(copia.manifestacao.confirmado_em)}</p>
              </header>
              <div>
                <article><small>HASH DO DOCUMENTO</small><code>{copia.manifestacao.hash_do_documento}</code></article>
                <article><small>HASH DA RESPOSTA E REGISTROS</small><code>{copia.manifestacao.hash_das_decisoes}</code></article>
                <article><small>INTEGRIDADE</small><code>{copia.manifestacao.integridade_sha256}</code></article>
              </div>
              <a
                className="hxiicca__pdf"
                href={`${caminho}/pdf?token=${encodeURIComponent(token)}`}
                target="_blank"
                rel="noreferrer"
              >
                BAIXAR CÓPIA INTEGRAL EM PDF
              </a>
              <section className="hxiicca__historico">
                <small>HISTÓRICO DE VERSÕES PRESERVADO</small>
                {(copia.historico_de_versoes ?? []).map((item) => (
                  <article key={`${item.codigo}-${item.integridade_sha256}`}>
                    <strong>{item.codigo} · {item.versao}</strong>
                    <span>{dataLegivel(item.confirmado_em)}</span>
                    <code>{item.integridade_sha256}</code>
                  </article>
                ))}
              </section>
              <a
                className="hxiicca__autorizacoes-link"
                href={`?token=${encodeURIComponent(token)}&area=autorizacoes`}
              >
                Minhas autorizações
              </a>
            </section>
          )}
        </section>
      </div>
      <footer className="hxiicca__rodape">
        <span>{consulta.identificacao.instituto}</span>
        <span>Canal institucional · Estado jurídico: {consulta.instrumento.situacao_juridica}</span>
        <span>Rascunho {revisao} · validade até {dataLegivel(consulta.apresentacao.expira_em)}</span>
      </footer>
    </main>
  );
}
