import postgres from "postgres";

const connection = process.env.DATABASE_URL;

export const sql = postgres(connection ?? "postgres://invalid:invalid@127.0.0.1:1/invalid", {
  ssl: connection ? "require" : false,
  max: 3,
  prepare: false,
  idle_timeout: 20
});

let schemaReady: Promise<void> | null = null;

export function ensureSchema() {
  if (!connection) throw new Error("DATABASE_URL não configurada.");
  schemaReady ??= migrate();
  return schemaReady;
}

async function migrate() {
  await sql`CREATE TABLE IF NOT EXISTS humanexus_schema_migrations (
    version text PRIMARY KEY,
    applied_at timestamptz NOT NULL DEFAULT now()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS humanexus_participants (
    id uuid PRIMARY KEY,
    name text NOT NULL,
    email text NOT NULL,
    phone text,
    bond_type text NOT NULL CHECK (bond_type IN ('PARTICULAR','ORGANIZACIONAL','MISTO')),
    organization text,
    niche text NOT NULL,
    role text,
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS humanexus_participants_email_context
    ON humanexus_participants (lower(email), bond_type, coalesce(organization, ''))`;
  await sql`CREATE TABLE IF NOT EXISTS humanexus_anamneses (
    id uuid PRIMARY KEY,
    participant_id uuid NOT NULL REFERENCES humanexus_participants(id),
    form_version text NOT NULL,
    version_number integer NOT NULL DEFAULT 1,
    previous_id uuid REFERENCES humanexus_anamneses(id),
    state text NOT NULL,
    progress numeric(5,2) NOT NULL DEFAULT 0,
    last_section text,
    consented_at timestamptz,
    completed_at timestamptz,
    reviewed_at timestamptz,
    review_decision text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS humanexus_invites (
    id uuid PRIMARY KEY,
    anamnesis_id uuid NOT NULL REFERENCES humanexus_anamneses(id),
    token_hash text NOT NULL UNIQUE,
    expires_at timestamptz NOT NULL,
    revoked_at timestamptz,
    first_access_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS humanexus_answers (
    id uuid PRIMARY KEY,
    anamnesis_id uuid NOT NULL REFERENCES humanexus_anamneses(id),
    question_id text NOT NULL,
    question_version text NOT NULL,
    answer jsonb NOT NULL,
    control_version integer NOT NULL DEFAULT 1,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(anamnesis_id, question_id)
  )`;
  await sql`CREATE TABLE IF NOT EXISTS humanexus_trigger_hypotheses (
    id uuid PRIMARY KEY,
    anamnesis_id uuid NOT NULL REFERENCES humanexus_anamneses(id),
    question_id text NOT NULL,
    source_category text NOT NULL,
    justification text NOT NULL,
    state text NOT NULL DEFAULT 'HIPOTESE',
    professional_decision text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(anamnesis_id, question_id)
  )`;
  await sql`CREATE TABLE IF NOT EXISTS humanexus_formulations (
    id uuid PRIMARY KEY,
    anamnesis_id uuid NOT NULL REFERENCES humanexus_anamneses(id),
    content jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
  )`;
  await sql`CREATE INDEX IF NOT EXISTS humanexus_anamneses_participant
    ON humanexus_anamneses(participant_id, created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS humanexus_answers_anamnesis
    ON humanexus_answers(anamnesis_id)`;
  await sql`INSERT INTO humanexus_schema_migrations(version)
    VALUES ('0001_g3c_production')
    ON CONFLICT (version) DO NOTHING`;
}
