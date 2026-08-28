"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HumanexusApiError, humanexusApi } from "@/lib/humanexus-api";

type ConfirmacaoPersistencia = {
  request_received: boolean;
  validation: "PASS" | "PENDING";
  server_commit: boolean;
  audit_concluido: number;
  read_after_write: "CONCLUIDO_100_PERCENT" | "PENDING";
  estado: string;
  percentual: number;
  identificador_de_correlacao?: string | null;
  repeticao_idempotente?: boolean;
  duplicacoes_persistidas: number;
};

type Question = {
  identificador: string;
  codigo: string;
  versao: string;
  texto: string;
  orientacao?: string;
  tipo_de_resposta: string;
  opcoes_json: string[];
  alternativas?: {
    codigo: string;
    texto: string;
    ordem: number;
    outro?: boolean;
  }[];
  limite_minimo_de_selecoes?: number | null;
  limite_maximo_de_selecoes?: number | null;
  valor_minimo?: number | null;
  valor_maximo?: number | null;
  rotulo_minimo?: string | null;
  rotulo_maximo?: string | null;
  permite_outro?: boolean;
  obrigatoria: boolean;
  blocos_json: string[];
  regra_condicional_json?: Record<string, unknown> | null;
  secao?: string;
  secao_rotulo?: string;
};
type Structure = {
  anamnese: string;
  nicho: string;
  nicho_rotulo?: string;
  funcao?: string;
  ramo_confirmado: boolean;
  revisao_do_ramo_pendente: boolean;
  versao: string;
  finalidade: string;
  privacidade: { codigo: string; texto: string; vigente_desde: string };
  progresso?: { estado: string; ultima_secao?: string; percentual_concluido: number };
  validacao: {
    total_aplicavel: number;
    total_respondido: number;
    percentual: number;
    pode_concluir: boolean;
    fonte: string;
    pendencias: {
      identificador: string;
      codigo: string;
      secao: string;
      secao_rotulo?: string;
      texto: string;
      motivo: string;
    }[];
  };
  perguntas: Question[];
  navegacao: { bloco: string; rotulo?: string; perguntas: string[] }[];
  selecao_de_ramo: {
    nichos: string[];
    orientacao: string;
    funcoes_e_subnichos: {
      nicho: string;
      funcoes_oficiais?: string[];
      catalogo_completo: string;
    }[];
    alternativas_oficiais: {
      codigo_da_alternativa: string;
      texto: string;
      nicho: string;
      funcao?: string | null;
      exige_nicho_customizado: boolean;
      exige_funcao_customizada: boolean;
    }[];
    nicho_customizado?: string | null;
    funcao_customizada?: string | null;
  };
  respostas?: { question_id: string; answer: unknown; control_version: number }[];
  confirmacao_persistencia?: ConfirmacaoPersistencia;
};
type Answer =
  | string
  | number
  | boolean
  | string[]
  | { valor: string; outro?: string }
  | { valores: string[]; outro?: string }
  | null;
type Pending = { pergunta: string; versao: string; resposta: Answer; controle: number };
type SaveState = "SALVO" | "SALVANDO" | "SEM_REDE" | "SINCRONIZACAO_PENDENTE" | "CONFLITO";

async function material(token: string) {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token)));
}

async function queueName(token: string) {
  const bytes = await material(token);
  return `hx-anamnese-fila-${Array.from(bytes.slice(0, 8)).map((item) => item.toString(16).padStart(2, "0")).join("")}`;
}

async function conclusionKey(token: string) {
  const bytes = await material(token);
  return `anamnese:${Array.from(bytes).map((item) => item.toString(16).padStart(2, "0")).join("")}`;
}

function correlationId() {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const value = Array.from(bytes).map((item) => item.toString(16).padStart(2, "0")).join("");
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`;
}

function persistenceConfirmed(value?: ConfirmacaoPersistencia) {
  return Boolean(
    value?.request_received
    && value.validation === "PASS"
    && value.server_commit
    && value.audit_concluido === 1
    && value.read_after_write === "CONCLUIDO_100_PERCENT"
    && value.estado === "CONCLUIDA_PELO_PARTICIPANTE"
    && Number(value.percentual) === 100
    && value.duplicacoes_persistidas === 0
  );
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

function normalizeAnswer(value: unknown): Answer {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    value === null
  ) return value;
  if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
    return value;
  }
  if (typeof value === "object" && value) {
    const structuredValue = value as Record<string, unknown>;
    if (typeof structuredValue.valor === "string") {
      return {
        valor: structuredValue.valor,
        outro: typeof structuredValue.outro === "string"
          ? structuredValue.outro
          : undefined
      };
    }
    if (
      Array.isArray(structuredValue.valores) &&
      structuredValue.valores.every((item) => typeof item === "string")
    ) {
      return {
        valores: structuredValue.valores as string[],
        outro: typeof structuredValue.outro === "string"
          ? structuredValue.outro
          : undefined
      };
    }
  }
  return null;
}

function isAnswered(value: Answer | undefined) {
  if (value == null) return false;
  if (typeof value === "string") return Boolean(value.trim());
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object" && "valor" in value) {
    return Boolean(value.valor.trim()) && (!value.outro || Boolean(value.outro.trim()));
  }
  if (typeof value === "object" && "valores" in value) {
    return value.valores.length > 0 && (!value.outro || Boolean(value.outro.trim()));
  }
  return true;
}

function valueText(value: unknown) {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value == null) return "";
  if (Array.isArray(value)) return value.join(" · ");
  if (typeof value === "object" && "valor" in value) {
    const item = value as { valor: unknown; outro?: unknown };
    return [String(item.valor ?? ""), item.outro ? `Outro: ${item.outro}` : ""]
      .filter(Boolean).join(" · ");
  }
  if (typeof value === "object" && "valores" in value) {
    const item = value as { valores: unknown[]; outro?: unknown };
    return [
      item.valores.map(String).join(" · "),
      item.outro ? `Outro: ${item.outro}` : ""
    ].filter(Boolean).join(" · ");
  }
  return JSON.stringify(value);
}

function isQuestionAnswered(question: Question, value: Answer | undefined) {
  if (!isAnswered(value)) return false;
  const outros = new Set(
    (question.alternativas ?? [])
      .filter((item) => item.outro)
      .map((item) => item.texto)
  );
  if (typeof value === "object" && value && "valor" in value) {
    return !outros.has(value.valor) || Boolean(value.outro?.trim());
  }
  if (typeof value === "object" && value && "valores" in value) {
    return !value.valores.some((item) => outros.has(item)) || Boolean(value.outro?.trim());
  }
  if (typeof value === "string") return !outros.has(value);
  if (Array.isArray(value)) return !value.some((item) => outros.has(item));
  return true;
}

const TEMPO_LIMITE_DA_ANAMNESE_MS = 25_000;

async function requisitarAnamnese<T>(
  caminho: string,
  opcoes: RequestInit = {}
): Promise<T> {
  const controlador = new AbortController();
  let expirou = false;
  const propagarCancelamento = () => controlador.abort(opcoes.signal?.reason);
  if (opcoes.signal?.aborted) propagarCancelamento();
  else opcoes.signal?.addEventListener("abort", propagarCancelamento, { once: true });
  const limite = window.setTimeout(() => {
    expirou = true;
    controlador.abort();
  }, TEMPO_LIMITE_DA_ANAMNESE_MS);
  try {
    return await humanexusApi<T>(caminho, {
      ...opcoes,
      signal: controlador.signal
    });
  } catch (erro) {
    if (expirou) {
      throw new Error(
        "A confirmação demorou além do esperado. O conteúdo permanece nesta tela; verifique a ligação e tente novamente."
      );
    }
    throw erro;
  } finally {
    window.clearTimeout(limite);
    opcoes.signal?.removeEventListener("abort", propagarCancelamento);
  }
}

export function AnamneseParticipante({ token }: { token: string }) {
  const [structure, setStructure] = useState<Structure | null>(null);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const answersRef = useRef<Record<string, Answer>>({});
  const [section, setSection] = useState(0);
  const [consent, setConsent] = useState(false);
  const [started, setStarted] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("SALVO");
  const [message, setMessage] = useState("");
  const [syncMessage, setSyncMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [branchMessage, setBranchMessage] = useState("");
  const [completed, setCompleted] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [selectedNiche, setSelectedNiche] = useState("");
  const [selectedFunction, setSelectedFunction] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [customNiche, setCustomNiche] = useState("");
  const [customFunction, setCustomFunction] = useState("");
  const syncPromise = useRef<Promise<boolean> | null>(null);
  const conclusionLock = useRef(false);
  const queueLock = useRef<Promise<void>>(Promise.resolve());
  const versionsRef = useRef<Record<string, number>>({});

  const withQueueLock = useCallback(<T,>(task: () => Promise<T>): Promise<T> => {
    const operation = queueLock.current.then(task, task);
    queueLock.current = operation.then(() => undefined, () => undefined);
    return operation;
  }, []);

  const load = useCallback(async (preserveCurrentSection = false) => {
    try {
      const data = await requisitarAnamnese<Structure>(
        `/api/humanexus/convites/${encodeURIComponent(token)}`
      );
      setStructure(data);
      setSelectedNiche(data.nicho);
      setSelectedFunction(data.funcao ?? "");
      setStarted(data.progresso?.estado === "EM_PREENCHIMENTO");
      setCompleted(data.progresso?.estado === "CONCLUIDA_PELO_PARTICIPANTE");
      const restored: Record<string, Answer> = {};
      const controls: Record<string, number> = {};
      for (const item of data.respostas ?? []) {
        restored[item.question_id] = normalizeAnswer(item.answer);
        controls[item.question_id] = item.control_version;
      }
      const merged = preserveCurrentSection
        ? { ...restored, ...answersRef.current }
        : restored;
      answersRef.current = merged;
      setAnswers(merged);
      setCustomNiche(data.selecao_de_ramo.nicho_customizado ?? "");
      setCustomFunction(data.selecao_de_ramo.funcao_customizada ?? "");
      const activeBranch = data.selecao_de_ramo.alternativas_oficiais.find(
        (item) => item.nicho === data.nicho && (
          data.nicho === "OUTROS" || !data.funcao || item.funcao === data.funcao
        )
      );
      setSelectedBranch(activeBranch?.codigo_da_alternativa ?? "");
      versionsRef.current = controls;
      if (!preserveCurrentSection) {
        const remembered = data.navegacao.findIndex(
          (item) => item.bloco === data.progresso?.ultima_secao
        );
        if (remembered >= 0) setSection(remembered);
      }
      return data;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Convite inválido, expirado ou revogado.");
      return null;
    }
  }, [token]);

  useEffect(() => { void load(); }, [load]);

  const syncPending = useCallback(async (): Promise<boolean> => {
    if (!navigator.onLine) {
      setSaveState("SEM_REDE");
      setSyncMessage(
        "Sem ligação com a internet. As respostas permanecem neste dispositivo e serão enviadas quando a ligação voltar."
      );
      return false;
    }
    if (syncPromise.current) return syncPromise.current;

    const operation = withQueueLock(async (): Promise<boolean> => {
      const pending = await readQueue(token);
      if (!pending.length) {
        setSaveState("SALVO");
        setSyncMessage("");
        return true;
      }
      setSaveState("SALVANDO");
      try {
        const remaining = [...pending];
        for (const item of pending) {
          const saved = await requisitarAnamnese<{ versao_de_controle: number }>(
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
          versionsRef.current[item.pergunta] = saved.versao_de_controle;
          remaining.shift();
          await writeQueue(token, remaining);
        }
        await load(true);
        setSaveState("SALVO");
        setSyncMessage("");
        return true;
      } catch (erro) {
        setSaveState("CONFLITO");
        setSyncMessage(
          erro instanceof Error
            ? erro.message
            : "Não foi possível confirmar as respostas. O conteúdo permanece nesta tela para uma nova tentativa."
        );
        return false;
      }
    });

    syncPromise.current = operation;
    try {
      return await operation;
    } finally {
      if (syncPromise.current === operation) syncPromise.current = null;
    }
  }, [load, token, withQueueLock]);

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
  const applicableTotal = structure?.validacao.total_aplicavel ?? 0;
  const applicableAnswered = structure?.validacao.total_respondido ?? 0;
  const percentage = Math.round(structure?.validacao.percentual ?? 0);
  const requiredPending = useMemo(
    () => (structure?.validacao.pendencias ?? []).map((pending) => {
      const question = structure?.perguntas.find(
        (item) => item.identificador === pending.identificador
      );
      return question ?? {
        identificador: pending.identificador,
        codigo: pending.codigo,
        versao: structure?.versao ?? "",
        texto: pending.texto,
        tipo_de_resposta: "PENDENTE",
        opcoes_json: [],
        obrigatoria: true,
        blocos_json: [pending.secao],
        secao: pending.secao,
        secao_rotulo: pending.secao_rotulo
      };
    }),
    [structure]
  );

  const stageAnswer = useCallback(async (question: Question, value: Answer) => {
    await withQueueLock(async () => {
      const pending = (await readQueue(token)).filter((item) => item.pergunta !== question.identificador);
      pending.push({
        pergunta: question.identificador,
        versao: question.versao,
        resposta: value,
        controle: versionsRef.current[question.identificador] ?? 0
      });
      await writeQueue(token, pending);
    });
    setSaveState(navigator.onLine ? "SINCRONIZACAO_PENDENTE" : "SEM_REDE");
  }, [token, withQueueLock]);

  const changeAnswer = useCallback((question: Question, value: Answer) => {
    answersRef.current = {
      ...answersRef.current,
      [question.identificador]: value
    };
    setAnswers(answersRef.current);
    void stageAnswer(question, value).catch((erro) => {
      setSaveState("CONFLITO");
      setSyncMessage(
        erro instanceof Error
          ? `Não foi possível proteger a resposta no armazenamento local: ${erro.message}. Mantenha esta tela aberta e tente novamente.`
          : "Não foi possível proteger a resposta no armazenamento local. Mantenha esta tela aberta e tente novamente."
      );
    });
  }, [stageAnswer]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [section, reviewing]);

  async function selectBranch() {
    const branch = structure?.selecao_de_ramo.alternativas_oficiais.find(
      (item) => item.codigo_da_alternativa === selectedBranch
    );
    if (!branch) {
      setBranchMessage("Selecione um contexto profissional oficial para continuar.");
      return;
    }
    if (
      branch.exige_nicho_customizado &&
      (!customNiche.trim() || !customFunction.trim())
    ) {
      setBranchMessage("Em Outros, informe obrigatoriamente o nicho e a função.");
      return;
    }
    try {
      const synchronized = await syncPending();
      if (!synchronized && (await readQueue(token)).length) return;
      await requisitarAnamnese(`/api/humanexus/convites/${encodeURIComponent(token)}`, {
        method: "POST",
        body: JSON.stringify({
          acao: "SELECIONAR_RAMO",
          alternativa_de_ramo: selectedBranch,
          nicho: branch.nicho,
          funcao: branch.funcao ?? customFunction,
          nicho_customizado: branch.exige_nicho_customizado ? customNiche : null,
          funcao_customizada: branch.exige_funcao_customizada ? customFunction : null,
          contexto_profissional_declarado: branch.texto
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
    await requisitarAnamnese(`/api/humanexus/convites/${encodeURIComponent(token)}`, {
      method: "POST",
      body: JSON.stringify({ acao: "CONFIRMAR_REVISAO_DO_RAMO" })
    });
    await load();
  }

  async function start() {
    if (!consent) return;
    try {
      await requisitarAnamnese(`/api/humanexus/convites/${encodeURIComponent(token)}`, {
        method: "POST",
        body: JSON.stringify({ acao: "INICIAR" })
      });
      setStarted(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível iniciar.");
    }
  }

  async function move(next: number) {
    if (next > section) {
      const pendenteNaSecao = questions.find(
        (question) =>
          question.obrigatoria
          && !isQuestionAnswered(
            question,
            answersRef.current[question.identificador]
          )
      );
      if (pendenteNaSecao) {
        setBranchMessage(
          `Responda a pergunta obrigatória ${pendenteNaSecao.codigo} antes de avançar.`
        );
        return;
      }
    }
    const synchronized = await syncPending();
    if (!synchronized && (await readQueue(token)).length) return;
    setBranchMessage("");
    setSection(Math.max(0, Math.min(sections.length - 1, next)));
  }

  async function conclude() {
    if (conclusionLock.current) return;
    conclusionLock.current = true;
    setSubmitting(true);
    setMessage("");
    try {
      const synchronized = await syncPending();
      if (!synchronized) {
        setMessage(
          "O envio não foi realizado porque existem respostas ainda não confirmadas. O conteúdo continua preenchido; tente novamente após restabelecer a ligação."
        );
        return;
      }
      const authoritative = await load(true);
      if (
        !authoritative ||
        authoritative.validacao.pendencias.length ||
        authoritative.revisao_do_ramo_pendente ||
        !authoritative.validacao.pode_concluir
      ) {
        setMessage(
          authoritative?.validacao.pendencias.length
            ? `Ainda existem ${authoritative.validacao.pendencias.length} pergunta(s) obrigatória(s). Use a lista abaixo para abrir o primeiro campo pendente.`
            : "A revisão do contexto profissional precisa ser confirmada antes do envio."
        );
        setReviewing(true);
        return;
      }
      const idempotencyKey = await conclusionKey(token);
      const correlation = correlationId();
      let lastError: unknown = null;
      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          await requisitarAnamnese(`/api/humanexus/convites/${encodeURIComponent(token)}`, {
            method: "POST",
            keepalive: true,
            headers: {
              "x-humanexus-correlation-id": correlation,
              "x-humanexus-idempotency-key": idempotencyKey
            },
            body: JSON.stringify({
              acao: "CONCLUIR",
              chave_de_idempotencia: idempotencyKey
            })
          });
        } catch (error) {
          lastError = error;
        }

        try {
          const confirmed = await requisitarAnamnese<Structure>(
            `/api/humanexus/convites/${encodeURIComponent(token)}`
          );
          if (persistenceConfirmed(confirmed.confirmacao_persistencia)) {
            setCompleted(true);
            setMessage("");
            return;
          }
        } catch (error) {
          lastError = lastError ?? error;
        }

        if (
          lastError instanceof HumanexusApiError
          && lastError.status >= 400
          && lastError.status < 500
        ) break;
        if (!navigator.onLine || attempt === 1) break;
        await new Promise((resolve) => window.setTimeout(resolve, 700));
      }
      throw lastError instanceof Error
        ? lastError
        : new Error(
          "O Núcleo ainda não confirmou o recebimento e a persistência. O conteúdo permanece nesta tela. Verifique a ligação e toque novamente em enviar."
        );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? `${error.message} Nenhuma resposta foi apagada; tente novamente sem recarregar a página.`
          : "Não foi possível concluir. Nenhuma resposta foi apagada; tente novamente sem recarregar a página."
      );
    } finally {
      conclusionLock.current = false;
      setSubmitting(false);
    }
  }

  async function openReview() {
    const synchronized = await syncPending();
    if (!synchronized) {
      setBranchMessage("Existem respostas ainda não confirmadas pelo servidor.");
      return;
    }
    const authoritative = await load(true);
    if (!authoritative) return;
    setReviewing(true);
  }

  function goToQuestion(question: Question) {
    const destination = sections.findIndex((item) => item.perguntas.includes(question.codigo));
    if (destination >= 0) setSection(destination);
    setReviewing(false);
  }

  if (message && !structure) return <StateCard title="Acesso indisponível" text={message} />;
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
          {message ? <p className="hx-anamnese-alert" role="alert">{message}</p> : null}
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
        {syncMessage ? <p className="hx-anamnese-alert" role="alert" aria-live="assertive">{syncMessage}</p> : null}
        {message ? <p className="hx-anamnese-alert" role="alert" aria-live="assertive">{message}</p> : null}
        {reviewing ? (
          <>
            <p className="hx-anamnese-kicker">REVISÃO ANTES DA CONCLUSÃO</p>
            <h1>Confira suas respostas</h1>
            <div className="hx-anamnese-validation-summary"><article><small>Total aplicável</small><strong>{applicableTotal}</strong></article><article><small>Respondidas</small><strong>{applicableAnswered}</strong></article><article><small>Pendências</small><strong>{requiredPending.length}</strong></article></div>
            {requiredPending.length ? <p className="hx-anamnese-alert">{requiredPending.length} pergunta(s) obrigatória(s) ainda pendente(s).</p> : null}
            {requiredPending.length ? <div className="hx-anamnese-pending">{requiredPending.map((question) => <button type="button" key={question.identificador} onClick={() => goToQuestion(question)}><small>{question.secao_rotulo ?? "Pergunta aplicável"}</small><span>{question.texto}</span><strong>Ir para a pergunta →</strong></button>)}</div> : null}
            {structure.revisao_do_ramo_pendente ? <p className="hx-anamnese-alert">O ramo foi alterado. Respostas anteriores foram preservadas, mas as incompatíveis não entram na análise. Confirme a revisão antes de concluir.</p> : null}
            <div className="hx-anamnese-review">
              {structure.ramo_confirmado ? <article><small>RAMO AUTORAL ATIVO</small><strong>{structure.nicho_rotulo ?? selectedNiche} · {selectedFunction}</strong><p>{customNiche ? `${customNiche} · ${customFunction}` : "Seleção confirmada no catálogo do Google Forms autoral."}</p></article> : null}
              {structure.perguntas.filter((question) => isQuestionAnswered(question, answers[question.identificador])).map((question) => (
                <article key={question.identificador}><small>{question.secao_rotulo ?? "Anamnese Regulatória"}</small><strong>{question.texto}</strong><p>{valueText(answers[question.identificador])}</p></article>
              ))}
            </div>
            <div className="hx-anamnese-actions">
              <button type="button" onClick={() => setReviewing(false)}>Voltar ao preenchimento</button>
              {structure.revisao_do_ramo_pendente ? <button type="button" onClick={() => void confirmBranchReview()}>Confirmar revisão do ramo</button> : null}
              <button
                type="button"
                disabled={submitting || !structure.validacao.pode_concluir || saveState !== "SALVO"}
                aria-busy={submitting}
                onClick={conclude}
              >{submitting ? "Enviando com segurança…" : "Confirmar e concluir"}</button>
            </div>
          </>
        ) : (
          <>
            <p className="hx-anamnese-kicker">SEÇÃO {section + 1} DE {sections.length}</p>
            <h1>{sections[section]?.rotulo ?? "Anamnese Regulatória"}</h1>
            {branchMessage && sections[section]?.bloco !== "SELECAO_DE_RAMO" ? <p className="hx-anamnese-alert">{branchMessage}</p> : null}
            {sections[section]?.bloco === "SELECAO_DE_RAMO" ? (
              <div className="hx-anamnese-branch">
                <p>{structure.selecao_de_ramo.orientacao}</p>
                <label><span>Contexto profissional e função</span><select value={selectedBranch} onChange={(event) => {
                  const value = event.target.value;
                  const branch = structure.selecao_de_ramo.alternativas_oficiais.find((item) => item.codigo_da_alternativa === value);
                  setSelectedBranch(value);
                  setSelectedNiche(branch?.nicho ?? "");
                  setSelectedFunction(branch?.funcao ?? "");
                }}><option value="">Selecione uma alternativa</option>{structure.selecao_de_ramo.alternativas_oficiais.map((item) => <option key={item.codigo_da_alternativa} value={item.codigo_da_alternativa}>{item.texto}</option>)}</select></label>
                {structure.selecao_de_ramo.alternativas_oficiais.find((item) => item.codigo_da_alternativa === selectedBranch)?.exige_nicho_customizado ? <>
                  <label><span>Qual é o seu nicho?</span><input value={customNiche} onChange={(event) => setCustomNiche(event.target.value)} maxLength={180} /></label>
                  <label><span>Qual é a sua função?</span><input value={customFunction} onChange={(event) => setCustomFunction(event.target.value)} maxLength={180} /></label>
                  <small>O ramo Outros não ativa perguntas empresariais. O nicho e a função informados ficam registrados explicitamente.</small>
                </> : <small>Alternativas, funções e destinos preservados do Google Forms autoral original.</small>}
                {branchMessage ? <p className="hx-anamnese-alert">{branchMessage}</p> : null}
                <button type="button" onClick={() => void selectBranch()}>{structure.ramo_confirmado ? "Atualizar ramo preservando respostas" : "Confirmar ramo"}</button>
              </div>
            ) : <div className="hx-anamnese-questions">
              {questions.map((question) => (
                <QuestionField
                  key={question.identificador}
                  question={question}
                  value={answers[question.identificador] ?? ""}
                  onChange={(value) => changeAnswer(question, value)}
                  onBlur={() => { void syncPending(); }}
                />
              ))}
            </div>}
            <div className="hx-anamnese-actions">
              <button disabled={section === 0} onClick={() => void move(section - 1)}>Anterior</button>
              {section < sections.length - 1
                ? <button onClick={() => void move(section + 1)}>Salvar e continuar</button>
                : <button onClick={() => void openReview()}>Revisar respostas</button>}
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
  question: Question; value: Answer; onChange: (value: Answer) => void; onBlur: (value: Answer) => void;
}) {
  const label = <><span>{question.texto}{question.obrigatoria ? " *" : ""}</span>{question.orientacao ? <small>{question.orientacao}</small> : null}</>;
  const catalogAlternatives = question.alternativas?.length
    ? question.alternativas
    : (question.opcoes_json ?? []).map((texto, index) => ({
        codigo: `${question.codigo}-${index + 1}`,
        texto,
        ordem: index + 1,
        outro: texto.trim().toLocaleLowerCase("pt-BR") === "outro"
      }));
  const seenAlternatives = new Set<string>();
  const alternatives = catalogAlternatives.filter((item) => {
    const normalized = item.texto.normalize("NFD").replace(/\p{Diacritic}/gu, "")
      .toLocaleLowerCase("pt-BR").replace(/[\W_]+/g, "");
    if (seenAlternatives.has(normalized)) return false;
    seenAlternatives.add(normalized);
    return true;
  });
  const singleValue = typeof value === "string"
    ? value
    : typeof value === "object" && value && "valor" in value
      ? value.valor
      : "";
  const multipleValues = Array.isArray(value)
    ? value
    : typeof value === "object" && value && "valores" in value
      ? value.valores
      : [];
  const otherText = typeof value === "object" && value && "outro" in value
    ? value.outro ?? ""
    : "";
  const selectedOther = alternatives.find(
    (item) => item.outro && (
      singleValue === item.texto || multipleValues.includes(item.texto)
    )
  );
  if (question.tipo_de_resposta === "TEXTO_LONGO") {
    const text = typeof value === "string" ? value : "";
    return <label>{label}<textarea value={text} onChange={(event) => onChange(event.target.value)} onBlur={() => onBlur(text)} rows={5} maxLength={12000} /></label>;
  }
  if (
    alternatives.length &&
    ["ESCOLHA_UNICA", "LISTA_SUSPENSA"].includes(question.tipo_de_resposta)
  ) {
    return <fieldset><legend>{label}</legend>{alternatives.map((option) => <label className="hx-anamnese-option" key={option.codigo}><input type="radio" name={question.identificador} checked={singleValue === option.texto} onChange={() => {
      const next: Answer = option.outro ? { valor: option.texto, outro: "" } : option.texto;
      onChange(next);
      if (!option.outro) onBlur(next);
    }} /><span>{option.texto}</span></label>)}{selectedOther ? <label><span>Especifique “Outro” *</span><input value={otherText} maxLength={600} onChange={(event) => onChange({ valor: selectedOther.texto, outro: event.target.value })} onBlur={() => onBlur({ valor: selectedOther.texto, outro: otherText })} /></label> : null}</fieldset>;
  }
  if (
    alternatives.length &&
    ["ESCOLHA_MULTIPLA", "ESCOLHA_MULTIPLA_LIMITADA"].includes(question.tipo_de_resposta)
  ) {
    const max = question.limite_maximo_de_selecoes ?? Number.POSITIVE_INFINITY;
    const limitId = `limite-${question.identificador}`;
    return <fieldset aria-describedby={Number.isFinite(max) ? limitId : undefined}><legend>{label}</legend>{Number.isFinite(max) ? <small id={limitId}>Selecione no máximo {max} alternativa(s). {multipleValues.length}/{max} selecionada(s).</small> : null}{alternatives.map((option) => {
      const checked = multipleValues.includes(option.texto);
      const disabled = !checked && multipleValues.length >= max;
      return <label className="hx-anamnese-option" key={option.codigo}><input type="checkbox" checked={checked} disabled={disabled} onChange={(event) => {
        const nextValues = event.target.checked
          ? [...multipleValues, option.texto]
          : multipleValues.filter((item) => item !== option.texto);
        const stillHasOther = alternatives.some(
          (item) => item.outro && nextValues.includes(item.texto)
        );
        const next: Answer = stillHasOther
          ? { valores: nextValues, outro: otherText }
          : nextValues;
        onChange(next);
        if (!option.outro || !event.target.checked) onBlur(next);
      }} /><span>{option.texto}</span></label>;
    })}{selectedOther ? <label><span>Especifique “Outro” *</span><input value={otherText} maxLength={600} onChange={(event) => onChange({ valores: multipleValues, outro: event.target.value })} onBlur={() => onBlur({ valores: multipleValues, outro: otherText })} /></label> : null}</fieldset>;
  }
  if (question.tipo_de_resposta === "ESCALA" && alternatives.length) {
    const numericValue = typeof value === "number" ? value : null;
    return <fieldset><legend>{label}</legend><div className="hx-anamnese-scale-labels"><small>{question.rotulo_minimo ?? question.valor_minimo}</small><small>{question.rotulo_maximo ?? question.valor_maximo}</small></div><div className="hx-anamnese-scale">{alternatives.map((option) => {
      const numeric = Number(option.texto);
      return <label className="hx-anamnese-option" key={option.codigo}><input type="radio" name={question.identificador} checked={numericValue === numeric} onChange={() => { onChange(numeric); onBlur(numeric); }} /><span>{option.texto}</span></label>;
    })}</div></fieldset>;
  }
  const type = ["NUMERO", "DURACAO", "FREQUENCIA"].includes(question.tipo_de_resposta) ? "number" : question.tipo_de_resposta === "DATA" ? "date" : question.tipo_de_resposta === "HORARIO" ? "time" : "text";
  const primitive = typeof value === "string" || typeof value === "number" ? value : "";
  return <label>{label}<input type={type} value={primitive} min={question.valor_minimo ?? undefined} max={question.valor_maximo ?? undefined} onChange={(event) => onChange(type === "number" ? Number(event.target.value) : event.target.value)} onBlur={() => onBlur(primitive)} maxLength={type === "text" ? 600 : undefined} /></label>;
}

function StateCard({ title, text }: { title: string; text: string }) {
  return <section className="hx-anamnese-participante"><div className="hx-anamnese-state"><h1>{title}</h1><p>{text}</p></div></section>;
}
