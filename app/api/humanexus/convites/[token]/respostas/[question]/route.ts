import catalog from "@/data/biblioteca-perguntas-1.0.json";
import { randomUUID } from "node:crypto";
import { ensureSchema, sql } from "@/lib/humanexus-db";
import { fail, ok } from "@/lib/humanexus-http";
import { hashToken, verifyInviteToken } from "@/lib/humanexus-security";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ token: string; question: string }> }
) {
  try {
    const { token, question } = await params;
    const payload = verifyInviteToken(token);
    const definition = catalog.perguntas.find((item) => item.identificador === question);
    if (!definition) throw new Error("Pergunta inválida.");
    await ensureSchema();
    const [context] = await sql`
      SELECT a.id, a.state
      FROM humanexus_invites i JOIN humanexus_anamneses a ON a.id=i.anamnesis_id
      WHERE i.id=${payload.invite} AND i.token_hash=${hashToken(token)}
        AND i.revoked_at IS NULL AND i.expires_at > now()
    `;
    if (!context || context.state !== "EM_PREENCHIMENTO") throw new Error("Edição não permitida.");
    const { resposta, versao_de_controle = 0 } = await request.json();
    const [existing] = await sql`
      SELECT id, control_version FROM humanexus_answers
      WHERE anamnesis_id=${context.id} AND question_id=${question}
    `;
    if (existing && existing.control_version !== versao_de_controle) throw new Error("CONFLITO_DE_CONCORRENCIA");
    const nextVersion = existing ? existing.control_version + 1 : 1;
    await sql`
      INSERT INTO humanexus_answers
        (id, anamnesis_id, question_id, question_version, answer, control_version)
      VALUES
        (${existing?.id ?? randomUUID()}, ${context.id}, ${question}, ${definition.versao},
         ${sql.json(resposta)}, ${nextVersion})
      ON CONFLICT (anamnesis_id, question_id)
      DO UPDATE SET answer=excluded.answer, control_version=excluded.control_version, updated_at=now()
    `;
    const [{ total }] = await sql`SELECT count(*)::int AS total FROM humanexus_answers WHERE anamnesis_id=${context.id}`;
    const applicable = catalog.perguntas.filter(
      (item) => item.nichos_json.includes("TODOS") || item.nichos_json.some((niche) => definition.nichos_json.includes(niche))
    ).length;
    const progress = Math.min(99, Number(((total / Math.max(applicable, 1)) * 100).toFixed(2)));
    await sql`UPDATE humanexus_anamneses SET progress=${progress}, updated_at=now() WHERE id=${context.id}`;
    return ok({ versao_de_controle: nextVersion, percentual: progress });
  } catch (error) {
    return fail(error, 409);
  }
}
