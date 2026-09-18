// Processamento exclusivamente CPU/WASM, inclusive na detecção inicial da biblioteca.
// Evita criar GPUDevice durante a importação e sua destruição no WebKit.
Object.defineProperty(self.navigator, 'gpu', { value: undefined, configurable: true });
