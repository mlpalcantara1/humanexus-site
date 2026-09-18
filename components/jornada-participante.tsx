"use client";

import { useEffect, useRef, useState } from "react";
import { humanexusApi } from "@/lib/humanexus-api";
import { portuguesVisivel } from "@/lib/portugues-visivel";
import styles from "./jornada-participante.module.css";

type Fonte = { identificador: string; pergunta: string; texto: string; destinos_documentados: string[]; fonte: string; data: string; versao: number; autoria: string };
type Decisao = { acao: "CONFIRMAR" | "EDITAR" | "IGNORAR"; texto?: string };
type Jornada = {
  identificador_da_organizacao: string; identificador_do_participante: string;
  profissional: string; consultado_em: string; proxima_acao: { titulo: string; href: string };
  etapas: { codigo: string; titulo: string; estado: string; quantidade: number; fonte: string | null; data: string | null; href: string }[];
  autorizacoes: { fonte: string; consentimentos_essenciais_validos: boolean; modalidades_opcionais_autorizadas: string[]; modalidades_recusadas: string[] };
  fontes_da_anamnese: { assinatura: string; anamnese: { identificador: string; numero_da_versao: number } | null; sugestoes: Fonte[] };
  preparacao: { sessao: string; nome: string; estado: string; modalidade: string | null; finalidade: string | null; ctr: string | null; thx: string | null; fase: string | null; acao: string | null; motivo: string | null; href: string; aviso: string;
    fontes: { identificador: string; tipo: string | null; estado: string | null; atualizado_em: string | null }[];
    hidratacao: { entradas: Record<string, { estado: string; motivo: string; fonte: string; referencia: string | null }>; gate_de_inicio: { bloqueia_inicio: boolean; motivos?: string[] } } } | null;
  formulacoes: { identificador: string; estado: string; criado_em: string; numero_da_revisao: number; limites_de_interpretacao: string[]; dados: { demanda_operacional?: string; proximo_passo?: string; limites?: string[]; contexto?: { fontes_revisadas?: { identificador: string; texto_revisado: string; decisao: string }[] } }; interpretacoes: string[]; hipoteses: string[]; decisoes: string[]; assinatura: string; profissional: string }[];
};
function rotulo(valor?: string | null) { return valor ? portuguesVisivel(valor.replaceAll("_", " ")) : "Não informado"; }
function data(valor?: string | null) {
  if (!valor) return "Data não informada";
  const d = new Date(valor);
  return Number.isNaN(d.getTime()) ? "Data não informada" : new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(d);
}

export function JornadaParticipante({ organizacao, participante, sessao = "", somentePreparacao = false }: {
  organizacao: string; participante: string; sessao?: string; somentePreparacao?: boolean;
}) {
  const [jornada, setJornada] = useState<Jornada | null>(null);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [fontesAlteradas, setFontesAlteradas] = useState(false);
  const pronto = useRef(false);
  const storageKey = useRef("");
  const [versao, atualizar] = useState(0);
  const [decisoes, setDecisoes] = useState<Record<string, Decisao>>({});
  const [demanda, setDemanda] = useState("");
  const [autoral, setAutoral] = useState({ interpretacao: "", hipotese: "", decisao_autoral: "" });
  const [justificativa, setJustificativa] = useState<Record<string, string>>({});
  const [confirmacao, setConfirmacao] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const comando = useRef<{ corpo: string; chave: string } | null>(null);
  const endereco = `/api/humanexus/participantes/${encodeURIComponent(participante)}/jornada-operacional?organizacao=${encodeURIComponent(organizacao)}${sessao ? `&sessao=${encodeURIComponent(sessao)}` : ""}`;
  useEffect(() => {
    const controller = new AbortController();
    setJornada(null); setErro(""); setConfirmacao(false); pronto.current = false;
    humanexusApi<Jornada>(endereco, { signal: controller.signal }).then((d) => {
      if (controller.signal.aborted) return;
      if (d.identificador_da_organizacao !== organizacao || d.identificador_do_participante !== participante) throw new Error("Resposta fora do contexto selecionado.");
      storageKey.current = `humanexus:formulacao:v1:${[organizacao, participante, d.profissional].map(encodeURIComponent).join(":")}`;
      try {
        const salvo = sessionStorage.getItem(storageKey.current);
        if (salvo) {
          const r = JSON.parse(salvo);
          if (!r || typeof r.demanda !== "string" || typeof r.decisoes !== "object" || !r.autoral) throw new Error("Formato de rascunho incompatível.");
          setDemanda(r.demanda); setDecisoes(r.decisoes); setAutoral(r.autoral); comando.current = r.comando;
          setFontesAlteradas(r.assinatura !== d.fontes_da_anamnese.assinatura);
        } else { setDecisoes({}); setFontesAlteradas(false); }
      } catch { setErro("O rascunho local não pôde ser recuperado. Preserve seu texto antes de continuar."); }
      pronto.current = true; setJornada(d);
    }).catch((e) => { if (!controller.signal.aborted) setErro(e.message); });
    return () => controller.abort();
  }, [endereco, organizacao, participante, versao]);
  useEffect(() => {
    if (!pronto.current || !jornada || !storageKey.current || fontesAlteradas) return;
    try { sessionStorage.setItem(storageKey.current, JSON.stringify({ demanda, decisoes, autoral, comando: comando.current, assinatura: jornada.fontes_da_anamnese.assinatura })); }
    catch { setErro("O navegador não conseguiu preservar o rascunho. Salve no Núcleo antes de fechar esta aba."); }
  }, [demanda, decisoes, autoral, jornada, fontesAlteradas]);
  async function salvar() {
    if (!jornada || salvando || fontesAlteradas) return;
    setSalvando(true); setErro(""); setMensagem("");
    try {
      const payload = { assinatura_das_fontes: jornada.fontes_da_anamnese.assinatura,
        confirmacao_profissional: confirmacao, demanda_operacional: demanda, ...autoral,
        decisoes: Object.entries(decisoes).map(([identificador, d]) => ({ identificador, ...d })) };
      const corpo = JSON.stringify(payload);
      if (!comando.current || comando.current.corpo !== corpo) comando.current = { corpo, chave: crypto.randomUUID() };
      // Preserva a chave antes do envio para que uma resposta perdida possa
      // ser reconciliada pelo mesmo comando após recarregar a aba.
      sessionStorage.setItem(storageKey.current, JSON.stringify({ demanda, decisoes, autoral, comando: comando.current, assinatura: jornada.fontes_da_anamnese.assinatura }));
      const csrf = document.cookie.split("; ").find((c) => c.startsWith("humanexus_csrf="))?.split("=").slice(1).join("=") ?? "";
      await humanexusApi(endereco, { method: "POST", headers: { "x-humanexus-csrf": decodeURIComponent(csrf) }, body: JSON.stringify({ ...payload, chave: comando.current.chave }) });
      sessionStorage.removeItem(storageKey.current); pronto.current = false;
      setMensagem("Rascunho profissional salvo com fontes e decisões. A homologação permanece uma decisão separada.");
      setDecisoes({}); comando.current = null; setDemanda(""); setAutoral({ interpretacao: "", hipotese: "", decisao_autoral: "" }); atualizar((v) => v + 1);
    } catch (e) { setErro(e instanceof Error ? e.message : "Não foi possível salvar. Suas escolhas permanecem nesta tela para reenvio."); }
    finally { setSalvando(false); }
  }
  async function homologar(f: Jornada["formulacoes"][number]) {
    if (salvando) return;
    setSalvando(true); setErro("");
    try {
      const csrf = document.cookie.split("; ").find((c) => c.startsWith("humanexus_csrf="))?.split("=").slice(1).join("=") ?? "";
      await humanexusApi(endereco, { method: "POST", headers: { "x-humanexus-csrf": decodeURIComponent(csrf) }, body: JSON.stringify({
        acao: "HOMOLOGAR", formulacao: f.identificador, assinatura_da_formulacao: f.assinatura,
        confirmacao_profissional: true, justificativa: justificativa[f.identificador]
      }) });
      setMensagem("Formulação homologada por decisão profissional explícita."); atualizar((v) => v + 1);
    } catch (e) { setErro(e instanceof Error ? e.message : "Não foi possível homologar."); }
    finally { setSalvando(false); }
  }
  const preparo = jornada?.preparacao;
  return <section className={styles.jornada} aria-label="Percurso operacional do participante">
    <header><div><small>PERCURSO DO PARTICIPANTE</small><h2>{somentePreparacao ? "Preparação integrada" : "Próxima ação e fontes reunidas"}</h2></div>
      <button type="button" disabled={salvando} onClick={() => atualizar((v) => v + 1)}>Atualizar percurso</button></header>
    {erro ? <p role="alert">{erro}</p> : null}
    {mensagem ? <p role="status">{mensagem}</p> : null}
    {!jornada && !erro ? <p role="status">Consultando registros autorizados…</p> : null}
    {jornada ? <>
      <a className={styles.proxima} href={jornada.proxima_acao.href}>{jornada.proxima_acao.titulo} →</a>
      <small>Consulta em {data(jornada.consultado_em)}. Os comandos revalidam o estado ao executar.</small>
      <details><summary>Cadastro → autorização → anamnese → formulação → ARR → RRO → NRA → CTR/THX → sessão → relatório → longitudinal</summary>
        <div className={styles.etapas}>{jornada.etapas.map((e) => <a key={e.codigo} href={e.href}><strong>{e.titulo}</strong><span>{rotulo(e.estado)}</span>{e.fonte ? <small>{data(e.data)} · {e.quantidade} registro(s)</small> : null}</a>)}</div>
      </details>
      <details><summary>Autorizações vigentes para este contexto</summary>
        <p>Fonte: {rotulo(jornada.autorizacoes.fonte)}. Consentimentos essenciais: {jornada.autorizacoes.consentimentos_essenciais_validos ? "registrados como válidos" : "verificar histórico e requisitos da operação"}.</p>
        <p>Escolhas vigentes: {jornada.autorizacoes.modalidades_opcionais_autorizadas.map(rotulo).join(", ") || "Nenhuma nesta consulta"}.</p>
        <p>Recusadas ou revogadas: {jornada.autorizacoes.modalidades_recusadas.map(rotulo).join(", ") || "Nenhuma nesta consulta"}.</p>
        <p>Uma recusa opcional se aplica à modalidade correspondente. Consulte as cópias e versões na ficha do participante.</p>
      </details>
      {preparo ? <details open={somentePreparacao}><summary>Sessão selecionada · {rotulo(preparo.estado)}</summary>
        <dl className={styles.dados}>{[["Sessão", preparo.nome || preparo.sessao], ["Modalidade", preparo.modalidade], ["Finalidade", preparo.finalidade], ["CTR", preparo.ctr], ["THX", preparo.thx], ["Fase", preparo.fase], ["Comando operacional", preparo.acao]].map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{rotulo(v)}</dd></div>)}</dl>
        {preparo.motivo ? <p>{rotulo(preparo.motivo)}</p> : null}
        <p>{preparo.aviso}</p>
        <div className={styles.etapas}>{Object.entries(preparo.hidratacao.entradas).map(([k, v]) => <article key={k}><strong>{rotulo(k)}</strong><span>{rotulo(v.estado)}</span><p>{v.motivo}</p>{v.referencia ? <small>Referência: {v.referencia}</small> : null}</article>)}</div>
        <p>{preparo.hidratacao.gate_de_inicio.bloqueia_inicio ? "Há pendências nas fontes de preparação; confira os itens acima." : "Fontes de preparação conferidas. O comando oficial verifica os demais requisitos de início."}</p>
        <h3>Sensores e fontes cadastrados nesta sessão</h3>
        {preparo.fontes.length ? <ul>{preparo.fontes.map((f) => <li key={f.identificador}>{rotulo(f.tipo)} · {rotulo(f.estado)} · {data(f.atualizado_em)}</li>)}</ul> : <p>Nenhuma fonte registrada. Disponibilidade física e telemetria precisam de recepção real.</p>}
        <a href={preparo.href}>Abrir sessão e verificar tarefas, sensores e comandos →</a>
      </details> : <p>Sem sessão selecionada. O planejamento reutilizará o participante deste contexto.</p>}
      {!somentePreparacao ? <details id="formulacao-assistida"><summary>Formulação assistida pela anamnese · {jornada.fontes_da_anamnese.sugestoes.length} fontes disponíveis</summary>
        {fontesAlteradas ? <aside role="alert"><p>A anamnese mudou desde o rascunho recuperado. O texto autoral foi mantido; as fontes precisam de nova revisão.</p><button type="button" onClick={() => { setDecisoes({}); setConfirmacao(false); setFontesAlteradas(false); comando.current = null; }}>Revisar seleção com as fontes atuais</button></aside> : null}
        <p>Vínculos definidos na biblioteca vigente. Confirme, edite ou ignore cada fonte; hipóteses, interpretação e homologação pertencem ao profissional.</p>
        {jornada.fontes_da_anamnese.sugestoes.map((f) => <article className={styles.fonte} key={f.identificador}>
          <strong>{f.pergunta}</strong><p>{f.texto}</p>
          <small>{f.destinos_documentados.map(rotulo).join(" · ")} · {data(f.data)} · versão {f.versao} · {rotulo(f.autoria)}</small>
          <label>Revisão da fonte<select value={decisoes[f.identificador]?.acao || ""} onChange={(e) => {
            setConfirmacao(false); const acao = e.target.value as Decisao["acao"];
            setDecisoes((d) => { const novo = { ...d }; if (acao) novo[f.identificador] = { acao, ...(acao === "EDITAR" ? { texto: f.texto } : {}) }; else delete novo[f.identificador]; return novo; });
          }}><option value="">Aguardando revisão</option><option value="CONFIRMAR">Confirmar texto</option><option value="EDITAR">Editar para a formulação</option><option value="IGNORAR">Ignorar nesta formulação</option></select></label>
          {decisoes[f.identificador]?.acao === "EDITAR" ? <textarea aria-label={`Texto revisado: ${f.pergunta}`} value={decisoes[f.identificador].texto || ""} onChange={(e) => { setConfirmacao(false); setDecisoes((d) => ({ ...d, [f.identificador]: { acao: "EDITAR", texto: e.target.value } })); }} /> : null}
        </article>)}
        {jornada.fontes_da_anamnese.sugestoes.length ? <>
          <label>Demanda operacional autoral<textarea value={demanda} onChange={(e) => { setConfirmacao(false); setDemanda(e.target.value); }} /></label>
          {([['interpretacao', 'Interpretação autoral'], ['hipotese', 'Hipótese profissional'], ['decisao_autoral', 'Decisão profissional']] as const).map(([chave, titulo]) => <label key={chave}>{titulo} (opcional)<textarea value={autoral[chave]} onChange={(e) => { setConfirmacao(false); setAutoral((a) => ({ ...a, [chave]: e.target.value })); }} /></label>)}
          <label><input type="checkbox" checked={confirmacao} onChange={(e) => setConfirmacao(e.target.checked)} /> Revisei as fontes selecionadas para este rascunho.</label>
          <button type="button" disabled={salvando || fontesAlteradas || !confirmacao || !demanda.trim() || !Object.values(decisoes).some((d) => d.acao !== "IGNORAR")} onClick={() => void salvar()}>{salvando ? "Salvando…" : "Salvar rascunho com fontes revisadas"}</button>
        </> : <p>É necessária uma anamnese concluída com respostas aplicáveis. Nenhuma resposta será inventada.</p>}
        {jornada.formulacoes.map((f) => <article key={f.identificador} className={styles.fonte}><h3>{rotulo(f.estado)} · revisão {f.numero_da_revisao}</h3><p>{f.dados.demanda_operacional}</p>
          {f.dados.contexto?.fontes_revisadas?.filter((r) => r.decisao !== "IGNORAR").map((r) => <p key={r.identificador}>{r.texto_revisado}</p>)}
          <p>Interpretação: {f.interpretacoes.join("; ") || "Não registrada"}</p><p>Hipóteses: {f.hipoteses.join("; ") || "Não registradas"}</p><p>Decisões: {f.decisoes.join("; ") || "Não registradas"}</p>
          <p>Limites: {[...(f.dados.limites || []), ...f.limites_de_interpretacao].map(rotulo).join("; ")}</p><p>Próximo passo: {f.dados.proximo_passo || "Não registrado"}</p><small>{data(f.criado_em)} · autoria {f.profissional}</small>
          {f.estado === "RASCUNHO_ESTRUTURADO" && f.dados.contexto?.fontes_revisadas ? <details><summary>Revisar e homologar esta formulação</summary><label>Justificativa profissional<textarea value={justificativa[f.identificador] || ""} onChange={(e) => setJustificativa((j) => ({ ...j, [f.identificador]: e.target.value }))} /></label><p>Ao homologar, confirmo a revisão dos dados, interpretações e limites exibidos e assumo a autoria desta decisão.</p><button type="button" disabled={salvando || !justificativa[f.identificador]?.trim()} onClick={() => void homologar(f)}>Confirmar revisão e homologar formulação</button></details> : null}
        </article>)}
      </details> : null}
    </> : null}
  </section>;
}
