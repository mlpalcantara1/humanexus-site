import { ensureSchema, sql } from "@/lib/humanexus-db";
import { fail, ok } from "@/lib/humanexus-http";

export async function GET() {
  try {
    await ensureSchema();
    const [migration] = await sql`SELECT version, applied_at FROM humanexus_schema_migrations ORDER BY applied_at DESC LIMIT 1`;
    return ok({ estado: "SAUDAVEL", banco: "POSTGRESQL", migration, algoritmo_alterado: false });
  } catch (error) {
    return fail(error, 503);
  }
}
