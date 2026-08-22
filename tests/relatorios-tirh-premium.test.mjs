import assert from "node:assert/strict";
import { mkdtemp, readFile, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const root = new URL("../", import.meta.url);
const source = (path) => readFile(new URL(path, root), "utf8");

const documentos = [
  ["relatorio-operacional-tirh-fixture.pdf", 9],
  ["relatorio-cientifico-tirh-fixture.pdf", 8],
  ["relatorio-executivo-tirh-fixture.pdf", 6],
  ["relatorio-tecnico-sistema-fixture.pdf", 3],
  ["formulacao-regulatoria-tirh-fixture.pdf", 6],
];

test("arquitetura documental contém cinco produtos TIRH independentes", async () => {
  const pdf = await source("lib/tirh-report-document.ts");
  for (const tipo of [
    "OPERACIONAL_TIRH",
    "CIENTIFICO_TIRH",
    "EXECUTIVO",
    "TECNICO",
    "FORMULACAO_REGULATORIA",
  ]) assert.match(pdf, new RegExp(tipo));
  for (const vetor of ["VH", "VT", "VS", "VSI", "VAR", "VAM", "VJ", "VE", "VR", "VEV"])
    assert.match(pdf, new RegExp(`\\["${vetor}"`));
  assert.match(pdf, /HIPÓTESE OPERACIONAL v0\.1 — EM VALIDAÇÃO EMPÍRICA/);
  assert.match(pdf, /Reorganização da Rota Operacional/);
  assert.match(pdf, /Nova Rota Adaptativa/);
  for (const zona of ["Zona Ótima", "Zona Adaptativa", "Zona de Instabilidade", "Zona de Comprometimento Funcional"])
    assert.match(pdf, new RegExp(zona));
  for (const zonaAntiga of ["Zona Funcional", "Zona de Sobrecarga", "Zona de Desregulação", "Zona de Colapso"])
    assert.doesNotMatch(pdf, new RegExp(zonaAntiga));
});

test("telemetria técnica não vaza para produtos profissional, científico, executivo ou formulação", async () => {
  const pdf = await source("lib/tirh-report-document.ts");
  const extrair = (inicio, fim) => pdf.slice(pdf.indexOf(inicio), pdf.indexOf(fim));
  const profissionais = [
    extrair("function renderOperacional", "function renderCientifico"),
    extrair("function renderCientifico", "function renderExecutivo"),
    extrair("function renderExecutivo", "function renderTecnico"),
    extrair("function renderFormulacao", "export async function gerarPdfVisualHumanexus"),
  ];
  for (const trecho of profissionais) {
    assert.ok(trecho.length > 0);
    assert.doesNotMatch(trecho, /latência|buffer|pacotes|fora de ordem|bridges/i);
  }
  const tecnico = extrair("function renderTecnico", "function renderFormulacao");
  assert.match(tecnico, /LATÊNCIA MÉDIA/);
  assert.match(tecnico, /BUFFER MÉDIO/);
  assert.match(tecnico, /PACOTES/);
  assert.match(tecnico, /Fontes e bridges/);
});

test("ausência permanece nula e nenhuma decisão profissional é automática", async () => {
  const pdf = await source("lib/tirh-report-document.ts");
  const fixture = await source("scripts/gerar-relatorios-tirh-fixture.mjs");
  assert.match(pdf, /Ausência de evidência permanece nula/i);
  assert.match(pdf, /não constituem decisão automática/i);
  assert.match(pdf, /proporcao\(item\.qualidade\) == null \? "—"/);
  assert.doesNotMatch(pdf, /magnitude\s*\|\|\s*0/);
  assert.doesNotMatch(pdf, /vetor\.magnitude \?\? 0/);
  assert.match(pdf, /validos\.length === vetores\.length/);
  assert.match(pdf, /EVOLUCAO_LONGITUDINAL/);
  assert.match(fixture, /VEV permanece não elegível/);
});

test("fixtures geram os cinco PDFs premium com paginação esperada", async () => {
  const output = await mkdtemp(join(tmpdir(), "hxp-relatorios-"));
  const execucao = spawnSync(
    process.execPath,
    ["--experimental-strip-types", "scripts/gerar-relatorios-tirh-fixture.mjs"],
    {
      cwd: new URL("../", import.meta.url),
      env: { ...process.env, HXP_PDF_OUTPUT: output },
      encoding: "utf8",
    },
  );
  assert.equal(execucao.status, 0, execucao.stderr);

  for (const [arquivo, paginas] of documentos) {
    const caminho = join(output, arquivo);
    const dados = await readFile(caminho);
    assert.equal(dados.subarray(0, 5).toString(), "%PDF-");
    assert.ok((await stat(caminho)).size > 5_000);
    const info = spawnSync("pdfinfo", [caminho], { encoding: "utf8" });
    assert.equal(info.status, 0, info.stderr);
    assert.match(info.stdout, new RegExp(`Pages:\\s+${paginas}\\b`));
  }
});

test("rota preserva impressão, exportação e nome documental profissional", async () => {
  const route = await source("app/api/operacao-homologacao/pdf/route.ts");
  const documento = await source("lib/tirh-report-document.ts");
  assert.match(route, /modoImpressao/);
  assert.match(route, /inline/);
  assert.match(route, /attachment/);
  assert.match(route, /humanexus-relatorio-tirh/);
  assert.match(route, /identificador_interno_da_sessao/);
  assert.match(route, /identificador_da_sessao/);
  assert.match(route, /Relatório desta sessão não localizado/);
  assert.match(route, /\/api\/v1\/relatorios\/\$\{encodeURIComponent/);
  assert.match(route, /SEM EVIDÊNCIA CIENTÍFICA DISPONÍVEL PARA ESTA SESSÃO/);
  assert.doesNotMatch(route, /relatorios\.at\(-1\)/);
  assert.match(documento, /entrada\.relatorio\.secoes \?\? entrada\.relatorio\.secoes_json/);
  assert.doesNotMatch(route, /humanexus-homologacao-visual/);
});

test("governança global exige seleção explícita e nunca consulta relatórios sem organização", async () => {
  const pagina = await source("app/(platform)/profissional/relatorios/page.tsx");
  const componente = await source("components/governanca-relatorios.tsx");
  assert.match(pagina, /const relatorios = organizacao/);
  assert.match(pagina, /\? await listarRelatoriosEmGovernanca\(sessao\.token, organizacao\)/);
  assert.match(pagina, /: \[\];/);
  assert.match(pagina, /listarOrganizacoesParaGovernancaDeRelatorios/);
  assert.match(componente, /Selecione a organização/);
  assert.match(componente, /name="organizacao"/);
  assert.match(componente, /action="\/profissional\/relatorios"/);
});
