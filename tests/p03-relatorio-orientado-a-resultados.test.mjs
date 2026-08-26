import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const raiz = new URL("../", import.meta.url);
const source = (caminho) => readFile(new URL(caminho, raiz), "utf8");

test("componente compartilhado comunica a microtrajetória sem definir taxonomia ou conclusão automática", async () => {
  const componente = await source("components/resultado-regulatorio-da-sessao.tsx");
  for (const trecho of [
    "MICROTRAJETÓRIA REGULATÓRIA DA SESSÃO",
    "Síntese de confiabilidade operacional",
    "MAPA PREVENTIVO DO FUNCIONAMENTO",
    "Como chegou",
    "O que mudou",
    "Como saiu",
    "SINAIS PRECURSORES",
    "LIMITE REGULATÓRIO OBSERVADO",
    "CONFIABILIDADE OPERACIONAL HUMANA",
    "O objetivo foi alcançado?",
    "AGUARDANDO CONCLUSÃO PROFISSIONAL",
    "Conclusão registrada pelo profissional",
    "DEVOLUTIVA PROFISSIONAL AUTORIZADA"
  ]) assert.match(componente, new RegExp(trecho.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(componente, /A plataforma não conclui automaticamente/);
  assert.doesNotMatch(
    componente,
    /\b(?:ARR|RRD|GRI|CRL|RRO|NRA)\b|Dor Operacional|cadeia canônica|legado/i
  );
  assert.doesNotMatch(componente, /calcular|recalcular|inferir|fallback/i);
});

test("resolver compartilhado usa apenas seções e consolidação já existentes", async () => {
  const resolver = await source("lib/projecao-narrativa-relatorio.ts");
  for (const etapa of [
    "OBJETIVO_DA_SESSAO",
    "COMO_CHEGOU",
    "DEMANDA_GATILHO",
    "ROTA_PREDOMINANTE",
    "GANHO_CUSTO",
    "RESPOSTA_ALTERNATIVA",
    "THX_INTERVENCAO",
    "PRE_TREINO_POS",
    "COMO_SAIU",
    "MUDANCA_OBSERVADA",
    "NAO_CONSOLIDADO",
    "PROXIMO_PASSO"
  ]) assert.match(resolver, new RegExp(`codigo: "${etapa}"`));
  assert.match(resolver, /itensDeSecoesAutorizadas/);
  assert.match(resolver, /MENSAGEM_UNICA_DE_INDISPONIBILIDADE/);
  assert.doesNotMatch(resolver, /calcular|recalcular|reclassificar|fallback/i);
});

test("relatório Web preserva indicadores oficiais e move gráficos para o conteúdo governado", async () => {
  const cockpit = await source("components/operacao-homologacao.tsx");
  const bloco = cockpit.slice(
    cockpit.indexOf("function RelatorioCanonicoV1"),
    cockpit.indexOf("const BANDAS_ANI_LONGITUDINAIS")
  );
  assert.match(bloco, /<ResultadoRegulatorioDaSessao microtrajetoria=\{microtrajetoria\}/);
  assert.doesNotMatch(
    bloco,
    /if \(!Object\.keys\(projecao\)\.length\)\s*\{\s*return/,
    "a ausência da projeção científica não pode ocultar a narrativa documental existente"
  );
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
  assert.match(bloco, /<PhaseComparisonChart[\s\S]+phases=\{fases\}/);
  assert.match(bloco, /<CockpitSignalStack/);
  assert.match(bloco, /filter\(\(trilha\) => !trilha\.technical\)/);
  assert.match(cockpit, /name: "EEG autorizado"/);
  assert.match(cockpit, /Polar ou sensor cardíaco humano não conectado/);
  assert.match(cockpit, /Nenhuma série humana de variabilidade foi recebida/);
  assert.doesNotMatch(bloco, /\?\?\s*0|\|\|\s*0/);
  assert.match(bloco, /RASTREABILIDADE E LIMITES DA LEITURA/);
  assert.ok(
    bloco.indexOf("MICROTRAJETÓRIA") < bloco.indexOf("RASTREABILIDADE E LIMITES DA LEITURA")
  );
});

test("visão longitudinal comunica macrotrajetória sem fabricar evolução", async () => {
  const cockpit = await source("components/operacao-homologacao.tsx");
  const bloco = cockpit.slice(
    cockpit.indexOf("function MacrotrajetoriaRegulatoria"),
    cockpit.indexOf("function EvolucaoDaAssinaturaNeuroregulatoria")
  );
  assert.match(bloco, /MACROTRAJETÓRIA PREVENTIVA/);
  assert.match(bloco, /confiabilidade operacional observada/);
  assert.match(bloco, /metodologicamente comparáveis/);
  assert.match(cockpit, /<MacrotrajetoriaRegulatoria longitudinal=\{estado\.longitudinal\}/);
  assert.doesNotMatch(bloco, /calcula|recalcula|infere|fallback/i);
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
    "Síntese de confiabilidade operacional",
    "Mapa preventivo do funcionamento",
    "Objetivo da sessão ou treinamento",
    "Como chegou",
    "Demanda ou gatilho registrado",
    "Rota predominante registrada",
    "Ganho ou custo registrado",
    "Resposta alternativa trabalhada",
    "Como saiu",
    "Mudança observada",
    "THX ou intervenção",
    "Aguardando conclusão profissional",
    "O que ainda não se consolidou",
    "Próximo passo profissional",
    "Gráficos regulatórios da sessão",
    "Nove Vetores momentâneos",
    "Rastreabilidade e limites da leitura"
  ]) assert.match(texto, new RegExp(termo, "i"));
  assert.ok(
    texto.indexOf("Síntese de confiabilidade operacional")
      < texto.lastIndexOf("Rastreabilidade e limites da leitura")
  );
  assert.doesNotMatch(texto, /THX-FIXTURE-001/i);
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
