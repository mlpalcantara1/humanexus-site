// Web Audio + ONNX/WASM: mesmo processamento local em navegadores modernos.
export function reamostrar16k(entrada: Float32Array, taxa: number) {
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
export async function iniciarTranscricaoLocal(opcoes: {
  estado: (mensagem: string) => void; texto: (texto: string) => void;
  fim: () => void; erro: (mensagem: string) => void;
}): Promise<TranscritorLocal> {
  if (!navigator.mediaDevices?.getUserMedia || !window.AudioContext || !window.Worker) throw new Error("Este navegador não oferece captura local. Atualize-o ou use o ditado do sistema no campo de texto.");
  clearTimeout(prazoMotor);
  const worker = motorLocal ??= new Worker('/voz-local/transcricao.worker.js', { type: 'module' });
  let stream: MediaStream | null = null, contexto: AudioContext | null = null, node: AudioWorkletNode | null = null;
  // Criado no gesto do clique, antes do download assíncrono, inclusive em Safari/Firefox.
  contexto = new AudioContext();
  void contexto.resume();
  let encerrado = false, reconhecendo = false, total = 0, ultimoSom = 0, vozDetectada = 0;
  let buffers: Float32Array[] = [], prazo: ReturnType<typeof setTimeout> | undefined;
  const liberarCaptura = () => { stream?.getTracks().forEach((t) => t.stop()); node?.disconnect(); if (contexto && contexto.state !== 'closed') void contexto.close(); clearTimeout(prazo); };
  const concluir = (descartarMotor: boolean) => {
    encerrado = true; liberarCaptura(); buffers.forEach((b) => b.fill(0)); buffers = [];
    worker.onmessage = null; worker.onerror = null;
    if (descartarMotor) liberarMotorDeVoz();
    else prazoMotor = setTimeout(liberarMotorDeVoz, 120000);
    opcoes.fim();
  };
  const cancelar = () => concluir(true);
  const falhar = (mensagem: string) => { cancelar(); opcoes.erro(mensagem); };
  const parar = () => {
    if (encerrado || reconhecendo) return;
    reconhecendo = true;
    const taxa = contexto?.sampleRate ?? 48000;
    liberarCaptura();
    if (vozDetectada < taxa * .25) { cancelar(); opcoes.estado('Nenhuma fala detectada. Nenhuma nota foi criada.'); return; }
    const audio = new Float32Array(total); let deslocamento = 0;
    for (const bloco of buffers) { audio.set(bloco, deslocamento); deslocamento += bloco.length; bloco.fill(0); }
    buffers = []; const pcm = reamostrar16k(audio, taxa); if (pcm !== audio) audio.fill(0);
    opcoes.estado('Transcrevendo no dispositivo; microfone desligado…');
    worker.postMessage({ tipo: 'TRANSCREVER', audio: pcm }, [pcm.buffer]);
    prazo = setTimeout(() => falhar('A transcrição local excedeu o tempo disponível. Dite um trecho mais curto ou registre por texto.'), 90000);
  };
  worker.onerror = () => falhar('Não foi possível carregar a transcrição local. Verifique a conexão para o download inicial do modelo.');
  worker.onmessage = async ({ data }) => {
    if (encerrado) return;
    if (data.tipo === 'PROGRESSO') opcoes.estado(`Preparando voz local: ${data.progresso}% (${data.arquivo}). O modelo é baixado da Hugging Face; áudio permanece no dispositivo.`);
    if (data.tipo === 'ERRO') falhar(`Transcrição local indisponível: ${data.mensagem}`);
    if (data.tipo === 'TEXTO') { if (data.texto) opcoes.texto(data.texto); concluir(false); }
    if (data.tipo === 'PRONTO') {
      let etapa = 'carregar captura local';
      try {
        clearTimeout(prazo);
        if (encerrado) return;
        await contexto!.audioWorklet.addModule('/voz-local/captura.worklet.js');
        if (encerrado) return;
        etapa = 'acessar o microfone';
        stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true }, video: false });
        if (encerrado) { stream.getTracks().forEach((t) => t.stop()); return; }
        etapa = 'conectar áudio local';
        node = new AudioWorkletNode(contexto, 'captura-profissional');
        const mudo = contexto.createGain(); mudo.gain.value = 0;
        contexto.createMediaStreamSource(stream).connect(node); node.connect(mudo); mudo.connect(contexto.destination);
        node.port.onmessage = ({ data: bloco }: { data: Float32Array }) => {
          if (encerrado || reconhecendo) return;
          const taxa = contexto!.sampleRate;
          let energia = 0; for (const v of bloco) energia += v * v;
          if (Math.sqrt(energia / bloco.length) > .008) { ultimoSom = total; vozDetectada += bloco.length; }
          buffers.push(bloco); total += bloco.length;
          if (total >= taxa * 25 || (vozDetectada > taxa * .3 && total - ultimoSom > taxa * 1.5)) parar();
        };
        etapa = 'ativar áudio local';
        await contexto.resume();
        opcoes.estado('Microfone local ativo. Dite sua observação e faça uma pausa para salvar. Limite de 25 segundos por nota.');
        prazo = setTimeout(parar, 27000);
      } catch (e) { falhar(`Não foi possível ${etapa}: ${e instanceof Error ? e.message : 'permissão indisponível'}`); }
    }
  };
  opcoes.estado('Preparando modelo aberto de voz local (primeiro uso: download; nenhum áudio é enviado)…');
  worker.postMessage({ tipo: 'CARREGAR' });
  prazo = setTimeout(() => falhar('Download do modelo incompleto. Tente novamente com conexão disponível; o texto já registrado foi preservado.'), 180000);
  return { parar, cancelar };
}
