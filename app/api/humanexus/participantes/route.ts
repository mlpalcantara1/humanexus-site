import { randomUUID } from "node:crypto";
import { ensureSchema, sql } from "@/lib/humanexus-db";
import { fail, ok } from "@/lib/humanexus-http";
import { verifyProfessionalToken } from "@/lib/humanexus-security";

export async function POST(request: Request) {
  try {
    verifyProfessionalToken(request.headers.get("authorization"));
    await ensureSchema();
    const body = await request.json();
    if (!body.nome || !body.email || !body.tipo_vinculo || !body.nicho) {
      throw new Error("Nome, e-mail, vínculo e nicho são obrigatórios.");
    }
    const id = randomUUID();
    const [participant] = await sql`
      INSERT INTO humanexus_participants
        (id, name, email, phone, bond_type, organization, niche, role)
      VALUES
        (${id}, ${body.nome}, ${String(body.email).toLowerCase()}, ${body.telefone || null},
         ${body.tipo_vinculo}, ${body.organizacao || null}, ${body.nicho}, ${body.funcao || null})
      RETURNING id, name, email, bond_type, organization, niche, role, created_at
    `;
    return ok(participant, 201);
  } catch (error) {
    return fail(error, 422);
  }
}

export async function GET(request: Request) {
  try {
    verifyProfessionalToken(request.headers.get("authorization"));
    await ensureSchema();
    return ok(await sql`
      SELECT id, name, email, bond_type, organization, niche, role, active, created_at
      FROM humanexus_participants ORDER BY created_at DESC LIMIT 100
    `);
  } catch (error) {
    return fail(error, 401);
  }
}
