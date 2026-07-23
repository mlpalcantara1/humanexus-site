import { createHash, createHmac, timingSafeEqual } from "node:crypto";

function secret(name: string) {
  const value = process.env[name];
  if (!value || value.length < 32) throw new Error(`${name} não configurado com segurança.`);
  return value;
}

function encode(value: Buffer | string) {
  return Buffer.from(value).toString("base64url");
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createInviteToken(inviteId: string, expiresAt: Date) {
  const body = encode(JSON.stringify({ invite: inviteId, exp: Math.floor(expiresAt.getTime() / 1000) }));
  const signature = createHmac("sha256", secret("HUMANEXUS_INVITE_SECRET")).update(body).digest("base64url");
  return `${body}.${signature}`;
}

export function verifyInviteToken(token: string): { invite: string; exp: number } {
  const [body, supplied] = token.split(".");
  if (!body || !supplied) throw new Error("Convite inválido.");
  const expected = createHmac("sha256", secret("HUMANEXUS_INVITE_SECRET")).update(body).digest();
  const received = Buffer.from(supplied, "base64url");
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) throw new Error("Convite inválido.");
  const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  if (payload.exp <= Math.floor(Date.now() / 1000)) throw new Error("Convite expirado.");
  return payload;
}

export function createProfessionalToken(email: string) {
  const body = encode(JSON.stringify({ email, exp: Math.floor(Date.now() / 1000) + 8 * 3600 }));
  const signature = createHmac("sha256", secret("HUMANEXUS_AUTH_SECRET")).update(body).digest("base64url");
  return `${body}.${signature}`;
}

export function verifyProfessionalToken(header: string | null) {
  if (!header?.startsWith("Bearer ")) throw new Error("Acesso profissional necessário.");
  const token = header.slice(7);
  const [body, supplied] = token.split(".");
  const expected = createHmac("sha256", secret("HUMANEXUS_AUTH_SECRET")).update(body).digest();
  const received = Buffer.from(supplied ?? "", "base64url");
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) throw new Error("Sessão inválida.");
  const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  if (payload.exp <= Math.floor(Date.now() / 1000)) throw new Error("Sessão expirada.");
  return payload as { email: string; exp: number };
}

export function verifyProfessionalCredentials(email: string, password: string) {
  const configuredEmail = process.env.HUMANEXUS_PROFESSIONAL_EMAIL ?? "";
  const configuredPassword = process.env.HUMANEXUS_PROFESSIONAL_PASSWORD ?? "";
  const supplied = createHash("sha256").update(`${email}\0${password}`).digest();
  const expected = createHash("sha256").update(`${configuredEmail}\0${configuredPassword}`).digest();
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}
