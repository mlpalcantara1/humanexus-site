import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { COOKIE_SESSAO } from '@/lib/portal-session';
import { requisitarNucleoAutenticado } from '@/lib/humanexus-core';
export async function GET() {
  const token = (await cookies()).get(COOKIE_SESSAO)?.value;
  if (!token) return NextResponse.json({ erro: 'Sessão ausente' }, { status: 401 });
  try {
    const r = await requisitarNucleoAutenticado('/api/v1/registro-local/chave', token, {}, { tentativas: 1, tempoLimiteMs: 10000 });
    return NextResponse.json(r, { headers: { 'cache-control': 'private, no-store' } });
  } catch { return NextResponse.json({ erro: 'Recuperação privada indisponível' }, { status: 503 }); }
}
