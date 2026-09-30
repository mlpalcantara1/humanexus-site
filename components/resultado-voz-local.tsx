import type { DiagnosticoVozLocal } from "@/lib/voz-local";

export function ResultadoVozLocal({ estado, texto, diagnostico }: {
  estado: string; texto?: string; diagnostico?: DiagnosticoVozLocal;
}) {
  return <section aria-label="Resultado da voz local">
    <strong>Voz local · resultado para conferência</strong>
    <p role="status" aria-live="polite">{estado}</p>
    {texto !== undefined && <><strong>Texto obtido pelo reconhecimento</strong><p data-portugues-preservar="true" style={{ whiteSpace: "pre-wrap", fontSize: "1rem", lineHeight: 1.5 }}>{texto || "Nenhum texto retornado."}</p></>}
    <small>Português · Whisper Tiny · processamento neste dispositivo. Reconhecimento automático não equivale a revisão profissional.</small>
    {diagnostico && <details><summary>Entrada e percurso do áudio desta tentativa</summary>
      <p>Microfone: {diagnostico.microfone ?? "Aguardando autorização e abertura da entrada."}</p>
      <p>Taxa da entrada: {diagnostico.taxaEntrada === undefined ? "não informada pelo navegador" : `${diagnostico.taxaEntrada} Hz`}; canais: {diagnostico.canaisEntrada ?? "não informados"}. Taxa do contexto de áudio: {diagnostico.taxaContexto === undefined ? "ainda indisponível" : `${diagnostico.taxaContexto} Hz`}.</p>
      <p>Amostras recebidas: {diagnostico.amostrasRecebidas ?? 0}; duração recebida: {diagnostico.duracaoSegundos?.toFixed(2) ?? "indisponível"} s. Amostras enviadas ao reconhecimento a 16 kHz: {diagnostico.amostras16k ?? "ainda não enviadas"}.</p>
      <p>Nível RMS: {diagnostico.rms?.toFixed(4) ?? "sem amostras"}; pico: {diagnostico.pico?.toFixed(4) ?? "sem amostras"}. Nível de áudio não comprova presença ou fidelidade de fala.</p>
      <p>Encerramento: {diagnostico.encerramento ?? "ainda não solicitado"}. Estes dados são temporários; nenhum áudio é armazenado.</p>
    </details>}
  </section>;
}
