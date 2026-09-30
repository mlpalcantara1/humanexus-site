export type PendingAnswer<T> = { pergunta: string; versao: string; resposta: T; controle: number };
export type RemoteAnswer<T> = { question_id: string; answer: T; control_version: number };
export type AnswerConflict<T> = { pending: PendingAnswer<T>; remote: RemoteAnswer<T> };

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`).join(",")}}`;
  }
  return JSON.stringify(value) ?? "undefined";
}

export function sameAnswer(a: unknown, b: unknown): boolean {
  return canonical(a) === canonical(b);
}

export function isAnswerConflict(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const item = error as { status?: number; codigo?: string; message?: string };
  return item.status === 409 || item.codigo === "CONFLITO_DE_CONCORRENCIA"
    || item.message === "CONFLITO_DE_CONCORRENCIA";
}

export async function synchronizeAnswers<T>(dependencies: {
  read: () => Promise<PendingAnswer<T>[]>;
  write: (queue: PendingAnswer<T>[]) => Promise<void>;
  save: (item: PendingAnswer<T>) => Promise<number>;
  remote: () => Promise<RemoteAnswer<T>[]>;
  acknowledged: (question: string, revision: number) => void;
}): Promise<AnswerConflict<T> | null> {
  const remaining = [...await dependencies.read()];
  while (remaining.length) {
    const item = remaining[0];
    let revision: number;
    try {
      revision = await dependencies.save(item);
    } catch (error) {
      if (!isAnswerConflict(error)) throw error;
      const remote = (await dependencies.remote()).find(answer => answer.question_id === item.pergunta);
      if (!remote) throw error;
      if (!sameAnswer(item.resposta, remote.answer)) return { pending: item, remote };
      revision = remote.control_version;
    }
    dependencies.acknowledged(item.pergunta, revision);
    remaining.shift();
    await dependencies.write(remaining);
  }
  return null;
}

export function resolveAnswerConflict<T>(queue: PendingAnswer<T>[], conflict: AnswerConflict<T>, keepLocal: boolean) {
  const index = queue.findIndex(item => item.pergunta === conflict.pending.pergunta);
  if (index < 0 || !sameAnswer(queue[index], conflict.pending)) return null;
  return queue.flatMap((item, position) => position !== index ? [item]
    : keepLocal ? [{ ...item, controle: conflict.remote.control_version }] : []);
}
