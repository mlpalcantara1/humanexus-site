import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const raiz = new URL("../", import.meta.url);
const fonte = (caminho) => readFile(new URL(caminho, raiz), "utf8");

test("captura multimodal usa APIs reais e fila IndexedDB sem localStorage", async () => {
  const captura = await fonte("components/captura-multimodal.tsx");
  for (const contrato of [
    "navigator.mediaDevices.getUserMedia",
    "navigator.mediaDevices.enumerateDevices",
    "MediaRecorder",
    "indexedDB.open",
    'crypto.subtle.digest("SHA-256"',
    "SINCRONIZAÇÃO_PENDENTE",
    "PERSISTIDO",
    "performance.now",
    "screen.orientation",
    "audio/webm",
    "video/webm"
  ]) {
    assert.match(captura, new RegExp(contrato.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.doesNotMatch(captura, /localStorage/);
});

test("token limitado não é persistido nem enviado em URL de API", async () => {
  const captura = await fonte("components/captura-multimodal.tsx");
  const api = await fonte("app/api/captura-sessao/route.ts");
  assert.match(captura, /x-humanexus-capture-token/);
  assert.match(api, /x-humanexus-capture-token/);
  assert.match(api, /\/api\/v1\/captura-segura/);
  assert.doesNotMatch(api, /console\.(log|error).*token/);
  assert.doesNotMatch(captura, /sessionStorage|localStorage/);
});

test("Cockpit integra configuração, QR, mídia protegida e Replay", async () => {
  const controle = await fonte("components/controle-gravacao-multimodal.tsx");
  const cockpit = await fonte("components/operacao-homologacao.tsx");
  const streaming = await fonte("app/api/plataforma/midias/[id]/route.ts");
  assert.match(controle, /QRCode\.toDataURL/);
  assert.match(controle, /AUDIO_E_VIDEO/);
  assert.match(controle, /BASELINE.*PRE.*TREINO.*POS/s);
  assert.match(cockpit, /ControleGravacaoMultimodal/);
  assert.match(cockpit, /hx-replay-media/);
  assert.match(cockpit, /<video controls/);
  assert.match(cockpit, /<audio controls/);
  assert.match(streaming, /COOKIE_SESSAO/);
  assert.match(streaming, /private, no-store/);
});

test("Regra Áurea aparece somente na governança autenticada", async () => {
  const governanca = await fonte("components/governanca-operacional.tsx");
  const rota = await fonte("app/api/plataforma/governanca-operacional/route.ts");
  assert.match(governanca, /REGRA ÁUREA/);
  assert.match(governanca, /SESSÕES ATIVAS/);
  assert.match(governanca, /AUTORIZAÇÃO TÉCNICA TEMPORÁRIA/);
  assert.match(governanca, /SEGREDO INDUSTRIAL/);
  assert.match(rota, /COOKIE_SESSAO/);
  assert.match(rota, /seguranca-proprietario/);
  assert.match(rota, /exigirCsrf/);
});
