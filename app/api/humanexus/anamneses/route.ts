import { randomUUID } from "node:crypto";
import { ensureSchema, sql } from "@/lib/humanexus-db";
import { fail, ok } from "@/lib/humanexus-http";
import { createInviteToken, hashToken, verifyProfessionalToken } from "@/lib/humanexus-security";

export async function POST(request: Request) {
  try {
    verifyProfessionalToken(request.headers.get("authorization"));
    await ensureSchema();
    const { participante_id } = await request.json();
    const [participant] = await sql`SELECT id FROM humanexus_participants WHERE id=${participante_id} AND active=true`;
    if (!participant) throw new Error("Participante não encontrado.");
    const anamnesisId = randomUUID();
    const inviteId = randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000);
    const token = createInviteToken(inviteId, expiresAt);
    await sql.begin(async (transaction) => {
      await transaction`
        INSERT INTO humanexus_anamneses(id, participant_id, form_version, state)
        VALUES (${anamnesisId}, ${participante_id}, '1.0.0', 'CONVITE_CRIADO')
      `;
      await transaction`
        INSERT INTO humanexus_invites(id, anamnesis_id, token_hash, expires_at)
        VALUES (${inviteId}, ${anamnesisId}, ${hashToken(token)}, ${expiresAt})
      `;
    });
    return ok({ identificador: anamnesisId, token_de_entrega_unica: token, expira_em: expiresAt }, 201);
  } catch (error) {
    return fail(error, 422);
  }
}

export async function GET(request: Request) {
  try {
    verifyProfessionalToken(request.headers.get("authorization"));
    await ensureSchema();
    return ok(await sql`
      SELECT a.id, a.state, a.progress, a.form_version, a.version_number, a.created_at,
             p.id AS participant_id, p.name, p.email, p.bond_type, p.organization, p.niche
      FROM humanexus_anamneses a
      JOIN humanexus_participants p ON p.id=a.participant_id
      ORDER BY a.created_at DESC LIMIT 100
    `);
  } catch (error) {
    return fail(error, 401);
  }
}
