import './cpu-only.js';
import { pipeline, env } from './runtime-3.8.1/transformers.min.js';
// Somente pesos públicos entram pela rede. Nunca há upload de áudio.
env.allowLocalModels = false;
env.backends.onnx.wasm.wasmPaths = new URL('./runtime-3.8.1/', import.meta.url).href;
env.backends.onnx.wasm.numThreads = 1;
env.backends.onnx.wasm.proxy = false;
let modelo;
const carregar = () => modelo ??= pipeline('automatic-speech-recognition', 'onnx-community/whisper-tiny', {
  revision: 'ff4177021cc41f7db950912b73ea4fdf7d01d8e7', device: 'wasm', dtype: 'q8',
  progress_callback: (p) => { if (p.status === 'progress') self.postMessage({ tipo: 'PROGRESSO', progresso: Math.round(p.progress), arquivo: p.file }); }
});
self.onmessage = async ({ data }) => {
  try {
    const transcrever = await carregar();
    if (data.tipo === 'CARREGAR') { self.postMessage({ tipo: 'PRONTO' }); return; }
    if (data.tipo !== 'TRANSCREVER' || !(data.audio instanceof Float32Array) || data.audio.length < 4000 || data.audio.length > 16000 * 31) throw new Error('Trecho de áudio inválido.');
    try {
      const resultado = await transcrever(data.audio, { language: 'portuguese', task: 'transcribe', return_timestamps: false, max_new_tokens: 160, do_sample: false });
      self.postMessage({ tipo: 'TEXTO', texto: String(resultado.text ?? '').trim() });
    } finally { data.audio.fill(0); }
  } catch (erro) { modelo = undefined; self.postMessage({ tipo: 'ERRO', mensagem: String(erro?.message ?? erro) }); }
};
