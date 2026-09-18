"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { respostaIiccaVigente } from "@/lib/iicca-request-order";

type Registro = Record<string, unknown>;
type Secao = {
  codigo: string;
  titulo: string;
  texto: string;
  natureza: string;
  classificacao: string;
  consequencia: string;
  decisao_obrigatoria?: boolean;
  opcoes?: string[];
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
    identificador_do_participante: string;
    identificador_da_organizacao: string;
    identificador_da_sessao?: string | null;
    estado: string;
    finalidade: string;
    rascunho_json: Record<string, string> | string;
    revisao_do_rascunho: number;
    progresso: number;
    politica_de_retencao: string;
    contexto_json: Record<string, unknown> | string;
    expira_em: string;
  };
  instrumento: {
    codigo: string;
    versao: string;
    titulo: string;
    hash_do_documento: string;
    secoes: Secao[];
  };
  identificacao: {
    instituto: string;
    participante: string;
    organizacao?: string | null;
    tipo_de_vinculo: "PARTICULAR" | "ORGANIZACIONAL" | "MISTO";
    rotulo_do_cliente: string;
    cliente: string;
    finalidade: string;
  };
  contexto_do_token: {
    origem: "TOKEN_EXCLUSIVO_DA_APRESENTACAO";
    autossuficiente: true;
    identificador_da_apresentacao: string;
    identificador_do_participante: string;
    identificador_da_organizacao: string;
    identificador_da_sessao?: string | null;
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
  identificacao?: Consulta["identificacao"];
  identificacao_institucional?: { razao_social?: string; cnpj?: string };
  manifestacao: {
    confirmado_em: string;
    hash_do_documento: string;
    hash_das_decisoes: string;
    integridade_sha256: string;
    politica_de_retencao: string;
    contexto_json: Record<string, unknown> | string;
    estado_consolidado_json: Registro | string;
  };
  decisoes: DecisaoRegistrada[];
  historico_de_versoes: Array<{
    codigo: string;
    versao: string;
    confirmado_em: string;
    integridade_sha256: string;
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

function rotuloDaMidia(modalidade?: string | null) {
  return ({
    NENHUM: "SEM GRAVAÇÃO",
    AUDIO: "ÁUDIO",
    VIDEO: "VÍDEO",
    AUDIO_E_VIDEO: "ÁUDIO E VÍDEO"
  } as Record<string, string>)[String(modalidade ?? "NENHUM")]
    ?? rotulo(String(modalidade ?? "NENHUM"));
}

function rotuloDaRetencao(politica?: string | null) {
  return ({
    NAO_ARMAZENAR: "NÃO ARMAZENAR",
    DURANTE_A_SESSAO: "SOMENTE DURANTE A SESSÃO",
    ATE_VALIDACAO_DO_RELATORIO: "ATÉ A VALIDAÇÃO DO RELATÓRIO",
    PRAZO_DEFINIDO: "PRAZO DEFINIDO NA CONFIGURAÇÃO DA SESSÃO",
    PRESERVACAO_MANUAL: "PRESERVAÇÃO AUTORIZADA PELO PROFISSIONAL",
    PESQUISA_AUTORIZADA: "PESQUISA ESPECIFICAMENTE AUTORIZADA"
  } as Record<string, string>)[String(politica ?? "NAO_ARMAZENAR")]
    ?? rotulo(String(politica ?? "NAO_ARMAZENAR"));
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
  const [decisoesIndependentes, setDecisoesIndependentes] =
    useState<Record<string, string>>({});
  const [revisao, setRevisao] = useState(0);
  const revisaoRef = useRef(0);
  const [sincronizacao, setSincronizacao] =
    useState("PERSISTIDO_NO_NUCLEO");
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);
  const geracaoDaPagina = useRef(0);
  const sequenciaDaCopia = useRef(0);
  const [revisaoDoPolling, setRevisaoDoPolling] = useState(0);

  const obterCopia = useCallback(async () => {
    const retorno = await fetch(
      `${caminho}?token=${encodeURIComponent(token)}&copia=1`,
      { cache: "no-store", credentials: "same-origin" }
    );
    if (!retorno.ok) return null;
    return await retorno.json() as Copia;
  }, [caminho, token]);

  useEffect(() => {
    let ativo = true;
    const geracao = ++geracaoDaPagina.current;
    const abortar = new AbortController();
    setConsulta(null);
    setCopia(null);
    setResposta("");
    setDecisoesIndependentes({});
    setErro("");
    setOcupado(false);
    setSincronizacao("PERSISTIDO_NO_NUCLEO");
    revisaoRef.current = 0;
    setRevisao(0);
    async function carregar() {
      if (!token) throw new Error("Instrumento indisponível.");
      const retorno = await fetch(
        `${caminho}?token=${encodeURIComponent(token)}`,
        {
          cache: "no-store",
          credentials: "same-origin",
          signal: abortar.signal
        }
      );
      const corpo = await retorno.json();
      if (!retorno.ok) {
        throw new Error(corpo?.erro?.mensagem ?? "Instrumento indisponível.");
      }
      if (!ativo || !respostaIiccaVigente(
        geracao, geracaoDaPagina.current
      )) return;
      const dados = corpo as Consulta;
      if (
        dados.apresentacao.identificador !== identificador
        || dados.contexto_do_token?.identificador_da_apresentacao
          !== identificador
        || dados.contexto_do_token?.identificador_do_participante
          !== dados.apresentacao.identificador_do_participante
        || dados.contexto_do_token?.identificador_da_organizacao
          !== dados.apresentacao.identificador_da_organizacao
      ) {
        throw new Error("Contexto criptográfico do instrumento inválido.");
      }
      const rascunho = json<Record<string, string>>(
        dados.apresentacao.rascunho_json ?? {}
      );
      const persistida = rascunho.RESPOSTA_OPERACIONAL_UNICA;
      setConsulta(dados);
      if (!dados.fluxo_simplificado) {
        const permitidas = new Map(dados.instrumento.secoes
          .filter((secao) => secao.decisao_obrigatoria)
          .map((secao) => [secao.codigo, secao.opcoes ?? []]));
        setDecisoesIndependentes(Object.fromEntries(
          Object.entries(rascunho).filter(([codigo, valor]) =>
            permitidas.get(codigo)?.includes(valor))
        ));
      }
      if (persistida === "AUTORIZO" || persistida === "NAO_AUTORIZO") {
        setResposta(persistida);
      }
      revisaoRef.current = Number(
        dados.apresentacao.revisao_do_rascunho ?? 0
      );
      setRevisao(revisaoRef.current);
      if (dados.apresentacao.estado === "CONFIRMADO") {
        const comprovante = await obterCopia();
        if (!ativo || !respostaIiccaVigente(
          geracao, geracaoDaPagina.current
        )) return;
        if (!comprovante) {
          throw new Error(
            "A resposta foi registrada, mas a cópia integral está temporariamente indisponível. Não confirme novamente; tente recarregar mais tarde."
          );
        }
        setCopia(comprovante);
        if (!dados.fluxo_simplificado) {
          setDecisoesIndependentes(Object.fromEntries(
            comprovante.decisoes.map((item) => [
              item.codigo_da_decisao, item.decisao
            ])
          ));
        }
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
      geracaoDaPagina.current++;
      abortar.abort();
      if (temporizador.current) clearTimeout(temporizador.current);
    };
  }, [caminho, identificador, obterCopia, token]);

  useEffect(() => {
    if (consulta?.apresentacao.estado !== "CONFIRMADO") return;
    let ativo = true;
    const geracao = geracaoDaPagina.current;
    async function atualizar() {
      const sequencia = ++sequenciaDaCopia.current;
      const comprovante = await obterCopia().catch(() => null);
      if (
        !ativo || !respostaIiccaVigente(
          geracao, geracaoDaPagina.current,
          sequencia, sequenciaDaCopia.current
        )
      ) return;
      if (comprovante) {
        setCopia(comprovante);
        setErro((atual) => atual ===
          "Estado atual temporariamente indisponível. Tente recarregar."
          ? "" : atual);
      } else {
        setCopia(null);
        setErro("Estado atual temporariamente indisponível. Tente recarregar.");
      }
    }
    const intervalo = setInterval(() => void atualizar(), 5000);
    const retomar = () => {
      if (document.visibilityState === "visible") void atualizar();
    };
    document.addEventListener("visibilitychange", retomar);
    return () => {
      ativo = false;
      clearInterval(intervalo);
      document.removeEventListener("visibilitychange", retomar);
    };
  }, [consulta?.apresentacao.estado, obterCopia, revisaoDoPolling]);

  async function enviar(
    acao: "salvar" | "confirmar" | "revogar",
    payload: Registro
  ) {
    const retorno = await fetch(caminho, {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "same-origin",
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
  ): Promise<boolean> => {
    const geracao = geracaoDaPagina.current;
    setSincronizacao("SALVANDO_NO_NUCLEO");
    try {
      const resultado = await enviar("salvar", {
        resposta_operacional: nova,
        revisao: revisaoRef.current
      });
      if (geracao !== geracaoDaPagina.current) return false;
      revisaoRef.current = Number(resultado.revisao);
      setRevisao(revisaoRef.current);
      setSincronizacao("PERSISTIDO_NO_NUCLEO");
      return true;
    } catch (causa) {
      if (geracao !== geracaoDaPagina.current) return false;
      setSincronizacao("NAO_PERSISTIDO");
      setErro(causa instanceof Error ? causa.message : "Falha ao salvar.");
      return false;
    }
  // caminho e token permanecem estáveis nesta apresentação.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caminho, token]);

  function escolher(valor: "AUTORIZO" | "NAO_AUTORIZO") {
    if (copia || consulta?.apresentacao.estado === "CONFIRMADO") return;
    setResposta(valor);
    setErro("");
    setSincronizacao("ALTERACAO_PENDENTE");
    if (temporizador.current) clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => void salvar(valor), 350);
  }

  async function confirmar() {
    if (!consulta || consulta.apresentacao.estado === "CONFIRMADO") return;
    const geracao = geracaoDaPagina.current;
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
      if (!(await salvar(resposta))) return;
      if (geracao !== geracaoDaPagina.current) return;
      const resultado = await enviar("confirmar", {
        resposta_operacional: resposta,
        codigo_do_instrumento: consulta.instrumento.codigo,
        versao_do_instrumento: consulta.instrumento.versao,
        hash_do_documento: consulta.instrumento.hash_do_documento,
        horario_do_dispositivo: new Date().toISOString(),
        fuso_horario: Intl.DateTimeFormat().resolvedOptions().timeZone,
        classe_do_dispositivo: /Mobi|Android/i.test(navigator.userAgent)
          ? "DISPOSITIVO_MOVEL"
          : "COMPUTADOR",
        agente_minimizado: navigator.userAgent
      });
      if (geracao !== geracaoDaPagina.current) return;
      setCopia(resultado as Copia);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (causa) {
      if (geracao !== geracaoDaPagina.current) return;
      try {
        const estado = await fetch(
          `${caminho}?token=${encodeURIComponent(token)}`,
          { cache: "no-store", credentials: "same-origin" }
        );
        if (estado.ok) {
          const atualizado = await estado.json() as Consulta;
          if (geracao !== geracaoDaPagina.current) return;
          if (atualizado.apresentacao.estado === "CONFIRMADO") {
            setConsulta(atualizado);
            const comprovante = await obterCopia();
            if (geracao !== geracaoDaPagina.current) return;
            if (comprovante) {
              setCopia(comprovante);
              setErro("");
              return;
            }
            setErro("Resposta registrada. A cópia está temporariamente indisponível; não confirme novamente.");
            return;
          }
        }
      } catch {
        // Sem nova confirmação: o estado remoto é desconhecido até recarregar.
      }
      if (geracao !== geracaoDaPagina.current) return;
      setErro(
        `${causa instanceof Error ? causa.message : "Falha ao confirmar."} `
        + "Se a conexão falhou após o envio, recarregue antes de tentar novamente."
      );
    } finally {
      if (geracao === geracaoDaPagina.current) setOcupado(false);
    }
  }

  async function confirmarEscolhasIndependentes() {
    if (!consulta || consulta.fluxo_simplificado ||
      consulta.apresentacao.estado === "CONFIRMADO") return;
    const geracao = geracaoDaPagina.current;
    const pendentes = consulta.instrumento.secoes.filter((secao) =>
      secao.decisao_obrigatoria &&
      !secao.opcoes?.includes(decisoesIndependentes[secao.codigo] ?? "")
    );
    if (pendentes.length) {
      setErro("Revise os atos e escolhas ainda sem resposta antes de confirmar.");
      document.getElementById(`secao-${pendentes[0].codigo}`)?.scrollIntoView({
        behavior: "smooth", block: "center"
      });
      return;
    }
    setOcupado(true);
    setErro("");
    try {
      const resultado = await enviar("confirmar", {
        decisoes: decisoesIndependentes,
        codigo_do_instrumento: consulta.instrumento.codigo,
        versao_do_instrumento: consulta.instrumento.versao,
        hash_do_documento: consulta.instrumento.hash_do_documento,
        horario_do_dispositivo: new Date().toISOString(),
        fuso_horario: Intl.DateTimeFormat().resolvedOptions().timeZone,
        classe_do_dispositivo: /Mobi|Android/i.test(navigator.userAgent)
          ? "DISPOSITIVO_MOVEL" : "COMPUTADOR",
        agente_minimizado: navigator.userAgent
      });
      if (geracao !== geracaoDaPagina.current) return;
      setCopia(resultado as Copia);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (causa) {
      if (geracao !== geracaoDaPagina.current) return;
      try {
        const estado = await fetch(
          `${caminho}?token=${encodeURIComponent(token)}`,
          { cache: "no-store", credentials: "same-origin" }
        );
        if (estado.ok) {
          const atualizado = await estado.json() as Consulta;
          if (geracao !== geracaoDaPagina.current) return;
          if (atualizado.apresentacao.estado === "CONFIRMADO") {
            setConsulta(atualizado);
            const comprovante = await obterCopia();
            if (geracao !== geracaoDaPagina.current) return;
            if (comprovante) {
              setCopia(comprovante);
              setErro("");
              return;
            }
          }
        }
      } catch {
        // Uma falha de rede não autoriza repetir a manifestação.
      }
      if (geracao !== geracaoDaPagina.current) return;
      setErro(`${causa instanceof Error ? causa.message : "Falha ao confirmar."} `
        + "Recarregue para verificar o registro antes de tentar novamente.");
    } finally {
      if (geracao === geracaoDaPagina.current) setOcupado(false);
    }
  }

  function baixarTextoIntegral() {
    if (!consulta) return;
    const contexto = json<Record<string, unknown>>(
      consulta.apresentacao.contexto_json ?? {}
    );
    const fichas = (contexto.fichas_do_programa ?? {}) as
      Record<string, Record<string, string>>;
    const linhas = [
      consulta.instrumento.titulo,
      `${consulta.instrumento.codigo} · versão ${consulta.instrumento.versao}`,
      `Integridade do documento: ${consulta.instrumento.hash_do_documento}`,
      `Finalidade apresentada: ${consulta.identificacao.finalidade}`,
      ...(consulta.instrumento.versao === "1.3" ? [
        `Serviço efetivo: ${String(contexto.servico_efetivo ?? "")}`,
        `Programa: ${String(contexto.programa ?? "")}`,
        ...Object.entries(fichas).flatMap(([codigo, ficha]) => [
          `Ficha do programa: ${codigo}`,
          ...Object.entries(ficha).map(([campo, valor]) => `${campo}: ${valor}`)
        ])
      ] : []),
      ...consulta.instrumento.secoes.flatMap((secao, indice) => [
        "",
        `${indice + 1}. ${secao.titulo}`,
        secao.texto,
        `Consequência: ${secao.consequencia}`,
        ...(secao.decisao_obrigatoria
          ? [`Opções de manifestação: ${(secao.opcoes ?? []).map(rotulo).join(" / ")}`]
          : [])
      ])
    ];
    const url = URL.createObjectURL(new Blob(
      [linhas.join("\n")], { type: "text/plain;charset=utf-8" }
    ));
    const link = document.createElement("a");
    link.href = url;
    link.download = `instrumento-humanexus-${consulta.instrumento.codigo}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function revogar(codigo: string) {
    if (!window.confirm(
      "Revogar esta modalidade para novas coletas e novos produtos?"
    )) return;
    const geracao = ++geracaoDaPagina.current;
    sequenciaDaCopia.current++;
    setOcupado(true);
    try {
      await enviar("revogar", { codigo_da_decisao: codigo });
      if (geracao !== geracaoDaPagina.current) return;
      const copiaAtual = await obterCopia();
      if (geracao !== geracaoDaPagina.current) return;
      if (!copiaAtual) {
        throw new Error("Revogação registrada. Recarregue para obter o estado atual.");
      }
      setCopia(copiaAtual);
      setErro("");
    } catch (causa) {
      if (geracao === geracaoDaPagina.current) {
        setErro(causa instanceof Error ? causa.message : "Falha ao revogar.");
      }
    } finally {
      if (geracao === geracaoDaPagina.current) {
        setOcupado(false);
        setRevisaoDoPolling((atual) => atual + 1);
      }
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
  const contexto = consulta.apresentacao.contexto_json as
    | Record<string, unknown>
    | string
    | undefined;
  const contextoDaApresentacao = contexto
    ? json<Record<string, unknown>>(contexto)
    : {};
  const fichasDaApresentacao = (
    contextoDaApresentacao.fichas_do_programa ?? {}
  ) as Record<string, Record<string, string>>;
  const confirmado = Boolean(copia)
    || consulta.apresentacao.estado === "CONFIRMADO";
  const secoesComEscolha = consulta.instrumento.secoes.filter(
    (secao) => secao.decisao_obrigatoria
  );
  const escolhasCompletas = secoesComEscolha.length > 0 &&
    secoesComEscolha.every((secao) =>
      secao.opcoes?.includes(decisoesIndependentes[secao.codigo] ?? "")
    );
  const estruturaMinimaPresente = [
    "TCLE", "AVISO_PRIVACIDADE", "TERMOS_USO"
  ].every((codigo) => consulta.instrumento.secoes.some(
    (secao) => secao.codigo === codigo
  )) && consulta.instrumento.secoes.every((secao) => Boolean(
    secao.titulo?.trim() && secao.texto?.trim() && secao.consequencia?.trim()
  )) && (!consulta.fluxo_simplificado || Boolean(
    configuracao?.autorizo?.trim()
    && configuracao?.nao_autorizo?.trim()
    && configuracao?.modalidades_abrangidas?.length
    && configuracao?.consequencias?.AUTORIZO?.trim()
    && configuracao?.consequencias?.NAO_AUTORIZO?.trim()
  ));
  const textoEscolhido = resposta === "AUTORIZO"
    ? configuracao?.autorizo ?? TEXTO_AUTORIZO
    : resposta === "NAO_AUTORIZO"
      ? configuracao?.nao_autorizo ?? TEXTO_NAO_AUTORIZO
      : "Nenhuma resposta escolhida.";
  const consequencia = resposta
    ? configuracao?.consequencias?.[resposta]
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

  if (!consulta.fluxo_simplificado) {
    return (
      <main className="hxiicca hxiicca--escolhas-independentes"
        translate="no" data-portugues-preservar="true">
        <header className="hxiicca__hero">
          <div className="hxiicca__brand"><span>HX</span><div>
            <strong>HUMANEXUS</strong><small>ACESSO DO PARTICIPANTE</small>
          </div></div>
          <div className="hxiicca__hero-copy">
            <small>DOCUMENTO IDENTIFICADO · {consulta.instrumento.codigo}</small>
            <h1>{consulta.instrumento.titulo}</h1>
            <p>Leia o conteúdo integral. Ciência, concordância e autorizações
              facultativas são atos distintos; nenhuma escolha é presumida.</p>
          </div>
        </header>
        <section className="hxiicca__contexto" aria-label="Identificação">
          <article><small>PRESTADOR</small><strong>{consulta.identificacao.instituto}</strong></article>
          <article><small>PARTICIPANTE</small><strong>{consulta.identificacao.participante}</strong></article>
          <article><small>{consulta.identificacao.rotulo_do_cliente}</small><strong>{consulta.identificacao.cliente}</strong></article>
          <article><small>FINALIDADE</small><strong>{consulta.identificacao.finalidade}</strong></article>
          <article><small>VERSÃO</small><strong>{consulta.instrumento.versao}</strong></article>
          {consulta.instrumento.versao === "1.3" && <>
            <article><small>SERVIÇO</small><strong>{rotulo(String(
              contextoDaApresentacao.servico_efetivo ?? ""
            ))}</strong></article>
            <article><small>PROGRAMA</small><strong>{String(
              contextoDaApresentacao.programa ?? ""
            )}</strong></article>
          </>}
        </section>
        {consulta.instrumento.versao === "1.3" &&
          Object.entries(fichasDaApresentacao).length > 0 && (
          <section className="hxiicca__documento" aria-label="Fichas do programa">
            <h2>Finalidades concretas deste programa</h2>
            {Object.entries(fichasDaApresentacao).map(([codigo, ficha]) => (
              <article className="hxiicca__secao-conteudo" key={codigo}>
                <h3>{rotulo(codigo)}</h3>
                {Object.entries(ficha).map(([campo, valor]) => (
                  <p key={campo}><strong>{rotulo(campo)}:</strong> {valor}</p>
                ))}
              </article>
            ))}
          </section>
        )}
        <button type="button" onClick={baixarTextoIntegral}>
          BAIXAR TEXTO INTEGRAL ANTES DE DECIDIR
        </button>
        <section className="hxiicca__documento">
          {consulta.instrumento.secoes.map((secao, indice) => (
            <details className="hxiicca__secao" id={`secao-${secao.codigo}`}
              key={secao.codigo} open>
              <summary><span>{String(indice + 1).padStart(2, "0")}</span>
                <div><h2>{secao.titulo}</h2><small>{rotulo(secao.natureza)}</small></div>
                <em data-classificacao={secao.classificacao}>{rotulo(secao.classificacao)}</em>
              </summary>
              <div className="hxiicca__secao-conteudo">
                {secao.texto.split(/\n\s*\n/).map((paragrafo, parte) =>
                  <p key={`${secao.codigo}-${parte}`}>{paragrafo}</p>)}
                <aside><strong>Consequência desta seção</strong><span>{secao.consequencia}</span></aside>
                {secao.decisao_obrigatoria && (
                  <fieldset disabled={confirmado || ocupado}>
                    <legend>{secao.natureza === "AUTORIZACAO"
                      ? `Escolha facultativa: ${secao.titulo}`
                      : `Ato distinto: ${secao.titulo}`}</legend>
                    {(secao.opcoes ?? []).map((opcao) => (
                      <label key={opcao}
                        className={decisoesIndependentes[secao.codigo] === opcao
                          ? "is-selected" : ""}>
                        <input type="radio" name={`decisao-${secao.codigo}`}
                          value={opcao}
                          checked={decisoesIndependentes[secao.codigo] === opcao}
                          onChange={() => setDecisoesIndependentes((anteriores) => ({
                            ...anteriores, [secao.codigo]: opcao
                          }))} />
                        <span>{rotulo(opcao)}</span>
                      </label>
                    ))}
                  </fieldset>
                )}
              </div>
            </details>
          ))}
          {!confirmado && (
            <section className="hxiicca__revisao" id="revisao">
              <h2>Revisão das escolhas independentes</h2>
              <p>Uma escolha não autoriza outra. Respostas em branco não são autorização.</p>
              <div className="hxiicca__revisao-grid">
                {secoesComEscolha.map((secao) => <article key={secao.codigo}>
                  <small>{secao.titulo}</small>
                  <strong>{decisoesIndependentes[secao.codigo]
                    ? rotulo(decisoesIndependentes[secao.codigo]) : "PENDENTE"}</strong>
                </article>)}
              </div>
              {erro && <p className="hxiicca__erro" role="alert">{erro}</p>}
              <button className="hxiicca__confirmar" type="button"
                disabled={ocupado || !escolhasCompletas || !estruturaMinimaPresente}
                onClick={() => void confirmarEscolhasIndependentes()}>
                CONFIRMAR OS ATOS E AS ESCOLHAS ACIMA
              </button>
            </section>
          )}
          {confirmado && copia && (
            <section className="hxiicca__copia">
              <h2>Manifestação preservada</h2>
              <p>{dataLegivel(copia.manifestacao.confirmado_em)}</p>
              {copia.decisoes.map((item) => <article key={item.identificador}>
                <strong>{rotulo(item.codigo_da_decisao)}</strong>
                <span>{rotulo(item.decisao)} · {rotulo(item.estado)}</span>
              </article>)}
              <a className="hxiicca__pdf"
                href={`${caminho}/pdf?token=${encodeURIComponent(token)}`}
                target="_blank" rel="noreferrer">BAIXAR CÓPIA INTEGRAL EM PDF</a>
              <a className="hxiicca__autorizacoes-link"
                href={`?token=${encodeURIComponent(token)}&area=autorizacoes`}>
                Minhas autorizações
              </a>
            </section>
          )}
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
      </header>

      <section className="hxiicca__contexto" aria-label="Identificação">
        <article><small>PARTICIPANTE</small><strong>{consulta.identificacao.participante}</strong></article>
        <article><small>{consulta.identificacao.rotulo_do_cliente}</small><strong>{consulta.identificacao.cliente}</strong></article>
        <article><small>FINALIDADE</small><strong>{consulta.identificacao.finalidade}</strong></article>
        <article><small>VERSÃO</small><strong>{consulta.instrumento.versao}</strong></article>
      </section>

      <button type="button" onClick={baixarTextoIntegral}>
        BAIXAR TEXTO INTEGRAL ANTES DE DECIDIR
      </button>

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
              open
            >
              <summary>
                <span>{String(indice + 1).padStart(2, "0")}</span>
                <div><h2>{secao.titulo}</h2><small>{rotulo(secao.natureza)}</small></div>
                <em data-classificacao={secao.classificacao}>{rotulo(secao.classificacao)}</em>
              </summary>
              <div className="hxiicca__secao-conteudo">
                {secao.texto.split(/\n\s*\n/).map((paragrafo, parte) => (
                  <p key={`${secao.codigo}-${parte}`}>{paragrafo}</p>
                ))}
                <aside><strong>Consequência desta seção</strong><span>{secao.consequencia}</span></aside>
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
                    <small>MÍDIA PLANEJADA</small>
                    <span>{rotuloDaMidia(String(contextoDaApresentacao.modalidade_de_midia ?? "NENHUM"))}</span>
                    <small>POLÍTICA DE ARMAZENAMENTO</small>
                    <span>{rotuloDaRetencao(consulta.apresentacao.politica_de_retencao)}</span>
                  </article>
                  <article>
                    <small>VERSÃO DO INSTRUMENTO</small>
                    <span>{consulta.instrumento.codigo} · {consulta.instrumento.versao}</span>
                  </article>
                </div>
                {!estruturaMinimaPresente && (
                  <p className="hxiicca__erro" role="alert">
                    A estrutura obrigatória do documento não foi recebida por
                    completo. A confirmação foi bloqueada; tente novamente ou
                    peça esclarecimentos ao Instituto HUMANEXUS.
                  </p>
                )}
                {!confirmado && (
                  <button
                    className="hxiicca__confirmar"
                    type="button"
                    disabled={ocupado || !resposta || !estruturaMinimaPresente}
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
        <span>Canal institucional</span>
        <span>Rascunho {revisao} · validade até {dataLegivel(consulta.apresentacao.expira_em)}</span>
      </footer>
    </main>
  );
}
