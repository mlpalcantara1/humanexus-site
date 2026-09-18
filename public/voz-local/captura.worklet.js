class CapturaProfissional extends AudioWorkletProcessor {
  constructor() { super(); this.buffer = new Float32Array(2048); this.pos = 0; }
  process(inputs) {
    const canal = inputs[0]?.[0];
    if (canal) for (const valor of canal) {
      this.buffer[this.pos++] = valor;
      if (this.pos === this.buffer.length) {
        this.port.postMessage(this.buffer, [this.buffer.buffer]);
        this.buffer = new Float32Array(2048); this.pos = 0;
      }
    }
    return true;
  }
}
registerProcessor('captura-profissional', CapturaProfissional);
