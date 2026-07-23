"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { humanexusApi } from "@/lib/humanexus-api";

type Question = {
  identificador: string;
  codigo: string;
  versao: string;
  texto: string;
  tipo_de_resposta: string;
  opcoes_json: string[];
  obrigatoria: boolean;
  blocos_json: string[];
};
type Structure = {
  anamnese: string;
  nicho: string;
  versao: string;
  perguntas: Question[];
  navegacao: { bloco: string; perguntas: string[] }[];
};
type SaveState = "Salvando" | "Salvo" | "Sem conexão" | "Pendente de sincronização" | "Erro ao salvar";

async function encryptedQueueKey(token: string) {
  return crypto.subtle.importKey(
    "raw",
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token)),
    "AES-GCM",
    false,
    ["encrypt", "decrypt"]
  );
}

async function saveEncryptedQueue(token: string, value: unknown) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    await encryptedQueueKey(token),
    new TextEncoder().encode(JSON.stringify(value))
  );
  localStorage.setItem(
    `hx-anamnese-${token.slice(0, 12)}`,
    JSON.stringify({ iv: Array.from(iv), data: Array.from(new Uint8Array(encrypted)) })
  );
}

function clearQueue(token: string) {
  localStorage.removeItem(`hx-anamnese-${token.slice(0, 12)}`);
}

export function AnamneseParticipante({ token }: { token: string }) {
  const [structure, setStructure] = useState<Structure | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [versions, setVersions] = useState<Record<string, number>>({});
  const [section, setSection] = useState(0);
  const [consent, setConsent] = useState(false);
  const [started, setStarted] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("Salvo");
  const [message, setMessage] = useState("");
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    humanexusApi<Structure>(`/api/humanexus/convites/${encodeURIComponent(token)}`)
      .then((data) => {
        setStructure(data);
        const restored = Object.fromEntries(
          (data as Structure & { respostas?: { question_id: string; answer: string; control_version: number }[] })
            .respostas?.map((item) => [item.question_id, String(item.answer ?? "")]) ?? []
        );
        setAnswers(restored);
      })
      .catch((error) => setMessage(error.message));
  }, [token]);

  useEffect(() => {
    const online = () => setSaveState("Pendente de sincronização");
    const offline = () => setSaveState("Sem conexão");
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
    };
  }, []);

  const sections = structure?.navegacao ?? [];
  const currentCodes = new Set(sections[section]?.perguntas ?? []);
  const questions = structure?.perguntas.filter((q) => currentCodes.has(q.codigo)) ?? [];
  const answered = Object.values(answers).filter((value) => value.trim()).length;
  const percentage = structure?.perguntas.length
    ? Math.round((answered / structure.perguntas.length) * 100)
    : 0;

  const saveAnswer = useCallback(async (question: Question, value: string) => {
    setAnswers((current) => ({ ...current, [question.identificador]: value }));
    setSaveState(navigator.onLine ? "Salvando" : "Pendente de sincronização");
    const pending = { pergunta: question.identificador, versao: question.versao, resposta: value };
    await saveEncryptedQueue(token, pending);
    if (!navigator.onLine) return;
    try {
      const saved = await humanexusApi<{ versao_de_controle: number }>(
        `/api/humanexus/convites/${encodeURIComponent(token)}/respostas/${question.identificador}`,
        {
          method: "PUT",
          body: JSON.stringify({
            versao_da_pergunta: question.versao,
            resposta: value,
            versao_de_controle: versions[question.identificador] ?? 0
          })
        }
      );
      setVersions((current) => ({ ...current, [question.identificador]: saved.versao_de_controle }));
      clearQueue(token);
      setSaveState("Salvo");
    } catch {
      setSaveState("Erro ao salvar");
    }
  }, [token, versions]);

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

  async function conclude() {
    if (saveState !== "Salvo") return;
    await humanexusApi(`/api/humanexus/convites/${encodeURIComponent(token)}`, {
      method: "POST",
      body: JSON.stringify({ acao: "CONCLUIR" })
    });
    setCompleted(true);
  }

  if (message) return <StateCard title="Acesso indisponível" text={message} />;
  if (!structure) return <StateCard title="Preparando sua anamnese" text="Validando o convite seguro…" />;
  if (completed) return <StateCard title="Anamnese concluída" text="Suas respostas foram enviadas para revisão profissional. Obrigado por dedicar este tempo ao seu processo." />;
  if (!started) {
    return (
      <section className="mx-auto max-w-2xl px-5 py-16">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-7 sm:p-10">
          <p className="text-xs uppercase tracking-[0.28em] text-[#C9A34E]">Anamnese Regulatória HUMANEXUS</p>
          <h1 className="mt-5 text-3xl font-semibold text-white">Antes de começar</h1>
          <p className="mt-5 leading-7 text-[#AEB2B9]">Suas respostas serão salvas ao longo do preenchimento e ficarão disponíveis apenas conforme a finalidade autorizada. Você poderá interromper e retomar pelo mesmo convite.</p>
          <label className="mt-8 flex cursor-pointer gap-3 rounded-2xl border border-white/10 p-4 text-sm leading-6 text-[#D5D7DB]">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1" />
            Li e compreendi a finalidade, a confidencialidade e minha liberdade de interromper o preenchimento.
          </label>
          <button disabled={!consent} onClick={start} className="mt-6 w-full rounded-full bg-[#C9A34E] px-6 py-4 font-semibold text-black disabled:cursor-not-allowed disabled:opacity-40">Iniciar anamnese</button>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl px-5 py-10 sm:py-16">
      <div className="mb-8">
        <div className="flex items-center justify-between gap-4 text-xs uppercase tracking-[0.18em]">
          <span className="text-[#C9A34E]">{percentage}% preenchido</span>
          <span aria-live="polite" className={saveState === "Salvo" ? "text-emerald-400" : "text-[#D5D7DB]"}>{saveState}</span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-[#C9A34E] transition-all" style={{ width: `${percentage}%` }} /></div>
      </div>
      <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 sm:p-9">
        <p className="text-xs uppercase tracking-[0.22em] text-[#8F949C]">Seção {section + 1} de {sections.length}</p>
        <h1 className="mt-3 text-2xl font-semibold text-white">{(sections[section]?.bloco ?? "").replaceAll("_", " ")}</h1>
        <div className="mt-8 space-y-8">
          {questions.map((question) => (
            <label key={question.identificador} className="block">
              <span className="block text-base leading-7 text-[#F2F2F2]">{question.texto}{question.obrigatoria ? " *" : ""}</span>
              {question.tipo_de_resposta === "TEXTO_LONGO" ? (
                <textarea value={answers[question.identificador] ?? ""} onChange={(e) => setAnswers((a) => ({ ...a, [question.identificador]: e.target.value }))} onBlur={(e) => saveAnswer(question, e.target.value)} rows={4} className="mt-3 w-full rounded-2xl border border-white/12 bg-black/25 px-4 py-3 text-white outline-none focus:border-[#C9A34E]" />
              ) : (
                <input value={answers[question.identificador] ?? ""} onChange={(e) => setAnswers((a) => ({ ...a, [question.identificador]: e.target.value }))} onBlur={(e) => saveAnswer(question, e.target.value)} className="mt-3 w-full rounded-2xl border border-white/12 bg-black/25 px-4 py-3 text-white outline-none focus:border-[#C9A34E]" />
              )}
            </label>
          ))}
        </div>
        <div className="mt-10 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <button disabled={section === 0} onClick={() => setSection((value) => Math.max(0, value - 1))} className="rounded-full border border-white/12 px-6 py-3 text-white disabled:opacity-30">Anterior</button>
          {section < sections.length - 1 ? (
            <button onClick={() => setSection((value) => Math.min(sections.length - 1, value + 1))} className="rounded-full bg-[#C9A34E] px-7 py-3 font-semibold text-black">Próxima seção</button>
          ) : (
            <button disabled={saveState !== "Salvo"} onClick={conclude} className="rounded-full bg-[#C9A34E] px-7 py-3 font-semibold text-black disabled:opacity-40">Revisar e concluir</button>
          )}
        </div>
      </div>
    </section>
  );
}

function StateCard({ title, text }: { title: string; text: string }) {
  return (
    <section className="mx-auto min-h-[65vh] max-w-xl px-5 py-20">
      <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-8">
        <h1 className="text-3xl font-semibold text-white">{title}</h1>
        <p className="mt-4 leading-7 text-[#AEB2B9]">{text}</p>
      </div>
    </section>
  );
}
