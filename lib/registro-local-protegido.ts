import { chaveDoRegistro, recuperarRascunho, type RascunhoLocal } from '@/lib/registro-integrado';

export const PREFIXO_CIFRADO = 'humanexus:registro:cifrado:v1:';
const chaves = new Map<string, CryptoKey>();
let pendente: Promise<unknown> = Promise.resolve();
const naoGravados = new Map<string, { contexto: string; cifrado: string }>();
export function pendenciasParaCopia() { return [...naoGravados.entries()].map(([id, v]) => ({ id, ...v })); }
const bytesHex = (s: string) => Uint8Array.from(s.match(/../g) ?? [], x => parseInt(x, 16));
const hex = (b: Uint8Array) => Array.from(b, x => x.toString(16).padStart(2, '0')).join('');
export async function importarChave(profissional: string, segredo: string) {
  if (!/^[a-f0-9]{64}$/.test(segredo)) throw new Error('Chave local inválida.');
  const chave = await crypto.subtle.importKey('raw', bytesHex(segredo), 'AES-GCM', false, ['encrypt', 'decrypt']);
  chaves.set(profissional, chave);
  return chave;
}
export async function obterChave(profissional?: string) {
  if (profissional && chaves.has(profissional)) return { profissional, chave: chaves.get(profissional)! };
  const r = await fetch('/api/registro-local/chave', { cache: 'no-store' });
  if (!r.ok) throw new Error('Não foi possível abrir a recuperação privada dos registros.');
  const d = await r.json();
  if (profissional && d.profissional !== profissional) throw new Error('Profissional divergente; nenhum rascunho foi aberto.');
  return { profissional: String(d.profissional), chave: await importarChave(String(d.profissional), String(d.chave)) };
}
export async function cifrar(chave: CryptoKey, contexto: string, valor: RascunhoLocal) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cifrado = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: new TextEncoder().encode(contexto) }, chave, new TextEncoder().encode(JSON.stringify(valor)));
  return JSON.stringify({ versao: 1, iv: hex(iv), dados: hex(new Uint8Array(cifrado)) });
}
export async function decifrar(chave: CryptoKey, contexto: string, valor: string) {
  const envelope = JSON.parse(valor);
  if (envelope.versao !== 1) throw new Error('Registro protegido incompatível.');
  const texto = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytesHex(envelope.iv), additionalData: new TextEncoder().encode(contexto) }, chave, bytesHex(envelope.dados));
  return recuperarRascunho(new TextDecoder().decode(texto));
}
export function salvarProtegido(storage: Storage, id: string, contexto: string, chave: CryptoKey, valor: RascunhoLocal) {
  const copia = JSON.parse(JSON.stringify(valor)) as RascunhoLocal;
  const salvar = async () => {
    const cifrado = await cifrar(chave, contexto, copia);
    naoGravados.set(id, { contexto, cifrado });
    storage.setItem(id, cifrado);
    naoGravados.delete(id);
  };
  pendente = pendente.then(salvar, salvar);
  return pendente;
}
export async function aguardarPersistencia() {
  await pendente;
  if (naoGravados.size) throw new Error('Há diários sem confirmação de gravação local.');
}
export function limparChaves() { chaves.clear(); }
export function contextoLegado(id: string) {
  const prefixo = 'humanexus:registro:v1:';
  if (!id.startsWith(prefixo)) return null;
  const partes = id.slice(prefixo.length).split(':');
  if (partes.length !== 5) return null;
  const escopo = partes.slice(0, 4).map(decodeURIComponent);
  return { contexto: chaveDoRegistro(escopo[0], escopo[1], escopo[2], escopo[3]), profissional: escopo[3] };
}
export async function protegerLegados(storage: Storage, profissional: string, chave: CryptoKey) {
  for (const id of Object.keys(storage)) {
    const escopo = contextoLegado(id);
    if (!escopo || escopo.profissional !== profissional) continue;
    const valor = storage.getItem(id);
    if (!valor) continue;
    const destino = PREFIXO_CIFRADO + id;
    await salvarProtegido(storage, destino, escopo.contexto, chave, recuperarRascunho(valor));
    storage.removeItem(id); // Apenas após confirmação da cópia cifrada.
  }
}
export function limparAposLogout(obterStorage: Storage | (() => Storage)) {
  try {
    const storage = typeof obterStorage === 'function' ? obterStorage() : obterStorage;
    for (const id of Object.keys(storage)) {
      // Diários cifrados sobrevivem à autenticação. Legados não migrados nunca
      // são descartados silenciosamente nem apresentados a outro profissional.
      if (/^(hx-|humanexus)/i.test(id) && !id.startsWith(PREFIXO_CIFRADO) && !contextoLegado(id)) storage.removeItem(id);
    }
    return true;
  } catch {
    // Armazenamento bloqueado não pode impedir a saída e limpeza das chaves.
    return false;
  } finally {
    limparChaves();
  }
}

export function baixarCopiaPrivada() {
  const entradas = pendenciasParaCopia();
  if (!entradas.length) return false;
  const url = URL.createObjectURL(new Blob([JSON.stringify({ versao: 1, entradas })], { type: 'application/json' }));
  const a = document.createElement('a'); a.href = url; a.download = 'humanexus-registros-pendentes-cifrados.json';
  a.click(); setTimeout(() => URL.revokeObjectURL(url), 10000);
  return true;
}
