"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { humanexusApi } from "@/lib/humanexus-api";

type Question = {
  identificador: string;
  codigo: string;
  versao: string;
  texto: string;
  orientacao?: string;
  tipo_de_resposta: string;
  opcoes_json: string[];
  obrigatoria: boolean;
  blocos_json: string[];
  regra_condicional_json?: Record<string, unknown> | null;
  secao?: string;
};
type Structure = {
  anamnese: string;
  nicho: string;
  funcao?: string;
  ramo_confirmado: boolean;
  revisao_do_ramo_pendente: boolean;
  versao: string;
  finalidade: string;
  privacidade: { codigo: string; texto: string; vigente_desde: string };
  progresso?: { estado: string; ultima_secao?: string; percentual_concluido: number };
  perguntas: Question[];
  navegacao: { bloco: string; perguntas: string[] }[];
  selecao_de_ramo: {
    nichos: string[];
    orientacao: string;
    funcoes_e_subnichos: {
      nicho: string;
      funcoes_observadas_historicamente: string[];
      catalogo_completo: string;
    }[];
  };
  respostas?: { question_id: string; answer: unknown; control_version: number }[];
};
type Pending = { pergunta: string; versao: string; resposta: string; controle: number };
type SaveState = "SALVO" | "SALVANDO" | "SEM_REDE" | "SINCRONIZACAO_PENDENTE" | "CONFLITO";

async function material(token: string) {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token)));
}

async function queueName(token: string) {
  const bytes = await material(token);
  return `hx-anamnese-fila-${Array.from(bytes.slice(0, 8)).map((item) => item.toString(16).padStart(2, "0")).join("")}`;
}

async function queueKey(token: string) {
  return crypto.subtle.importKey("raw", await material(token), "AES-GCM", false, ["encrypt", "decrypt"]);
}

async function readQueue(token: string): Promise<Pending[]> {
  try {
    const stored = localStorage.getItem(await queueName(token));
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    const clear = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: new Uint8Array(parsed.iv) },
      await queueKey(token),
      new Uint8Array(parsed.data)
    );
    return JSON.parse(new TextDecoder().decode(clear));
  } catch {
    return [];
  }
}

async function writeQueue(token: string, pending: Pending[]) {
  const name = await queueName(token);
  if (!pending.length) {
    localStorage.removeItem(name);
    return;
  }
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    await queueKey(token),
    new TextEncoder().encode(JSON.stringify(pending))
  );
  localStorage.setItem(
    name,
    JSON.stringify({ iv: Array.from(iv), data: Array.from(new Uint8Array(encrypted)) })
  );
}

function valueText(value: unknown) {
  if (typeof value === "string") return value;
  if (value == null) return "";
  return typeof value === "object" && "valor" in value
    ? String((value as { valor: unknown }).valor ?? "")
    : JSON.stringify(value);
}

export function AnamneseParticipante({ token }: { token: string }) {
  const [structure, setStructure] = useState<Structure | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [versions, setVersions] = useState<Record<string, number>>({});
  const [section, setSection] = useState(0);
  const [consent, setConsent] = useState(false);
  const [started, setStarted] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("SALVO");
  const [message, setMessage] = useState("");
  const [branchMessage, setBranchMessage] = useState("");
  const [completed, setCompleted] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [selectedNiche, setSelectedNiche] = useState("");
  const [selectedFunction, setSelectedFunction] = useState("");
  const syncPromise = useRef<Promise<boolean> | null>(null);
  const queueLock = useRef<Promise<void>>(Promise.resolve());

  const withQueueLock = useCallback(<T,>(task: () => Promise<T>): Promise<T> => {
    const operation = queueLock.current.then(task, task);
    queueLock.current = operation.then(() => undefined, () => undefined);
    return operation;
  }, []);

  const load = useCallback(async () => {
    try {
      const data = await humanexusApi<Structure>(
        `/api/humanexus/convites/${encodeURIComponent(token)}`
      );
      setStructure(data);
      setSelectedNiche(data.nicho);
      setSelectedFunction(data.funcao ?? "");
      setStarted(data.progresso?.estado === "EM_PREENCHIMENTO");
      setCompleted(data.progresso?.estado === "CONCLUIDA_PELO_PARTICIPANTE");
      const restored: Record<string, string> = {};
      const controls: Record<string, number> = {};
      for (const item of data.respostas ?? []) {
        restored[item.question_id] = valueText(item.answer);
        controls[item.question_id] = item.control_version;
      }
      setAnswers(restored);
      setVersions(controls);
      const remembered = data.navegacao.findIndex((item) => item.bloco === data.progresso?.ultima_secao);
      if (remembered >= 0) setSection(remembered);
      return data;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Convite inválido, expirado ou revogado.");
      return null;
    }
  }, [token]);

  useEffect(() => { void load(); }, [load]);

  const syncPending = useCallback(async (): Promise<boolean> => {
    if (!navigator.onLine) return false;
    if (syncPromise.current) return syncPromise.current;

    const operation = withQueueLock(async (): Promise<boolean> => {
      const pending = await readQueue(token);
      if (!pending.length) {
        setSaveState("SALVO");
        return true;
      }
      setSaveState("SALVANDO");
      try {
        const remaining = [...pending];
        for (const item of pending) {
          const saved = await humanexusApi<{ versao_de_controle: number }>(
            `/api/humanexus/convites/${encodeURIComponent(token)}/respostas/${item.pergunta}`,
            {
              method: "PUT",
              body: JSON.stringify({
                versao_da_pergunta: item.versao,
                resposta: item.resposta,
                versao_de_controle: item.controle
              })
            }
          );
          setVersions((current) => ({ ...current, [item.pergunta]: saved.versao_de_controle }));
          remaining.shift();
          await writeQueue(token, remaining);
        }
        setSaveState("SALVO");
        return true;
      } catch {
        setSaveState("CONFLITO");
        return false;
      }
    });

    syncPromise.current = operation;
    try {
      return await operation;
    } finally {
      if (syncPromise.current === operation) syncPromise.current = null;
    }
  }, [token, withQueueLock]);

  useEffect(() => {
    const online = () => { setSaveState("SINCRONIZACAO_PENDENTE"); void syncPending(); };
    const offline = () => setSaveState("SEM_REDE");
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    const timer = window.setInterval(() => void syncPending(), 15000);
    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
      window.clearInterval(timer);
    };
  }, [syncPending]);

  const sections = structure?.navegacao ?? [];
  const currentCodes = new Set(sections[section]?.perguntas ?? []);
  const questions = structure?.perguntas.filter((question) => currentCodes.has(question.codigo)) ?? [];
  const answered = (structure?.perguntas ?? []).filter(
    (question) => answers[question.identificador]?.trim()
  ).length;
  const percentage = structure?.perguntas.length
    ? Math.round((answered / structure.perguntas.length) * 100)
    : 0;
  const requiredPending = useMemo(
    () => (structure?.perguntas ?? []).filter((question) => question.obrigatoria && !answers[question.identificador]?.trim()),
    [answers, structure]
  );

  const stageAnswer = useCallback(async (question: Question, value: string) => {
    await withQueueLock(async () => {
      const pending = (await readQueue(token)).filter((item) => item.pergunta !== question.identificador);
      pending.push({
        pergunta: question.identificador,
        versao: question.versao,
        resposta: value,
        controle: versions[question.identificador] ?? 0
      });
      await writeQueue(token, pending);
    });
    setSaveState(navigator.onLine ? "SINCRONIZACAO_PENDENTE" : "SEM_REDE");
  }, [token, versions, withQueueLock]);

  async function selectBranch() {
    if (!selectedNiche || !selectedFunction.trim()) {
      setBranchMessage("Selecione o nicho e informe sua função para continuar.");
      return;
    }
    try {
      const synchronized = await syncPending();
      if (!synchronized && (await readQueue(token)).length) return;
      await humanexusApi(`/api/humanexus/convites/${encodeURIComponent(token)}`, {
        method: "POST",
        body: JSON.stringify({
          acao: "SELECIONAR_RAMO",
          nicho: selectedNiche,
          funcao: selectedFunction
        })
      });
      setBranchMessage("");
      const updated = await load();
      const firstBranchSection = updated?.navegacao.findIndex(
        (item) => !["PERGUNTAS_GERAIS", "SELECAO_DE_RAMO"].includes(item.bloco)
      ) ?? -1;
      if (firstBranchSection >= 0) setSection(firstBranchSection);
    } catch (error) {
      setBranchMessage(error instanceof Error ? error.message : "Não foi possível atualizar o ramo.");
    }
  }

  async function confirmBranchReview() {
    await humanexusApi(`/api/humanexus/convites/${encodeURIComponent(token)}`, {
      method: "POST",
      body: JSON.stringify({ acao: "CONFIRMAR_REVISAO_DO_RAMO" })
    });
    await load();
  }

  async function start() {
    if (!consent) return;
    try {
      await humanexusApi(`/api/humanexus/convites/${encodeURIComponent(token)}`, {
        method: "POST",
        body: JSON.stringify({ acao: "INICIAR" })
      });
      setStarted(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível iniciar.");
    }
  }

  async function move(next: number) {
    const synchronized = await syncPending();
    if (!synchronized && (await readQueue(token)).length) return;
    setSection(Math.max(0, Math.min(sections.length - 1, next)));
  }

  async function conclude() {
    const synchronized = await syncPending();
    if (!synchronized || requiredPending.length || structure?.revisao_do_ramo_pendente) return;
    try {
      await humanexusApi(`/api/humanexus/convites/${encodeURIComponent(token)}`, {
        method: "POST",
        body: JSON.stringify({ acao: "CONCLUIR" })
      });
      setCompleted(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível concluir.");
    }
  }

  function goToQuestion(question: Question) {
    const destination = sections.findIndex((item) => item.perguntas.includes(question.codigo));
    if (destination >= 0) setSection(destination);
    setReviewing(false);
  }

  if (message) return <StateCard title="Acesso indisponível" text={message} />;
  if (!structure) return <StateCard title="Preparando sua Anamnese" text="Validando o convite seguro…" />;
  if (completed) return <StateCard title="Anamnese concluída" text="A versão enviada foi congelada com integridade e está disponível para revisão profissional." />;
  if (!started) {
    return (
      <section className="hx-anamnese-participante">
        <div className="hx-anamnese-consent">
          <p>ANAMNESE REGULATÓRIA HUMANEXUS</p>
          <h1>Antes de começar</h1>
          <span>{structure.versao} · finalidade {structure.finalidade.replaceAll("_", " ")}</span>
          <article><strong>Aviso de privacidade</strong><p>{structure.privacidade.texto}</p><small>{structure.privacidade.codigo}</small></article>
          <label>
            <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
            <span>Li e compreendi a finalidade, o aviso de privacidade e as condições de preenchimento.</span>
          </label>
          <button disabled={!consent} onClick={start}>Aceitar e iniciar</button>
        </div>
      </section>
    );
  }

  return (
    <section className="hx-anamnese-participante">
      <header className="hx-anamnese-progress">
        <div><p>{structure.versao}</p><strong>{percentage}% preenchido</strong></div>
        <span data-state={saveState}>{saveState.replaceAll("_", " ")}</span>
        <div aria-label={`${percentage}% preenchido`}><i style={{ width: `${percentage}%` }} /></div>
      </header>
      <main className="hx-anamnese-form">
        {reviewing ? (
          <>
            <p className="hx-anamnese-kicker">REVISÃO ANTES DA CONCLUSÃO</p>
            <h1>Confira suas respostas</h1>
            <div className="hx-anamnese-validation-summary"><article><small>Total aplicável</small><strong>{structure.perguntas.length}</strong></article><article><small>Respondidas</small><strong>{structure.perguntas.length - requiredPending.length}</strong></article><article><small>Pendências</small><strong>{requiredPending.length}</strong></article></div>
            {requiredPending.length ? <p className="hx-anamnese-alert">{requiredPending.length} pergunta(s) obrigatória(s) ainda pendente(s).</p> : null}
            {requiredPending.length ? <div className="hx-anamnese-pending">{requiredPending.map((question) => <button type="button" key={question.identificador} onClick={() => goToQuestion(question)}><small>{question.codigo} · {(question.secao || question.blocos_json[0]).replaceAll("_", " ")}</small><span>{question.texto}</span><strong>Ir para a pergunta →</strong></button>)}</div> : null}
            {structure.revisao_do_ramo_pendente ? <p className="hx-anamnese-alert">O ramo foi alterado. Respostas anteriores foram preservadas, mas as incompatíveis não entram na análise. Confirme a revisão antes de concluir.</p> : null}
            <div className="hx-anamnese-review">
              {structure.perguntas.filter((question) => answers[question.identificador]?.trim()).map((question) => (
                <article key={question.identificador}><small>{question.codigo}</small><strong>{question.texto}</strong><p>{answers[question.identificador]}</p></article>
              ))}
            </div>
            <div className="hx-anamnese-actions">
              <button type="button" onClick={() => setReviewing(false)}>Voltar ao preenchimento</button>
              {structure.revisao_do_ramo_pendente ? <button type="button" onClick={() => void confirmBranchReview()}>Confirmar revisão do ramo</button> : null}
              <button type="button" disabled={requiredPending.length > 0 || saveState !== "SALVO" || structure.revisao_do_ramo_pendente} onClick={conclude}>Confirmar e concluir</button>
            </div>
          </>
        ) : (
          <>
            <p className="hx-anamnese-kicker">SEÇÃO {section + 1} DE {sections.length}</p>
            <h1>{(sections[section]?.bloco ?? "").replaceAll("_", " ")}</h1>
            {sections[section]?.bloco === "SELECAO_DE_RAMO" ? (
              <div className="hx-anamnese-branch">
                <p>{structure.selecao_de_ramo.orientacao}</p>
                <label><span>Nicho profissional</span><select value={selectedNiche} onChange={(event) => setSelectedNiche(event.target.value)}>{structure.selecao_de_ramo.nichos.map((niche) => <option key={niche} value={niche}>{niche.replaceAll("_", " ")}</option>)}</select></label>
                <label><span>Função ou subnicho</span><input value={selectedFunction} onChange={(event) => setSelectedFunction(event.target.value)} maxLength={180} /></label>
                <small>As listas completas de funções ainda aguardam homologação autoral; por isso a função é registrada com o texto informado, sem opções inventadas.</small>
                {branchMessage ? <p className="hx-anamnese-alert">{branchMessage}</p> : null}
                <button type="button" onClick={() => void selectBranch()}>{structure.ramo_confirmado ? "Atualizar ramo preservando respostas" : "Confirmar ramo"}</button>
              </div>
            ) : <div className="hx-anamnese-questions">
              {questions.map((question) => (
                <QuestionField
                  key={question.identificador}
                  question={question}
                  value={answers[question.identificador] ?? ""}
                  onChange={(value) => setAnswers((current) => ({ ...current, [question.identificador]: value }))}
                  onBlur={(value) => { void stageAnswer(question, value).then(() => syncPending()); }}
                />
              ))}
            </div>}
            <div className="hx-anamnese-actions">
              <button disabled={section === 0} onClick={() => void move(section - 1)}>Anterior</button>
              {section < sections.length - 1
                ? <button onClick={() => void move(section + 1)}>Salvar e continuar</button>
                : <button onClick={() => { void syncPending(); setReviewing(true); }}>Revisar respostas</button>}
            </div>
          </>
        )}
      </main>
    </section>
  );
}

function QuestionField({
  question, value, onChange, onBlur
}: {
  question: Question; value: string; onChange: (value: string) => void; onBlur: (value: string) => void;
}) {
  const label = <><span>{question.texto}{question.obrigatoria ? " *" : ""}</span>{question.orientacao ? <small>{question.orientacao}</small> : null}</>;
  const options = Array.isArray(question.opcoes_json) ? question.opcoes_json : [];
  if (question.tipo_de_resposta === "TEXTO_LONGO") {
    return <label>{label}<textarea value={value} onChange={(event) => onChange(event.target.value)} onBlur={() => onBlur(value)} rows={5} maxLength={12000} /></label>;
  }
  if (options.length && question.tipo_de_resposta.includes("ESCOLHA_UNICA")) {
    return <fieldset><legend>{label}</legend>{options.map((option) => <label className="hx-anamnese-option" key={option}><input type="radio" name={question.identificador} checked={value === option} onChange={() => { onChange(option); onBlur(option); }} /><span>{option}</span></label>)}</fieldset>;
  }
  if (options.length && question.tipo_de_resposta === "MULTIPLA_ESCOLHA") {
    const selected = value ? value.split("\n") : [];
    return <fieldset><legend>{label}</legend>{options.map((option) => <label className="hx-anamnese-option" key={option}><input type="checkbox" checked={selected.includes(option)} onChange={(event) => { const next = event.target.checked ? [...selected, option] : selected.filter((item) => item !== option); const joined = next.join("\n"); onChange(joined); onBlur(joined); }} /><span>{option}</span></label>)}</fieldset>;
  }
  const type = question.tipo_de_resposta === "NUMERO" ? "number" : question.tipo_de_resposta === "DATA" ? "date" : question.tipo_de_resposta === "HORARIO" ? "time" : "text";
  return <label>{label}<input type={type} value={value} onChange={(event) => onChange(event.target.value)} onBlur={() => onBlur(value)} maxLength={type === "text" ? 12000 : undefined} /></label>;
}

function StateCard({ title, text }: { title: string; text: string }) {
  return <section className="hx-anamnese-participante"><div className="hx-anamnese-state"><h1>{title}</h1><p>{text}</p></div></section>;
}
