class CapturaProfissional extends AudioWorkletProcessor {
  constructor() {
    super(); this.buffer = new Float32Array(2048); this.pos = 0; this.encerrado = false;
    this.port.onmessage = ({ data }) => {
      if (data?.tipo !== 'ENCERRAR' || this.encerrado) return;
      this.encerrado = true;
      if (this.pos) {
        const restante = this.buffer.slice(0, this.pos);
        this.port.postMessage(restante, [restante.buffer]);
      }
      this.buffer.fill(0); this.pos = 0;
      this.port.postMessage({ tipo: 'ENCERRADO' });
    };
  }
  process(inputs) {
    if (this.encerrado) return false;
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
