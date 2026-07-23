import catalog from "@/data/biblioteca-perguntas-1.0.json";
import { ensureSchema, sql } from "@/lib/humanexus-db";
import { fail, ok } from "@/lib/humanexus-http";
import { hashToken, verifyInviteToken } from "@/lib/humanexus-security";

async function context(token: string) {
  const payload = verifyInviteToken(token);
  await ensureSchema();
  const [row] = await sql`
    SELECT i.id AS invite_id, i.expires_at, i.revoked_at, a.*, p.niche, p.name
    FROM humanexus_invites i
    JOIN humanexus_anamneses a ON a.id=i.anamnesis_id
    JOIN humanexus_participants p ON p.id=a.participant_id
    WHERE i.id=${payload.invite} AND i.token_hash=${hashToken(token)}
  `;
  if (!row || row.revoked_at) throw new Error("Convite revogado ou indisponível.");
  return row;
}

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const row = await context(token);
    const questions = catalog.perguntas.filter(
      (question) => question.nichos_json.includes("TODOS") || question.nichos_json.includes(row.niche)
    );
    const blocks = [...new Set(questions.map((question) => question.blocos_json[0]))];
    const answers = await sql`
      SELECT question_id, answer, control_version
      FROM humanexus_answers WHERE anamnesis_id=${row.id}
    `;
    await sql`UPDATE humanexus_invites SET first_access_at=coalesce(first_access_at, now()) WHERE id=${row.invite_id}`;
    return ok({
      anamnese: row.id,
      estado: row.state,
      nicho: row.niche,
      versao: row.form_version,
      perguntas: questions,
      navegacao: blocks.map((block) => ({
        bloco: block,
        perguntas: questions.filter((question) => question.blocos_json[0] === block).map((question) => question.codigo)
      })),
      respostas: answers
    });
  } catch (error) {
    return fail(error, 404);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const row = await context(token);
    const { acao } = await request.json();
    if (acao === "INICIAR") {
      if (!["CONVITE_CRIADO", "EM_PREENCHIMENTO", "PAUSADA"].includes(row.state)) throw new Error("Anamnese não pode ser iniciada.");
      await sql`UPDATE humanexus_anamneses SET state='EM_PREENCHIMENTO', consented_at=coalesce(consented_at, now()), updated_at=now() WHERE id=${row.id}`;
      return ok({ estado: "EM_PREENCHIMENTO" });
    }
    if (acao === "CONCLUIR") {
      if (row.state !== "EM_PREENCHIMENTO") throw new Error("Anamnese não está em preenchimento.");
      const answered = await sql`SELECT question_id FROM humanexus_answers WHERE anamnesis_id=${row.id}`;
      const answeredIds = new Set(answered.map((item) => item.question_id));
      const triggerQuestions = catalog.perguntas.filter(
        (question) => question.gera_hipotese_gatilho && answeredIds.has(question.identificador)
      );
      await sql.begin(async (transaction) => {
        await transaction`UPDATE humanexus_anamneses SET state='CONCLUIDA_PELO_PARTICIPANTE', progress=100, completed_at=now(), updated_at=now() WHERE id=${row.id}`;
        for (const question of triggerQuestions) {
          await transaction`
            INSERT INTO humanexus_trigger_hypotheses
              (id, anamnesis_id, question_id, source_category, justification)
            VALUES
              (gen_random_uuid(), ${row.id}, ${question.identificador}, 'ANAMNESE',
               'Resposta autoral compatível com investigação profissional; nenhum cálculo automático foi produzido.')
            ON CONFLICT (anamnesis_id, question_id) DO NOTHING
          `;
        }
      });
      return ok({ estado: "CONCLUIDA_PELO_PARTICIPANTE" });
    }
    throw new Error("Ação inválida.");
  } catch (error) {
    return fail(error, 422);
  }
}
