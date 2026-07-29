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

test("Cockpit agrega leituras e atualiza telemetria sem recarregar o contexto inteiro", async () => {
  const route = await source("app/api/operacao-homologacao/route.ts");
  const client = await source("components/operacao-homologacao.tsx");

  assert.match(route, /\/api\/v1\/consultas-em-lote/);
  assert.match(route, /atualizacaoLeve/);
  assert.match(route, /limite=120/);
  assert.match(client, /atualizacao_parcial/);
  assert.match(client, /carregar\(selecaoInicial, true\)/);
});

test("Cockpit respeita o escopo organizacional e não escolhe participante fictício", async () => {
  const route = await source("app/api/operacao-homologacao/route.ts");
  assert.match(route, /x-humanexus-organization-id/);
  assert.match(route, /consultarLote\(\s*token,\s*consultasPrincipais,\s*organizacaoId/s);
  assert.doesNotMatch(route, /PARTICIPANTE FICTÍCIO/);
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
  assert.match(client, /NENHUM INDICADOR PROMETIDO/);
  assert.match(client, /contrato_cientifico/);
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
  assert.match(route, /comandos-operacionais/);
  assert.match(route, /acao-principal/);
  assert.match(client, /CONCLUIR_SESSAO: "Concluir sessão"/);
  assert.match(client, /ACESSO MÓVEL AUTENTICADO/);
  assert.match(pdf, /gerarPdfVisualHumanexus/);
  assert.match(pdf, /cache-control.*private, no-store/s);
  assert.match(pdfVisual, /graficoFases/);
  assert.match(pdfVisual, /graficoLinha/);
  assert.match(pdfVisual, /Versão clara para impressão A4/);
  assert.doesNotMatch(pdf, /PARTICIPANTE FICTÍCIO/);
});

test("encerramento operacional permanece distinto de completude científica", async () => {
  const route = await source("app/api/operacao-homologacao/route.ts");
  const client = await source("components/operacao-homologacao.tsx");

  assert.match(route, /estado_operacional/);
  assert.match(route, /estado-operacional/);
  assert.match(route, /comandos-operacionais/);
  assert.match(client, /ENCERRAMENTO OPERACIONAL ≠ COMPLETUDE CIENTÍFICA/);
  assert.match(client, /completude_cientifica/);
});

test("frontend não reconstrói a máquina de estados e exibe uma ação principal", async () => {
  const route = await source("app/api/operacao-homologacao/route.ts");
  const client = await source("components/operacao-homologacao.tsx");
  assert.match(route, /estadoOperacional/);
  assert.match(route, /chaveDeIdempotencia/);
  assert.match(route, /ultima_atualizacao/);
  assert.match(client, /proxima_acao_principal/);
  assert.match(client, /acoes_secundarias_permitidas/);
  assert.match(client, /COMANDO CONTEXTUAL/);
  assert.doesNotMatch(route, /async function assegurarFase/);
  assert.doesNotMatch(route, /async function preservarSnapshot/);
});

test("visualizações premium diferenciam dado, simulação, lacuna e bloqueio", async () => {
  const chart = await source("components/hx-command-visualizations.tsx");
  const client = await source("components/operacao-homologacao.tsx");
  for (const estado of ["Dado humano", "Simulação técnica", "Lacuna real", "BLOQUEADO POR COMPARABILIDADE", "AMOSTRA NÃO ELEGÍVEL"]) {
    assert.match(`${chart}\n${client}`, new RegExp(estado, "i"));
  }
  assert.match(client, /SIMULAÇÃO TÉCNICA — NÃO É RESULTADO HUMANO/);
  assert.match(client, /NÃO CALCULÁVEL/);
  assert.match(client, /NÃO INFERÍVEL/);
});

test("Cockpit exibe somente indicadores contratados e prontidão acionável", async () => {
  const route = await source("app/api/operacao-homologacao/route.ts");
  const client = await source("components/operacao-homologacao.tsx");
  const pdf = await source("lib/humanexus-report-pdf.ts");

  assert.match(route, /contrato_cientifico/);
  assert.match(client, /CONTRATO DE ENTREGA CIENTÍFICA DA SESSÃO/);
  assert.match(client, /contratoCientifico\.indicadores/);
  assert.match(client, /NÃO PRONTO —/);
  assert.match(client, /REQUISITO:/);
  assert.match(client, /AÇÃO:/);
  assert.match(pdf, /contratoCientifico\.indicadores/);
  assert.doesNotMatch(client, /rotulo="RMSSD".*NÃO CONECTADO/s);
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
  assert.match(client, /Diagnóstico técnico protegido/);
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

test("encerramento e limitação científica permanecem distintos no Cockpit", async () => {
  const client = await source("components/operacao-homologacao.tsx");
  const operacional = await source("components/cockpit-operacional-vivo.tsx");
  assert.match(operacional, /SESSÃO ENCERRADA/);
  assert.match(client, /ENCERRAMENTO OPERACIONAL ≠ COMPLETUDE CIENTÍFICA/);
  assert.match(client, /DADO FÍSICO ≠ RESULTADO CIENTÍFICO AUTOMÁTICO/);
  assert.match(client, /NENHUMA FASE ATIVA/);
});

test("Cockpit Vivo separa operação e análise com HUD e comando canônicos", async () => {
  const client = await source("components/operacao-homologacao.tsx");
  const operacional = await source("components/cockpit-operacional-vivo.tsx");
  const hud = operacional.match(
    /<section className="hx-live-hud"[\s\S]*?<\/section>/
  )?.[0] ?? "";
  for (const item of [
    "MODO OPERACIONAL AO VIVO",
    "Inspeção TIRH",
  ]) assert.match(`${client}\n${operacional}`, new RegExp(item));
  for (const item of [
    "ÍNDICE DE INTELIGÊNCIA REGULATÓRIA HUMANA",
    "ZONA OPERACIONAL",
    "THX",
    "FASE",
    "TEMPO",
    "FREQUÊNCIA CARDÍACA",
    "RMSSD",
    "ESTADO DO EEG",
    "ESTADO DO POLAR"
  ]) assert.match(hud, new RegExp(item));
  for (const item of ["TEMPO TOTAL", "QUALIDADE", "COBERTURA", "SESSÃO"]) {
    assert.doesNotMatch(hud, new RegExp(`<small>${item}</small>`));
  }
  assert.match(operacional, /acaoPrincipal/);
  assert.match(operacional, /hx-live-operation-focus/);
  assert.match(operacional, /FLUXO OPERACIONAL/);
  assert.match(operacional, /A ação principal permanece em foco acima/);
  assert.match(operacional, /fornecidos exclusivamente pelo estado operacional do backend/);
  assert.match(client, /proxima_acao_principal/);
});

test("Cockpit cinematográfico prioriza HUD, leitura viva e condução sem alterar o núcleo", async () => {
  const client = await source("components/operacao-homologacao.tsx");
  const operacional = await source("components/cockpit-operacional-vivo.tsx");
  const modulo = await source("components/modulo-integrado.tsx");
  const estilos = await source("app/globals.css");

  const hud = operacional.indexOf('className="hx-live-hud"');
  const comando = operacional.indexOf('className="hx-live-operation-focus"');
  const vetores = operacional.indexOf('className="hx-live-command-center"');
  assert.ok(hud >= 0 && comando > hud && vetores > comando);
  assert.match(operacional, /hx-live-temporal-rail/);
  assert.match(operacional, /AGUARDANDO EVIDÊNCIA REAL/);
  assert.match(operacional, /hx-live-regulatory-readout/);
  assert.match(operacional, /hx-live-conduction/);
  assert.match(operacional, /hx-live-technical-drawer/);
  assert.match(operacional, /Baseline como modalidade independente/);
  assert.match(operacional, /Ciclo independente de Baseline obrigatório/);
  assert.match(client, /EstruturaInicialDoCockpit/);
  assert.match(client, /window\.confirm/);
  assert.match(modulo, /modulo !== "cockpit-vivo"/);
  assert.match(estilos, /Cockpit Premium cinematográfico/);
  assert.match(estilos, /grid-template-columns: repeat\(9, minmax\(78px, 1fr\)\)/);
});

test("Cockpit abre progressivamente e preserva os dez vetores visíveis", async () => {
  const client = await source("components/operacao-homologacao.tsx");
  const operacional = await source("components/cockpit-operacional-vivo.tsx");
  const rota = await source("app/api/operacao-homologacao/route.ts");
  assert.match(client, /carregar\(selecao, false, true\)/);
  assert.match(client, /carregamento_progressivo/);
  assert.match(rota, /limite_de_amostras=120/);
  assert.match(rota, /carregamentoInicial/);
  assert.match(operacional, /VETORES VIVOS · MATRIZ VETORIAL/);
  assert.match(operacional, /AGUARDANDO EVIDÊNCIA/);
  assert.match(operacional, /INTERVENÇÃO SELECIONADA/);
  assert.match(operacional, /RESPOSTA OBSERVADA/);
  assert.match(
    operacional,
    /objeto\(contextoSessao\.detalhes_operacionais\)\.tipo_de_sessao[\s\S]*estadoOperacional\.tipo_de_sessao/
  );
});

test("telemetria real é contínua, histórica quando encerrada e não cria simulação", async () => {
  const client = await source("components/operacao-homologacao.tsx");
  const operacional = await source("components/cockpit-operacional-vivo.tsx");
  const rota = await source("app/api/operacao-homologacao/route.ts");
  assert.match(rota, /cockpit-operacional/);
  assert.match(rota, /telemetria\/sessoes\/.*limite=1200/);
  assert.match(rota, /eventos\?limite=240/);
  assert.match(rota, /linhas-temporais\/.*limite=1200/);
  assert.match(operacional, /REPLAY HISTÓRICO/);
  assert.match(operacional, /MODO OPERACIONAL — REPLAY HISTÓRICO/);
  assert.match(operacional, /MODO OPERACIONAL — AGUARDANDO CONEXÃO/);
  assert.match(operacional, /Nenhum dado é simulado enquanto os sensores não conectam/);
  assert.match(operacional, /referenciaDeBaseline/);
  assert.match(operacional, /showTechnicalLegend=\{false\}/);
  assert.match(operacional, /Dados físicos históricos · sem transmissão atual/);
  for (const item of [
    "Foco e atenção", "Engajamento", "Interesse", "Excitação", "Estresse", "Relaxamento"
  ]) assert.match(operacional, new RegExp(item));
  assert.doesNotMatch(operacional, /theta|alpha|betaL|betaH|gamma|fluxos_ativos|metricas_cortex_autorizadas/i);
  assert.match(operacional, /REPRODUÇÃO HISTÓRICA DE SESSÃO CIENTIFICAMENTE INCOMPLETA/);
  assert.match(client, /window\.setInterval/);
  assert.doesNotMatch(rota, /gerarTelemetriaTecnica|BRIDGE_TESTE/);
  assert.doesNotMatch(client, /comandos\.telemetria/);
});

test("registro profissional rápido herda o contexto e Replay segue sem mídia", async () => {
  const operacional = await source("components/cockpit-operacional-vivo.tsx");
  const rota = await source("app/api/operacao-homologacao/route.ts");
  for (const categoria of [
    "EVENTO",
    "INTERVENCAO",
    "RESPOSTA",
    "OBSERVACAO",
    "DECISAO_PROFISSIONAL"
  ]) assert.match(`${operacional}\n${rota}`, new RegExp(categoria));
  assert.match(rota, /REGISTRO_PROFISSIONAL_RAPIDO/);
  assert.match(operacional, /A ausência de mídia|NÃO É FALHA/);
  assert.match(operacional, /REPLAY SINCRONIZANDO/);
});
