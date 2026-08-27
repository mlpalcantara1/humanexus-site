import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function source(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("P2 — envio móvel possui limite, trava de duplo toque e erro recuperável", async () => {
  const participante = await source("components/anamnese-participante.tsx");
  const estilos = await source("app/anamnese-operacional.css");
  assert.match(participante, /TEMPO_LIMITE_DA_ANAMNESE_MS = 25_000/);
  assert.match(participante, /if \(conclusionLock\.current\) return/);
  assert.match(participante, /aria-busy=\{submitting\}/);
  assert.match(participante, /Nenhuma resposta foi apagada/);
  assert.match(participante, /setSyncMessage/);
  assert.match(participante, /role="alert" aria-live="assertive"/);
  assert.match(estilos, /position:sticky/);
  assert.match(estilos, /safe-area-inset-bottom/);
  assert.match(estilos, /font-size:16px;min-height:48px/);
});

test("P2 — proxy preserva causa humana, expiração e timeout sem escrita duplicada", async () => {
  const convite = await source("app/api/humanexus/convites/[token]/route.ts");
  const resposta = await source(
    "app/api/humanexus/convites/[token]/respostas/[question]/route.ts"
  );
  const api = await source("lib/humanexus-api.ts");
  assert.match(convite, /tempoLimiteMs: 20_000/g);
  assert.match(resposta, /tempoLimiteMs: 20_000/);
  assert.match(resposta, /O conteúdo foi preservado para uma nova tentativa/);
  assert.match(resposta, /status: conviteIndisponivel \? 410 : erro\.status/);
  assert.match(api, /readonly status: number/);
  assert.match(api, /readonly codigo: string/);
});

test("P3 — autoridade documental indisponível bloqueia PDF e preserva pendências", async () => {
  const {
    CAMPOS_PROFISSIONAIS_DO_RELATORIO,
    projetarEstadoFuncionalDoRelatorio
  } = await import("../lib/humanexus-report-authority.ts");
  const incompleto = projetarEstadoFuncionalDoRelatorio({
    identificador: "relatorio-incompleto",
    estado_funcional: "AGUARDANDO_CONSOLIDACAO_PROFISSIONAL",
    estado_documental: "RASCUNHO",
    consolidacao_profissional: { conclusao: "Registro parcial" }
  });
  assert.equal(incompleto.finalDisponivel, false);
  assert.ok(incompleto.rotulosAusentes.length > 0);

  const consolidacao = Object.fromEntries(
    CAMPOS_PROFISSIONAIS_DO_RELATORIO.map(([campo]) => [campo, `conteúdo ${campo}`])
  );
  const completo = projetarEstadoFuncionalDoRelatorio({
    identificador: "relatorio-completo",
    estado_funcional: "RELATORIO_FINAL_VALIDADO",
    estado_documental: "CONCLUIDO",
    consolidacao_profissional: consolidacao
  });
  assert.equal(completo.finalDisponivel, true);
  assert.equal(completo.rotulosAusentes.length, 0);
});

test("P3 — PDF e impressão interceptam indisponibilidade sem abrir ou baixar JSON", async () => {
  const operacao = await source("components/operacao-homologacao.tsx");
  const consolidacao = await source(
    "components/consolidacao-profissional-relatorio.tsx"
  );
  const rota = await source("app/api/operacao-homologacao/pdf/route.ts");
  assert.match(operacao, /accept: "application\/pdf, application\/json"/);
  assert.match(operacao, /tipo\.includes\("application\/pdf"\)/);
  assert.match(operacao, /RELATORIO_FINAL_INDISPONIVEL/);
  assert.match(operacao, /Relatório final ainda não disponível/);
  assert.match(operacao, /camposPendentesDoDocumento/);
  assert.match(operacao, /IR PARA CONSOLIDAÇÃO PROFISSIONAL/);
  assert.match(operacao, /<button className="hx-op-button" type="button" disabled>Baixar PDF final<\/button>/);
  assert.doesNotMatch(operacao, /href=\{pdfHref\} download/);
  assert.doesNotMatch(operacao, /href=\{`\$\{pdfHref\}&modo=impressao`\}/);
  assert.match(consolidacao, /id="consolidacao-profissional"/);
  assert.match(rota, /url\.searchParams\.get\("modo"\) === "disponibilidade"/);
  assert.match(rota, /somenteDisponibilidade/);
  assert.match(rota, /codigo: "RELATORIO_FINAL_INDISPONIVEL"/);
  assert.match(rota, /status: 409/);
  assert.match(rota, /"content-type": "application\/pdf"/);
});
