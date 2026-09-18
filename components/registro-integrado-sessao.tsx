"use client";
import { useEffect, useRef, useState } from "react";
import { iniciarTranscricaoLocal, liberarMotorDeVoz, type TranscritorLocal } from "@/lib/voz-local";
import { CAMPOS_PROFISSIONAIS_DO_RELATORIO } from "@/lib/humanexus-report-authority";
import { aceitarResposta, chaveDoRegistro, MARCADORES, novoRascunho, recuperarRascunho, type RascunhoLocal, type ComandoDeRegistro } from "@/lib/registro-integrado";

type Registro = Record<string, unknown>;
type Resumo = {
  fontes_automaticas?: Record<string, Registro>; proveniencia?: Record<string, string[]>;
  revisao: number; assinatura_do_rascunho: string; salvo_em?: string; terminal: boolean; fase: string | null; identificador_da_fase: string | null;
  checklist?: Registro; profissional: string; campos: Record<string, string>; pendencias: string[]; encerrado_em?: string;
  notas: { identificador: string; texto: string; texto_original?: string; fase: string | null; salvo_em: string; capturado_no_dispositivo_em?: string; campo_destino?: string; estado_revisao?: string; modalidade?: string; profissional?: string; revisavel?: boolean }[];
  validacao?: { assinatura_do_rascunho?: string; historica?: boolean; revisao_validada: number; relatorio: string; versao: number; validado_em: string; longitudinal: string };
};
function obj(v: unknown): Registro { return v && typeof v === "object" ? v as Registro : {}; }
function csrf() { return document.cookie.split("; ").find((x) => x.startsWith("humanexus_csrf="))?.split("=").slice(1).join("=") ?? ""; }
const uuid = () => crypto.randomUUID();

export function RegistroIntegradoDaSessao({ estado, revisar = false }: { estado: Registro; revisar?: boolean }) {
  const sessao = obj(estado.sessao), org = obj(estado.organizacao), participante = obj(estado.participante), usuario = obj(estado.usuario);
  const escopo = [String(org.identificador ?? ""), String(participante.identificador ?? ""), String(sessao.identificador ?? ""), String(usuario.identificador ?? "")];
  if (escopo.some((v) => !v)) return null;
  return <RegistroNoEscopo key={escopo.join(":")} escopo={escopo} estado={estado} revisar={revisar} />;
}
function RegistroNoEscopo({ escopo: [org, participante, sessao, usuario], estado, revisar }: { escopo: string[]; estado: Registro; revisar: boolean }) {
  const scopeKey = chaveDoRegistro(org, participante, sessao, usuario);
  const [storageKey, setStorageKey] = useState("");
  useEffect(() => {
    try {
      // Cada montagem tem um diário próprio. Uma aba duplicada recupera uma
      // cópia, mas jamais sobrescreve o diário ainda aberto na aba original.
      const anterior = sessionStorage.getItem(scopeKey);
      const proxima = `${scopeKey}:${uuid()}`;
      const salvo = anterior ? localStorage.getItem(anterior) : null;
      if (salvo) localStorage.setItem(proxima, salvo);
      sessionStorage.setItem(scopeKey, proxima);
      setStorageKey(proxima);
    } catch { setMensagem("Armazenamento local indisponível. Habilite-o antes de registrar notas."); }
  }, [scopeKey]);
  const endereco = `/api/humanexus/sessoes/${encodeURIComponent(sessao)}/registro-integrado?organizacao=${encodeURIComponent(org)}&participante=${encodeURIComponent(participante)}`;
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const resumoRef = useRef<Resumo | null>(null);
  const local = useRef<RascunhoLocal>(novoRascunho());
  const [versaoUi, atualizarUi] = useState(0);
  const [mensagem, setMensagem] = useState("Carregando registro desta sessão…");
  const [conflito, setConflito] = useState(false);
  const conflitoRef = useRef(false), ativo = useRef(true), enviando = useRef(false), pronto = useRef(false);
  const [salvando, setSalvando] = useState(false), [confirmar, setConfirmar] = useState(false), [ouvindo, setOuvindo] = useState(false);
  const voz = useRef<TranscritorLocal | null>(null);
  const faseVoz = useRef<{ fase: string | null; id: string | null }>({ fase: null, id: null });
  const [campoVoz, setCampoVoz] = useState("");
  const [camposAbertos, setCamposAbertos] = useState<Record<string, boolean>>({});
  const [edicoesNotas, setEdicoesNotas] = useState<Record<string, string>>({});
  const [destinosNotas, setDestinosNotas] = useState<Record<string, string>>({});
  const [aprovacao, setAprovacao] = useState("");
  const operacao = obj(estado.estado_operacional), detalhes = obj(obj(estado.sessao_operacional).detalhes);
  const terminal = resumo?.terminal || ["FINALIZADA", "ENCERRADA"].includes(String(obj(estado.sessao).estado));
  const faseAtual = terminal ? "REVISAO_POS_SESSAO" : String(operacao.fase_cientifica_atual ?? resumo?.fase ?? "") || null;
  const fases = Array.isArray(estado.fases) ? estado.fases.map(obj) : [];
  const faseAtualId = terminal ? null : String(fases.findLast((f) => f.fase === faseAtual)?.identificador ?? resumo?.identificador_da_fase ?? "") || null;
  const faseRef = useRef({ fase: faseAtual, id: faseAtualId });
  faseRef.current = { fase: faseAtual, id: faseAtualId };
  const persistir = () => {
    if (!storageKey) return false;
    try { localStorage.setItem(storageKey, JSON.stringify(local.current)); atualizarUi((v) => v + 1); return true; }
    catch { setMensagem("O navegador não conseguiu preservar o rascunho. Copie o texto e libere espaço antes de sair."); return false; }
  };
  const aplicar = (r: Resumo) => {
    if (!ativo.current || !aceitarResposta(resumoRef.current?.revisao ?? -1, r)) return;
    const conciliado = { ...r, checklist: r.checklist ?? resumoRef.current?.checklist };
    resumoRef.current = conciliado; setResumo(conciliado);
  };
  const requisitar = async (comando?: ComandoDeRegistro) => {
    const r = await fetch(endereco, { method: comando ? "POST" : "GET", cache: "no-store",
      headers: { "content-type": "application/json", "x-humanexus-csrf": decodeURIComponent(csrf()) },
      ...(comando ? { body: JSON.stringify(comando) } : {}), signal: AbortSignal.timeout(comando?.acao === "VALIDAR" ? 65000 : 25000) });
    const d = await r.json();
    if (!r.ok) {
      if (r.status === 409) { conflitoRef.current = true; if (ativo.current) setConflito(true); }
      throw new Error(d.erro?.mensagem ?? "Falha de comunicação. O rascunho permanece neste navegador.");
    }
    if (d.identificador_da_sessao !== sessao || d.identificador_do_participante !== participante || d.identificador_da_organizacao !== org || d.profissional !== usuario) throw new Error("Resposta fora do contexto atual; nenhum texto foi aplicado.");
    return d as Resumo;
  };
  const sincronizar = async () => {
    if (!pronto.current || enviando.current || conflitoRef.current || !ativo.current) return;
    enviando.current = true; setSalvando(true);
    try {
      while (ativo.current) {
        if (!local.current.fila.length && Object.keys(local.current.campos).length) {
          local.current.fila.push({ acao: "SALVAR", chave: uuid(), revisao: local.current.revisaoBase, campos: { ...local.current.campos } });
          if (!persistir()) break;
        }
        const cmd = local.current.fila[0];
        if (!cmd) break;
        const r = await requisitar(cmd);
        if (!ativo.current) return;
        local.current.fila.shift();
        if (cmd.acao === "SALVAR") {
          for (const [k, v] of Object.entries(cmd.campos as Record<string, string>)) if (local.current.campos[k] === v) delete local.current.campos[k];
          local.current.revisaoBase = r.revisao;
        } else if (!Object.keys(local.current.campos).length || r.revisao === local.current.revisaoBase + 1) local.current.revisaoBase = r.revisao;
        aplicar(r); persistir();
        if (cmd.acao === "VALIDAR") window.dispatchEvent(new CustomEvent("humanexus:registro-validado", { detail: { sessao, participante, org } }));
        setMensagem(cmd.acao === "VALIDAR" ? "Versão validada, relatório e longitudinal preservados." : "Salvo no servidor. Rascunho recuperável.");
      }
    } catch (e) { if (ativo.current) setMensagem(e instanceof Error ? e.message : "Não foi possível salvar. Texto preservado para reenvio."); }
    finally { enviando.current = false; if (ativo.current) setSalvando(false); }
  };
  const sincronizarRef = useRef(sincronizar); sincronizarRef.current = sincronizar;
  useEffect(() => {
    if (!storageKey) return;
    ativo.current = true;
    try { local.current = recuperarRascunho(localStorage.getItem(storageKey)); atualizarUi((v) => v + 1); }
    catch (e) { setMensagem(String(e)); return; }
    const carregar = async () => {
      try {
        const r = await requisitar();
        if (!ativo.current) return;
        aplicar(r);
        if (!local.current.fila.length && !Object.keys(local.current.campos).length) local.current.revisaoBase = r.revisao;
        pronto.current = true;
        if (!r.terminal && !r.revisao && !local.current.fila.some((c) => c.acao === "ABRIR")) local.current.fila.push({ acao: "ABRIR", chave: uuid() });
        persistir();
        setMensagem(local.current.texto || local.current.fila.length ? "Rascunho recuperado; sincronizando…" : "Registro carregado nesta sessão.");
        void sincronizarRef.current();
      } catch (e) { if (ativo.current) setMensagem(String(e)); }
    };
    void carregar();
    const retomar = async () => {
      if (document.visibilityState !== "visible" || enviando.current) return;
      if (!pronto.current) { await carregar(); return; }
      await sincronizarRef.current();
      if (!ativo.current || enviando.current) return;
      try {
        const r = await requisitar();
        if (!ativo.current) return;
        if (!local.current.fila.length && !Object.keys(local.current.campos).length) local.current.revisaoBase = r.revisao;
        aplicar(r);
      } catch { /* O estado confirmado permanece visível durante interrupção. */ }
    };
    const timer = setInterval(retomar, 15000);
    window.addEventListener("online", retomar); document.addEventListener("visibilitychange", retomar);
    const outraAba = (e: StorageEvent) => { if (e.key === storageKey && e.newValue && e.newValue !== JSON.stringify(local.current)) { conflitoRef.current = true; setConflito(true); setMensagem("Outra aba alterou o rascunho. Compare as versões antes de continuar."); } };
    window.addEventListener("storage", outraAba);
    const sair = () => { voz.current?.cancelar(); liberarMotorDeVoz(); };
    window.addEventListener("pagehide", sair);
    return () => { ativo.current = false; pronto.current = false; clearInterval(timer); window.removeEventListener("online", retomar); document.removeEventListener("visibilitychange", retomar); window.removeEventListener("storage", outraAba); window.removeEventListener("pagehide", sair); voz.current?.cancelar(); liberarMotorDeVoz(); };
  // A chave React remonta todo o registro ao trocar organização, participante, sessão ou usuário.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);
  useEffect(() => { if (!pronto.current) return; const timer = setTimeout(() => void sincronizarRef.current(), 900); return () => clearTimeout(timer); }, [versaoUi]);
  const estadoDaSessao = String(obj(estado.sessao).estado ?? "");
  useEffect(() => {
    if (!pronto.current) return;
    void requisitar().then((r) => { aplicar(r); }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estadoDaSessao, faseAtualId]);
  // Encerra uma enunciação na transição; resultados finais conservam a fase congelada.
  useEffect(() => { if (voz.current && faseVoz.current.id !== faseAtualId) voz.current.parar(); }, [faseAtualId]);
  const registrar = (conteudo: string, modalidade = "TEXTO", categoria = "", fase = faseRef.current, processamento?: string, destino?: string, capturadoEm?: string) => {
    if (!conteudo.trim()) return;
    if (local.current.fila.length >= 1000) { setMensagem("Fila local cheia. Sincronize antes de registrar novas notas."); return; }
    local.current.fila.push({ acao: "NOTA", chave: uuid(), texto: conteudo.trim(), modalidade, categoria, identificador_da_fase: fase.id, fase_capturada: fase.fase, capturado_em: capturadoEm ?? new Date().toISOString(), contexto_da_captura: fase.fase === "REVISAO_POS_SESSAO" ? "REVISAO_POS_SESSAO" : "FASE_DA_SESSAO", ...(destino ? { campo_destino: destino } : {}), ...(processamento ? { processamento } : {}) });
    if (modalidade !== "FALA") { local.current.texto = ""; local.current.fase = null; local.current.faseId = null; }
    if (persistir()) { setMensagem("Nota preservada neste navegador; aguardando confirmação do servidor."); void sincronizarRef.current(); }
  };
  const editar = (campo: string, valor: string) => {
    setCamposAbertos((atual) => ({ ...atual, [campo]: true }));
    if (!Object.keys(local.current.campos).length && !local.current.fila.some((c) => c.acao === "SALVAR")) local.current.revisaoBase = resumoRef.current?.revisao ?? 0;
    local.current.campos[campo] = valor; setConfirmar(false); persistir();
  };
  const iniciarVoz = async () => {
    if (voz.current) { voz.current.parar(); return; }
    faseVoz.current = { ...faseRef.current };
    const faseCongelada = { ...faseRef.current }, alvo = campoVoz || undefined;
    const capturadoEm = new Date().toISOString();
    setOuvindo(true);
    try {
      voz.current = await iniciarTranscricaoLocal({
        estado: (m) => { if (ativo.current) setMensagem(m); },
        erro: (m) => { if (ativo.current) setMensagem(m); },
        fim: () => { voz.current = null; if (ativo.current) setOuvindo(false); },
        texto: (transcrito) => {
          if (!ativo.current) return;
          registrar(transcrito, "FALA", "", faseCongelada, "LOCAL_NO_DISPOSITIVO", alvo, capturadoEm);
        }
      });
      if (!ativo.current) voz.current?.cancelar();
    } catch (e) { setOuvindo(false); setMensagem(e instanceof Error ? e.message : "Não foi possível ativar a voz local."); }
  };
  const validar = async () => {
    if (ouvindo || !resumo || !resumo.terminal || pendencias.length || enviando.current || conflito || local.current.fila.length || Object.keys(local.current.campos).length || local.current.texto.trim()) { setMensagem("Sincronize as notas e correções antes de confirmar."); return; }
    local.current.fila.push({ acao: "VALIDAR", chave: uuid(), revisao: resumo.revisao, assinatura_do_rascunho: resumo.assinatura_do_rascunho, confirmacao_final: true });
    setConfirmar(false); if (persistir()) await sincronizar();
  };
  const resolver = async () => {
    try {
      const r = await requisitar(); aplicar(r);
      // Apenas revisões editáveis podem ser reconciliadas; notas e confirmação são reenviadas com sua chave original.
      local.current.fila = local.current.fila.filter((c) => c.acao !== "SALVAR" && c.acao !== "VALIDAR");
      local.current.revisaoBase = r.revisao;
      conflitoRef.current = false; setConflito(false); persistir(); void sincronizar();
    } catch (e) { setMensagem(String(e)); }
  };
  const revisarNota = (nota: Resumo["notas"][number], estadoNota: string) => {
    if (!resumo || enviando.current || conflito || local.current.fila.length || Object.keys(local.current.campos).length) return;
    local.current.fila.push({ acao: "REVISAR_NOTA", chave: uuid(), revisao: resumo.revisao, nota: nota.identificador,
      estado: estadoNota, campo_destino: destinosNotas[nota.identificador] ?? nota.campo_destino ?? "observacoes_por_fase",
      ...(estadoNota === "EDITADA" ? { texto_revisado: edicoesNotas[nota.identificador] ?? nota.texto } : {}) });
    if (persistir()) void sincronizar();
  };
  const rotuloCampo = (campo?: string) => CAMPOS_PROFISSIONAIS_DO_RELATORIO.find(([c]) => c === campo)?.[1] ?? "Observações por fase";
  const rotuloRevisao = (estadoNota?: string) => ({ PENDENTE_DE_REVISAO: "Pendente de revisão", INCORPORADA: "Incorporada", EDITADA: "Editada", DESCARTADA: "Descartada" }[estadoNota ?? ""] ?? "Pendente de revisão");
  const campos = { ...resumo?.campos, ...local.current.campos };
  const pendencias = CAMPOS_PROFISSIONAIS_DO_RELATORIO.filter(([c]) => !campos[c]?.trim());
  const finalValidado = (resumo?.validacao?.historica || resumo?.validacao?.assinatura_do_rascunho === resumo?.assinatura_do_rascunho) && resumo?.validacao?.revisao_validada === resumo?.revisao && !Object.keys(local.current.campos).length && !local.current.fila.length;
  const checklist = obj(resumo?.checklist), prontidao = obj(checklist.prontidao), contexto = obj(checklist.contexto);
  const bloqueios = Array.isArray(prontidao.bloqueios_essenciais) ? prontidao.bloqueios_essenciais.map(String) : [];
  const bloqueio = bloqueios.join(" · ");
  const listaFontes = Array.isArray(prontidao.fontes) ? prontidao.fontes.map(obj).filter((f) => f.selecionada || ["POLAR_H10", "EPOC_X", "TELEMETRIA_TAREFA"].includes(String(f.codigo ?? ""))) : [];
  const consentimentos = Array.isArray(contexto.consentimentos) ? contexto.consentimentos.map(String) : [];
  return <section className="hx-professional-consolidation hx-session-register" aria-label="Registro integrado da sessão" id={revisar ? "consolidacao-profissional" : "registro-integrado"}>
    <header><div><small>{revisar || resumo?.terminal ? "REVISÃO PROFISSIONAL ÚNICA" : "REGISTRO DA SESSÃO"}</small><h3>{revisar || resumo?.terminal ? "Revisar, corrigir e validar" : "Observações sempre à mão"}</h3></div><strong>{terminal ? "REVISÃO PÓS-SESSÃO" : faseAtual ?? "PREPARAÇÃO"}</strong></header>
    {!resumo?.terminal && <details open={!resumo?.notas.length}><summary>Checklist automático da sessão</summary><ul>
      <li>Participante: {String(obj(estado.participante).nome_documental ?? obj(estado.participante).referencia_operacional ?? participante)} · Organização: {String(obj(estado.organizacao).nome ?? org)}</li>
      <li>Modalidade: {String(obj(estado.sessao).tipo_de_sessao ?? detalhes.tipo_de_sessao ?? "não informada")}</li>
      <li>Objetivo: {String(obj(estado.sessao).finalidade ?? detalhes.finalidade ?? "não informado")} · CTR: {String(obj(estado.ctr_individual).codigo ?? detalhes.identificador_do_ctr ?? "não selecionado")} · THX: {String(obj(estado.thx_individual).codigo ?? detalhes.identificador_do_thx ?? "não selecionado")}</li>
      <li>Fontes: {listaFontes.length ? listaFontes.map((f) => `${String(f.codigo ?? f.tipo ?? f.nome ?? "fonte")}: ${f.selecionada ? "prevista" : "não prevista"}, ${f.disponivel ? "disponível" : "indisponível"} (${String(f.estado ?? "sem confirmação")})`).join(" · ") : "nenhum sensor ativo confirmado"}</li>
      <li>Baseline: {String(obj(obj(checklist.baseline).referencia).estado ?? obj(obj(operacao.referencia_de_baseline).baseline).estado ?? "decisão pendente na preparação")}</li>
      <li>Autorizações presentes: {consentimentos.join(" · ") || "ainda não confirmadas"}</li>
      <li>Condições de início: {bloqueio || String(prontidao.estado ?? "verificando preparação canônica")}</li>
    </ul>{bloqueio && <p role="alert">{bloqueio}</p>}</details>}
    <div className="hx-session-register__capture">
      <label>Campo de destino da voz<select value={campoVoz} onChange={(e) => setCampoVoz(e.target.value)} disabled={ouvindo}><option value="">Nova nota / comandos</option>{CAMPOS_PROFISSIONAIS_DO_RELATORIO.map(([c, r]) => <option key={c} value={c}>{r}</option>)}</select></label>
      <label>Nota profissional breve<textarea aria-label="Nota profissional breve" value={local.current.texto} rows={2} maxLength={6000} onChange={(e) => { if (!local.current.texto) { local.current.fase = faseRef.current.fase; local.current.faseId = faseRef.current.id; } local.current.texto = e.target.value; persistir(); }} /></label>
      <div><button type="button" onClick={() => void iniciarVoz()} disabled={!resumo || conflito}>{ouvindo ? "Parar microfone" : "Falar observação"}</button> <button type="button" disabled={!resumo || !local.current.texto.trim() || conflito} onClick={() => registrar(local.current.texto, "TEXTO", "", { fase: local.current.fase, id: local.current.faseId })}>Registrar nota</button></div>
      <div className="hx-session-register__markers">{MARCADORES.map((m) => <button type="button" key={m} disabled={!resumo || conflito} onClick={() => registrar(local.current.texto.trim() || `Marcador profissional: ${m.toLowerCase()}. Conteúdo descritivo não registrado.`, "MARCADOR", m, local.current.texto ? { fase: local.current.fase, id: local.current.faseId } : faseRef.current)}>{m}</button>)}</div>
      <p>Use comandos como “intervenção”, “resposta”, “limitação”, “conclusão” ou ditado livre. A voz é transcrita neste dispositivo. No primeiro uso, o modelo aberto é baixado da Hugging Face; áudio não é enviado nem gravado permanentemente. Ative o microfone apenas para ditar suas próprias observações.</p>

    </div>
    <p role="status" aria-live="polite">{salvando ? "Sincronizando… " : ""}{mensagem} {local.current.fila.length > 0 ? `(${local.current.fila.length} envio(s) pendente(s))` : ""}</p>
    {conflito && <aside role="alert"><p>Há duas versões. Seu conteúdo local permanece preservado.</p><button type="button" onClick={async () => { try { aplicar(await requisitar()); } catch (e) { setMensagem(String(e)); } }}>Carregar versão do servidor para comparar</button><details><summary>Conteúdo atual do servidor</summary><pre>{JSON.stringify(resumo?.campos, null, 2)}</pre></details><button type="button" onClick={() => void resolver()}>Aplicar minhas correções sobre a versão atual</button></aside>}
    <section aria-label="Transcrições e notas da sessão">
      <h4>Transcrições e notas — {String(obj(estado.sessao).nome_operacional ?? sessao)}</h4>
      {local.current.fila.filter((c) => c.acao === "NOTA").map((n) => <article key={n.chave}><p>{String(n.texto)}</p><small>{String(n.capturado_em)} · {n.contexto_da_captura === "REVISAO_POS_SESSAO" ? "Revisão pós-sessão" : String(n.fase_capturada ?? "Preparação")} · {n.campo_destino ? rotuloCampo(String(n.campo_destino)) : "Destino sugerido após sincronização"} · Pendente de revisão e sincronização</small></article>)}
      {resumo?.notas.map((n) => <article key={n.identificador}>
        <p>{n.texto}</p><small>{n.fase === "REVISAO_POS_SESSAO" ? "Revisão pós-sessão" : n.fase ?? "Preparação"} · {n.capturado_no_dispositivo_em || n.salvo_em} · {rotuloCampo(n.campo_destino)} · {rotuloRevisao(n.estado_revisao)}</small>
        {n.modalidade === "FALA" && <p>Transcrição persistida. Áudio bruto não armazenado.</p>}
        {n.revisavel !== false && <details><summary>Revisar destino e texto</summary>
          <p>Texto original: {n.texto_original ?? n.texto}</p><small>Autoria: {n.profissional ?? "Registro profissional preservado"} · Recebido em {n.salvo_em}</small>
          <label>Campo de destino<select value={destinosNotas[n.identificador] ?? n.campo_destino ?? "observacoes_por_fase"} onChange={(e) => setDestinosNotas((d) => ({ ...d, [n.identificador]: e.target.value }))}>{CAMPOS_PROFISSIONAIS_DO_RELATORIO.map(([c,r]) => <option key={c} value={c}>{r}</option>)}</select></label>
          <label>Texto revisado<textarea maxLength={6000} value={edicoesNotas[n.identificador] ?? n.texto} onChange={(e) => setEdicoesNotas((d) => ({ ...d, [n.identificador]: e.target.value }))} /></label>
          <button disabled={salvando || conflito || !!local.current.fila.length || !!Object.keys(local.current.campos).length} onClick={() => revisarNota(n, "INCORPORADA")}>Incorporar no destino</button>
          <button disabled={salvando || conflito || !!local.current.fila.length || !!Object.keys(local.current.campos).length} onClick={() => revisarNota(n, "EDITADA")}>Salvar edição auditável</button>
          <button disabled={salvando || conflito || !!local.current.fila.length || !!Object.keys(local.current.campos).length} onClick={() => revisarNota(n, "DESCARTADA")}>Descartar do rascunho</button>
        </details>}
      </article>)}
    </section>
    {(revisar || resumo?.terminal) && resumo && <>
      <p>O rascunho reúne contexto, fases e registros existentes. A interpretação e a decisão só se tornam profissionais após sua confirmação final.</p>
      <div className="hx-session-register__summary"><strong>Síntese consolidada</strong>{CAMPOS_PROFISSIONAIS_DO_RELATORIO.filter(([c]) => campos[c]?.trim()).map(([c, label]) => <p key={c}><b>{label}: </b>{campos[c].length > 240 ? campos[c].slice(0, 240) + "…" : campos[c]}</p>)}</div>
      <details><summary>Fontes carregadas e informações faltantes</summary><ul>{Object.entries(resumo.fontes_automaticas ?? {}).map(([k, f]) => <li key={k}><b>{k.replaceAll("_", " ")}:</b> {String(f.motivo ?? f.estado)} <small>Origem: {String(f.fonte)} · {String(f.referencia ?? "sem registro elegível")}</small></li>)}</ul></details>
      <p>{pendencias.length ? `Lacunas indispensáveis: ${pendencias.map(([, r]) => r).join(" · ")}` : "Todos os campos possuem conteúdo para revisão."}</p>

      <div className="hx-professional-consolidation__fields">{CAMPOS_PROFISSIONAIS_DO_RELATORIO.map(([c, r]) => <details key={c} open={camposAbertos[c] ?? !campos[c]?.trim()} onToggle={(e) => { const aberto = e.currentTarget.open; setCamposAbertos((atual) => atual[c] === aberto ? atual : { ...atual, [c]: aberto }); }}><summary>{r}{!campos[c]?.trim() ? " — completar" : " — revisar / corrigir"}</summary><label>{r}<textarea aria-label={r} value={campos[c] ?? ""} rows={3} maxLength={30000} onChange={(e) => editar(c, e.target.value)} /></label><small>Registros de origem: {(resumo.proveniencia?.[c] ?? []).filter(Boolean).join(" · ") || "Conteúdo autoral para sua revisão"}</small></details>)}</div>
      {finalValidado ? <p role="status">Versão {resumo.validacao?.versao} validada em {resumo.validacao?.validado_em}. {resumo.validacao?.historica ? "Documento histórico preservado." : "Longitudinal atualizado."} <a href={`/api/governanca-relatorios/${encodeURIComponent(resumo.validacao?.relatorio ?? "")}/pdf`} target="_blank" rel="noreferrer">Baixar PDF validado</a></p> : <>
        <label>Aprovação escrita (opcional)<input value={aprovacao} onChange={(e) => { setAprovacao(e.target.value); if (/^(aprovar|validar|confirmar)$/i.test(e.target.value.trim())) setConfirmar(true); }} placeholder="Digite aprovar ou use o botão" /></label>
        <button type="button" disabled={ouvindo || !resumo.terminal || pendencias.length > 0 || salvando || conflito || local.current.fila.length > 0 || Object.keys(local.current.campos).length > 0 || !!local.current.texto.trim()} onClick={() => setConfirmar(true)}>Aprovar revisão profissional</button>
        {confirmar && <aside role="dialog" aria-label="Confirmação final profissional"><p>Confirmo que revisei o conteúdo e assumo a autoria desta versão. Criar relatório validado e atualizar longitudinal?</p><button type="button" onClick={() => void validar()} disabled={ouvindo || salvando || pendencias.length > 0}>Confirmar e criar versão validada</button><button type="button" onClick={() => setConfirmar(false)}>Continuar revisão</button></aside>}
      </>}
    </>}
  </section>;
}
