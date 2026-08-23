import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("autoridade documental usa cadastro civil, CPF e organização reais", async () => {
  const autoridade = await source("lib/humanexus-report-authority.ts");
  const rota = await source("app/api/operacao-homologacao/route.ts");
  assert.match(autoridade, /perfil_operacional/);
  assert.match(autoridade, /dados_cadastrais/);
  assert.match(autoridade, /documentos/);
  assert.match(autoridade, /formatarCpfDocumental/);
  assert.match(rota, /nome: identidadeDocumental\.nomeCompleto/);
  assert.match(rota, /cpf_documental: identidadeDocumental\.cpf/);
  assert.doesNotMatch(rota, /nome:\s*nomeDoParticipante\s*\?\?/);
});

test("consolidação profissional possui quatorze campos, não autosalva e cria versão append-only", async () => {
  const autoridade = await source("lib/humanexus-report-authority.ts");
  const componente = await source("components/consolidacao-profissional-relatorio.tsx");
  const rota = await source("app/api/operacao-homologacao/route.ts");
  const campos = [
    "contexto_e_objetivo",
    "evidencias_utilizadas",
    "observacoes_por_fase",
    "intervencao",
    "resposta_observada",
    "interpretacao_profissional",
    "recursos_regulatorios_observados",
    "pontos_de_atencao",
    "limitacoes",
    "conclusao",
    "justificativa",
    "recomendacao",
    "proximo_passo_regulatorio",
    "conteudo_da_devolutiva_ao_participante"
  ];
  for (const campo of campos) assert.match(autoridade, new RegExp(`"${campo}"`));
  assert.match(componente, /Nada é salvo automaticamente/);
  assert.match(componente, /CRIAR VERSÃO CONSOLIDADA/);
  assert.doesNotMatch(componente, /useEffect\([\s\S]*consolidar/);
  assert.match(rota, /identificador_da_serie: anterior\.identificador_da_serie/);
  assert.match(rota, /Consolidação profissional append-only/);
});

test("fluxo humano é Síntese, Consolidação, Relatório e bloqueia PDF final incompleto", async () => {
  const cockpit = await source("components/operacao-homologacao.tsx");
  const pdf = await source("app/api/operacao-homologacao/pdf/route.ts");
  const bloco = cockpit.slice(
    cockpit.indexOf("const visaoRelatorio"),
    cockpit.indexOf("const visaoColetiva")
  );
  const sintese = bloco.indexOf("<SinteseValidacaoTirhV1");
  const consolidacao = bloco.indexOf("<ConsolidacaoProfissionalDoRelatorio");
  const relatorio = bloco.indexOf("<RelatorioCanonicoV1");
  assert.ok(sintese >= 0 && consolidacao > sintese && relatorio > consolidacao);
  assert.match(cockpit, /cicloDoRelatorioAtual\.finalDisponivel/);
  assert.match(cockpit, /Enviar para validação/);
  assert.match(cockpit, /Validar relatório final/);
  assert.match(pdf, /RELATORIO_FINAL_INDISPONIVEL/);
  assert.match(pdf, /status: 409/);
});

test("relatório humano explica vetores, VEV, Resultante, IIRH, Zona, rotas e devolutiva", async () => {
  const cockpit = await source("components/operacao-homologacao.tsx");
  for (const termo of [
    "NOVE VETORES MOMENTÂNEOS",
    "VEV LONGITUDINAL",
    "RESULTANTE, IIRH, ZONA E TRAJETÓRIA",
    "ARR / RRD / GRI / CRL / NRA",
    "HX-OBS → TCR → ICR",
    "DEVOLUTIVA AO PARTICIPANTE",
    "Campos que impedem o relatório final"
  ]) assert.match(cockpit, new RegExp(termo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.doesNotMatch(cockpit, /Magnitude escalar da Resultante:\s*\{?[^\n]*\|\|\s*0/);
});

test("coletivo mostra formação automática sem nome, CPF ou média individual", async () => {
  const cockpit = await source("components/operacao-homologacao.tsx");
  const rota = await source("app/api/operacao-homologacao/route.ts");
  assert.match(rota, /populacao_coletiva/);
  assert.match(cockpit, /membros_organizacionais_automaticos/);
  assert.match(cockpit, /COLETIVO EM FORMAÇÃO/);
  assert.match(cockpit, /CPF e identidades individuais: NÃO EXPOSTOS/);
  assert.match(cockpit, /Nenhuma média individual é calculada/);
  assert.doesNotMatch(cockpit, /Não há equipe autorizada, finalidade coletiva/);
});

test("coletivo expõe individualmente somente referência operacional autorizada", async () => {
  const cockpit = await source("components/operacao-homologacao.tsx");
  const rota = await source("app/api/operacao-homologacao/route.ts");
  const coletivo = cockpit.slice(
    cockpit.indexOf("const visaoColetiva"),
    cockpit.indexOf("const visaoTecnica")
  );
  const dto = rota.slice(
    rota.indexOf("function sanitizarDtoDaPopulacaoColetiva"),
    rota.indexOf("async function atualizacaoLeve")
  );
  assert.match(cockpit, /data-collective-visible-identifier="REFERENCIA_OPERACIONAL_ONLY"/);
  assert.match(coletivo, /referenciasColetivasFiltradas/);
  assert.doesNotMatch(coletivo, /estado\.participante|nome_documental|cpf_documental/);
  assert.match(dto, /referencia_operacional/);
  assert.match(dto, /REFERENCIA_OPERACIONAL_ONLY/);
  assert.doesNotMatch(dto, /nome_completo|nome_social|nome_preferencial|cpf_documental|data_de_nascimento|email|telefone|documentos/);
});

test("PDF final usa identidade atual e paginação dirigida por conteúdo", async () => {
  const pdf = await source("lib/tirh-report-document.ts");
  assert.match(pdf, /resolverIdentidadeDocumental/);
  assert.match(pdf, /renderOperacionalFinalConsolidado/);
  assert.match(pdf, /if \(y \+ alturaDoItem > 735\) novaContinuacao\(\)/);
  assert.doesNotMatch(
    pdf.slice(pdf.indexOf("function renderOperacionalFinalConsolidado")),
    /Nenhum registro autorizado para esta seção/
  );
});

test("layout funcional é responsivo e impressão oculta formulários", async () => {
  const css = await source("app/operational.css");
  assert.match(css, /@media \(max-width: 820px\)[\s\S]*hx-professional-consolidation__fields[\s\S]*grid-template-columns: 1fr/);
  assert.match(css, /@media print[\s\S]*hx-professional-consolidation[\s\S]*display: none !important/);
});

test("rotas modulares reutilizam relatório e coletivo governados sem implementação paralela", async () => {
  const cockpit = await source("components/operacao-homologacao.tsx");
  const moduloRelatorios = cockpit.slice(
    cockpit.indexOf('if (modulo === "relatorios")'),
    cockpit.indexOf('if (modulo === "longitudinal")')
  );
  const moduloColetivo = cockpit.slice(
    cockpit.indexOf('if (modulo === "indicador-coletivo")'),
    cockpit.indexOf('if (modulo === "painel")')
  );
  assert.match(moduloRelatorios, /\{visaoRelatorio\}/);
  assert.doesNotMatch(moduloRelatorios, /Baixar PDF A4 claro|Materializar entregas finais/);
  assert.match(moduloColetivo, /\{visaoColetiva\}/);
  assert.doesNotMatch(moduloColetivo, /A sessão atual é técnica e individual/);
});

test("carregamento progressivo não apresenta ausência como conclusão", async () => {
  const cockpit = await source("components/operacao-homologacao.tsx");
  assert.match(cockpit, /carregandoFontesAutorizadas/);
  assert.match(cockpit, /data-authoritative-loading-state="PENDING"/);
  assert.match(cockpit, /Nenhuma ausência é conclusiva durante este estado/);
  assert.match(cockpit, /Nenhum vazio é conclusivo durante este estado/);
});
