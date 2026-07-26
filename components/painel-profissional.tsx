"use client";

import QRCode from "qrcode";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { humanexusApi } from "@/lib/humanexus-api";

const NICHOS = ["AVIACAO", "SAUDE", "EMPRESARIAL", "POLITICA", "TRANSPORTE", "MARITIMO", "SEGURANCA_PUBLICA", "OUTROS"];
const PUBLIC_BASE = process.env.NEXT_PUBLIC_HUMANEXUS_APP_URL;

type Convite = {
  identificador: string;
  identificador_da_anamnese: string;
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
};
type Resposta = {
  identificador_da_pergunta: string;
  resposta_json: unknown;
  pergunta?: { codigo: string; texto: string; blocos_json: string[] };
};
type Revisao = {
  anamnese: { identificador: string; identificador_do_participante: string; estado: string; numero_da_versao: number; nicho: string; funcao?: string };
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
    organizacao: "", nicho: "OUTROS", validade_horas: 72
  });
  const [entrega, setEntrega] = useState<Entrega | null>(null);
  const [link, setLink] = useState("");
  const [qr, setQr] = useState("");
  const [status, setStatus] = useState("Aguardando uma ação.");
  const [convites, setConvites] = useState<Convite[]>([]);
  const [filtro, setFiltro] = useState("TODOS");
  const [busca, setBusca] = useState("");
  const [versaoFiltro, setVersaoFiltro] = useState("TODAS");
  const [expiracaoProxima, setExpiracaoProxima] = useState(false);
  const [revisao, setRevisao] = useState<Revisao | null>(null);
  const [auditoria, setAuditoria] = useState<Record<string, unknown>[] | null>(null);
  const [observacao, setObservacao] = useState("");
  const [reabertura, setReabertura] = useState<{ anamneseId: string; participante: string } | null>(null);
  const [justificativaReabertura, setJustificativaReabertura] = useState("");
  const [citacoes, setCitacoes] = useState<Set<string>>(new Set());

  async function carregar() {
    try {
      setConvites(await humanexusApi<Convite[]>("/api/humanexus/gestao-convites"));
    } catch {
      setStatus("O perfil atual não possui acesso ao painel de convites.");
    }
  }
  useEffect(() => { void carregar(); }, []);

  async function criar(event: FormEvent) {
    event.preventDefault();
    setStatus("Cadastrando participante e gerando convite seguro…");
    try {
      const participante = await humanexusApi<{
        id: string; identidade_id: string; vinculo_id: string; nicho: string;
      }>("/api/humanexus/participantes", {
        method: "POST",
        body: JSON.stringify(form)
      });
      const gerado = await humanexusApi<Entrega>("/api/humanexus/anamneses", {
        method: "POST",
        body: JSON.stringify({
          participante_id: participante.id,
          identidade_id: participante.identidade_id,
          vinculo_id: participante.vinculo_id,
          nicho: participante.nicho,
          validade_horas: form.validade_horas
        })
      });
      const base = PUBLIC_BASE || window.location.origin;
      const conviteLink = `${base}/acesso-participante?token=${encodeURIComponent(gerado.token_de_entrega_unica)}`;
      setEntrega(gerado);
      setLink(conviteLink);
      setQr(await QRCode.toDataURL(conviteLink, {
        width: 320, margin: 1,
        color: { dark: "#061014", light: "#f4efe3" },
        errorCorrectionLevel: "M"
      }));
      setStatus("Convite criado. Link, código e QR Code são exibidos somente nesta entrega.");
      await carregar();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Não foi possível criar o convite.");
    }
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
    await carregar();
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
    await carregar();
  }

  async function exibirNovaEntrega(gerado: Entrega) {
    const base = PUBLIC_BASE || window.location.origin;
    const conviteLink = `${base}/acesso-participante?token=${encodeURIComponent(gerado.token_de_entrega_unica)}`;
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
    await carregar();
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
    await carregar();
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
        pergunta_id: evidencia.identificador_da_pergunta
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
      return (filtro === "TODOS" || item.estado === filtro)
        && (versaoFiltro === "TODAS" || item.versao_da_anamnese === versaoFiltro)
        && (!busca.trim() || texto.includes(busca.trim().toLowerCase()))
        && (!expiracaoProxima || pertoDeExpirar);
    }),
    [busca, convites, expiracaoProxima, filtro, versaoFiltro]
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
    <section className="hx-invites">
      <header className="hx-invites__head">
        <div><p>ANAMNESE REGULATÓRIA / OPERAÇÃO</p><h2>Convites, acompanhamento e revisão profissional.</h2><span>ANAMNESE-REGULATORIA-TIRH-1.0 · 156 perguntas autorais ativas · 195 preservadas · 14 módulos</span></div>
        <span>SESSÃO HTTPONLY · NÚCLEO PROTEGIDO</span>
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
          <header><small>GERAR CONVITE DE ANAMNESE</small><h3>Cadastrar participante</h3></header>
          <label><span>Nome</span><input required value={form.nome} onChange={(event) => setForm({ ...form, nome: event.target.value })} /></label>
          <label><span>E-mail</span><input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
          <div><label><span>Telefone</span><input value={form.telefone} onChange={(event) => setForm({ ...form, telefone: event.target.value })} /></label><label><span>Função</span><input value={form.funcao} onChange={(event) => setForm({ ...form, funcao: event.target.value })} /></label></div>
          <div><label><span>Vínculo</span><select value={form.tipo_vinculo} onChange={(event) => setForm({ ...form, tipo_vinculo: event.target.value })}>{["PARTICULAR", "ORGANIZACIONAL", "MISTO"].map((item) => <option key={item}>{item}</option>)}</select></label><label><span>Nicho</span><select value={form.nicho} onChange={(event) => setForm({ ...form, nicho: event.target.value })}>{NICHOS.map((item) => <option key={item}>{item}</option>)}</select></label></div>
          {form.tipo_vinculo !== "PARTICULAR" ? <label><span>Organização</span><input required value={form.organizacao} onChange={(event) => setForm({ ...form, organizacao: event.target.value })} /></label> : null}
          <label><span>Validade</span><select value={form.validade_horas} onChange={(event) => setForm({ ...form, validade_horas: Number(event.target.value) })}><option value={24}>24 horas</option><option value={72}>72 horas</option><option value={168}>7 dias</option></select></label>
          <button>Gerar convite seguro</button>
        </form>
        <aside className="hx-invite-delivery">
          <header><small>ENTREGA ÚNICA</small><h3>Link, código e QR Code</h3></header>
          <p aria-live="polite">{status}</p>
          {entrega ? <>
            <div className="hx-invite-code"><small>CÓDIGO ALTERNATIVO</small><strong>{entrega.codigo_de_entrega_unica}</strong></div>
            <div className="hx-invite-link">{link}</div>
            {qr ? <img src={qr} alt="QR Code do convite seguro para a Anamnese" /> : null}
            <div className="hx-invite-actions">
              <button type="button" onClick={() => void copiar(link, "Link copiado.")}>Copiar link</button>
              <button type="button" onClick={() => void copiar(entrega.codigo_de_entrega_unica, "Código copiado.")}>Copiar código</button>
              <button type="button" onClick={whatsapp}>WhatsApp</button>
              <button type="button" onClick={email}>E-mail</button>
              <a href={link} target="_blank" rel="noreferrer">Visualizar como participante</a>
            </div>
          </> : <div className="hx-invite-empty">O token bruto não será exibido novamente após sair desta entrega.</div>}
        </aside>
      </div>
      <section className="hx-invites__panel">
        <header><div><small>PAINEL DE CONVITES</small><h3>Acompanhamento operacional</h3></div><div className="hx-invites__filters"><input aria-label="Filtrar por participante ou organização" placeholder="Participante ou organização" value={busca} onChange={(event) => setBusca(event.target.value)} /><select value={filtro} onChange={(event) => setFiltro(event.target.value)}><option value="TODOS">Todos os estados</option>{["CRIADO", "COMPARTILHAMENTO_INICIADO", "ENVIADO_CONFIRMADO", "ACESSADO", "EM_PREENCHIMENTO", "CONCLUIDO", "EXPIRADO", "REVOGADO", "REABERTO"].map((item) => <option key={item}>{item}</option>)}</select><select value={versaoFiltro} onChange={(event) => setVersaoFiltro(event.target.value)}><option value="TODAS">Todas as versões</option>{[...new Set(convites.map((item) => item.versao_da_anamnese))].map((item) => <option key={item}>{item}</option>)}</select><label><input type="checkbox" checked={expiracaoProxima} onChange={(event) => setExpiracaoProxima(event.target.checked)} /> Expira em até 24h</label></div></header>
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
  return JSON.stringify(value, null, 2);
}
