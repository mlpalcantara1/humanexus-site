"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { ModuloDaPlataforma } from "@/components/modulo-integrado";

type Registro = Record<string, unknown>;
type Dados = {
  usuario: Registro;
  organizacoes: Registro[];
  organizacao: Registro | null;
  participantes: Registro[];
  sessoes: Registro[];
  catalogo_treinamentos: Registro[];
  programacoes: Registro[];
  contratos: Registro[];
  profissionais: Registro[];
  vinculos_ctr_thx_validados: Registro[];
  modelos_consentimento: Registro[];
};

function csrf() {
  return document.cookie
    .split("; ")
    .find((item) => item.startsWith("humanexus_csrf="))
    ?.split("=")[1] ?? "";
}

function texto(valor: unknown, padrao = "Não informado") {
  return valor == null || valor === ""
    ? padrao
    : String(valor).replaceAll("_", " ");
}

function dataLegivel(valor: unknown) {
  if (!valor) return "Não registrada";
  const data = new Date(String(valor));
  return Number.isNaN(data.getTime())
    ? texto(valor)
    : new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
        timeZone: "America/Manaus"
      }).format(data);
}

export function GestaoOperacional({
  modulo
}: {
  modulo: ModuloDaPlataforma;
}) {
  const [dados, setDados] = useState<Dados | null>(null);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [organizacaoSelecionada, setOrganizacaoSelecionada] = useState("");
  const [organizacao, setOrganizacao] = useState({
    nome: "",
    justificativa: "",
    organizacao_base: false
  });
  const [participante, setParticipante] = useState({
    referencia_externa: "",
    tipo_de_vinculo: "ORGANIZACIONAL"
  });
  const [sessao, setSessao] = useState({
    identificador_do_participante: "",
    finalidade: "",
    modalidade: "INDIVIDUAL",
    data_programada: "",
    duracao_planejada_minutos: "60",
    identificador_do_profissional: "",
    identificador_da_anamnese: "",
    codigo_do_ctr: "",
    codigo_do_thx: "",
    justificativa: ""
  });
  const [treinamento, setTreinamento] = useState({
    codigo: "",
    nome: "",
    descricao: "",
    versao: "1.0"
  });
  const [programacao, setProgramacao] = useState({
    identificador_do_catalogo: "",
    identificador_do_participante: ""
  });
  const [contrato, setContrato] = useState({
    tipo: "ORGANIZACIONAL",
    inicio_da_vigencia: "",
    fim_da_vigencia: "",
    numero_de_participantes: "",
    marcacao: ""
  });
  const [consentimento, setConsentimento] = useState({
    identificador_do_participante: "",
    identificador_da_sessao: "",
    finalidade: "HOMOLOGACAO_FISICA_AUTORIZADA",
    validade_em_horas: "72",
    polar: false,
    eeg: false,
    telemetria: false,
    audio: false,
    video: false,
    replay: true,
    relatorio: true,
    longitudinal: true,
    coletivo: false,
    pesquisa: false
  });
  const [entregaDeConsentimento, setEntregaDeConsentimento] =
    useState<Registro | null>(null);

  async function carregar(organizacaoId = organizacaoSelecionada) {
    const parametros = new URLSearchParams();
    if (organizacaoId) parametros.set("organizacao", organizacaoId);
    const resposta = await fetch(
      `/api/gestao-operacional${parametros.size ? `?${parametros}` : ""}`,
      { cache: "no-store" }
    );
    const corpo = await resposta.json();
    if (!resposta.ok) {
      throw new Error(corpo?.erro?.mensagem ?? "Gestão indisponível.");
    }
    setDados(corpo as Dados);
    const atual = String(corpo.organizacao?.identificador ?? "");
    setOrganizacaoSelecionada(atual);
    setOrganizacao((estado) => ({
      ...estado,
      nome: String(corpo.organizacao?.nome ?? "")
    }));
    setSessao((estado) => ({
      ...estado,
      identificador_do_participante:
        estado.identificador_do_participante
        || String(corpo.participantes?.[0]?.identificador ?? ""),
      identificador_do_profissional:
        estado.identificador_do_profissional
        || String(corpo.profissionais?.[0]?.identificador ?? ""),
      identificador_da_anamnese:
        estado.identificador_da_anamnese
        || String(
          corpo.participantes?.[0]?.anamneses
            ?.find((item: Registro) =>
              item.estado === "CONCLUIDA_PELO_PARTICIPANTE"
              && Number(item.percentual_concluido) === 100
              && item.validade_cientifica === "VALIDA"
            )?.identificador ?? ""
        ),
      codigo_do_ctr:
        estado.codigo_do_ctr
        || String(corpo.vinculos_ctr_thx_validados?.[0]?.codigo_do_ctr ?? ""),
      codigo_do_thx:
        estado.codigo_do_thx
        || String(corpo.vinculos_ctr_thx_validados?.[0]?.codigo_do_thx ?? "")
    }));
    setConsentimento((estado) => ({
      ...estado,
      identificador_do_participante:
        estado.identificador_do_participante
        || String(corpo.participantes?.[0]?.identificador ?? "")
    }));
  }

  useEffect(() => {
    carregar().catch((causa) => setErro(causa.message));
  }, []);

  async function executar(
    acao: string,
    payload: Registro,
    identificador?: unknown
  ): Promise<Registro | null> {
    setOcupado(true);
    setErro("");
    setMensagem("");
    try {
      const resposta = await fetch("/api/gestao-operacional", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-humanexus-csrf": csrf()
        },
        body: JSON.stringify({
          acao,
          identificador,
          dados: payload
        })
      });
      const corpo = await resposta.json();
      if (!resposta.ok) {
        throw new Error(corpo?.erro?.mensagem ?? "Operação recusada.");
      }
      setMensagem("Operação concluída e auditada.");
      await carregar();
      return corpo as Registro;
    } catch (causa) {
      setErro(causa instanceof Error ? causa.message : "Operação recusada.");
      return null;
    } finally {
      setOcupado(false);
    }
  }

  async function apresentarConsentimento(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const resultado = await executar("apresentar-instrumento-integrado", {
      identificador_da_organizacao: String(dados?.organizacao?.identificador ?? ""),
      identificador_do_participante:
        consentimento.identificador_do_participante,
      identificador_da_sessao:
        consentimento.identificador_da_sessao || null,
      finalidade: consentimento.finalidade,
      validade_em_horas: Number(consentimento.validade_em_horas),
      recursos: {
        dados_sensiveis: true,
        polar: consentimento.polar,
        eeg: consentimento.eeg,
        telemetria: consentimento.telemetria,
        audio: consentimento.audio,
        video: consentimento.video,
        multimodal: false,
        replay: consentimento.replay,
        relatorio: consentimento.relatorio,
        longitudinal: consentimento.longitudinal,
        coletivo: consentimento.coletivo,
        pesquisa: consentimento.pesquisa,
        modalidade_de_midia: consentimento.audio && consentimento.video
          ? "AUDIO_E_VIDEO"
          : consentimento.audio ? "AUDIO"
          : consentimento.video ? "VIDEO"
          : "NENHUM",
        politica_de_retencao: "NAO_ARMAZENAR"
      }
    });
    const identificador = String(resultado?.identificador ?? "");
    const token = String(resultado?.token_de_entrega_unica ?? "");
    if (!identificador || !token) return;
    setEntregaDeConsentimento({
      ...resultado,
      link_de_manifestacao:
        `${window.location.origin}/instrumento-integrado/${encodeURIComponent(identificador)}`
        + `?token=${encodeURIComponent(token)}`
    });
  }

  const organizacaoAtual = dados?.organizacao;
  const podeAdministrar = [
    "ADMINISTRADOR_DO_SISTEMA",
    "ADMINISTRADOR_DA_ORGANIZACAO"
  ].includes(String(dados?.usuario.perfil));
  const podeConduzir = String(dados?.usuario.perfil) === "PROFISSIONAL_HUMANEXUS"
    || String(dados?.usuario.perfil) === "ADMINISTRADOR_DO_SISTEMA";
  const participanteDaSessao = dados?.participantes.find(
    (item) => item.identificador === sessao.identificador_do_participante
  );
  const anamnesesConcluidas = (
    participanteDaSessao?.anamneses as Registro[] | undefined
  )?.filter(
    (item) =>
      item.estado === "CONCLUIDA_PELO_PARTICIPANTE"
      && Number(item.percentual_concluido) === 100
      && item.validade_cientifica === "VALIDA"
  ) ?? [];

  const cabecalho = (
    <section className="hx-management-context">
      <div>
        <small>ESCOPO AUTORIZADO</small>
        <strong>{texto(organizacaoAtual?.nome, "Nenhuma organização selecionada")}</strong>
        <span>{texto(dados?.usuario.nome)} · {texto(dados?.usuario.perfil)}</span>
      </div>
      <label>
        Organização
        <select
          value={organizacaoSelecionada}
          disabled={ocupado || (dados?.organizacoes.length ?? 0) < 2}
          onChange={(evento) => {
            setOrganizacaoSelecionada(evento.target.value);
            void carregar(evento.target.value);
          }}
        >
          {dados?.organizacoes.map((item) => (
            <option key={String(item.identificador)} value={String(item.identificador)}>
              {texto(item.nome)}
            </option>
          ))}
        </select>
      </label>
    </section>
  );

  const tabelaParticipantes = (
    <section className="hx-management-table">
      <header><div><small>PARTICIPANTES</small><h2>Cadastros no escopo</h2></div><span>{dados?.participantes.length ?? 0} registro(s)</span></header>
      <div>
        {dados?.participantes.map((item) => (
          <article key={String(item.identificador)}>
            <div><small>Referência</small><strong>{texto(item.referencia_externa)}</strong></div>
            <div><small>Situação</small><strong>{item.ativo ? "ATIVO" : "INATIVO"}</strong></div>
            <div><small>Criado</small><strong>{dataLegivel(item.criado_em)}</strong></div>
            <button
              type="button"
              disabled={ocupado}
              onClick={() => void executar(
                "atualizar-participante",
                {
                  referencia_externa: item.referencia_externa,
                  ativo: !item.ativo,
                  tipo_de_vinculo: "ORGANIZACIONAL"
                },
                item.identificador
              )}
            >
              {item.ativo ? "Inativar" : "Reativar"}
            </button>
          </article>
        ))}
      </div>
    </section>
  );

  const tabelaSessoes = (
    <section className="hx-management-table">
      <header><div><small>SESSÕES</small><h2>Ciclo operacional auditável</h2></div><span>{dados?.sessoes.length ?? 0} registro(s)</span></header>
      <div>
        {dados?.sessoes.map((item) => {
          const operacional = item.detalhes_operacionais as Registro | undefined;
          const estado = String(operacional?.estado_operacional ?? item.estado);
          const acao = estado === "CRIADA"
            ? "ABRIR"
            : estado === "INICIADA"
              ? "PAUSAR"
              : estado === "PAUSADA" || estado === "INTERROMPIDA" || estado === "REABERTA"
                ? "RETOMAR"
                : null;
          return (
            <article key={String(item.identificador)}>
              <div><small>Sessão</small><strong>{texto(item.identificador)}</strong></div>
              <div><small>Estado</small><strong>{texto(estado)}</strong></div>
              <div><small>Participante</small><strong>{texto(item.identificador_do_participante)}</strong></div>
              {acao && operacional ? (
                <button
                  type="button"
                  disabled={ocupado}
                  onClick={() => void executar(
                    "operar-sessao",
                    { acao },
                    item.identificador
                  )}
                >
                  {texto(acao)}
                </button>
              ) : <span>Histórico preservado</span>}
            </article>
          );
        })}
      </div>
    </section>
  );

  const contadores = useMemo(() => ({
    participantes: dados?.participantes.length ?? 0,
    sessoes: dados?.sessoes.length ?? 0,
    treinamentos: dados?.catalogo_treinamentos.length ?? 0,
    programacoes: dados?.programacoes.length ?? 0,
    contratos: dados?.contratos.length ?? 0
  }), [dados]);
  const ctrsValidados = useMemo(() => Array.from(new Map(
    (dados?.vinculos_ctr_thx_validados ?? []).map((item) => [String(item.codigo_do_ctr), item])
  ).values()), [dados]);
  const thxValidadosDoCtr = useMemo(() => (
    dados?.vinculos_ctr_thx_validados ?? []
  ).filter((item) => item.codigo_do_ctr === sessao.codigo_do_ctr), [dados, sessao.codigo_do_ctr]);

  if (erro && !dados) return <p className="hx-module__error">{erro}</p>;
  if (!dados) return <p className="hx-module__loading">Carregando gestão operacional…</p>;

  return (
    <div className="hx-management">
      {cabecalho}
      <section className="hx-management-metrics">
        {Object.entries(contadores).map(([rotulo, total]) => (
          <article key={rotulo}><small>{texto(rotulo)}</small><strong>{total}</strong></article>
        ))}
      </section>

      {modulo === "organizacoes" ? (
        <div className="hx-management-grid">
          <form onSubmit={(evento: FormEvent) => {
            evento.preventDefault();
            void executar(
              "atualizar-organizacao",
              {
                ...organizacao,
                ativa: Boolean(organizacaoAtual?.ativa),
                dados_contratuais: {},
                responsaveis: [],
                gestores: [],
                unidades: [],
                escopo: {}
              },
              organizacaoAtual?.identificador
            );
          }}>
            <small>EDIÇÃO VERSIONADA</small>
            <h2>Dados da organização</h2>
            <label>Nome institucional<input required value={organizacao.nome} onChange={(evento) => setOrganizacao({ ...organizacao, nome: evento.target.value })} /></label>
            <label className="hx-checkbox"><input type="checkbox" checked={organizacao.organizacao_base} onChange={(evento) => setOrganizacao({ ...organizacao, organizacao_base: evento.target.checked })} />Organização-base</label>
            <label>Justificativa<textarea required value={organizacao.justificativa} onChange={(evento) => setOrganizacao({ ...organizacao, justificativa: evento.target.value })} /></label>
            <button disabled={ocupado || !podeAdministrar}>Salvar nova versão</button>
          </form>
          <section className="hx-management-table">
            <header><div><small>ORGANIZAÇÕES</small><h2>Diretório autorizado</h2></div></header>
            <div>{dados.organizacoes.map((item) => <article key={String(item.identificador)}><div><small>Nome</small><strong>{texto(item.nome)}</strong></div><div><small>Situação</small><strong>{item.ativa ? "ATIVA" : "INATIVA"}</strong></div><span>{texto(item.identificador)}</span></article>)}</div>
          </section>
        </div>
      ) : null}

      {modulo === "clientes" ? (
        <div className="hx-management-grid">
          <form onSubmit={(evento: FormEvent) => {
            evento.preventDefault();
            void executar("criar-participante", {
              identificador_da_organizacao: organizacaoAtual?.identificador,
              referencia_externa: participante.referencia_externa,
              tipo_de_vinculo: participante.tipo_de_vinculo,
              dados_minimizados: {
                referencia_operacional: participante.referencia_externa
              }
            });
          }}>
            <small>CADASTRO MINIMIZADO</small>
            <h2>Novo participante</h2>
            <label>Referência operacional<input required value={participante.referencia_externa} onChange={(evento) => setParticipante({ ...participante, referencia_externa: evento.target.value })} /></label>
            <label>Tipo de vínculo<select value={participante.tipo_de_vinculo} onChange={(evento) => setParticipante({ ...participante, tipo_de_vinculo: evento.target.value })}><option>ORGANIZACIONAL</option><option>PARTICULAR</option><option>MISTO</option></select></label>
            <button disabled={ocupado}>Cadastrar participante</button>
          </form>
          <form onSubmit={(evento) => void apresentarConsentimento(evento)}>
            <small>IICCA-HXP-1.1 · RESPOSTA ÚNICA</small>
            <h2>Instrumento integrado único</h2>
            <label>Participante<select
              required
              value={consentimento.identificador_do_participante}
              onChange={(evento) => setConsentimento({
                ...consentimento,
                identificador_do_participante: evento.target.value,
                identificador_da_sessao: ""
              })}
            >
              {dados.participantes.map((item) => (
                <option
                  key={String(item.identificador)}
                  value={String(item.identificador)}
                >
                  {texto(item.referencia_externa)} · {String(item.identificador)}
                </option>
              ))}
            </select></label>
            <label>Sessão<select
              value={consentimento.identificador_da_sessao}
              onChange={(evento) => setConsentimento({
                ...consentimento,
                identificador_da_sessao: evento.target.value
              })}
            >
              <option value="">Sem sessão vinculada</option>
              {dados.sessoes
                .filter((item) =>
                  item.identificador_do_participante
                    === consentimento.identificador_do_participante
                )
                .map((item) => (
                  <option
                    key={String(item.identificador)}
                    value={String(item.identificador)}
                  >
                    {texto(item.finalidade)} · {String(item.identificador)}
                  </option>
                ))}
            </select></label>
            <label>Finalidade<input
              required
              value={consentimento.finalidade}
              onChange={(evento) => setConsentimento({
                ...consentimento,
                finalidade: evento.target.value
              })}
            /></label>
            <fieldset className="hx-integrated-resources">
              <legend>Recursos planejados para esta atividade</legend>
              {([
                ["polar", "Polar H10"],
                ["eeg", "EPOC X ou EEG homologado"],
                ["telemetria", "Telemetria de tarefa"],
                ["audio", "Áudio"],
                ["video", "Imagem e vídeo"],
                ["replay", "Replay"],
                ["relatorio", "Relatório individual"],
                ["longitudinal", "Acompanhamento longitudinal"],
                ["coletivo", "Indicador coletivo anonimizado"],
                ["pesquisa", "Pesquisa científica"]
              ] as const).map(([campo, rotulo]) => (
                <label key={campo}>
                  <input
                    type="checkbox"
                    checked={consentimento[campo]}
                    onChange={(evento) => setConsentimento({
                      ...consentimento,
                      [campo]: evento.target.checked
                    })}
                  />
                  {rotulo}
                </label>
              ))}
            </fieldset>
            <label>Validade<select
              value={consentimento.validade_em_horas}
              onChange={(evento) => setConsentimento({
                ...consentimento,
                validade_em_horas: evento.target.value
              })}
            >
              <option value="24">24 horas</option>
              <option value="72">72 horas</option>
              <option value="168">7 dias</option>
            </select></label>
            <button disabled={ocupado || !podeConduzir}>
              Gerar instrumento único
            </button>
            <p>
              Uma única tela, decisões granulares e uma única confirmação final.
              Nenhuma opção é pré-marcada.
            </p>
            {entregaDeConsentimento ? (
              <aside className="hx-module__notice">
                <strong>Link exibido uma única vez</strong>
                <a
                  href={String(entregaDeConsentimento.link_de_manifestacao)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Abrir instrumento como participante
                </a>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(
                    String(entregaDeConsentimento.link_de_manifestacao)
                  )}
                >
                  Copiar link
                </button>
              </aside>
            ) : null}
          </form>
          {tabelaParticipantes}
        </div>
      ) : null}

      {modulo === "sessoes" ? (
        <div className="hx-management-grid">
          <form onSubmit={(evento: FormEvent) => {
            evento.preventDefault();
            void executar("criar-sessao-com-vinculo", {
              ...sessao,
              duracao_planejada_minutos: Number(sessao.duracao_planejada_minutos)
            });
          }}>
            <small>CONTEXTO CIENTÍFICO PRESERVADO</small>
            <h2>Programar sessão</h2>
            <label>Participante<select required value={sessao.identificador_do_participante} onChange={(evento) => {
              const participanteId = evento.target.value;
              const participanteSelecionado = dados.participantes.find(
                (item) => item.identificador === participanteId
              );
              const anamnese = (
                participanteSelecionado?.anamneses as Registro[] | undefined
              )?.find(
                (item) =>
                  item.estado === "CONCLUIDA_PELO_PARTICIPANTE"
                  && Number(item.percentual_concluido) === 100
                  && item.validade_cientifica === "VALIDA"
              );
              setSessao({
                ...sessao,
                identificador_do_participante: participanteId,
                identificador_da_anamnese: String(anamnese?.identificador ?? "")
              });
            }}>{dados.participantes.map((item) => <option key={String(item.identificador)} value={String(item.identificador)}>{texto(item.referencia_externa)}</option>)}</select></label>
            <label>Profissional responsável<select required value={sessao.identificador_do_profissional} onChange={(evento) => setSessao({ ...sessao, identificador_do_profissional: evento.target.value })}>{dados.profissionais.map((item) => <option key={String(item.identificador)} value={String(item.identificador)}>{texto(item.nome)}</option>)}</select></label>
            <label>Anamnese concluída<select required value={sessao.identificador_da_anamnese} onChange={(evento) => setSessao({ ...sessao, identificador_da_anamnese: evento.target.value })}><option value="">Selecione</option>{anamnesesConcluidas.map((item) => <option key={String(item.identificador)} value={String(item.identificador)}>{texto(item.identificador_da_versao_do_formulario)} · {dataLegivel(item.concluido_em)}</option>)}</select></label>
            <label>Finalidade<input required value={sessao.finalidade} onChange={(evento) => setSessao({ ...sessao, finalidade: evento.target.value })} /></label>
            <label>Modalidade<select value={sessao.modalidade} onChange={(evento) => setSessao({ ...sessao, modalidade: evento.target.value })}><option>INDIVIDUAL</option><option>GRUPO</option><option>TREINAMENTO</option><option>AVALIAÇÃO</option></select></label>
            <label>CTR oficial<select required value={sessao.codigo_do_ctr} onChange={(evento) => {
              const codigo = evento.target.value;
              const primeiroThx = dados.vinculos_ctr_thx_validados.find((item) => item.codigo_do_ctr === codigo);
              setSessao({ ...sessao, codigo_do_ctr: codigo, codigo_do_thx: String(primeiroThx?.codigo_do_thx ?? "") });
            }}>{ctrsValidados.map((item) => <option key={String(item.codigo_do_ctr)} value={String(item.codigo_do_ctr)}>{texto(item.codigo_do_ctr)} · {texto(item.nome_do_ctr)}</option>)}</select></label>
            <label>THX oficial validado<select required value={sessao.codigo_do_thx} onChange={(evento) => setSessao({ ...sessao, codigo_do_thx: evento.target.value })}>{thxValidadosDoCtr.map((item) => <option key={String(item.identificador)} value={String(item.codigo_do_thx)}>{texto(item.codigo_do_thx)} · {texto(item.nome_do_thx)} · {texto(item.papel)}</option>)}</select></label>
            <label>Justificativa da seleção profissional<textarea required value={sessao.justificativa} onChange={(evento) => setSessao({ ...sessao, justificativa: evento.target.value })} /></label>
            <label>Data programada<input type="datetime-local" value={sessao.data_programada} onChange={(evento) => setSessao({ ...sessao, data_programada: evento.target.value })} /></label>
            <label>Duração planejada<input type="number" min="1" max="1440" value={sessao.duracao_planejada_minutos} onChange={(evento) => setSessao({ ...sessao, duracao_planejada_minutos: evento.target.value })} /></label>
            <button disabled={ocupado || !podeConduzir}>Criar sessão</button>
          </form>
          {tabelaSessoes}
        </div>
      ) : null}

      {modulo === "treinamentos" ? (
        <div className="hx-management-grid">
          <form onSubmit={(evento: FormEvent) => {
            evento.preventDefault();
            void executar("criar-treinamento", treinamento);
          }}>
            <small>CATÁLOGO OPERACIONAL</small>
            <h2>Novo treinamento</h2>
            <label>Código<input required value={treinamento.codigo} onChange={(evento) => setTreinamento({ ...treinamento, codigo: evento.target.value })} /></label>
            <label>Nome<input required value={treinamento.nome} onChange={(evento) => setTreinamento({ ...treinamento, nome: evento.target.value })} /></label>
            <label>Descrição<textarea required value={treinamento.descricao} onChange={(evento) => setTreinamento({ ...treinamento, descricao: evento.target.value })} /></label>
            <button disabled={ocupado || !podeAdministrar}>Adicionar ao catálogo</button>
          </form>
          <form onSubmit={(evento: FormEvent) => {
            evento.preventDefault();
            void executar("programar-treinamento", programacao);
          }}>
            <small>PROGRAMAÇÃO</small>
            <h2>Vincular treinamento</h2>
            <label>Treinamento<select required value={programacao.identificador_do_catalogo} onChange={(evento) => setProgramacao({ ...programacao, identificador_do_catalogo: evento.target.value })}><option value="">Selecione</option>{dados.catalogo_treinamentos.map((item) => <option key={String(item.identificador)} value={String(item.identificador)}>{texto(item.nome)}</option>)}</select></label>
            <label>Participante<select required value={programacao.identificador_do_participante} onChange={(evento) => setProgramacao({ ...programacao, identificador_do_participante: evento.target.value })}><option value="">Selecione</option>{dados.participantes.map((item) => <option key={String(item.identificador)} value={String(item.identificador)}>{texto(item.referencia_externa)}</option>)}</select></label>
            <button disabled={ocupado || !podeConduzir}>Programar</button>
          </form>
          <section className="hx-management-table"><header><div><small>PROGRAMAÇÕES</small><h2>Execuções previstas</h2></div></header><div>{dados.programacoes.map((item) => <article key={String(item.identificador)}><div><small>Estado</small><strong>{texto(item.estado)}</strong></div><div><small>Participante</small><strong>{texto(item.identificador_do_participante)}</strong></div><span>{dataLegivel(item.criado_em)}</span></article>)}</div></section>
        </div>
      ) : null}

      {modulo === "configuracoes" ? (
        <div className="hx-management-grid">
          <form onSubmit={(evento: FormEvent) => {
            evento.preventDefault();
            const formulario = new FormData(evento.currentTarget as HTMLFormElement);
            const participantes = String(formulario.get("numero_de_participantes") ?? "");
            void executar("criar-contrato", {
              tipo: String(formulario.get("tipo") ?? "ORGANIZACIONAL"),
              inicio_da_vigencia: String(formulario.get("inicio_da_vigencia") ?? ""),
              fim_da_vigencia: String(formulario.get("fim_da_vigencia") ?? "") || null,
              numero_de_participantes: participantes
                ? Number(participantes)
                : null,
              escopo: {
                marcacao: String(formulario.get("marcacao") ?? "")
              },
              servicos_autorizados: [],
              profissionais_vinculados: []
            });
          }}>
            <small>CONTRATOS E VÍNCULOS</small>
            <h2>Novo vínculo</h2>
            <label>Tipo<select name="tipo" value={contrato.tipo} onChange={(evento) => setContrato({ ...contrato, tipo: evento.target.value })}><option>ORGANIZACIONAL</option><option>PARTICULAR</option></select></label>
            <label>Início<input required name="inicio_da_vigencia" inputMode="numeric" placeholder="AAAA-MM-DD" pattern="\d{4}-\d{2}-\d{2}" value={contrato.inicio_da_vigencia} onChange={(evento) => setContrato({ ...contrato, inicio_da_vigencia: evento.target.value })} /></label>
            <label>Fim<input name="fim_da_vigencia" inputMode="numeric" placeholder="AAAA-MM-DD" pattern="\d{4}-\d{2}-\d{2}" value={contrato.fim_da_vigencia} onChange={(evento) => setContrato({ ...contrato, fim_da_vigencia: evento.target.value })} /></label>
            <label>Número de participantes<input name="numero_de_participantes" type="number" min="1" value={contrato.numero_de_participantes} onChange={(evento) => setContrato({ ...contrato, numero_de_participantes: evento.target.value })} /></label>
            <label>Identificação do contexto<input required name="marcacao" value={contrato.marcacao} onChange={(evento) => setContrato({ ...contrato, marcacao: evento.target.value })} /></label>
            <button disabled={ocupado || !podeAdministrar}>Registrar contrato</button>
          </form>
          <section className="hx-management-table"><header><div><small>HISTÓRICO CONTRATUAL</small><h2>Vínculos preservados</h2></div></header><div>{dados.contratos.map((item) => <article key={String(item.identificador)}><div><small>Tipo</small><strong>{texto(item.tipo)}</strong></div><div><small>Situação</small><strong>{texto(item.situacao)}</strong></div><span>{texto(item.inicio_da_vigencia)} → {texto(item.fim_da_vigencia, "vigente")}</span></article>)}</div></section>
        </div>
      ) : null}

      {mensagem ? <p className="hx-module__notice" role="status">{mensagem}</p> : null}
      {erro ? <p className="hx-module__error" role="alert">{erro}</p> : null}
    </div>
  );
}
