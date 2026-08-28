"use client";

import QRCode from "qrcode";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { humanexusApi } from "@/lib/humanexus-api";
import { resolverIdentidadeDocumental } from "@/lib/humanexus-report-authority";
import { substituirUrlPreservandoContexto } from "@/lib/contexto-navegacao";

const NICHOS = ["AVIACAO", "SAUDE", "EMPRESARIAL", "POLITICA", "TRANSPORTE", "MARITIMO", "SEGURANCA_PUBLICA", "OUTROS"];

function montarLigacaoDoConvite(token: string) {
  const base = window.location.origin.replace(/\/$/, "");
  return `${base}/acesso-participante?token=${encodeURIComponent(token)}`;
}

function atualizarContextoDaAnamnese(
  organizacao: string,
  participante = ""
) {
  const url = new URL(window.location.href);
  if (organizacao) url.searchParams.set("organizacao", organizacao);
  else url.searchParams.delete("organizacao");
  if (participante) url.searchParams.set("participante", participante);
  else url.searchParams.delete("participante");
  url.searchParams.delete("sessao");
  substituirUrlPreservandoContexto(url);
}

type Convite = {
  identificador: string;
  identificador_da_anamnese: string;
  identificador_da_organizacao?: string;
  tipo_de_vinculo?: "PARTICULAR" | "ORGANIZACIONAL" | "MISTO";
  participante: string;
  organizacao?: string;
  identificador_do_profissional?: string;
  finalidade: string;
  versao_da_anamnese: string;
  criado_em: string;
  expira_em: string;
  estado: string;
  ultimo_acesso_em?: string;
  progresso: number;
  concluido_em?: string;
};
type Entrega = {
  convite: Convite;
  token_de_entrega_unica: string;
  codigo_de_entrega_unica: string;
  participante?: { identificador: string };
  anamnese?: { identificador: string };
};
type RegistroParticipante = {
  identificador: string;
  identificador_da_organizacao: string;
  referencia_externa: string;
  ativo: boolean;
  identidade_individual_autoritativa?: Record<string, unknown>;
  perfil_operacional?: {
    tipo_de_vinculo?: "PARTICULAR" | "ORGANIZACIONAL" | "MISTO";
    dados_cadastrais?: {
      nome_completo?: string;
      nome_social?: string;
      email?: string;
      telefone?: string;
    };
    dados_profissionais?: {
      cargo?: string;
      funcao?: string;
    };
    contatos?: Array<{ telefone?: string; email?: string }>;
  };
};
type ContextoParticipantes = {
  organizacoes: Array<{
    identificador: string;
    nome: string;
    ativa?: boolean;
  }>;
  organizacao: { identificador: string; nome: string } | null;
  participantes: RegistroParticipante[];
};
type Resposta = {
  identificador_da_pergunta: string;
  resposta_json: unknown;
  pergunta?: { codigo: string; texto: string; blocos_json: string[] };
};
type Revisao = {
  anamnese: { identificador: string; identificador_do_participante: string; identificador_da_organizacao?: string; estado: string; numero_da_versao: number; nicho: string; funcao?: string };
  respostas: (Resposta & { aplicavel_ao_ramo_atual: boolean })[];
  consentimentos: Record<string, unknown>[];
  revisoes: Record<string, unknown>[];
  observacoes: Record<string, unknown>[];
  evidencias: { identificador: string; identificador_da_pergunta: string }[];
  historico_de_ramos: Record<string, unknown>[];
};

function dataLegivel(value?: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

export function PainelProfissional() {
  const [form, setForm] = useState({
    nome: "", email: "", telefone: "", funcao: "", tipo_vinculo: "ORGANIZACIONAL",
    organizacao: "", participante: "", modo: "NOVO", nicho: "OUTROS",
    validade_horas: 72
  });
  const [contexto, setContexto] = useState<ContextoParticipantes | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [chaveDeOperacao, setChaveDeOperacao] = useState("");
  const [entrega, setEntrega] = useState<Entrega | null>(null);
  const [link, setLink] = useState("");
  const [qr, setQr] = useState("");
  const [status, setStatus] = useState("Aguardando uma ação.");
  const [convites, setConvites] = useState<Convite[]>([]);
  const [filtro, setFiltro] = useState("TODOS");
  const [grupoConvite, setGrupoConvite] =
    useState<"PARTICULAR" | "ORGANIZACIONAL">("ORGANIZACIONAL");
  const [busca, setBusca] = useState("");
  const [versaoFiltro, setVersaoFiltro] = useState("TODAS");
  const [expiracaoProxima, setExpiracaoProxima] = useState(false);
  const [revisao, setRevisao] = useState<Revisao | null>(null);
  const [auditoria, setAuditoria] = useState<Record<string, unknown>[] | null>(null);
  const [observacao, setObservacao] = useState("");
  const [reabertura, setReabertura] = useState<{ anamneseId: string; participante: string } | null>(null);
  const [justificativaReabertura, setJustificativaReabertura] = useState("");
  const [citacoes, setCitacoes] = useState<Set<string>>(new Set());

  async function carregar(organizacao = form.organizacao) {
    try {
      const consulta = organizacao
        ? `?organizacao=${encodeURIComponent(organizacao)}`
        : "";
      setConvites(await humanexusApi<Convite[]>(
        `/api/humanexus/gestao-convites${consulta}`
      ));
    } catch {
      setStatus("O perfil atual não possui acesso ao painel de convites.");
    }
  }
  async function carregarParticipantes(
    organizacao?: string,
    participanteSolicitado = ""
  ) {
    const consulta = organizacao
      ? `?organizacao=${encodeURIComponent(organizacao)}`
      : "";
    const dados = await humanexusApi<ContextoParticipantes>(
      `/api/humanexus/participantes${consulta}`
    );
    const organizacaoAtual = dados.organizacao?.identificador ?? "";
    if (organizacao && organizacaoAtual !== organizacao) {
      throw new Error(
        "O Núcleo não confirmou a organização solicitada. O módulo foi bloqueado para impedir roteamento cruzado."
      );
    }
    const participanteAtual = participanteSolicitado
      ? dados.participantes.find(
          (item) => item.identificador === participanteSolicitado
        )
      : null;
    if (participanteSolicitado && !participanteAtual) {
      throw new Error(
        "O Núcleo não confirmou o participante no escopo organizacional solicitado."
      );
    }
    setContexto(dados);
    setForm((atual) => ({
      ...atual,
      organizacao: organizacaoAtual,
      participante: participanteAtual?.identificador
        ?? (dados.participantes.some(
          (item) => item.identificador === atual.participante
        ) ? atual.participante : ""),
      modo: participanteAtual ? "EXISTENTE" : atual.modo,
      nome: participanteAtual
        ? participanteAtual.perfil_operacional?.dados_cadastrais?.nome_social
          || participanteAtual.perfil_operacional?.dados_cadastrais?.nome_completo
          || ""
        : atual.nome,
      email: participanteAtual
        ? participanteAtual.perfil_operacional?.dados_cadastrais?.email
          || participanteAtual.perfil_operacional?.contatos?.[0]?.email
          || ""
        : atual.email,
      telefone: participanteAtual
        ? participanteAtual.perfil_operacional?.dados_cadastrais?.telefone
          || participanteAtual.perfil_operacional?.contatos?.[0]?.telefone
          || ""
        : atual.telefone,
      funcao: participanteAtual
        ? participanteAtual.perfil_operacional?.dados_profissionais?.funcao
          || participanteAtual.perfil_operacional?.dados_profissionais?.cargo
          || ""
        : atual.funcao,
      tipo_vinculo: participanteAtual?.perfil_operacional?.tipo_de_vinculo
        || atual.tipo_vinculo
    }));
    return dados;
  }
  useEffect(() => {
    const parametros = new URLSearchParams(window.location.search);
    const organizacao = parametros.get("organizacao") ?? "";
    const participante = parametros.get("participante") ?? "";
    void carregarParticipantes(organizacao, participante).then(
      (dados) => carregar(dados.organizacao?.identificador ?? "")
    ).catch((erro) => {
      setStatus(
        erro instanceof Error
          ? erro.message
          : "Não foi possível carregar organizações e participantes."
      );
    });
  }, []);

  async function criar(event: FormEvent) {
    event.preventDefault();
    if (ocupado) return;
    setOcupado(true);
    setStatus(
      form.modo === "NOVO"
        ? "Cadastrando participante e gerando convite seguro…"
        : "Gerando convite seguro para o participante selecionado…"
    );
    try {
      const chaveIdempotente =
        chaveDeOperacao || crypto.randomUUID();
      if (!chaveDeOperacao) setChaveDeOperacao(chaveIdempotente);
      const gerado = await humanexusApi<Entrega>("/api/humanexus/anamneses", {
        method: "POST",
        body: JSON.stringify({
          identificador_da_organizacao: form.organizacao,
          identificador_do_participante:
            form.modo === "EXISTENTE" ? form.participante : null,
          novo_participante: form.modo === "NOVO"
            ? {
                nome: form.nome,
                email: form.email,
                telefone: form.telefone,
                funcao: form.funcao
              }
            : null,
          chave_de_idempotencia:
            form.modo === "NOVO" ? chaveIdempotente : null,
          tipo_de_vinculo: form.tipo_vinculo,
          nicho: form.nicho,
          funcao: form.funcao,
          validade_horas: form.validade_horas,
          usos_permitidos: 50
        })
      });
      const conviteLink = montarLigacaoDoConvite(gerado.token_de_entrega_unica);
      setEntrega(gerado);
      setLink(conviteLink);
      setQr(await QRCode.toDataURL(conviteLink, {
        width: 320, margin: 1,
        color: { dark: "#061014", light: "#f4efe3" },
        errorCorrectionLevel: "M"
      }));
      await carregarParticipantes(form.organizacao);
      setForm((atual) => ({
        ...atual,
        modo: "EXISTENTE",
        participante:
          gerado.participante?.identificador ?? atual.participante,
        nome: "",
        email: "",
        telefone: "",
        funcao: ""
      }));
      setChaveDeOperacao("");
      setStatus("Participante persistido e convite criado. Ligação, código e código QR são exibidos somente nesta entrega.");
      await carregar(form.organizacao);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Não foi possível criar o convite.");
    } finally {
      setOcupado(false);
    }
  }

  function selecionarParticipanteExistente(identificador: string) {
    const registro = contexto?.participantes.find(
      (item) => item.identificador === identificador
    );
    const perfil = registro?.perfil_operacional;
    const cadastrais = perfil?.dados_cadastrais;
    const profissionais = perfil?.dados_profissionais;
    const contato = perfil?.contatos?.[0];
    setForm((atual) => ({
      ...atual,
      participante: identificador,
      nome: cadastrais?.nome_social || cadastrais?.nome_completo || "",
      email: cadastrais?.email || contato?.email || "",
      telefone: cadastrais?.telefone || contato?.telefone || "",
      funcao: profissionais?.funcao || profissionais?.cargo || "",
      tipo_vinculo: perfil?.tipo_de_vinculo || atual.tipo_vinculo
    }));
    atualizarContextoDaAnamnese(form.organizacao, identificador);
  }

  async function copiar(value: string, mensagem: string) {
    await navigator.clipboard.writeText(value);
    setStatus(mensagem);
  }

  async function registrarCompartilhamento(id: string) {
    await humanexusApi(`/api/humanexus/gestao-convites/${id}`, {
      method: "POST",
      body: JSON.stringify({ acao: "COMPARTILHAMENTO_INICIADO" })
    });
    await carregar(form.organizacao);
  }

  function whatsapp() {
    if (!entrega) return;
    const mensagem = `HUMANEXUS — convite para Anamnese Regulatória\nFinalidade: Anamnese Regulatória HUMANEXUS\nAcesso seguro: ${link}\nValidade: ${dataLegivel(entrega.convite.expira_em)}\nSuporte: contato@institutohumanexus.com`;
    void registrarCompartilhamento(entrega.convite.identificador);
    window.open(`https://wa.me/?text=${encodeURIComponent(mensagem)}`, "_blank", "noopener,noreferrer");
  }

  function email() {
    if (!entrega) return;
    const assunto = "Convite seguro — Anamnese Regulatória HUMANEXUS";
    const corpo = `HUMANEXUS\n\nVocê recebeu um convite para responder à Anamnese Regulatória.\n\nAcesso seguro: ${link}\nValidade: ${dataLegivel(entrega.convite.expira_em)}\n\nSuporte: contato@institutohumanexus.com`;
    void registrarCompartilhamento(entrega.convite.identificador);
    window.location.href = `mailto:?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;
    setStatus("PROVEDOR_DE_EMAIL_NAO_CONFIGURADO — cliente de e-mail aberto; envio não confirmado.");
  }

  async function revogar(id: string) {
    await humanexusApi(`/api/humanexus/gestao-convites/${id}`, {
      method: "POST",
      body: JSON.stringify({ acao: "REVOGAR", justificativa: "Revogação solicitada pelo profissional." })
    });
    setStatus("Convite revogado e auditado.");
    await carregar(form.organizacao);
  }

  async function exibirNovaEntrega(gerado: Entrega) {
    const conviteLink = montarLigacaoDoConvite(gerado.token_de_entrega_unica);
    setEntrega(gerado);
    setLink(conviteLink);
    setQr(await QRCode.toDataURL(conviteLink, {
      width: 320, margin: 1,
      color: { dark: "#061014", light: "#f4efe3" },
      errorCorrectionLevel: "M"
    }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function gerarNovoConvite(anamneseId: string) {
    const gerado = await humanexusApi<Entrega>(`/api/humanexus/anamneses/${anamneseId}`, {
      method: "POST",
      body: JSON.stringify({ acao: "NOVO_CONVITE" })
    });
    await exibirNovaEntrega(gerado);
    setStatus("Novo convite criado; o anterior ativo foi revogado de forma auditada.");
    await carregar(form.organizacao);
  }

  async function reabrir() {
    if (!reabertura || !justificativaReabertura.trim()) return;
    const gerado = await humanexusApi<{
      anamnese: Record<string, unknown>;
      convite: Convite;
      token_de_entrega_unica: string;
      codigo_de_entrega_unica: string;
    }>(`/api/humanexus/anamneses/${reabertura.anamneseId}`, {
      method: "POST",
      body: JSON.stringify({ acao: "REABRIR", justificativa: justificativaReabertura.trim() })
    });
    await exibirNovaEntrega({
      convite: gerado.convite,
      token_de_entrega_unica: gerado.token_de_entrega_unica,
      codigo_de_entrega_unica: gerado.codigo_de_entrega_unica
    });
    setReabertura(null);
    setJustificativaReabertura("");
    setStatus("Nova versão de preenchimento criada; a versão concluída anterior foi preservada.");
    await carregar(form.organizacao);
  }

  async function abrirAuditoria(conviteId: string) {
    setAuditoria(await humanexusApi<Record<string, unknown>[]>(
      `/api/humanexus/gestao-convites/${conviteId}`
    ));
  }

  async function abrirRevisao(anamneseId: string) {
    try {
      setRevisao(await humanexusApi<Revisao>(`/api/humanexus/anamneses/${anamneseId}`));
      setStatus("Revisão profissional carregada.");
    } catch {
      setStatus("A revisão individual exige perfil profissional autorizado.");
    }
  }

  async function aceitarEvidencia(resposta: Resposta) {
    if (!revisao) return;
    await humanexusApi(`/api/humanexus/anamneses/${revisao.anamnese.identificador}`, {
      method: "POST",
      body: JSON.stringify({
        acao: "ACEITAR_EVIDENCIA",
        identificador_da_pergunta: resposta.identificador_da_pergunta,
        modalidade: "NARRATIVA",
        qualidade: "PARCIAL",
        justificativa: "Resposta aceita pelo profissional como evidência narrativa contextual.",
        contexto: { origem: "ANAMNESE_REGULATORIA", versao: "ANAMNESE-REGULATORIA-TIRH-1.0" }
      })
    });
    await abrirRevisao(revisao.anamnese.identificador);
  }

  async function citarNaFormulacao(evidencia: { identificador: string; identificador_da_pergunta: string }) {
    if (!revisao) return;
    await humanexusApi("/api/humanexus/formulacoes", {
      method: "POST",
      body: JSON.stringify({
        participante_id: revisao.anamnese.identificador_do_participante,
        anamnese_id: revisao.anamnese.identificador,
        evidencia_id: evidencia.identificador,
        pergunta_id: evidencia.identificador_da_pergunta,
        identificador_da_organizacao:
          revisao.anamnese.identificador_da_organizacao
          ?? form.organizacao
      })
    });
    setCitacoes((atuais) => new Set(atuais).add(evidencia.identificador));
    setStatus("Evidência citada em Formulação profissional rastreável, sem inferência automática.");
  }

  async function registrarObservacao() {
    if (!revisao || !observacao.trim()) return;
    await humanexusApi(`/api/humanexus/anamneses/${revisao.anamnese.identificador}`, {
      method: "POST",
      body: JSON.stringify({
        acao: "OBSERVAR",
        tipo: "PONTO_A_ESCLARECER",
        conteudo: observacao,
        limitacao: "Exige esclarecimento profissional antes de uso inferencial.",
        proximo_passo: "Relacionar à Formulação Regulatória somente após esclarecimento."
      })
    });
    setObservacao("");
    await abrirRevisao(revisao.anamnese.identificador);
  }

  const visiveis = useMemo(
    () => convites.filter((item) => {
      const texto = `${item.participante} ${item.organizacao ?? ""}`.toLowerCase();
      const pertoDeExpirar = new Date(item.expira_em).getTime() - Date.now() <= 24 * 60 * 60 * 1000;
      const grupoCorreto = grupoConvite === "PARTICULAR"
        ? item.tipo_de_vinculo === "PARTICULAR"
          || item.tipo_de_vinculo === "MISTO"
        : item.tipo_de_vinculo !== "PARTICULAR";
      return grupoCorreto
        && (filtro === "TODOS" || item.estado === filtro)
        && (versaoFiltro === "TODAS" || item.versao_da_anamnese === versaoFiltro)
        && (!busca.trim() || texto.includes(busca.trim().toLowerCase()))
        && (!expiracaoProxima || pertoDeExpirar);
    }),
    [busca, convites, expiracaoProxima, filtro, grupoConvite, versaoFiltro]
  );
  const indicadores = {
    ativos: convites.filter((item) => !["CONCLUIDO", "EXPIRADO", "REVOGADO"].includes(item.estado)).length,
    naoAcessados: convites.filter((item) => ["CRIADO", "COMPARTILHAMENTO_INICIADO", "ENVIADO_CONFIRMADO"].includes(item.estado)).length,
    preenchimento: convites.filter((item) => item.estado === "EM_PREENCHIMENTO").length,
    concluidos: convites.filter((item) => item.estado === "CONCLUIDO").length,
    expirados: convites.filter((item) => item.estado === "EXPIRADO").length,
    revogados: convites.filter((item) => item.estado === "REVOGADO").length
  };

  return (
    <section className="hx-invites" data-portugues-preservar="true">
      <header className="hx-invites__head">
        <div><p>ANAMNESE REGULATÓRIA / OPERAÇÃO</p><h2>Convites, acompanhamento e revisão profissional.</h2><span>ANAMNESE-REGULATORIA-TIRH-1.0 · 156 perguntas autorais ativas · 195 preservadas · 14 módulos</span></div>
        <span>SESSÃO PROTEGIDA NO NAVEGADOR · NÚCLEO PROTEGIDO</span>
      </header>
      <section className="hx-invites__metrics">
        <article><small>Convites ativos</small><strong>{indicadores.ativos}</strong></article>
        <article><small>Não acessados</small><strong>{indicadores.naoAcessados}</strong></article>
        <article><small>Em preenchimento</small><strong>{indicadores.preenchimento}</strong></article>
        <article><small>Concluídos</small><strong>{indicadores.concluidos}</strong></article>
        <article><small>Expirados</small><strong>{indicadores.expirados}</strong></article>
        <article><small>Revogados</small><strong>{indicadores.revogados}</strong></article>
      </section>
      <div className="hx-invites__workspace">
        <form onSubmit={criar} className="hx-invite-form">
          <header><small>GERAR CONVITE DE ANAMNESE</small><h3>Participante persistido</h3></header>
          <label><span>Organização</span><select required value={form.organizacao} onChange={(event) => { const organizacao = event.target.value; setForm({ ...form, organizacao, participante: "", nome: "", email: "", telefone: "", funcao: "" }); atualizarContextoDaAnamnese(organizacao); void Promise.all([carregarParticipantes(organizacao), carregar(organizacao)]).catch((erro) => setStatus(erro instanceof Error ? erro.message : "Organização indisponível.")); }}><option value="">Selecione</option>{(contexto?.organizacoes ?? []).filter((item) => item.ativa !== false).map((item) => <option key={item.identificador} value={item.identificador}>{item.nome}</option>)}</select></label>
          <label><span>Origem do cadastro</span><select value={form.modo} onChange={(event) => setForm({ ...form, modo: event.target.value, participante: "", nome: "", email: "", telefone: "", funcao: "" })}><option value="NOVO">Novo participante</option><option value="EXISTENTE">Participante existente</option></select></label>
          {form.modo === "EXISTENTE" ? <label><span>Participante</span><select required value={form.participante} onChange={(event) => selecionarParticipanteExistente(event.target.value)}><option value="">Selecione</option>{(contexto?.participantes ?? []).filter((item) => item.ativo !== false).map((item) => { const identidade = resolverIdentidadeDocumental(item as unknown as Record<string, unknown>, { identificador: form.organizacao }); const rotulo = identidade.referenciaOperacional !== identidade.nomeCompleto ? `${identidade.nomeCompleto} — ${identidade.referenciaOperacional}` : identidade.nomeCompleto; return <option key={item.identificador} value={item.identificador}>{rotulo}</option>; })}</select></label> : <>
            <label><span>Nome</span><input required value={form.nome} onChange={(event) => setForm({ ...form, nome: event.target.value })} /></label>
            <label><span>Correio eletrônico</span><input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
          </>}
          <div><label><span>Telefone</span><input value={form.telefone} onChange={(event) => setForm({ ...form, telefone: event.target.value })} /></label><label><span>Função</span><input value={form.funcao} onChange={(event) => setForm({ ...form, funcao: event.target.value })} /></label></div>
          {form.modo === "EXISTENTE" && form.participante ? <small>Telefone, função e vínculo foram reutilizados do cadastro. Ajustes valem somente para este convite e não alteram a ficha original.</small> : null}
          <div><label><span>Vínculo</span><select value={form.tipo_vinculo} onChange={(event) => setForm({ ...form, tipo_vinculo: event.target.value })}>{["PARTICULAR", "ORGANIZACIONAL", "MISTO"].map((item) => <option key={item}>{item}</option>)}</select></label><label><span>Nicho</span><select value={form.nicho} onChange={(event) => setForm({ ...form, nicho: event.target.value })}>{NICHOS.map((item) => <option key={item}>{item}</option>)}</select></label></div>
          <label><span>Validade</span><select value={form.validade_horas} onChange={(event) => setForm({ ...form, validade_horas: Number(event.target.value) })}><option value={24}>24 horas</option><option value={72}>72 horas</option><option value={168}>7 dias</option></select></label>
          <button disabled={ocupado || !form.organizacao || (form.modo === "EXISTENTE" && !form.participante)}>{ocupado ? "Processando…" : "Gerar convite seguro"}</button>
        </form>
        <aside className="hx-invite-delivery">
          <header><small>ENTREGA ÚNICA</small><h3>Ligação, código e código QR</h3></header>
          <p aria-live="polite">{status}</p>
          {entrega ? <>
            <div className="hx-invite-code"><small>CÓDIGO ALTERNATIVO</small><strong>{entrega.codigo_de_entrega_unica}</strong></div>
            <div className="hx-invite-link" data-portugues-preservar="true">{link}</div>
            {qr ? <img src={qr} alt="Código QR do convite seguro para a Anamnese" /> : null}
            <div className="hx-invite-actions">
              <button type="button" onClick={() => void copiar(link, "Ligação copiada.")}>Copiar ligação</button>
              <button type="button" onClick={() => void copiar(entrega.codigo_de_entrega_unica, "Código copiado.")}>Copiar código</button>
              <button type="button" onClick={whatsapp}>WhatsApp</button>
              <button type="button" onClick={email}>Correio eletrônico</button>
              <a href={link} target="_blank" rel="noreferrer">Visualizar como participante</a>
            </div>
          </> : <div className="hx-invite-empty">O código secreto original não será exibido novamente após sair desta entrega.</div>}
        </aside>
      </div>
      <section className="hx-invites__panel">
        <header><div><small>PAINEL DE CONVITES</small><h3>Acompanhamento operacional</h3></div><div className="hx-invites__filters"><button type="button" onClick={() => setGrupoConvite("ORGANIZACIONAL")}>Organizacionais</button><button type="button" onClick={() => setGrupoConvite("PARTICULAR")}>Particulares</button><input aria-label="Filtrar por participante ou organização" placeholder="Participante ou organização" value={busca} onChange={(event) => setBusca(event.target.value)} /><select value={filtro} onChange={(event) => setFiltro(event.target.value)}><option value="TODOS">Todos os estados</option>{["CRIADO", "COMPARTILHAMENTO_INICIADO", "ENVIADO_CONFIRMADO", "ACESSADO", "EM_PREENCHIMENTO", "CONCLUIDO", "EXPIRADO", "REVOGADO", "REABERTO"].map((item) => <option key={item}>{item}</option>)}</select><select value={versaoFiltro} onChange={(event) => setVersaoFiltro(event.target.value)}><option value="TODAS">Todas as versões</option>{[...new Set(convites.map((item) => item.versao_da_anamnese))].map((item) => <option key={item}>{item}</option>)}</select><label><input type="checkbox" checked={expiracaoProxima} onChange={(event) => setExpiracaoProxima(event.target.checked)} /> Expira em até 24h</label></div></header>
        <div className="hx-invites__table"><table><thead><tr><th>Participante</th><th>Organização</th><th>Versão</th><th>Criação / validade</th><th>Situação</th><th>Progresso</th><th>Ações</th></tr></thead><tbody>{visiveis.map((item) => <tr key={item.identificador}><td>{item.participante}</td><td>{item.organizacao || "Particular"}</td><td>{item.versao_da_anamnese}</td><td>{dataLegivel(item.criado_em)}<small>{dataLegivel(item.expira_em)}</small></td><td><span data-state={item.estado}>{item.estado.replaceAll("_", " ")}</span></td><td>{Number(item.progresso || 0).toFixed(0)}%</td><td><button onClick={() => void abrirRevisao(item.identificador_da_anamnese)}>Revisar</button><button onClick={() => void abrirAuditoria(item.identificador)}>Auditoria</button>{!["CONCLUIDO", "EXPIRADO", "REVOGADO"].includes(item.estado) ? <button onClick={() => void revogar(item.identificador)}>Revogar</button> : null}{["EXPIRADO", "REVOGADO"].includes(item.estado) ? <button onClick={() => void gerarNovoConvite(item.identificador_da_anamnese)}>Novo convite</button> : null}{item.estado === "CONCLUIDO" ? <button onClick={() => { setReabertura({ anamneseId: item.identificador_da_anamnese, participante: item.participante }); setJustificativaReabertura(""); }}>Reabrir</button> : null}</td></tr>)}</tbody></table></div>
      </section>
      {reabertura ? <section className="hx-review">
        <header><div><small>REABERTURA AUDITÁVEL</small><h3>Preservar versão concluída e criar novo preenchimento</h3></div><span>{reabertura.participante}</span></header>
        <div className="hx-review__tools">
          <textarea aria-label="Justificativa obrigatória da reabertura" placeholder="Registre a justificativa profissional completa." value={justificativaReabertura} onChange={(event) => setJustificativaReabertura(event.target.value)} />
          <button type="button" onClick={() => { setReabertura(null); setJustificativaReabertura(""); }}>Cancelar</button>
          <button type="button" disabled={!justificativaReabertura.trim()} onClick={() => void reabrir()}>Confirmar reabertura</button>
        </div>
      </section> : null}
      {auditoria ? <section className="hx-review"><header><div><small>AUDITORIA DO CONVITE</small><h3>Histórico imutável de estados</h3></div><button onClick={() => setAuditoria(null)}>Fechar</button></header><pre>{JSON.stringify(auditoria, null, 2)}</pre></section> : null}
      {revisao ? <section className="hx-review"><header><div><small>REVISÃO PROFISSIONAL</small><h3>Respostas por módulo</h3></div><span>{revisao.anamnese.estado} · versão {revisao.anamnese.numero_da_versao} · {revisao.anamnese.nicho} / {revisao.anamnese.funcao || "função não informada"}</span></header><div className="hx-review__tools"><textarea aria-label="Observação ou pedido de esclarecimento" placeholder="Registre observação, limitação ou ponto que exige esclarecimento." value={observacao} onChange={(event) => setObservacao(event.target.value)} /><button onClick={() => void registrarObservacao()}>Registrar observação</button><a href="/plataforma/cockpit-vivo?visao=formulacao">Abrir Formulação Regulatória</a></div><div>{revisao.respostas.map((resposta) => { const evidencia = revisao.evidencias.find((item) => item.identificador_da_pergunta === resposta.identificador_da_pergunta); return <article key={resposta.identificador_da_pergunta} data-applicable={resposta.aplicavel_ao_ramo_atual}><small>{resposta.pergunta?.codigo || "RESPOSTA PRESERVADA"} · {resposta.pergunta?.blocos_json?.[0] || "INAPLICÁVEL AO RAMO ATUAL"}</small><strong>{resposta.pergunta?.texto || "Resposta de ramo anterior preservada no histórico"}</strong><p>{valueText(resposta.resposta_json)}</p>{resposta.aplicavel_ao_ramo_atual ? <div className="hx-review__evidence-actions"><button disabled={Boolean(evidencia)} onClick={() => void aceitarEvidencia(resposta)}>{evidencia ? "Evidência narrativa aceita" : "Aceitar como evidência narrativa"}</button>{evidencia ? <button disabled={citacoes.has(evidencia.identificador)} onClick={() => void citarNaFormulacao(evidencia)}>{citacoes.has(evidencia.identificador) ? "Citada na Formulação" : "Citar na Formulação"}</button> : null}</div> : <span>Não utilizar na análise do ramo atual.</span>}</article>; })}</div></section> : null}
    </section>
  );
}

function valueText(value: unknown) {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(String).join("\n• ");
  if (value && typeof value === "object" && "valor" in value) {
    const resposta = value as { valor: unknown; outro?: unknown };
    return [String(resposta.valor ?? ""), resposta.outro ? `Outro: ${resposta.outro}` : ""]
      .filter(Boolean).join("\n");
  }
  if (value && typeof value === "object" && "valores" in value) {
    const resposta = value as { valores: unknown[]; outro?: unknown };
    return [
      resposta.valores.map(String).join("\n• "),
      resposta.outro ? `Outro: ${resposta.outro}` : ""
    ].filter(Boolean).join("\n");
  }
  return JSON.stringify(value, null, 2);
}
