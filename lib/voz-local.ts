// Web Audio + ONNX/WASM: mesmo processamento local em navegadores modernos.
export function reamostrar16k(entrada: Float32Array, taxa: number) {
  if (!Number.isFinite(taxa) || taxa <= 0 || entrada.some(v => !Number.isFinite(v))) throw new Error("Áudio ou taxa de amostragem inválidos.");
  if (taxa === 16000) return entrada;
  const razao = taxa / 16000, saida = new Float32Array(Math.floor(entrada.length / razao));
  for (let i = 0; i < saida.length; i++) {
    const ini = Math.floor(i * razao), fim = Math.min(entrada.length, Math.floor((i + 1) * razao));
    let soma = 0; for (let j = ini; j < fim; j++) soma += entrada[j];
    saida[i] = soma / Math.max(1, fim - ini);
  }
  return saida;
}
let motorLocal: Worker | null = null;
let prazoMotor: ReturnType<typeof setTimeout> | undefined;
export function liberarMotorDeVoz() { clearTimeout(prazoMotor); motorLocal?.terminate(); motorLocal = null; }
export type TranscritorLocal = { parar: () => void; cancelar: () => void };
export type DiagnosticoVozLocal = {
  microfone?: string; taxaEntrada?: number; canaisEntrada?: number;
  taxaContexto?: number; amostrasRecebidas?: number; duracaoSegundos?: number;
  pico?: number; rms?: number; amostras16k?: number; encerramento?: string;
};
// Não transforma uma indicação de música/silêncio em observação profissional.
export function textoDeFalaAdmissivel(texto: string) {
  const semIndicacoes = texto.replace(/[\[(]\s*(?:m[uú]sica|music|sil[eê]ncio|silence|ru[ií]do|noise|aplausos|applause|risos|laughter)\s*[\])]/giu, "");
  return /[\p{L}\p{N}]/u.test(semIndicacoes);
}
export async function iniciarTranscricaoLocal(opcoes: {
  estado: (mensagem: string) => void; texto: (texto: string) => void;
  fim: () => void; erro: (mensagem: string) => void;
  obtido?: (texto: string) => void;
  diagnostico?: (dados: DiagnosticoVozLocal) => void;
}): Promise<TranscritorLocal> {
  if (!navigator.mediaDevices?.getUserMedia || !window.AudioContext || !window.Worker) throw new Error("Este navegador não oferece captura local. Atualize-o ou use o ditado do sistema no campo de texto.");
  clearTimeout(prazoMotor);
  // O cache PWA pode servir o módulo anterior antes de atualizá-lo em segundo plano.
  // Versionar o protocolo evita misturar o novo encerramento com um worklet antigo.
  const worker = motorLocal ??= new Worker('/voz-local/transcricao.worker.js?v=2', { type: 'module' });
  let stream: MediaStream | null = null, contexto: AudioContext | null = null, node: AudioWorkletNode | null = null;
  // Criado no gesto do clique, antes do download assíncrono, inclusive em Safari/Firefox.
  contexto = new AudioContext();
  void contexto.resume();
  let encerrado = false, encerrando = false, reconhecendo = false, total = 0, ultimoSom = 0, vozDetectada = 0;
  let energiaTotal = 0, pico = 0, ultimaAtualizacao = 0;
  const diagnostico: DiagnosticoVozLocal = {};
  const informar = () => opcoes.diagnostico?.({ ...diagnostico, amostrasRecebidas: total,
    duracaoSegundos: contexto ? total / contexto.sampleRate : undefined,
    pico, rms: total ? Math.sqrt(energiaTotal / total) : undefined });
  let buffers: Float32Array[] = [], prazo: ReturnType<typeof setTimeout> | undefined;
  const liberarCaptura = () => { stream?.getTracks().forEach((t) => t.stop()); node?.disconnect(); if (contexto && contexto.state !== 'closed') void contexto.close(); clearTimeout(prazo); };
  const concluir = (descartarMotor: boolean) => {
    if (encerrado) return;
    encerrado = true; liberarCaptura(); buffers.forEach((b) => b.fill(0)); buffers = [];
    worker.onmessage = null; worker.onerror = null;
    if (descartarMotor) liberarMotorDeVoz();
    else prazoMotor = setTimeout(liberarMotorDeVoz, 120000);
    opcoes.fim();
  };
  const cancelar = () => concluir(true);
  const falhar = (mensagem: string) => { cancelar(); opcoes.erro(mensagem); };
  const transcrever = () => {
    if (encerrado || reconhecendo) return;
    reconhecendo = true;
    const taxa = contexto!.sampleRate;
    liberarCaptura();
    if (vozDetectada < taxa * .25) { falhar(total ? 'Áudio recebido sem sinal suficiente para reconhecer fala. Nenhuma nota foi criada.' : 'Nenhuma amostra de áudio chegou do microfone. Nenhuma nota foi criada.'); return; }
    const audio = new Float32Array(total); let deslocamento = 0;
    for (const bloco of buffers) { audio.set(bloco, deslocamento); deslocamento += bloco.length; bloco.fill(0); }
    buffers = []; let pcm: Float32Array;
    try { pcm = reamostrar16k(audio, taxa); } catch { audio.fill(0); falhar('Conversão do áudio inválida. Nenhuma nota foi criada.'); return; }
    if (pcm !== audio) audio.fill(0);
    diagnostico.amostras16k = pcm.length; informar();
    opcoes.estado('Transcrevendo no dispositivo; microfone desligado…');
    worker.postMessage({ tipo: 'TRANSCREVER', audio: pcm }, [pcm.buffer]);
    prazo = setTimeout(() => falhar('A transcrição local excedeu o tempo disponível. Dite um trecho mais curto ou registre por texto.'), 90000);
  };
  const parar = (motivo = 'Comando do profissional') => {
    if (encerrado || encerrando || reconhecendo) return;
    if (!node) { cancelar(); opcoes.estado('Preparação cancelada. Nenhuma nota foi criada.'); return; }
    encerrando = true; diagnostico.encerramento = motivo; informar();
    opcoes.estado('Encerrando captura e recolhendo o último bloco de áudio…');
    clearTimeout(prazo);
    node.port.postMessage({ tipo: 'ENCERRAR' });
    prazo = setTimeout(() => falhar('A captura não confirmou o último bloco de áudio. Nenhuma nota foi criada.'), 2000);
  };
  worker.onerror = () => falhar('Não foi possível carregar a transcrição local. Verifique a conexão para o download inicial do modelo.');
  worker.onmessage = async ({ data }) => {
    if (encerrado) return;
    if (data.tipo === 'PROGRESSO') opcoes.estado(`Preparando voz local: ${data.progresso}% (${data.arquivo}). O modelo é baixado da Hugging Face; áudio permanece no dispositivo.`);
    if (data.tipo === 'ERRO') falhar(`Transcrição local indisponível: ${data.mensagem}`);
    if (data.tipo === 'TEXTO') {
      const texto = String(data.texto ?? '').trim(); opcoes.obtido?.(texto);
      if (!textoDeFalaAdmissivel(texto)) { falhar('O reconhecimento não produziu fala utilizável. Resultado exibido abaixo; nenhuma nota foi criada.'); return; }
      opcoes.texto(texto); opcoes.estado('Transcrição obtida — confira o texto abaixo. Fidelidade ainda não confirmada.'); concluir(false);
    }
    if (data.tipo === 'PRONTO') {
      let etapa = 'carregar captura local';
      try {
        clearTimeout(prazo);
        if (encerrado) return;
        await contexto!.audioWorklet.addModule('/voz-local/captura.worklet.js?v=2');
        if (encerrado) return;
        etapa = 'acessar o microfone';
        stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true }, video: false });
        if (encerrado) { stream.getTracks().forEach((t) => t.stop()); return; }
        const trilha = stream.getAudioTracks()[0];
        if (!trilha) throw new Error('Nenhuma entrada de áudio disponível.');
        const ajustes = trilha.getSettings();
        Object.assign(diagnostico, { microfone: trilha.label || 'Nome da entrada não fornecido pelo navegador', taxaEntrada: ajustes.sampleRate, canaisEntrada: ajustes.channelCount, taxaContexto: contexto!.sampleRate }); informar();
        trilha.addEventListener('ended', () => { if (!encerrado && !encerrando && !reconhecendo) falhar('O microfone foi desconectado durante a captura. Nenhuma nota foi criada.'); });
        etapa = 'conectar áudio local';
        node = new AudioWorkletNode(contexto, 'captura-profissional');
        const mudo = contexto.createGain(); mudo.gain.value = 0;
        contexto.createMediaStreamSource(stream).connect(node); node.connect(mudo); mudo.connect(contexto.destination);
        node.port.onmessage = ({ data: bloco }: { data: Float32Array | { tipo: string } }) => {
          if (encerrado || reconhecendo) return;
          if (!(bloco instanceof Float32Array)) { if (encerrando && bloco?.tipo === 'ENCERRADO') transcrever(); return; }
          const taxa = contexto!.sampleRate;
          let energia = 0; for (const v of bloco) { energia += v * v; pico = Math.max(pico, Math.abs(v)); }
          energiaTotal += energia;
          if (Math.sqrt(energia / bloco.length) > .008) { ultimoSom = total; vozDetectada += bloco.length; }
          buffers.push(bloco); total += bloco.length;
          if (total - ultimaAtualizacao >= taxa) { ultimaAtualizacao = total; informar(); }
          if (total >= taxa * 25) parar('Limite de 25 segundos');
          else if (vozDetectada > taxa * .3 && total - ultimoSom > taxa * 1.5) parar('Pausa de 1,5 segundo no sinal');
        };
        etapa = 'ativar áudio local';
        await contexto.resume();
        opcoes.estado('Microfone local ativo. Dite sua observação e faça uma pausa para salvar. Limite de 25 segundos por nota.');
        prazo = setTimeout(() => parar('Limite de espera da captura'), 27000);
      } catch (e) { falhar(`Não foi possível ${etapa}: ${e instanceof Error ? e.message : 'permissão indisponível'}`); }
    }
  };
  opcoes.estado('Preparando modelo aberto de voz local (primeiro uso: download; nenhum áudio é enviado)…');
  worker.postMessage({ tipo: 'CARREGAR' });
  prazo = setTimeout(() => falhar('Download do modelo incompleto. Tente novamente com conexão disponível; o texto já registrado foi preservado.'), 180000);
  return { parar, cancelar };
}
