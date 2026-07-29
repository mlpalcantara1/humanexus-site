"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { ModuloDaPlataforma } from "@/components/modulo-integrado";

type Registro = Record<string, unknown>;
type ProtocoloClassificado = Registro & {
  classificacao_operacional: "RECOMENDADO" | "COMPATIVEL" | "OUTRO_OFICIAL";
  recomendacao_operacional: Registro | null;
  vinculos_compativeis: Registro[];
};
type Dados = {
  usuario: Registro;
  organizacoes: Registro[];
  organizacao: Registro | null;
  participantes: Registro[];
  sessoes: Registro[];
  catalogo_treinamentos: Registro[];
  biblioteca_thx_oficial: Registro | null;
  programacoes: Registro[];
  contratos: Registro[];
  profissionais: Registro[];
  vinculos_ctr_thx_validados: Registro[];
  evidencias_regulatorias_treinamento: Registro;
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

function objeto(valor: unknown): Registro {
  if (typeof valor === "string") {
    try {
      const convertido = JSON.parse(valor);
      return convertido && typeof convertido === "object"
        && !Array.isArray(convertido)
        ? convertido as Registro
        : {};
    } catch {
      return {};
    }
  }
  return valor && typeof valor === "object" && !Array.isArray(valor)
    ? valor as Registro
    : {};
}

function lista(valor: unknown): Registro[] {
  if (Array.isArray(valor)) return valor as Registro[];
  if (typeof valor !== "string" || !valor) return [];
  try {
    const convertido = JSON.parse(valor);
    return Array.isArray(convertido) ? convertido as Registro[] : [];
  } catch {
    return [];
  }
}

function listaDeTextos(valor: unknown): string[] {
  if (Array.isArray(valor)) return valor.map(String);
  if (typeof valor !== "string" || !valor) return [];
  try {
    const convertido = JSON.parse(valor);
    return Array.isArray(convertido) ? convertido.map(String) : [];
  } catch {
    return [valor];
  }
}

function normalizar(valor: unknown) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
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
  const [novaOrganizacao, setNovaOrganizacao] = useState(false);
  const [organizacao, setOrganizacao] = useState({
    nome: "",
    razao_social: "",
    nome_fantasia: "",
    cnpj: "",
    inscricao_estadual: "",
    inscricao_municipal: "",
    setor_de_atividade: "",
    porte: "",
    email: "",
    telefone: "",
    site: "",
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    uf: "",
    pais: "Brasil",
    responsavel_nome: "",
    responsavel_cargo: "",
    responsavel_email: "",
    responsavel_telefone: "",
    observacoes: "",
    ativa: true,
    justificativa: "",
    organizacao_base: false
  });
  const [participanteSelecionado, setParticipanteSelecionado] = useState("");
  const [grupoParticipante, setGrupoParticipante] =
    useState<"TODOS" | "PARTICULAR" | "ORGANIZACIONAL">("TODOS");
  const [buscaParticipante, setBuscaParticipante] = useState("");
  const [buscaThx, setBuscaThx] = useState("");
  const [participante, setParticipante] = useState({
    referencia_externa: "",
    tipo_de_vinculo: "ORGANIZACIONAL",
    nome_completo: "",
    nome_social: "",
    data_de_nascimento: "",
    email: "",
    telefone: "",
    cpf: "",
    documento_de_identidade: "",
    profissao: "",
    empresa: "",
    cargo: "",
    funcao: "",
    matricula: "",
    unidade: "",
    setor: "",
    equipe: "",
    registro_profissional: "",
    regime_de_trabalho: "",
    contato_emergencia_nome: "",
    contato_emergencia_parentesco: "",
    contato_emergencia_telefone: "",
    elegibilidade: "PENDENTE",
    justificativa_da_elegibilidade: "",
    observacoes: "",
    ativo: true,
    justificativa: ""
  });
  const [sessao, setSessao] = useState({
    identificador_do_participante: "",
    finalidade: "HOMOLOGAÇÃO FÍSICA FINAL — DADOS REAIS AUTORIZADOS",
    modalidade: "INDIVIDUAL",
    tipo_de_sessao: "PRE_TREINO_POS",
    data_programada: "",
    duracao_planejada_minutos: "60",
    identificador_do_profissional: "",
    identificador_da_anamnese: "",
    codigo_do_ctr: "",
    codigo_do_thx: "",
    justificativa: "",
    chave_de_idempotencia: ""
  });
  const [participanteDoCatalogo, setParticipanteDoCatalogo] = useState("");
  const [familiaThx, setFamiliaThx] = useState("");
  const [contratoSelecionado, setContratoSelecionado] = useState("");
  const [contrato, setContrato] = useState({
    tipo: "ORGANIZACIONAL",
    inicio_da_vigencia: "",
    fim_da_vigencia: "",
    numero_de_participantes: "",
    marcacao: "",
    situacao: "ATIVO",
    justificativa: ""
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

  function preencherOrganizacao(registro: Registro | null) {
    const perfil = objeto(registro?.perfil_operacional);
    const institucionais = objeto(perfil.dados_institucionais);
    const endereco = objeto(perfil.endereco);
    const contato = lista(perfil.contatos)[0] ?? {};
    const responsavel = lista(perfil.responsaveis)[0] ?? {};
    setOrganizacao({
      nome: String(registro?.nome ?? ""),
      razao_social: String(institucionais.razao_social ?? ""),
      nome_fantasia: String(institucionais.nome_fantasia ?? ""),
      cnpj: String(institucionais.cnpj ?? ""),
      inscricao_estadual: String(institucionais.inscricao_estadual ?? ""),
      inscricao_municipal: String(institucionais.inscricao_municipal ?? ""),
      setor_de_atividade: String(institucionais.setor_de_atividade ?? ""),
      porte: String(institucionais.porte ?? ""),
      email: String(contato.email ?? ""),
      telefone: String(contato.telefone ?? ""),
      site: String(contato.site ?? ""),
      cep: String(endereco.cep ?? ""),
      logradouro: String(endereco.logradouro ?? ""),
      numero: String(endereco.numero ?? ""),
      complemento: String(endereco.complemento ?? ""),
      bairro: String(endereco.bairro ?? ""),
      cidade: String(endereco.cidade ?? ""),
      uf: String(endereco.uf ?? ""),
      pais: String(endereco.pais ?? "Brasil"),
      responsavel_nome: String(responsavel.nome ?? ""),
      responsavel_cargo: String(responsavel.cargo ?? ""),
      responsavel_email: String(responsavel.email ?? ""),
      responsavel_telefone: String(responsavel.telefone ?? ""),
      observacoes: String(institucionais.observacoes ?? ""),
      ativa: registro?.ativa !== false,
      justificativa: "",
      organizacao_base: Boolean(perfil.organizacao_base)
    });
  }

  function preencherParticipante(registro: Registro | null) {
    const perfil = objeto(registro?.perfil_operacional);
    const cadastrais = objeto(perfil.dados_cadastrais);
    const profissionais = objeto(perfil.dados_profissionais);
    const contato = lista(perfil.contatos)[0] ?? {};
    const documentos = lista(perfil.documentos);
    const cpf = documentos.find((item) => item.tipo === "CPF") ?? {};
    const identidade = documentos.find(
      (item) => item.tipo === "DOCUMENTO_DE_IDENTIDADE"
    ) ?? {};
    setParticipante({
      referencia_externa: String(registro?.referencia_externa ?? ""),
      tipo_de_vinculo: String(perfil.tipo_de_vinculo ?? "ORGANIZACIONAL"),
      nome_completo: String(cadastrais.nome_completo ?? ""),
      nome_social: String(cadastrais.nome_social ?? ""),
      data_de_nascimento: String(cadastrais.data_de_nascimento ?? ""),
      email: String(cadastrais.email ?? ""),
      telefone: String(cadastrais.telefone ?? ""),
      cpf: String(cpf.numero ?? ""),
      documento_de_identidade: String(identidade.numero ?? ""),
      profissao: String(profissionais.profissao ?? ""),
      empresa: String(profissionais.empresa ?? ""),
      cargo: String(profissionais.cargo ?? ""),
      funcao: String(profissionais.funcao ?? ""),
      matricula: String(profissionais.matricula ?? ""),
      unidade: String(profissionais.unidade ?? ""),
      setor: String(profissionais.setor ?? ""),
      equipe: String(profissionais.equipe ?? ""),
      registro_profissional: String(profissionais.registro_profissional ?? ""),
      regime_de_trabalho: String(profissionais.regime_de_trabalho ?? ""),
      contato_emergencia_nome: String(contato.nome ?? ""),
      contato_emergencia_parentesco: String(contato.parentesco ?? ""),
      contato_emergencia_telefone: String(contato.telefone ?? ""),
      elegibilidade: String(perfil.elegibilidade ?? "PENDENTE"),
      justificativa_da_elegibilidade: String(
        perfil.justificativa_da_elegibilidade ?? ""
      ),
      observacoes: String(cadastrais.observacoes ?? ""),
      ativo: registro?.ativo !== false,
      justificativa: ""
    });
  }

  async function carregar(organizacaoId = organizacaoSelecionada) {
    const parametros = new URLSearchParams({ modulo });
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
    setNovaOrganizacao(false);
    preencherOrganizacao(corpo.organizacao ?? null);
    const participanteAberto = corpo.participantes?.find(
      (item: Registro) => item.identificador === participanteSelecionado
    );
    if (participanteAberto) {
      preencherParticipante(participanteAberto);
    } else if (participanteSelecionado) {
      setParticipanteSelecionado("");
      preencherParticipante(null);
    }
    setSessao((estado) => {
      const participanteAtual = corpo.participantes?.find(
        (item: Registro) =>
          String(item.identificador) === estado.identificador_do_participante
      ) ?? corpo.participantes?.[0];
      const profissionalAtual = corpo.profissionais?.find(
        (item: Registro) =>
          String(item.identificador) === estado.identificador_do_profissional
      ) ?? corpo.profissionais?.[0];
      const anamneses = Array.isArray(participanteAtual?.anamneses)
        ? participanteAtual.anamneses as Registro[]
        : [];
      const anamneseAtual = anamneses.find(
        (item) =>
          String(item.identificador) === estado.identificador_da_anamnese
          && item.estado === "CONCLUIDA_PELO_PARTICIPANTE"
          && Number(item.percentual_concluido) === 100
          && item.validade_cientifica === "VALIDA"
      ) ?? anamneses.find(
        (item) =>
          item.estado === "CONCLUIDA_PELO_PARTICIPANTE"
          && Number(item.percentual_concluido) === 100
          && item.validade_cientifica === "VALIDA"
      );
      const ctrAtual = corpo.vinculos_ctr_thx_validados?.find(
        (item: Registro) =>
          String(item.codigo_do_ctr) === estado.codigo_do_ctr
      ) ?? corpo.vinculos_ctr_thx_validados?.[0];
      const thxAtual = corpo.vinculos_ctr_thx_validados?.find(
        (item: Registro) =>
          String(item.codigo_do_ctr) === String(ctrAtual?.codigo_do_ctr ?? "")
          && String(item.codigo_do_thx) === estado.codigo_do_thx
      ) ?? corpo.vinculos_ctr_thx_validados?.find(
        (item: Registro) =>
          String(item.codigo_do_ctr) === String(ctrAtual?.codigo_do_ctr ?? "")
      );
      return {
        ...estado,
        identificador_do_participante:
          String(participanteAtual?.identificador ?? ""),
        identificador_do_profissional:
          String(profissionalAtual?.identificador ?? ""),
        identificador_da_anamnese:
          String(anamneseAtual?.identificador ?? ""),
        codigo_do_ctr: String(ctrAtual?.codigo_do_ctr ?? ""),
        codigo_do_thx: String(thxAtual?.codigo_do_thx ?? ""),
        chave_de_idempotencia: ""
      };
    });
    setConsentimento((estado) => ({
      ...estado,
      identificador_do_participante:
        estado.identificador_do_participante
        || String(corpo.participantes?.[0]?.identificador ?? "")
    }));
    setParticipanteDoCatalogo((atual) => (
      corpo.participantes?.some(
        (item: Registro) => String(item.identificador) === atual
      )
        ? atual
        : String(corpo.participantes?.[0]?.identificador ?? "")
    ));
  }

  useEffect(() => {
    carregar().catch((causa) => setErro(causa.message));
  }, []);

  async function executar(
    acao: string,
    payload: Registro,
    identificador?: unknown,
    recarregar = true
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
          identificador_da_organizacao:
            organizacaoSelecionada
            || String(dados?.organizacao?.identificador ?? ""),
          dados: payload
        })
      });
      const corpo = await resposta.json();
      if (!resposta.ok) {
        throw new Error(corpo?.erro?.mensagem ?? "Operação recusada.");
      }
      setMensagem("Operação concluída e auditada.");
      if (recarregar) await carregar();
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
  const podeGerenciarParticipantes = [
    "ADMINISTRADOR_DO_SISTEMA",
    "ADMINISTRADOR_DA_ORGANIZACAO",
    "PROFISSIONAL_HUMANEXUS"
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

  const participantesVisiveis = (dados?.participantes ?? []).filter((item) => {
    const perfil = objeto(item.perfil_operacional);
    const cadastrais = objeto(perfil.dados_cadastrais);
    const profissionais = objeto(perfil.dados_profissionais);
    const documentos = lista(perfil.documentos);
    const vinculo = String(perfil.tipo_de_vinculo ?? "ORGANIZACIONAL");
    const pertenceAoGrupo = grupoParticipante === "TODOS"
      || vinculo === grupoParticipante
      || vinculo === "MISTO";
    const conjunto = normalizar([
      item.referencia_externa,
      cadastrais.nome_completo,
      cadastrais.nome_social,
      profissionais.matricula,
      profissionais.empresa,
      profissionais.cargo,
      profissionais.funcao,
      profissionais.unidade,
      profissionais.setor,
      profissionais.equipe,
      ...documentos.map((documento) => documento.numero)
    ].join(" "));
    return pertenceAoGrupo
      && (!buscaParticipante.trim()
        || conjunto.includes(normalizar(buscaParticipante.trim())));
  });

  const tabelaParticipantes = (
    <section className="hx-management-table">
      <header><div><small>PARTICIPANTES</small><h2>Cadastros no escopo</h2></div><span>{participantesVisiveis.length} registro(s)</span></header>
      <div className="hx-management-actions">
        <button type="button" onClick={() => setGrupoParticipante("TODOS")}>Todos</button>
        <button type="button" onClick={() => setGrupoParticipante("PARTICULAR")}>Particulares</button>
        <button type="button" onClick={() => setGrupoParticipante("ORGANIZACIONAL")}>Organizacionais</button>
        <label>
          Buscar participante
          <input
            value={buscaParticipante}
            onChange={(evento) => setBuscaParticipante(evento.target.value)}
            placeholder="Nome, CPF, matrícula, empresa, cargo ou função"
          />
        </label>
      </div>
      <div>
        {participantesVisiveis.map((item) => {
          const perfil = objeto(item.perfil_operacional);
          const cadastrais = objeto(perfil.dados_cadastrais);
          const profissionais = objeto(perfil.dados_profissionais);
          return (
            <article key={String(item.identificador)}>
              <div>
                <small>Participante</small>
                <strong>{texto(cadastrais.nome_completo, texto(item.referencia_externa))}</strong>
              </div>
              <div><small>Vínculo</small><strong>{texto(perfil.tipo_de_vinculo)}</strong></div>
              <div><small>Organização / unidade</small><strong>{texto(profissionais.empresa, texto(dados?.organizacao?.nome))} · {texto(profissionais.unidade)}</strong></div>
              <div><small>Setor / equipe</small><strong>{texto(profissionais.setor)} · {texto(profissionais.equipe)}</strong></div>
              <div><small>Situação</small><strong>{item.ativo ? "ATIVO" : "INATIVO"}</strong></div>
              <div><small>Versão</small><strong>{texto(perfil.numero_da_versao, "1")}</strong></div>
              <div className="hx-management-actions">
                <button
                  type="button"
                  disabled={ocupado}
                  onClick={() => {
                    setParticipanteSelecionado(String(item.identificador));
                    preencherParticipante(item);
                  }}
                >
                  Abrir ficha
                </button>
                <button
                  type="button"
                  disabled={ocupado}
                  onClick={() => void executar(
                    item.ativo
                      ? "inativar-participante"
                      : "reativar-participante",
                    {},
                    item.identificador
                  )}
                >
                  {item.ativo ? "Inativar" : "Reativar"}
                </button>
              </div>
            </article>
          );
        })}
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
                  onClick={() => void (async () => {
                    const resultado = await executar(
                      "operar-sessao",
                      { acao },
                      item.identificador
                    );
                    if (!resultado || acao !== "ABRIR") return;
                    const parametros = new URLSearchParams({
                      organizacao: String(
                        dados?.organizacao?.identificador ?? ""
                      ),
                      participante: String(
                        item.identificador_do_participante ?? ""
                      ),
                      sessao: String(item.identificador ?? "")
                    });
                    window.location.assign(
                      `/plataforma/cockpit-vivo?${parametros}`
                    );
                  })()}
                >
                  {acao === "ABRIR" ? "INICIAR SESSÃO" : texto(acao)}
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
  const evidenciaDoCatalogo = useMemo(() => {
    const porParticipante = objeto(
      dados?.evidencias_regulatorias_treinamento
    );
    return objeto(porParticipante[participanteDoCatalogo]);
  }, [dados, participanteDoCatalogo]);
  const protocolosOficiais = useMemo<ProtocoloClassificado[]>(() => {
    const biblioteca = objeto(dados?.biblioteca_thx_oficial);
    const recomendacoes = lista(evidenciaDoCatalogo.recomendacoes_thx)
      .filter((item) => !["REJEITADA", "EXPIRADA"].includes(
        String(item.estado ?? "")
      ));
    const idsRecomendados = new Set(
      recomendacoes.map((item) => String(
        item.identificador_do_protocolo ?? ""
      ))
    );
    const avaliacoesCtr = lista(evidenciaDoCatalogo.avaliacoes_ctr);
    const ctrsComEvidencia = new Set<string>();
    const thxExplicitamenteCompativeis = new Set<string>();
    for (const avaliacao of avaliacoesCtr) {
      for (const codigo of listaDeTextos(
        avaliacao.criterios_atendidos_json
      )) {
        ctrsComEvidencia.add(codigo);
      }
      for (const item of lista(avaliacao.thx_compativeis_json)) {
        const codigo = String(
          item.codigo_do_thx ?? item.codigo ?? item.identificador ?? ""
        );
        if (codigo) thxExplicitamenteCompativeis.add(codigo);
      }
    }
    const busca = normalizar(buscaThx.trim());
    const ordenacao: Record<string, number> = {
      RECOMENDADO: 0,
      COMPATIVEL: 1,
      OUTRO_OFICIAL: 2
    };
    return lista(biblioteca.protocolos)
      .map<ProtocoloClassificado>((protocolo) => {
        const codigo = String(protocolo.codigo ?? "");
        const vinculos = lista(protocolo.vinculos_documentados);
        const recomendacao = recomendacoes.find(
          (item) => String(item.identificador_do_protocolo ?? "")
            === String(protocolo.identificador ?? "")
        );
        const vinculosCompativeis = vinculos.filter((item) =>
          ctrsComEvidencia.has(String(item.codigo_do_ctr ?? ""))
        );
        const classificacao: ProtocoloClassificado[
          "classificacao_operacional"
        ] = (
          recomendacao || idsRecomendados.has(String(protocolo.identificador))
        )
          ? "RECOMENDADO"
          : (
              thxExplicitamenteCompativeis.has(codigo)
              || vinculosCompativeis.length > 0
            )
            ? "COMPATIVEL"
            : "OUTRO_OFICIAL";
        return {
          ...protocolo,
          classificacao_operacional: classificacao,
          recomendacao_operacional: recomendacao ?? null,
          vinculos_compativeis: vinculosCompativeis
        };
      })
      .filter((protocolo) => (
        (!familiaThx || protocolo.familia === familiaThx)
        && (
          !busca
          || normalizar([
            protocolo.codigo,
            protocolo.nome,
            protocolo.dominio,
            protocolo.objetivo_regulatorio,
            protocolo.dor_operacional
          ].join(" ")).includes(busca)
        )
      ))
      .sort((a, b) => (
        ordenacao[String(a.classificacao_operacional)]
        - ordenacao[String(b.classificacao_operacional)]
        || String(a.codigo).localeCompare(String(b.codigo), "pt-BR")
      ));
  }, [
    buscaThx,
    dados,
    evidenciaDoCatalogo,
    familiaThx
  ]);
  const gatilhoDoCatalogo = lista(
    evidenciaDoCatalogo.gatilhos
  ).at(-1);
  const arrDoCatalogo = lista(
    evidenciaDoCatalogo.analises_arr
  ).at(-1);
  const rroDoCatalogo = lista(
    evidenciaDoCatalogo.resultados_rro
  ).at(-1);
  const nraDoCatalogo = lista(
    evidenciaDoCatalogo.registros_nra
  ).at(-1);
  const ganhoDoCatalogo = lista(
    evidenciaDoCatalogo.ganhos_regulatorios
  ).at(-1);
  const protocolosPorClassificacao = {
    RECOMENDADO: protocolosOficiais.filter(
      (item) => item.classificacao_operacional === "RECOMENDADO"
    ),
    COMPATIVEL: protocolosOficiais.filter(
      (item) => item.classificacao_operacional === "COMPATIVEL"
    ),
    OUTRO_OFICIAL: protocolosOficiais.filter(
      (item) => item.classificacao_operacional === "OUTRO_OFICIAL"
    )
  };

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
          <form className="hx-record-form" onSubmit={async (evento: FormEvent) => {
            evento.preventDefault();
            const resultado = await executar(
              novaOrganizacao
                ? "criar-organizacao"
                : "atualizar-organizacao",
              {
                nome: organizacao.nome,
                ativa: organizacao.ativa,
                organizacao_base: organizacao.organizacao_base,
                dados_institucionais: {
                  razao_social: organizacao.razao_social,
                  nome_fantasia: organizacao.nome_fantasia,
                  cnpj: organizacao.cnpj,
                  inscricao_estadual: organizacao.inscricao_estadual,
                  inscricao_municipal: organizacao.inscricao_municipal,
                  setor_de_atividade: organizacao.setor_de_atividade,
                  porte: organizacao.porte,
                  observacoes: organizacao.observacoes
                },
                contatos: [{
                  email: organizacao.email,
                  telefone: organizacao.telefone,
                  site: organizacao.site
                }],
                endereco: {
                  cep: organizacao.cep,
                  logradouro: organizacao.logradouro,
                  numero: organizacao.numero,
                  complemento: organizacao.complemento,
                  bairro: organizacao.bairro,
                  cidade: organizacao.cidade,
                  uf: organizacao.uf,
                  pais: organizacao.pais
                },
                responsaveis: [{
                  nome: organizacao.responsavel_nome,
                  cargo: organizacao.responsavel_cargo,
                  email: organizacao.responsavel_email,
                  telefone: organizacao.responsavel_telefone
                }],
                justificativa: organizacao.justificativa
              },
              novaOrganizacao
                ? undefined
                : organizacaoAtual?.identificador,
              !novaOrganizacao
            );
            if (novaOrganizacao && resultado?.identificador) {
              await carregar(String(resultado.identificador));
            }
          }}>
            <small>FICHA INSTITUCIONAL · EDIÇÃO VERSIONADA</small>
            <div className="hx-record-form__title">
              <h2>{novaOrganizacao ? "Nova organização" : "Dados da organização"}</h2>
              {String(dados.usuario.perfil) === "ADMINISTRADOR_DO_SISTEMA" ? (
                <button
                  type="button"
                  onClick={() => {
                    setNovaOrganizacao(!novaOrganizacao);
                    preencherOrganizacao(
                      novaOrganizacao ? organizacaoAtual ?? null : null
                    );
                  }}
                >
                  {novaOrganizacao ? "Voltar à ficha atual" : "Nova organização"}
                </button>
              ) : null}
            </div>
            <fieldset className="hx-record-section">
              <legend>Identificação institucional</legend>
              <div className="hx-fields-grid">
                <label>Nome institucional<input required value={organizacao.nome} onChange={(evento) => setOrganizacao({ ...organizacao, nome: evento.target.value })} /></label>
                <label>Razão social<input required value={organizacao.razao_social} onChange={(evento) => setOrganizacao({ ...organizacao, razao_social: evento.target.value })} /></label>
                <label>Nome fantasia<input value={organizacao.nome_fantasia} onChange={(evento) => setOrganizacao({ ...organizacao, nome_fantasia: evento.target.value })} /></label>
                <label>CNPJ<input inputMode="numeric" value={organizacao.cnpj} onChange={(evento) => setOrganizacao({ ...organizacao, cnpj: evento.target.value })} /></label>
                <label>Inscrição estadual<input value={organizacao.inscricao_estadual} onChange={(evento) => setOrganizacao({ ...organizacao, inscricao_estadual: evento.target.value })} /></label>
                <label>Inscrição municipal<input value={organizacao.inscricao_municipal} onChange={(evento) => setOrganizacao({ ...organizacao, inscricao_municipal: evento.target.value })} /></label>
                <label>Setor de atividade<input value={organizacao.setor_de_atividade} onChange={(evento) => setOrganizacao({ ...organizacao, setor_de_atividade: evento.target.value })} /></label>
                <label>Porte<input value={organizacao.porte} onChange={(evento) => setOrganizacao({ ...organizacao, porte: evento.target.value })} /></label>
              </div>
            </fieldset>
            <fieldset className="hx-record-section">
              <legend>Contato e endereço</legend>
              <div className="hx-fields-grid">
                <label>E-mail institucional<input type="email" value={organizacao.email} onChange={(evento) => setOrganizacao({ ...organizacao, email: evento.target.value })} /></label>
                <label>Telefone<input type="tel" value={organizacao.telefone} onChange={(evento) => setOrganizacao({ ...organizacao, telefone: evento.target.value })} /></label>
                <label>Site<input type="url" value={organizacao.site} onChange={(evento) => setOrganizacao({ ...organizacao, site: evento.target.value })} /></label>
                <label>CEP<input inputMode="numeric" value={organizacao.cep} onChange={(evento) => setOrganizacao({ ...organizacao, cep: evento.target.value })} /></label>
                <label>Logradouro<input value={organizacao.logradouro} onChange={(evento) => setOrganizacao({ ...organizacao, logradouro: evento.target.value })} /></label>
                <label>Número<input value={organizacao.numero} onChange={(evento) => setOrganizacao({ ...organizacao, numero: evento.target.value })} /></label>
                <label>Complemento<input value={organizacao.complemento} onChange={(evento) => setOrganizacao({ ...organizacao, complemento: evento.target.value })} /></label>
                <label>Bairro<input value={organizacao.bairro} onChange={(evento) => setOrganizacao({ ...organizacao, bairro: evento.target.value })} /></label>
                <label>Cidade<input value={organizacao.cidade} onChange={(evento) => setOrganizacao({ ...organizacao, cidade: evento.target.value })} /></label>
                <label>UF<input maxLength={2} value={organizacao.uf} onChange={(evento) => setOrganizacao({ ...organizacao, uf: evento.target.value.toUpperCase() })} /></label>
                <label>País<input value={organizacao.pais} onChange={(evento) => setOrganizacao({ ...organizacao, pais: evento.target.value })} /></label>
              </div>
            </fieldset>
            <fieldset className="hx-record-section">
              <legend>Responsável institucional</legend>
              <div className="hx-fields-grid">
                <label>Nome<input required value={organizacao.responsavel_nome} onChange={(evento) => setOrganizacao({ ...organizacao, responsavel_nome: evento.target.value })} /></label>
                <label>Cargo<input value={organizacao.responsavel_cargo} onChange={(evento) => setOrganizacao({ ...organizacao, responsavel_cargo: evento.target.value })} /></label>
                <label>E-mail<input type="email" value={organizacao.responsavel_email} onChange={(evento) => setOrganizacao({ ...organizacao, responsavel_email: evento.target.value })} /></label>
                <label>Telefone<input type="tel" value={organizacao.responsavel_telefone} onChange={(evento) => setOrganizacao({ ...organizacao, responsavel_telefone: evento.target.value })} /></label>
              </div>
            </fieldset>
            <label>Outros dados institucionais<textarea value={organizacao.observacoes} onChange={(evento) => setOrganizacao({ ...organizacao, observacoes: evento.target.value })} /></label>
            <div className="hx-fields-grid">
              <label className="hx-checkbox"><input type="checkbox" checked={organizacao.organizacao_base} onChange={(evento) => setOrganizacao({ ...organizacao, organizacao_base: evento.target.checked })} />Organização-base</label>
              <label className="hx-checkbox"><input type="checkbox" checked={organizacao.ativa} onChange={(evento) => setOrganizacao({ ...organizacao, ativa: evento.target.checked })} />Cadastro ativo</label>
            </div>
            <label>Justificativa da versão<textarea required value={organizacao.justificativa} onChange={(evento) => setOrganizacao({ ...organizacao, justificativa: evento.target.value })} /></label>
            <button disabled={ocupado || !podeAdministrar}>
              {novaOrganizacao ? "Criar organização" : "Salvar nova versão"}
            </button>
          </form>
          <section className="hx-management-table">
            <header><div><small>ORGANIZAÇÕES</small><h2>Diretório autorizado</h2></div></header>
            <div>{dados.organizacoes.map((item) => {
              const perfil = objeto(item.perfil_operacional);
              const institucionais = objeto(perfil.dados_institucionais);
              return (
                <article key={String(item.identificador)}>
                  <div><small>Nome</small><strong>{texto(item.nome)}</strong></div>
                  <div><small>CNPJ</small><strong>{texto(institucionais.cnpj)}</strong></div>
                  <div><small>Situação</small><strong>{item.ativa ? "ATIVA" : "INATIVA"}</strong></div>
                  <div><small>Versão</small><strong>{texto(perfil.numero_da_versao, "1")}</strong></div>
                  <button type="button" disabled={ocupado} onClick={() => void carregar(String(item.identificador))}>Abrir ficha</button>
                </article>
              );
            })}</div>
            {Number(
              objeto(organizacaoAtual?.perfil_operacional).numero_da_versao
            ) > 0 ? (
              <p>
                Histórico preservado: {
                  Number(
                    objeto(organizacaoAtual?.perfil_operacional)
                      .numero_da_versao
                  )
                } versão(ões).
              </p>
            ) : null}
          </section>
        </div>
      ) : null}

      {modulo === "clientes" ? (
        <div className="hx-management-grid">
          <form className="hx-record-form" onSubmit={async (evento: FormEvent) => {
            evento.preventDefault();
            const resultado = await executar(
              participanteSelecionado
                ? "atualizar-participante"
                : "criar-participante",
              {
              identificador_da_organizacao: organizacaoAtual?.identificador,
              referencia_externa: participante.referencia_externa,
              tipo_de_vinculo: participante.tipo_de_vinculo,
              dados_minimizados: {
                referencia_operacional: participante.referencia_externa,
                nome_preferencial:
                  participante.nome_social || participante.nome_completo
              },
              dados_cadastrais: {
                nome_completo: participante.nome_completo,
                nome_social: participante.nome_social,
                data_de_nascimento: participante.data_de_nascimento,
                email: participante.email,
                telefone: participante.telefone,
                observacoes: participante.observacoes
              },
              dados_profissionais: {
                profissao: participante.profissao,
                empresa: participante.empresa,
                cargo: participante.cargo,
                funcao: participante.funcao,
                matricula: participante.matricula,
                unidade: participante.unidade,
                setor: participante.setor,
                equipe: participante.equipe,
                registro_profissional: participante.registro_profissional,
                regime_de_trabalho: participante.regime_de_trabalho
              },
              contatos: participante.contato_emergencia_nome
                || participante.contato_emergencia_telefone
                ? [{
                    tipo: "EMERGENCIA",
                    nome: participante.contato_emergencia_nome,
                    parentesco: participante.contato_emergencia_parentesco,
                    telefone: participante.contato_emergencia_telefone
                  }]
                : [],
              documentos: [
                { tipo: "CPF", numero: participante.cpf },
                {
                  tipo: "DOCUMENTO_DE_IDENTIDADE",
                  numero: participante.documento_de_identidade
                }
              ].filter((item) => item.numero),
              elegibilidade: participante.elegibilidade,
              justificativa_da_elegibilidade:
                participante.justificativa_da_elegibilidade || null,
              ativo: participante.ativo,
              justificativa: participante.justificativa
            },
              participanteSelecionado || undefined
            );
            if (resultado?.identificador) {
              setParticipanteSelecionado(String(resultado.identificador));
              preencherParticipante(resultado);
            }
          }}>
            <small>FICHA ÚNICA · HISTÓRICO VERSIONADO</small>
            <div className="hx-record-form__title">
              <h2>{participanteSelecionado ? "Ficha do participante" : "Novo participante"}</h2>
              {participanteSelecionado ? (
                <button
                  type="button"
                  onClick={() => {
                    setParticipanteSelecionado("");
                    preencherParticipante(null);
                  }}
                >
                  Novo participante
                </button>
              ) : null}
            </div>
            <fieldset className="hx-record-section">
              <legend>Identificação e vínculo</legend>
              <div className="hx-fields-grid">
                <label>Referência operacional<input required value={participante.referencia_externa} onChange={(evento) => setParticipante({ ...participante, referencia_externa: evento.target.value })} /></label>
                <label>Nome completo<input required value={participante.nome_completo} onChange={(evento) => setParticipante({ ...participante, nome_completo: evento.target.value })} /></label>
                <label>Nome social ou preferencial<input value={participante.nome_social} onChange={(evento) => setParticipante({ ...participante, nome_social: evento.target.value })} /></label>
                <label>Data de nascimento<input type="date" value={participante.data_de_nascimento} onChange={(evento) => setParticipante({ ...participante, data_de_nascimento: evento.target.value })} /></label>
                <label>Tipo de vínculo<select value={participante.tipo_de_vinculo} onChange={(evento) => setParticipante({ ...participante, tipo_de_vinculo: evento.target.value })}><option>ORGANIZACIONAL</option><option>PARTICULAR</option><option>MISTO</option></select></label>
                <label>Elegibilidade<select value={participante.elegibilidade} onChange={(evento) => setParticipante({ ...participante, elegibilidade: evento.target.value })}><option value="PENDENTE">Pendente</option><option value="ELEGIVEL">Elegível</option><option value="NAO_ELEGIVEL">Não elegível</option></select></label>
              </div>
              <label>Justificativa da elegibilidade<textarea value={participante.justificativa_da_elegibilidade} onChange={(evento) => setParticipante({ ...participante, justificativa_da_elegibilidade: evento.target.value })} /></label>
            </fieldset>
            <fieldset className="hx-record-section">
              <legend>Contato e documentos previstos</legend>
              <div className="hx-fields-grid">
                <label>E-mail<input type="email" value={participante.email} onChange={(evento) => setParticipante({ ...participante, email: evento.target.value })} /></label>
                <label>Telefone<input type="tel" value={participante.telefone} onChange={(evento) => setParticipante({ ...participante, telefone: evento.target.value })} /></label>
                <label>CPF, quando aplicável<input inputMode="numeric" value={participante.cpf} onChange={(evento) => setParticipante({ ...participante, cpf: evento.target.value })} /></label>
                <label>Documento de identidade, quando aplicável<input value={participante.documento_de_identidade} onChange={(evento) => setParticipante({ ...participante, documento_de_identidade: evento.target.value })} /></label>
              </div>
            </fieldset>
            <fieldset className="hx-record-section">
              <legend>Dados profissionais</legend>
              <div className="hx-fields-grid">
                <label>Profissão<input value={participante.profissao} onChange={(evento) => setParticipante({ ...participante, profissao: evento.target.value })} /></label>
                <label>Empresa ou organização de vínculo<input value={participante.empresa} onChange={(evento) => setParticipante({ ...participante, empresa: evento.target.value })} /></label>
                <label>Cargo ou função<input value={participante.cargo} onChange={(evento) => setParticipante({ ...participante, cargo: evento.target.value })} /></label>
                <label>Função operacional<input value={participante.funcao} onChange={(evento) => setParticipante({ ...participante, funcao: evento.target.value })} /></label>
                <label>Matrícula<input value={participante.matricula} onChange={(evento) => setParticipante({ ...participante, matricula: evento.target.value })} /></label>
                <label>Unidade<input value={participante.unidade} onChange={(evento) => setParticipante({ ...participante, unidade: evento.target.value })} /></label>
                <label>Setor<input value={participante.setor} onChange={(evento) => setParticipante({ ...participante, setor: evento.target.value })} /></label>
                <label>Equipe<input value={participante.equipe} onChange={(evento) => setParticipante({ ...participante, equipe: evento.target.value })} /></label>
                <label>Registro profissional<input value={participante.registro_profissional} onChange={(evento) => setParticipante({ ...participante, registro_profissional: evento.target.value })} /></label>
                <label>Regime de trabalho<input value={participante.regime_de_trabalho} onChange={(evento) => setParticipante({ ...participante, regime_de_trabalho: evento.target.value })} /></label>
              </div>
            </fieldset>
            <fieldset className="hx-record-section">
              <legend>Contato de emergência</legend>
              <div className="hx-fields-grid">
                <label>Nome<input value={participante.contato_emergencia_nome} onChange={(evento) => setParticipante({ ...participante, contato_emergencia_nome: evento.target.value })} /></label>
                <label>Relação ou parentesco<input value={participante.contato_emergencia_parentesco} onChange={(evento) => setParticipante({ ...participante, contato_emergencia_parentesco: evento.target.value })} /></label>
                <label>Telefone<input type="tel" value={participante.contato_emergencia_telefone} onChange={(evento) => setParticipante({ ...participante, contato_emergencia_telefone: evento.target.value })} /></label>
              </div>
            </fieldset>
            <label>Observações cadastrais<textarea value={participante.observacoes} onChange={(evento) => setParticipante({ ...participante, observacoes: evento.target.value })} /></label>
            <label className="hx-checkbox"><input type="checkbox" checked={participante.ativo} onChange={(evento) => setParticipante({ ...participante, ativo: evento.target.checked })} />Cadastro ativo</label>
            <label>Justificativa da versão<textarea required value={participante.justificativa} onChange={(evento) => setParticipante({ ...participante, justificativa: evento.target.value })} /></label>
            <button disabled={ocupado || !podeGerenciarParticipantes}>
              {participanteSelecionado ? "Salvar nova versão" : "Cadastrar participante"}
            </button>
            {participanteSelecionado ? (
              <p>
                Histórico preservado: {
                  Number(
                    objeto(
                      dados.participantes.find(
                        (item) =>
                          item.identificador === participanteSelecionado
                      )?.perfil_operacional
                    ).numero_da_versao ?? 0
                  )
                } versão(ões).
              </p>
            ) : null}
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
          <form onSubmit={async (evento: FormEvent) => {
            evento.preventDefault();
            const chave = sessao.chave_de_idempotencia || crypto.randomUUID();
            setSessao((estado) => ({
              ...estado,
              chave_de_idempotencia: chave
            }));
            const resultado = await executar("criar-sessao-com-vinculo", {
              ...sessao,
              codigo_do_ctr: sessao.tipo_de_sessao === "BASELINE"
                ? ""
                : sessao.codigo_do_ctr,
              codigo_do_thx: sessao.tipo_de_sessao === "BASELINE"
                ? ""
                : sessao.codigo_do_thx,
              justificativa: sessao.tipo_de_sessao === "BASELINE"
                ? ""
                : sessao.justificativa,
              chave_de_idempotencia: chave,
              duracao_planejada_minutos: Number(sessao.duracao_planejada_minutos)
            });
            if (resultado) {
              setSessao((estado) => ({
                ...estado,
                chave_de_idempotencia: ""
              }));
            }
          }}>
            <small>CONTEXTO CIENTÍFICO PRESERVADO</small>
            <h2>Criar sessão</h2>
            <fieldset className="hx-session-type">
              <legend>Tipo da sessão</legend>
              <label>
                <input
                  type="radio"
                  name="tipo-da-sessao"
                  value="BASELINE"
                  checked={sessao.tipo_de_sessao === "BASELINE"}
                  onChange={(evento) => setSessao({
                    ...sessao,
                    tipo_de_sessao: evento.target.value
                  })}
                />
                Baseline
              </label>
              <label>
                <input
                  type="radio"
                  name="tipo-da-sessao"
                  value="PRE_TREINO_POS"
                  checked={sessao.tipo_de_sessao === "PRE_TREINO_POS"}
                  onChange={(evento) => setSessao({
                    ...sessao,
                    tipo_de_sessao: evento.target.value
                  })}
                />
                PRÉ → TREINO → PÓS
              </label>
            </fieldset>
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
            <label>Finalidade<select required value={sessao.finalidade} onChange={(evento) => setSessao({ ...sessao, finalidade: evento.target.value })}>
              <option value="HOMOLOGAÇÃO FÍSICA FINAL — DADOS REAIS AUTORIZADOS">Homologação física final — dados reais autorizados</option>
              <option value="HOMOLOGAÇÃO FÍSICA AUTORIZADA — DR. MARCOS ALCÂNTARA">Homologação física autorizada — Dr. Marcos Alcântara</option>
            </select></label>
            {sessao.tipo_de_sessao === "PRE_TREINO_POS" ? (
              <>
                <label>CTR oficial<select required value={sessao.codigo_do_ctr} onChange={(evento) => {
                  const codigo = evento.target.value;
                  const primeiroThx = dados.vinculos_ctr_thx_validados.find((item) => item.codigo_do_ctr === codigo);
                  setSessao({ ...sessao, codigo_do_ctr: codigo, codigo_do_thx: String(primeiroThx?.codigo_do_thx ?? "") });
                }}>{ctrsValidados.map((item) => <option key={String(item.codigo_do_ctr)} value={String(item.codigo_do_ctr)}>{texto(item.codigo_do_ctr)} · {texto(item.nome_do_ctr)}</option>)}</select></label>
                <label>THX oficial validado<select required value={sessao.codigo_do_thx} onChange={(evento) => setSessao({ ...sessao, codigo_do_thx: evento.target.value })}>{thxValidadosDoCtr.map((item) => <option key={String(item.identificador)} value={String(item.codigo_do_thx)}>{texto(item.codigo_do_thx)} · {texto(item.nome_do_thx)} · {texto(item.papel)}</option>)}</select></label>
                <label>Justificativa da seleção profissional<textarea required value={sessao.justificativa} onChange={(evento) => setSessao({ ...sessao, justificativa: evento.target.value })} /></label>
              </>
            ) : (
              <p>
                Baseline é uma modalidade independente e não exige seleção de
                CTR ou THX.
              </p>
            )}
            <label>Data programada<input type="datetime-local" value={sessao.data_programada} onChange={(evento) => setSessao({ ...sessao, data_programada: evento.target.value })} /></label>
            <label>Duração planejada<input type="number" min="1" max="1440" value={sessao.duracao_planejada_minutos} onChange={(evento) => setSessao({ ...sessao, duracao_planejada_minutos: evento.target.value })} /></label>
            <button disabled={ocupado || !podeConduzir}>Salvar sessão</button>
          </form>
          {tabelaSessoes}
        </div>
      ) : null}

      {modulo === "treinamentos" ? (
        <div className="hx-training-library">
          <section className="hx-training-library__controls">
            <div>
              <small>BIBLIOTECA OFICIAL HUMANEXUS</small>
              <h2>THX e THX-AER preservados</h2>
              <p>
                A classificação utiliza exclusivamente evidências persistidas.
                A decisão final permanece do profissional.
              </p>
            </div>
            <label>
              Participante
              <select
                value={participanteDoCatalogo}
                onChange={(evento) =>
                  setParticipanteDoCatalogo(evento.target.value)}
              >
                {dados.participantes.map((item) => (
                  <option
                    key={String(item.identificador)}
                    value={String(item.identificador)}
                  >
                    {texto(item.referencia_externa)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Família
              <select
                value={familiaThx}
                onChange={(evento) => setFamiliaThx(evento.target.value)}
              >
                <option value="">THX e THX-AER</option>
                <option value="THX">THX</option>
                <option value="THX-AER">THX-AER</option>
              </select>
            </label>
            <label>
              Buscar
              <input
                value={buscaThx}
                onChange={(evento) => setBuscaThx(evento.target.value)}
                placeholder="Código, nome, domínio ou finalidade"
              />
            </label>
          </section>

          <section className="hx-regulatory-evidence">
            <article>
              <small>Gatilho</small>
              <strong>{texto(
                gatilhoDoCatalogo?.nome,
                "Nenhum gatilho persistido"
              )}</strong>
            </article>
            <article>
              <small>ARR / rota dominante</small>
              <strong>{texto(
                arrDoCatalogo?.padrao_dominante,
                "Não registrada"
              )}</strong>
            </article>
            <article>
              <small>RRO</small>
              <strong>{texto(
                rroDoCatalogo?.categoria,
                "Não registrado"
              )}</strong>
            </article>
            <article>
              <small>NRA</small>
              <strong>{texto(
                nraDoCatalogo?.estado,
                "Não registrada"
              )}</strong>
            </article>
            <article>
              <small>Ganho regulatório</small>
              <strong>{ganhoDoCatalogo?.ganho_relativo == null
                ? "Não calculado"
                : texto(ganhoDoCatalogo.ganho_relativo)}</strong>
            </article>
          </section>

          {([
            [
              "RECOMENDADO",
              "Recomendados",
              "Sugestões existentes, ainda sujeitas à validação profissional."
            ],
            [
              "COMPATIVEL",
              "Compatíveis",
              "Vínculo oficial compatível com CTR apoiado por evidência persistida."
            ],
            [
              "OUTRO_OFICIAL",
              "Demais protocolos oficiais",
              "Biblioteca preservada sem correspondência individual suficiente."
            ]
          ] as const).map(([classificacao, titulo, descricao]) => {
            const protocolos = protocolosPorClassificacao[classificacao];
            return (
              <section
                className="hx-training-group"
                key={classificacao}
              >
                <header>
                  <div>
                    <small>{classificacao}</small>
                    <h2>{titulo}</h2>
                    <p>{descricao}</p>
                  </div>
                  <span>{protocolos.length} protocolo(s)</span>
                </header>
                <div className="hx-training-group__items">
                  {protocolos.map((protocolo) => {
                    const recomendacao = objeto(
                      protocolo.recomendacao_operacional
                    );
                    const vinculos = lista(
                      protocolo.vinculos_compativeis
                    );
                    const ctrs = vinculos
                      .map((item) => String(item.codigo_do_ctr ?? ""))
                      .filter(Boolean);
                    const rota = objeto(
                      arrDoCatalogo?.rota_observada_json
                    );
                    return (
                      <article key={String(protocolo.identificador)}>
                        <div className="hx-training-card__heading">
                          <span>{texto(protocolo.codigo)}</span>
                          <span>{texto(protocolo.familia)}</span>
                          <span>{texto(protocolo.dominio)}</span>
                        </div>
                        <h3>{texto(protocolo.nome)}</h3>
                        <p>{texto(
                          protocolo.dor_operacional,
                          "Dor operacional não informada na fonte oficial"
                        )}</p>
                        <dl>
                          <div>
                            <dt>Finalidade</dt>
                            <dd>{texto(
                              protocolo.objetivo_regulatorio,
                              "Não informada na fonte oficial"
                            )}</dd>
                          </div>
                          <div>
                            <dt>Razão da classificação</dt>
                            <dd>{texto(
                              recomendacao.justificativa,
                              ctrs.length
                                ? `Vínculo oficial com ${ctrs.join(", ")}`
                                : "Sem evidência individual suficiente para recomendação"
                            )}</dd>
                          </div>
                          <div>
                            <dt>Gatilho considerado</dt>
                            <dd>{texto(
                              gatilhoDoCatalogo?.descricao
                                ?? gatilhoDoCatalogo?.nome,
                              "Não registrado"
                            )}</dd>
                          </div>
                          <div>
                            <dt>CTR</dt>
                            <dd>{ctrs.length
                              ? ctrs.join(", ")
                              : "Nenhum CTR compatível demonstrado"}</dd>
                          </div>
                          <div>
                            <dt>Rota regulatória</dt>
                            <dd>{texto(
                              arrDoCatalogo?.padrao_dominante
                                ?? rota.nome
                                ?? rota.codigo,
                              "Não registrada"
                            )}</dd>
                          </div>
                          <div>
                            <dt>Critério de progressão</dt>
                            <dd>{listaDeTextos(
                              protocolo.criterios_de_progressao
                            ).join("; ") || "Não informado na fonte oficial"}</dd>
                          </div>
                        </dl>
                      </article>
                    );
                  })}
                  {!protocolos.length ? (
                    <p className="hx-module__notice">
                      Nenhum protocolo nesta classificação para os filtros atuais.
                    </p>
                  ) : null}
                </div>
              </section>
            );
          })}

          {dados.programacoes.length ? (
            <section className="hx-management-table">
              <header>
                <div>
                  <small>HISTÓRICO PRESERVADO</small>
                  <h2>Programações existentes</h2>
                </div>
              </header>
              <div>{dados.programacoes.map((item) => (
                <article key={String(item.identificador)}>
                  <div><small>Estado</small><strong>{texto(item.estado)}</strong></div>
                  <div><small>Participante</small><strong>{texto(item.identificador_do_participante)}</strong></div>
                  <div><small>Histórico</small><strong>{lista(item.historico).length} evento(s)</strong></div>
                </article>
              ))}</div>
            </section>
          ) : null}
        </div>
      ) : null}

      {modulo === "configuracoes" ? (
        <div className="hx-management-grid">
          <form onSubmit={(evento: FormEvent) => {
            evento.preventDefault();
            void executar(
              contratoSelecionado
                ? "atualizar-contrato"
                : "criar-contrato",
              {
              tipo: contrato.tipo,
              inicio_da_vigencia: contrato.inicio_da_vigencia,
              fim_da_vigencia: contrato.fim_da_vigencia || null,
              situacao: contrato.situacao,
              numero_de_participantes: contrato.numero_de_participantes
                ? Number(contrato.numero_de_participantes)
                : null,
              escopo: {
                marcacao: contrato.marcacao
              },
              servicos_autorizados: [],
              profissionais_vinculados: [],
              justificativa: contrato.justificativa
            },
              contratoSelecionado || undefined
            );
          }}>
            <small>CONTRATOS E VÍNCULOS VERSIONADOS</small>
            <h2>{contratoSelecionado ? "Ficha contratual" : "Novo vínculo"}</h2>
            <label>Tipo<select name="tipo" value={contrato.tipo} onChange={(evento) => setContrato({ ...contrato, tipo: evento.target.value })}><option>ORGANIZACIONAL</option><option>PARTICULAR</option></select></label>
            <label>Início<input required name="inicio_da_vigencia" inputMode="numeric" placeholder="AAAA-MM-DD" pattern="\d{4}-\d{2}-\d{2}" value={contrato.inicio_da_vigencia} onChange={(evento) => setContrato({ ...contrato, inicio_da_vigencia: evento.target.value })} /></label>
            <label>Fim<input name="fim_da_vigencia" inputMode="numeric" placeholder="AAAA-MM-DD" pattern="\d{4}-\d{2}-\d{2}" value={contrato.fim_da_vigencia} onChange={(evento) => setContrato({ ...contrato, fim_da_vigencia: evento.target.value })} /></label>
            <label>Número de participantes<input name="numero_de_participantes" type="number" min="1" value={contrato.numero_de_participantes} onChange={(evento) => setContrato({ ...contrato, numero_de_participantes: evento.target.value })} /></label>
            <label>Identificação do contexto<input required name="marcacao" value={contrato.marcacao} onChange={(evento) => setContrato({ ...contrato, marcacao: evento.target.value })} /></label>
            <label>Situação<select value={contrato.situacao} onChange={(evento) => setContrato({ ...contrato, situacao: evento.target.value })}><option>ATIVO</option><option>INATIVO</option><option>ENCERRADO</option></select></label>
            <label>Justificativa da versão<textarea required value={contrato.justificativa} onChange={(evento) => setContrato({ ...contrato, justificativa: evento.target.value })} /></label>
            <button disabled={ocupado || !podeAdministrar}>
              {contratoSelecionado ? "Salvar nova versão" : "Registrar contrato"}
            </button>
            {contratoSelecionado ? (
              <button type="button" onClick={() => {
                setContratoSelecionado("");
                setContrato({
                  tipo: "ORGANIZACIONAL",
                  inicio_da_vigencia: "",
                  fim_da_vigencia: "",
                  numero_de_participantes: "",
                  marcacao: "",
                  situacao: "ATIVO",
                  justificativa: ""
                });
              }}>Novo vínculo</button>
            ) : null}
          </form>
          <section className="hx-management-table"><header><div><small>HISTÓRICO CONTRATUAL</small><h2>Vínculos preservados</h2></div></header><div>{dados.contratos.map((item) => <article key={String(item.identificador)}><div><small>Tipo</small><strong>{texto(item.tipo)}</strong></div><div><small>Situação</small><strong>{texto(item.situacao)}</strong></div><div><small>Versão</small><strong>{texto(item.numero_da_versao)}</strong></div><span>{texto(item.inicio_da_vigencia)} → {texto(item.fim_da_vigencia, "vigente")}</span><button type="button" onClick={() => {
            const escopo = objeto(item.escopo_json);
            setContratoSelecionado(String(item.identificador));
            setContrato({
              tipo: String(item.tipo ?? "ORGANIZACIONAL"),
              inicio_da_vigencia: String(item.inicio_da_vigencia ?? ""),
              fim_da_vigencia: String(item.fim_da_vigencia ?? ""),
              numero_de_participantes: String(item.numero_de_participantes ?? ""),
              marcacao: String(escopo.marcacao ?? ""),
              situacao: String(item.situacao ?? "ATIVO"),
              justificativa: ""
            });
          }}>Abrir ficha</button></article>)}</div></section>
        </div>
      ) : null}

      {mensagem ? <p className="hx-module__notice" role="status">{mensagem}</p> : null}
      {erro ? <p className="hx-module__error" role="alert">{erro}</p> : null}
    </div>
  );
}
