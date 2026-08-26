import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const raiz = new URL("../", import.meta.url);
const source = (caminho) => readFile(new URL(caminho, raiz), "utf8");

test("componente compartilhado comunica resultado sem definir taxonomia ou conclusão automática", async () => {
  const componente = await source("components/resultado-regulatorio-da-sessao.tsx");
  for (const trecho of [
    "Objetivo da sessão ou treinamento",
    "Treinamento ou THX realizado",
    "Intervenção aplicada",
    "Resposta ou resultado esperado",
    "O que efetivamente aconteceu",
    "O objetivo foi alcançado?",
    "Indicadores e evidências selecionados pelo profissional",
    "O que ainda precisa ser desenvolvido",
    "Próximo passo registrado pelo profissional"
  ]) assert.match(componente, new RegExp(trecho.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(componente, /AINDA NÃO FOI POSSÍVEL DETERMINAR/);
  assert.match(componente, /A plataforma não a deduz da variação dos indicadores/);
  assert.doesNotMatch(
    componente,
    /\b(?:ARR|RRD|GRI|CRL|RRO|NRA)\b|Dor Operacional|cadeia canônica|legado/i
  );
  assert.doesNotMatch(componente, /calcular|recalcular|inferir|fallback/i);
});

test("relatório Web preserva indicadores oficiais e move gráficos para o conteúdo governado", async () => {
  const cockpit = await source("components/operacao-homologacao.tsx");
  const bloco = cockpit.slice(
    cockpit.indexOf("function RelatorioCanonicoV1"),
    cockpit.indexOf("const BANDAS_ANI_LONGITUDINAIS")
  );
  assert.match(bloco, /<ResultadoRegulatorioDaSessao conteudo=\{conteudoDoResultado\}/);
  for (const termo of [
    "IIRH",
    "Zona",
    "Resultante",
    "NOVE VETORES MOMENTÂNEOS",
    "VEV LONGITUDINAL",
    "PRÉ / TREINO / PÓS",
    "Intervenção",
    "HX-OBS"
  ]) assert.match(bloco, new RegExp(termo));
  assert.match(bloco, /Direção: \{texto\(resultante\.direcao/);
  assert.match(bloco, /Sentido: \{texto\(resultante\.sentido/);
  assert.match(bloco, /Tendência: \{texto\(resultante\.tendencia/);
  assert.match(bloco, /<PhaseComparisonChart phases=\{fases\}/);
  assert.match(bloco, /<CockpitSignalStack/);
  assert.match(bloco, /filter\(\(trilha\) => !trilha\.technical\)/);
  assert.match(cockpit, /name: "EEG autorizado"/);
  assert.match(cockpit, /Polar ou sensor cardíaco humano não conectado/);
  assert.match(cockpit, /Nenhuma série humana de variabilidade foi recebida/);
  assert.doesNotMatch(bloco, /\?\?\s*0|\|\|\s*0/);
});

test("PDF e impressão priorizam resultado, preservam gráficos e deixam rastreabilidade no final", async () => {
  const pasta = await mkdtemp(join(tmpdir(), "hxp-p03-relatorio-"));
  const pdf = join(pasta, "relatorio-p03.pdf");
  const geracao = spawnSync(
    process.execPath,
    ["--experimental-strip-types", "scripts/gerar-relatorio-final-funcional-fixture.mjs"],
    {
      cwd: raiz,
      env: { ...process.env, HXP_FINAL_PDF_OUTPUT: pdf },
      encoding: "utf8"
    }
  );
  assert.equal(geracao.status, 0, geracao.stderr);

  const extracao = spawnSync("pdftotext", ["-layout", pdf, "-"], {
    encoding: "utf8"
  });
  assert.equal(extracao.status, 0, extracao.stderr);
  const texto = extracao.stdout;
  for (const termo of [
    "Resultado regulatório da sessão",
    "Objetivo da sessão ou treinamento",
    "THX-FIXTURE-001",
    "Intervenção aplicada",
    "O que efetivamente aconteceu",
    "Ainda não foi possível determinar",
    "O que ainda precisa ser desenvolvido",
    "Próximo passo registrado pelo profissional",
    "Gráficos regulatórios da sessão",
    "Nove Vetores momentâneos",
    "Rastreabilidade técnica e documental"
  ]) assert.match(texto, new RegExp(termo, "i"));
  assert.ok(
    texto.indexOf("Resultado regulatório da sessão")
      < texto.lastIndexOf("Rastreabilidade técnica e documental")
  );
  assert.doesNotMatch(texto, /objetivo foi alcançado[^\n]*(alcançado|parcialmente alcançado|não alcançado)[^.]*\./i);

  const rota = await source("app/api/operacao-homologacao/pdf/route.ts");
  assert.match(rota, /modoImpressao/);
  assert.match(rota, /protocoloThx/);
  assert.match(rota, /\/api\/v1\/thx\/protocolos\//);
  assert.match(rota, /cache-control": "private, no-store"/);
});

test("alteração não toca coletivo, Núcleo, ciência, banco ou fluxo documental", async () => {
  const cockpit = await source("components/operacao-homologacao.tsx");
  const coletivo = cockpit.slice(
    cockpit.indexOf("const visaoColetiva"),
    cockpit.indexOf("const visaoTecnica")
  );
  assert.match(coletivo, /CPF e identidades individuais: NÃO EXPOSTOS/);
  assert.doesNotMatch(coletivo, /ResultadoRegulatorioDaSessao|nome_documental|cpf_documental/);
  const rotaPdf = await source("app/api/operacao-homologacao/pdf/route.ts");
  assert.doesNotMatch(rotaPdf, /POST|PUT|PATCH|DELETE|migration|migracao|INSERT|UPDATE/);
});
