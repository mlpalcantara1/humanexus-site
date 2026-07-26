import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const source = (path) => readFile(new URL(path, root), "utf8");

test("operação usa sessão httpOnly e proteção CSRF sem expor token", async () => {
  const route = await source("app/api/operacao-homologacao/route.ts");
  const client = await source("components/operacao-homologacao.tsx");
  assert.match(route, /COOKIE_SESSAO/);
  assert.match(route, /exigirCsrf/);
  assert.match(client, /x-humanexus-csrf/);
  assert.doesNotMatch(client, /authorization|Bearer|localStorage|sessionStorage/);
});

test("CTR e THX individuais não usam a versão do catálogo como identificador", async () => {
  const route = await source("app/api/operacao-homologacao/route.ts");
  const client = await source("components/operacao-homologacao.tsx");
  assert.match(route, /ctr_individual/);
  assert.match(route, /criterios_atendidos_json/);
  assert.match(route, /thx_individual/);
  assert.doesNotMatch(client, /codigo_do_catalogo/);
});

test("simulação técnica não produz IIRH, zona ou evidência humana", async () => {
  const route = await source("app/api/operacao-homologacao/route.ts");
  const client = await source("components/operacao-homologacao.tsx");
  for (const content of [route, client]) assert.match(content, /SIMULAÇÃO TÉCNICA — NÃO É RESULTADO HUMANO/);
  assert.match(route, /interpretacao_cientifica_executada: false/);
  assert.match(route, /dados_humanos_reais: false/);
  assert.match(client, /IIRH.*NÃO CALCULADO/);
  assert.match(client, /ZONA.*NÃO CALCULADA/);
});

test("gráficos e Replay usam registros do núcleo e expõem controles exigidos", async () => {
  const client = await source("components/operacao-homologacao.tsx");
  const chart = await source("components/hx-command-visualizations.tsx");
  const runtime = await source("components/hx-echarts.tsx");
  for (const label of ["Reproduzir", "Pausar", "Retroceder", "Avançar", "Velocidade", "Zoom", "Início do intervalo", "Fim do intervalo", "Exportação autorizada"]) {
    if (label === "Exportação autorizada") assert.match(client, /Exportar intervalo/);
    else assert.match(client, new RegExp(label));
  }
  assert.match(client, /estado\.telemetria/);
  assert.match(client, /estado\.replay/);
  assert.match(runtime, /import\("echarts"\)/);
  assert.match(runtime, /useDirtyRect: true/);
  assert.match(chart, /axisPointer/);
  assert.match(chart, /dataZoom/);
  assert.match(chart, /markArea/);
  assert.match(chart, /connectNulls: false/);
  assert.match(chart, /sampling:.*lttb/s);
  assert.doesNotMatch(chart, /<svg|polyline/);
});

test("conclusão formal, relatório PDF e módulo móvel permanecem integrados", async () => {
  const route = await source("app/api/operacao-homologacao/route.ts");
  const client = await source("components/operacao-homologacao.tsx");
  const pdf = await source("app/api/operacao-homologacao/pdf/route.ts");
  const pdfVisual = await source("lib/humanexus-report-pdf.ts");
  assert.match(route, /execucoes-thx.*concluir/);
  assert.match(route, /sessoes.*operacoes/);
  assert.match(client, /Concluir formalmente a sessão/);
  assert.match(client, /ACESSO MÓVEL AUTENTICADO/);
  assert.match(pdf, /gerarPdfVisualHumanexus/);
  assert.match(pdf, /cache-control.*private, no-store/s);
  assert.match(pdfVisual, /graficoFases/);
  assert.match(pdfVisual, /graficoLinha/);
  assert.match(pdfVisual, /Versão clara para impressão A4/);
});

test("visualizações premium diferenciam dado, simulação, lacuna e bloqueio", async () => {
  const chart = await source("components/hx-command-visualizations.tsx");
  const client = await source("components/operacao-homologacao.tsx");
  for (const estado of ["Dado humano", "Simulação técnica", "Lacuna real", "BLOQUEADO POR COMPARABILIDADE", "AMOSTRA NÃO ELEGÍVEL"]) {
    assert.match(`${chart}\n${client}`, new RegExp(estado, "i"));
  }
  assert.match(client, /SIMULAÇÃO TÉCNICA — NÃO É RESULTADO HUMANO/);
  assert.match(client, /NÃO CALCULADO/);
  assert.match(client, /NÃO CALCULADA/);
});

test("há um único Cockpit com quinze visões internas e contexto persistente", async () => {
  const client = await source("components/operacao-homologacao.tsx");
  const navigation = await source("components/platform-navigation.tsx");
  for (const view of [
    "Visão Geral", "Evidências", "Constituição Operacional da TIRH", "Matriz Vetorial Viva",
    "Resultante", "Trajetória", "PRÉ / TREINO / PÓS", "Rotas Regulatórias", "CTR e THX",
    "Formulação", "Longitudinal", "Replay", "Relatório", "Modo Coletivo", "Técnico"
  ]) assert.match(client, new RegExp(view));
  assert.match(client, /ContextoPersistente/);
  assert.match(client, /history\.replaceState/);
  assert.match(navigation, /Cockpit Vivo/);
  for (const removed of ["PRÉ \\/ TREINO \\/ PÓS", "Formulação Regulatória", "Replay Inteligente", "Telemetria Bridge"]) {
    assert.doesNotMatch(navigation, new RegExp(removed));
  }
});

test("rotas legadas preservam compatibilidade e convergem para o Cockpit", async () => {
  const page = await source("app/(platform)/plataforma/[modulo]/page.tsx");
  for (const legacy of ["pre-treino-pos", "formulacao", "longitudinal", "indicador-coletivo", "relatorios", "conectores", "telemetria", "movel", "replay"]) {
    assert.match(page, new RegExp(`"${legacy}"`));
  }
  assert.match(page, /redirect\(`\/plataforma\/cockpit-vivo\?/);
});

test("Constituição operacional usa os sete postulados e os quatro campos oficiais", async () => {
  const client = await source("components/operacao-homologacao.tsx");
  const route = await source("app/api/operacao-homologacao/route.ts");
  for (const postulate of [
    "Dinâmica Regulatória", "Multivetorialidade", "Integração Regulatória",
    "Resultante Regulatória", "Trajetória Regulatória", "Mensurabilidade Parcial", "Adaptação"
  ]) assert.match(client, new RegExp(postulate));
  for (const field of ["Campo Humano", "Campo da Tarefa", "Campo Estruturante", "Campo Neuroregulatório"]) {
    assert.match(client, new RegExp(field));
  }
  assert.match(route, /cientifico\/postulados/);
  assert.match(route, /cientifico\/macrocampos/);
  assert.match(route, /cientifico\/vetores/);
  assert.doesNotMatch(client, /VNR|Vetor Neuroregulatório/);
});

test("Matriz Vetorial não fabrica força, magnitude, direção, sentido ou interação", async () => {
  const client = await source("components/operacao-homologacao.tsx");
  for (const state of [
    "FORÇA RELATIVA NÃO CALCULÁVEL", "NÃO CALCULÁVEL", "DOMÍNIO NÃO DETERMINADO",
    "NÃO DETERMINADA", "NÃO OBSERVADO", "EVIDÊNCIA HUMANA AUSENTE"
  ]) assert.match(client, new RegExp(state));
  assert.match(client, /estado\.ciencia\.vetores/);
  assert.doesNotMatch(client, /magnitude\s*:\s*0|sentido\s*:\s*"adaptativo"|interacao\s*:\s*"convergência"/i);
});

test("Resultante, IIRH, Zona e Trajetória permanecem ontologicamente separados", async () => {
  const client = await source("components/operacao-homologacao.tsx");
  assert.match(client, /A Resultante.*não é IIRH nem Zona/s);
  assert.match(client, /RESULTANTE REGULATÓRIA NÃO CALCULÁVEL/);
  assert.match(client, /TRAJETÓRIA NÃO INFERÍVEL/);
  assert.match(client, /um ponto isolado não gera trajetória/i);
  assert.doesNotMatch(client, /iirh\s*=\s*resultante|zona\s*=\s*resultante/i);
});

test("produtos científicos e infraestrutura estão integrados sem virar módulos concorrentes", async () => {
  const client = await source("components/operacao-homologacao.tsx");
  for (const item of [
    "ARR", "Reorganização da Rota Operacional", "Nova Rota Adaptativa",
    "Formulação Regulatória", "LONGITUDINAL", "REPLAY MULTIMODAL SINCRONIZADO",
    "RELATÓRIO E PDF GOVERNADOS", "MODO COLETIVO DO COCKPIT"
  ]) assert.match(client, new RegExp(item));
  assert.match(client, /<details className="hx-technical-details">/);
  assert.match(client, /Saúde do Bridge, frequência, latência, perda, buffer/);
});

test("Painel de Comando é operacional e não duplica análise científica", async () => {
  const panel = await source("components/modulo-integrado.tsx");
  for (const action of ["Consultar organizações", "Consultar participantes", "Gerar convite de Anamnese", "Abrir sessão técnica", "Abrir Cockpit Vivo"]) {
    assert.match(panel, new RegExp(action));
  }
  assert.match(panel, /Não disponibilizado no resumo/);
  assert.match(panel, /o painel não fabrica pendências/i);
  assert.doesNotMatch(panel, /function Painel[\\s\\S]*Matriz Vetorial Viva/);
});

test("encerramento e limitação técnica aparecem uma única vez no Cockpit", async () => {
  const client = await source("components/operacao-homologacao.tsx");
  assert.equal((client.match(/SESSÃO FINALIZADA/g) ?? []).length, 1);
  assert.equal((client.match(/Esta sessão contém somente dados técnicos de homologação e não produz resultados humanos\./g) ?? []).length, 1);
  assert.match(client, /NENHUMA FASE ATIVA/);
});
