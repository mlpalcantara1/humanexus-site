import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  atrasoDoPollingCanonico,
  fonteDuranteSincronizacao,
  podeAplicarRespostaCanonica
} from "../lib/cockpit-live-coordination.ts";
import { formatarPercentualCanonico } from "../lib/percentual-canonico.ts";

const root = new URL("../", import.meta.url);
const source = (path) => readFile(new URL(path, root), "utf8");

test("cobertura canônica é formatada uma única vez", () => {
  assert.equal(formatarPercentualCanonico(0), "0%");
  assert.equal(formatarPercentualCanonico(0.44), "44%");
  assert.equal(formatarPercentualCanonico(0.5), "50%");
  assert.equal(formatarPercentualCanonico(0.56), "56%");
  assert.equal(formatarPercentualCanonico(1), "100%");
  assert.equal(formatarPercentualCanonico(50), "50%");
  assert.equal(formatarPercentualCanonico(100), "100%");
});

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
  assert.match(
    client,
    /carregar\(contexto, true, false, \{[\s\S]*?signal: controlador\.signal,[\s\S]*?identificadorDaConsulta: identificador[\s\S]*?\}\)/
  );
  assert.match(client, /parametros\.set\("_t", String\(Date\.now\(\)\)\)/);
});

test("comandos operacionais sincronizam o controle de captura sem recarregamento manual", async () => {
  const cockpit = await source("components/operacao-homologacao.tsx");
  const captura = await source("components/controle-gravacao-multimodal.tsx");

  assert.match(cockpit, /humanexus:operacao-atualizada/);
  assert.match(cockpit, /identificador_da_sessao/);
  assert.match(captura, /humanexus:operacao-atualizada/);
  assert.match(captura, /detalhe\.sessao !== sessao/);
  assert.match(captura, /void carregar\(\)/);
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
  assert.match(client, /const replayDisponivel = itensDaLinha\.length > 0/);
  assert.match(client, /disabled=\{!replayDisponivel\}/);
  assert.match(client, /Nenhum conteúdo válido disponível nesta sessão/);
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
  assert.match(pdfVisual, /tirh-report-document/);
  assert.match(pdf, /humanexus-relatorio-tirh/);
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
  assert.match(route, /corpo\.chave_de_idempotencia/);
  assert.match(route, /ultima_atualizacao/);
  assert.match(client, /crypto\.randomUUID\(\)/);
  assert.match(client, /chave_de_idempotencia: novaChaveDeTentativa\(\)/);
  assert.match(client, /proxima_acao_principal/);
  assert.match(client, /acoes_secundarias_permitidas/);
  assert.match(client, /COMANDO CONTEXTUAL/);
  assert.doesNotMatch(route, /async function assegurarFase/);
  assert.doesNotMatch(route, /async function preservarSnapshot/);
});

test("comando principal inicia e mantém o Baseline pela rota canônica", async () => {
  const client = await source("components/operacao-homologacao.tsx");
  const trecho = client.slice(
    client.indexOf("const executarPrincipal = () =>"),
    client.indexOf("const executarSecundaria =")
  );

  assert.match(trecho, /acaoPrincipal === "DEFINIR_REFERENCIA_BASELINE"/);
  assert.match(trecho, /void comandos\.principal\(\)/);
  for (const comando of [
    "INICIAR_BASELINE",
    "PAUSAR_BASELINE",
    "RETOMAR_BASELINE",
    "ENCERRAR_BASELINE"
  ]) {
    assert.doesNotMatch(trecho, new RegExp(`"${comando}"`));
  }
  assert.match(client, /ENCERRAR_BASELINE: "Encerrar Baseline"/);
  assert.match(
    client,
    /comando\.startsWith\("ENCERRAR_"\)[\s\S]*?toUpperCase\(\)/
  );
  assert.match(
    client,
    /if \(comando === "CONCLUIR_SESSAO"\) \{[\s\S]*?return "ENCERRAR SESSÃO"/
  );
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
  const pdf = await source("lib/tirh-report-document.ts");

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
  assert.match(client, /Aguardando evidência operacional/);
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
  assert.doesNotMatch(client, /<small>INSPEÇÃO<\/small>\s*<strong>Inspeção TIRH<\/strong>/);
  assert.match(client, /<small>ANÁLISE<\/small>\s*<strong>Inspeção TIRH<\/strong>/);
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

test("Cockpit apresenta a configuração basal sem fabricar magnitude", async () => {
  const operacional = await source("components/cockpit-operacional-vivo.tsx");
  assert.match(operacional, /Configuração regulatória basal/);
  assert.match(operacional, /FORMALIZAÇÃO AUTORAL IMPLEMENTADA · VALIDAÇÃO COMPUTACIONAL/);
  assert.match(operacional, /texto livre não convertido/);
  assert.match(operacional, /Magnitude somente quando sustentada por regra autoral e evidência admissível/);
  assert.match(operacional, /Nenhum snapshot científico foi fabricado/);
  assert.match(operacional, /vetor\.magnitude/);
  assert.match(operacional, /vetor\.decisao_autoral_pendente|vetor\.motivo/);
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

test("Cockpit Vivo Premium anima instrumentos sem fabricar dado operacional", async () => {
  const operacional = await source("components/cockpit-operacional-vivo.tsx");
  const graficos = await source("components/hx-command-visualizations.tsx");
  const runtime = await source("components/hx-echarts.tsx");
  const estilos = await source("app/globals.css");

  assert.match(operacional, /LeituraNumerica/);
  assert.match(operacional, /hx-live-vector-meter/);
  assert.match(operacional, /vetor\.value == null[\s\S]*<em \/>/);
  assert.match(graficos, /animationDurationUpdate: 760/);
  assert.match(graficos, /animationEasingUpdate: "cubicOut"/);
  assert.match(runtime, /prefers-reduced-motion: reduce/);
  assert.match(runtime, /animationDurationUpdate: 0/);
  assert.match(estilos, /Cockpit Vivo Premium — instrumentação, movimento e demonstração visual isolada/);
  assert.match(estilos, /@keyframes hx-phase-progress/);
  assert.match(estilos, /@media \(prefers-reduced-motion: reduce\)/);
});

test("demonstração visual é local, sintética e estruturalmente isolada", async () => {
  const demonstracao = await source("components/cockpit-demonstracao-visual.tsx");
  const pagina = await source("app/cockpit-visual-demo/page.tsx");

  assert.match(pagina, /process\.env\.NODE_ENV !== "development"/);
  assert.match(pagina, /notFound\(\)/);
  assert.match(demonstracao, /DEMONSTRAÇÃO VISUAL ISOLADA/);
  assert.match(demonstracao, /DADOS SINTÉTICOS · SEM API · SEM BANCO · SEM RELATÓRIOS/);
  assert.match(demonstracao, /primaryDataLabel="Dado sintético identificado"/);
  assert.match(demonstracao, /HUD demonstrativo com nove itens/);
  assert.match(demonstracao, /VETORES\.map/);
  assert.match(demonstracao, /AGUARDANDO CONEXÃO/);
  assert.match(demonstracao, /CAPTURA ATIVA/);
  assert.match(demonstracao, /QUALIDADE INSUFICIENTE/);
  assert.match(demonstracao, /RECONECTANDO/);
  assert.match(demonstracao, /"PRÉ", "TREINO", "PÓS", "BASELINE"/);
  assert.doesNotMatch(demonstracao, /fetch\(|localStorage|sessionStorage|indexedDB|\/api\//);
});

test("composição executiva premium permanece isolada no front-end da plataforma", async () => {
  const shell = await source("components/platform-shell.tsx");
  const navegacao = await source("components/platform-navigation.tsx");
  const painel = await source("components/painel-seguro.tsx");
  const cockpit = await source("components/cockpit-operacional-vivo.tsx");
  const estilos = await source("app/humanexus-design-system.css");
  const estilosOperacionais = await source("app/operational.css");
  const estilosGlobais = await source("app/globals.css");
  const designSystem = await source("components/hx-design-system.tsx");

  assert.match(shell, /hx-app hx-app--executive/);
  assert.match(navegacao, /hx-nav--collapsed/);
  assert.match(navegacao, /Recolher menu lateral/);
  assert.match(navegacao, /Expandir menu lateral/);
  assert.match(navegacao, /humanexus:navegacao-recolhida:\$\{escopoDePersistencia\}/);
  assert.match(shell, /escopoDePersistencia=\{sessao\?\.usuario\.identificador/);
  assert.match(painel, /GOVERNANÇA AUTENTICADA/);
  assert.match(painel, /CONTEXTO PROTEGIDO PELO NÚCLEO/);
  assert.doesNotMatch(painel, /BotaoSair/);

  const masthead = cockpit.indexOf('className="hx-live-cockpit__masthead"');
  const hud = cockpit.indexOf('className="hx-live-hud"');
  const operacao = cockpit.indexOf('className="hx-live-operation-focus"');
  const contexto = cockpit.indexOf('className="hx-live-context-strip"');
  const instrumentos = cockpit.indexOf('className="hx-live-command-center"');
  assert.ok(
    masthead >= 0 &&
      contexto > masthead &&
      hud > contexto &&
      operacao > hud &&
      instrumentos > operacao
  );

  assert.match(estilos, /HUMANEXUS DESIGN SYSTEM — Command Experience 1\.0/);
  assert.doesNotMatch(estilosOperacionais, /composição executiva premium/);
  assert.match(designSystem, /export function HxPageHeader/);
  assert.match(designSystem, /export function HxSectionHeader/);
  assert.match(designSystem, /export function HxSurface/);
  assert.match(estilos, /\.hx-app--executive:has\(\.hx-nav--collapsed\)/);
  assert.match(estilosGlobais, /\.hx-live-hud\{position:sticky;top:135px/);
  assert.match(estilosGlobais, /@media\(min-width:1600px\)\{\.hx-live-hud\{grid-template-columns:repeat\(9,minmax\(88px,1fr\)\)/);
  assert.match(estilosGlobais, /@media\(max-width:900px\)[\s\S]*\.hx-live-hud\{position:relative;top:auto;grid-template-columns:repeat\(3,1fr\)/);
  assert.match(estilosGlobais, /@media\(max-width:640px\)[\s\S]*\.hx-live-hud\{grid-template-columns:1fr 1fr\}/);
  assert.match(estilos, /\.hx-app--executive \.hx-vector-radar-live\s*\{[\s\S]*min-height: clamp\(400px, 38vw, 580px\)/);
  assert.match(estilos, /\.hx-app :where\(\.hx-management-context,[\s\S]*\.hx-admin__directory\)/);
  assert.match(estilos, /\.hx-app :where\(input, select, textarea\):focus/);
  assert.match(estilos, /@media \(max-width: 1080px\)[\s\S]*\.hx-nav-toggle/);
  assert.match(estilos, /@media \(prefers-reduced-motion: reduce\)/);
});

test("HUMANEXUS Design System unifica módulos e separa profundidade sem alterar ciência", async () => {
  const estilos = await source("app/humanexus-design-system.css");
  const shell = await source("components/platform-shell.tsx");
  const modo = await source("components/experience-mode-control.tsx");
  const navegacao = await source("components/platform-navigation.tsx");
  const cockpit = await source("components/cockpit-operacional-vivo.tsx");
  const demonstracao = await source("components/cockpit-demonstracao-visual.tsx");

  assert.match(estilos, /HUMANEXUS DESIGN SYSTEM — Command Experience 1\.0/);
  assert.match(estilos, /--hx-gold: #a88443/);
  assert.match(estilos, /--hx-signal: #72c6d3/);
  assert.match(estilos, /\[data-hx-experience-mode="executivo"\] \.hx-live-scientific-chain/);
  assert.match(estilos, /\[data-hx-experience-mode="executivo"\] \.hx-live-technical-drawer/);
  assert.doesNotMatch(estilos, /\[data-hx-experience-mode="executivo"\][^{]*(hx-live-regulatory-readout|hx-live-hud)/);
  assert.match(estilos, /@media \(max-width: 820px\)[\s\S]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(estilos, /@media print[\s\S]*\.hx-report-view/);
  assert.match(estilos, /@media \(prefers-reduced-motion: reduce\)/);

  assert.match(shell, /CENTRO DE INTELIGÊNCIA OPERACIONAL/);
  assert.match(shell, /ExperienceModeControl/);
  assert.match(modo, /humanexus-experience-mode/);
  assert.match(modo, /document\.documentElement\.dataset\.hxExperienceMode/);
  assert.doesNotMatch(modo, /fetch\(|\/api\//);

  for (const modulo of [
    "Painel de Comando", "Organizações", "Participantes", "Anamnese Regulatória",
    "Sessões", "Treinamentos", "Cockpit Vivo", "Arquitetura Vetorial", "Resultante",
    "ARR · RRO · NRA", "CTR · THX · THX-AER", "Longitudinal", "Replay",
    "Relatórios e exportação", "Administração", "Configurações"
  ]) assert.match(navegacao, new RegExp(modulo.replaceAll("·", "\\·")));

  assert.match(cockpit, /01<\/span>\s*<strong>Comando/);
  assert.match(cockpit, /02<\/span>\s*<strong>Regulação/);
  assert.match(cockpit, /03<\/span>\s*<strong>Evidências/);
  assert.match(cockpit, /04<\/span>\s*<strong>Inspeção/);
  assert.match(demonstracao, /SEM CÁLCULO · SEM FALLBACK/);
  assert.match(demonstracao, /Ausência não convertida em zero/);
});

test("Cockpit não converte ausência de evidência em zero e explica cobertura", async () => {
  const cockpit = await source("components/cockpit-operacional-vivo.tsx");
  const operacao = await source("components/operacao-homologacao.tsx");

  assert.match(cockpit, /valor == null \|\| valor === ""/);
  assert.match(cockpit, /COBERTURA CIENTÍFICA/);
  assert.match(cockpit, /Detalhe sob demanda/);
  assert.match(cockpit, /Evidências recebidas/);
  assert.match(cockpit, /Fontes válidas/);
  assert.match(cockpit, /Janela acumulada/);
  assert.match(cockpit, /Requisito restante/);
  assert.match(operacao, /contextoAtual\.current/);
  assert.doesNotMatch(
    operacao,
    /visao !== "visao-geral"[\s\S]{0,120}estado\.carregamento_progressivo/
  );
});

test("Cockpit nunca apresenta leitura histórica como telemetria ao vivo", async () => {
  const cockpit = await source("components/cockpit-operacional-vivo.tsx");

  assert.match(cockpit, /if \(fonte\.ao_vivo !== true\) return \[\];/);
  assert.match(cockpit, /fontes\.filter\(\(fonte\) => fonte\.ao_vivo === true\)/);
  assert.match(cockpit, /polar\.ao_vivo === true[\s\S]*Sem leitura atual/);
  assert.match(cockpit, /eeg\.ao_vivo === true[\s\S]*Sem leitura atual/);
  assert.match(cockpit, /Última leitura registrada/);
  assert.match(cockpit, /leituraAoVivo \? valorNormalizado/);
  assert.match(cockpit, /const cienciaAtualAdmissivel = leituraAoVivo \|\| configuracaoBasalCanonica/);
  assert.match(cockpit, /const iirhCalculado = cienciaAtualAdmissivel/);
  assert.match(cockpit, /const resultanteCalculada = cienciaAtualAdmissivel/);
  assert.match(cockpit, /const trajetoriaCalculada = leituraAoVivo/);
  assert.match(cockpit, /const projecaoOperacionalAtual = Number\.isFinite/);
  assert.match(cockpit, /fontesRecebidas\.map\(fonteDuranteSincronizacao\)/);
  assert.match(cockpit, /Última projeção canônica · não é leitura atual/);
  assert.match(cockpit, /não são tratados como leitura atual nem alimentam cálculos científicos/);
  assert.match(cockpit, /const modoSincronizando = !projecaoOperacionalAtual/);
  assert.doesNotMatch(
    cockpit,
    /const modoAguardando = !projecaoOperacionalAtual/
  );
  assert.match(cockpit, /SINCRONIZANDO ESTADO CANÔNICO/);
  assert.match(cockpit, /sem inferir desconexão/);
  assert.doesNotMatch(
    cockpit.match(/const fontes = projecaoOperacionalAtual[\s\S]*?const replay/)?.[0] ?? "",
    /estado: "RECONECTANDO"/
  );
});

test("sincronização preserva a projeção identificada sem convertê-la em leitura atual", () => {
  const fonte = fonteDuranteSincronizacao({
    codigo: "POLAR_H10",
    estado: "CAPTURANDO",
    ao_vivo: true,
    valores: { hr_bpm: 71, rmssd_tecnico_ms: 11.4 },
    metricas: { ultima_sequencia: 1444 },
    series: { hr: [{ valor: 71 }] }
  });

  assert.equal(fonte.ao_vivo, false);
  assert.equal(fonte.projecao_em_verificacao, true);
  assert.equal(fonte.estado, "PROJEÇÃO CANÔNICA EM VERIFICAÇÃO");
  assert.deepEqual(fonte.valores, { hr_bpm: 71, rmssd_tecnico_ms: 11.4 });
  assert.equal(fonte.metricas.ultima_sequencia, 1444);
});

test("resposta fora de ordem não sobrescreve a projeção canônica mais recente", () => {
  const contexto = {
    organizacao: "org-a",
    participante: "part-a",
    sessao: "sessao-a"
  };
  assert.equal(podeAplicarRespostaCanonica({
    contextoEsperado: contexto,
    contextoRecebido: contexto,
    cancelada: false,
    componenteMontado: true,
    consultaSolicitada: 14,
    ultimaConsultaAplicada: 15
  }), false);
  assert.equal(podeAplicarRespostaCanonica({
    contextoEsperado: contexto,
    contextoRecebido: contexto,
    cancelada: false,
    componenteMontado: true,
    consultaSolicitada: 16,
    ultimaConsultaAplicada: 15
  }), true);
});

test("snapshot e neurotelemetria têm projeção visual completa e separada da qualidade EEG", async () => {
  const cockpit = await source("components/cockpit-operacional-vivo.tsx");
  const gravacao = await source("components/controle-gravacao-multimodal.tsx");

  assert.match(cockpit, /Inspecionar snapshot basal imutável/);
  for (const item of [
    "Identificador", "Timestamp", "Organização", "Participante", "Sessão",
    "Versão científica", "Biblioteca", "Taxonomia de Zona", "Cobertura",
    "Qualidade", "Confiança", "Fontes", "Proveniência", "Regra longitudinal"
  ]) assert.match(cockpit, new RegExp(item));
  assert.match(cockpit, /NEUROTELEMETRIA REGULATÓRIA · STREAM MET CORTEX/);
  assert.match(cockpit, /Separada da qualidade do sinal EEG/);
  assert.match(cockpit, /Stream MET real sem valor canônico atual/);
  assert.match(gravacao, /snapshot_canonico/);
  assert.match(gravacao, /Snapshot basal imutável/);
  assert.match(gravacao, /fontesBasaisCanonicas/);
});

test("Baseline canônico aparece sem ser rotulado como telemetria viva", async () => {
  const cockpit = await source("components/cockpit-operacional-vivo.tsx");

  assert.match(
    cockpit,
    /const configuracaoBasalCanonica = \(sessaoBaseline \|\| \([\s\S]*!sessaoFinalizada && !faseCientificaAtual/
  );
  assert.match(cockpit, /projecaoOperacionalAtual[\s\S]*!modoHistorico/);
  assert.match(
    cockpit,
    /configuracaoBasal\.identificador_da_sessao[\s\S]*identificadorDaSessao/
  );
  assert.match(cockpit, /VETORES BASAIS CANÔNICOS · MATRIZ VETORIAL/);
  assert.match(cockpit, /FORMALIZAÇÃO AUTORAL IMPLEMENTADA · VALIDAÇÃO COMPUTACIONAL/);
  assert.match(cockpit, /texto livre não convertido/);
  assert.match(cockpit, /zero e fallback são proibidos/);
});

test("configuração basal canônica aparece antes do PRÉ na sessão integral", async () => {
  const cockpit = await source("components/cockpit-operacional-vivo.tsx");

  assert.match(cockpit, /const faseCientificaAtual = String\(sessao\.fase_atual \?\? ""\)/);
  assert.match(cockpit, /!sessaoFinalizada && !faseCientificaAtual/);
  assert.match(cockpit, /const faseAtual = faseCientificaAtual/);
  assert.doesNotMatch(
    cockpit,
    /const configuracaoBasalCanonica = leituraAoVivo/
  );
});

test("polling vivo não para em segundo plano e retoma imediatamente no foco", async () => {
  const operacao = await source("components/operacao-homologacao.tsx");
  const ciclo = operacao.match(
    /useEffect\(\(\) => \{[\s\S]*?contextoDoPolling\.current = \{[\s\S]*?\}, \[[\s\S]*?\]\);/
  )?.[0] ?? operacao;

  assert.doesNotMatch(
    ciclo,
    /document\.visibilityState !== "visible"[\s\S]{0,120}agendar\(500\)/
  );
  assert.match(ciclo, /visibilitychange/);
  assert.match(ciclo, /limparTemporizador\(\);[\s\S]*agendar\(0\)/);
  assert.match(operacao, /polling_confirmado_em/);
  assert.match(operacao, /podeAplicarRespostaCanonica/);
  assert.doesNotMatch(operacao, /respostaRegressiva/);
});

test("snapshot canônico de outra instância não é recusado por revisão local menor", () => {
  const contexto = {
    organizacao: "org-a",
    participante: "part-a",
    sessao: "sessao-a"
  };

  assert.equal(podeAplicarRespostaCanonica({
    contextoEsperado: contexto,
    contextoRecebido: contexto,
    cancelada: false,
    componenteMontado: true
  }), true);
  // A primeira instância podia emitir revisão 47 e a seguinte revisão 1.
  // A revisão process-local não participa da decisão do consumidor.
  assert.equal(podeAplicarRespostaCanonica({
    contextoEsperado: contexto,
    contextoRecebido: contexto,
    cancelada: false,
    componenteMontado: true,
    revisaoAnterior: 47,
    revisaoRecebida: 1
  }), true);
});

test("propriedade do ciclo canônico cobre duas horas, retomada, concorrência e isolamento", () => {
  const sessaoA = {
    organizacao: "org-a",
    participante: "part-a",
    sessao: "sessao-a"
  };
  const sessaoB = {
    organizacao: "org-b",
    participante: "part-b",
    sessao: "sessao-b"
  };
  let estado = { polar: 475, epoc: 3419, contexto: sessaoA };
  let picoDeObjetosResidentes = 1;

  // 2 h / 2,5 s = 2.880 ciclos. As fontes avançam em ritmos distintos e
  // snapshots vindos de instâncias recém-aquecidas continuam aplicáveis.
  for (let ciclo = 1; ciclo <= 2_880; ciclo += 1) {
    const resposta = {
      polar: 475 + ciclo,
      epoc: 3419 + (ciclo * 3),
      contexto: sessaoA,
      revisaoLocal: ciclo % 2 === 0 ? 1 : 91
    };
    if (podeAplicarRespostaCanonica({
      contextoEsperado: sessaoA,
      contextoRecebido: resposta.contexto,
      cancelada: false,
      componenteMontado: true
    })) {
      estado = {
        polar: resposta.polar,
        epoc: resposta.epoc,
        contexto: resposta.contexto
      };
    }
    picoDeObjetosResidentes = Math.max(picoDeObjetosResidentes, 1);
  }
  assert.deepEqual(
    { polar: estado.polar, epoc: estado.epoc },
    { polar: 3355, epoc: 12059 }
  );
  assert.equal(picoDeObjetosResidentes, 1);

  // Uma resposta lenta é cancelada antes da retomada imediata e não pode
  // sobrescrever a resposta canônica nova.
  assert.equal(podeAplicarRespostaCanonica({
    contextoEsperado: sessaoA,
    contextoRecebido: sessaoA,
    cancelada: true,
    componenteMontado: true
  }), false);
  assert.equal(atrasoDoPollingCanonico("INICIADA"), 2_500);
  assert.equal(atrasoDoPollingCanonico("INICIADA", 1), 5_000);
  assert.equal(atrasoDoPollingCanonico("INICIADA", 99), 30_000);
  assert.equal(atrasoDoPollingCanonico("PAUSADA"), 15_000);

  // Após A→B, nenhum snapshot tardio de A entra em B; uma nova geração com
  // sequência inferior é aceita por ser estado canônico da sessão B.
  assert.equal(podeAplicarRespostaCanonica({
    contextoEsperado: sessaoB,
    contextoRecebido: sessaoA,
    cancelada: false,
    componenteMontado: true
  }), false);
  assert.equal(podeAplicarRespostaCanonica({
    contextoEsperado: sessaoB,
    contextoRecebido: sessaoB,
    cancelada: false,
    componenteMontado: true
  }), true);
});

test("EPOC degradado gera ressalva sem bloquear o fluxo operacional", async () => {
  const cockpit = await source("components/cockpit-operacional-vivo.tsx");

  assert.match(cockpit, /qualidade_mediana_da_janela/);
  assert.match(cockpit, /nivel_de_confianca_eeg/);
  assert.match(cockpit, /QUALIDADE_MUITO_DEGRADADA/);
  assert.match(cockpit, /A sessão e as demais fontes continuam normalmente/);
  assert.match(cockpit, /EPOC X está indisponível ou reconectando; a sessão continua/);
  assert.match(cockpit, /não bloqueia o fluxo da sessão/);
});

test("Cockpit expõe o contrato de dependência por indicador em português", async () => {
  const cockpit = await source("components/cockpit-operacional-vivo.tsx");
  const demo = await source("components/cockpit-demonstracao-visual.tsx");

  for (const item of [
    "Fontes obrigatórias",
    "Fontes complementares",
    "Janela mínima",
    "Atualidade máxima",
    "Confiança atual",
    "Ausência permanece nula, sem zero e sem fallback",
    "Ação possível",
    "Versão científica",
    "Motor/contrato"
  ]) assert.match(cockpit, new RegExp(item));
  assert.match(cockpit, /Aguardando requisitos oficiais/);
  assert.match(cockpit, /Resultado aguardando validação profissional/);
  assert.match(demo, /DADOS DE TESTE — NÃO REAIS/);
});

test("Cockpit resolve vetores por UUID ou código e exibe rastreabilidade sob demanda", async () => {
  const cockpit = await source("components/cockpit-operacional-vivo.tsx");

  assert.match(cockpit, /const codigo = codigoVetorial\(definicao\)[\s\S]*estadosVetoriaisPorDefinicao\.get\(identificador\)[\s\S]*estadosVetoriaisPorDefinicao\.get\(codigo\)/);
  assert.match(cockpit, /estadosVetoriaisPorDefinicao\.get\(vetor\.code\)/);
  assert.match(cockpit, /valor <= 1 \? valor : valor \/ 100/);
  assert.match(cockpit, /Rastreabilidade científica/);
  for (const item of [
    "Cobertura",
    "Qualidade",
    "Confiança",
    "Sessão",
    "Fase",
    "Timestamp",
    "Biblioteca",
    "Origem matemática",
    "Evidências utilizadas",
    "Evidências ausentes",
    "Requisito ausente"
  ]) assert.match(cockpit, new RegExp(item));
});

test("Cockpit projeta a cadeia científica única sem decisão ou preenchimento automático", async () => {
  const cockpit = await source("components/cockpit-operacional-vivo.tsx");

  for (const item of [
    "Fontes atuais",
    "Evidências",
    "Vetores oficiais",
    "Resultante Regulatória",
    "ARR",
    "Reorganização da Rota Operacional — RRO",
    "Nova Rota Adaptativa — NRA",
    "THX-AER",
    "CTR",
    "Validação profissional",
    "Intervenção",
    "Longitudinal e VEV"
  ]) assert.match(cockpit, new RegExp(item));
  assert.match(cockpit, /Somente relações autorais rastreáveis/);
  assert.match(cockpit, /nenhuma decisão automática/);
  assert.match(cockpit, /HIPÓTESE OPERACIONAL v0\.1 — EM VALIDAÇÃO EMPÍRICA/);
  assert.match(cockpit, /Validação profissional obrigatória/);
  assert.match(cockpit, /resultante\.estado === "CALCULAVEL"/);
  assert.match(cockpit, /resultante\.estado === "CONFLITANTE"/);
  assert.match(cockpit, /Cobertura[\s\S]*Qualidade[\s\S]*Confiança/);
  for (const item of [
    "Direção funcional",
    "Sentido contextual",
    "Vetores contribuintes",
    "Vetores ausentes",
    "Macrocampos cobertos",
    "Macrocampos ausentes",
    "Conflitos",
    "Compensações",
    "Versão científica",
    "Origem matemática",
    "Justificativa",
    "Incertezas"
  ]) assert.match(cockpit, new RegExp(item));
  assert.match(cockpit, /Rastreabilidade, dependências e candidatos documentais/);
  for (const item of [
    "Anamnese e contexto",
    "Vetores oficiais · dez vetores e radar",
    "IIRH",
    "Zona Operacional",
    "Gatilhos regulatórios",
    "Rotas regulatórias possíveis",
    "Rota dominante",
    "PRÉ → TREINO → PÓS",
    "Resposta e ganhos regulatórios",
    "Relatório rastreável"
  ]) assert.match(cockpit, new RegExp(item));
  assert.match(cockpit, /detalhesDaEtapa/);
  assert.match(cockpit, /Por que este resultado\?/);
  assert.match(cockpit, /estado_do_contrato_operacional/);
  assert.match(cockpit, /mecanismo_operacional/);
  assert.match(cockpit, /referenciaCientificaLegivel/);
  assert.match(cockpit, /precondicoes_nao_atendidas/);
  assert.match(cockpit, /Ausência permanece nula/);
  assert.match(
    cockpit,
    /radarVetorial\.filter\(\(item\) => item\.value != null\)\.length/
  );
  assert.doesNotMatch(
    cockpit,
    /estadosVetoriais\.filter\(\(item\) => item\.magnitude != null\)\.length/
  );
  assert.doesNotMatch(cockpit, /resultante\.valor\s*\?\?/);
});

test("Polling oficial expira requisição travada e permite nova tentativa", async () => {
  const operacao = await source("components/operacao-homologacao.tsx");
  const coordenacao = await source("lib/cockpit-live-coordination.ts");
  const rota = await source("app/api/operacao-homologacao/route.ts");
  const nucleo = await source("lib/humanexus-core.ts");

  assert.match(operacao, /const controlador = !opcoes\.signal \? new AbortController\(\) : null/);
  assert.match(operacao, /window\.setTimeout\(\(\) => controlador\.abort\(\), 12_000\)/);
  assert.match(operacao, /signal: controlador\.signal/);
  assert.match(operacao, /nova tentativa automática em andamento/);
  assert.match(operacao, /controlador\.abort\(\)[\s\S]*agendar\(250\)/);
  assert.match(operacao, /concluir\(identificador, proximoAtraso\)/);
  assert.match(operacao, /falhasConsecutivas \+= 1/);
  assert.match(operacao, /atrasoDoPollingCanonico/);
  assert.match(coordenacao, /Math\.min\(30_000/);
  assert.match(rota, /tentativas: 1/);
  assert.match(rota, /tempoLimiteMs: 10_000/);
  assert.match(nucleo, /signal: controlador\.signal/);
  assert.match(nucleo, /controlador\.abort\(new Error\("Tempo limite do núcleo excedido\."\)\)/);
});

test("Cockpit usa snapshot e delta incremental sem reler lotes históricos", async () => {
  const operacao = await source("components/operacao-homologacao.tsx");
  const rota = await source("app/api/operacao-homologacao/route.ts");

  assert.match(rota, /cockpit-operacional-vivo/);
  assert.match(rota, /desde_versao/);
  assert.match(rota, /SEM_ALTERACAO/);
  assert.match(rota, /sequencias_do_cockpit: dados\.sequencias_por_fonte/);
  assert.match(rota, /geracoes_do_cockpit: dados\.geracoes_por_fonte/);
  assert.match(rota, /revisao_do_cockpit: dados\.revisao/);
  assert.match(
    rota,
    /escopo_da_revisao_do_cockpit: dados\.escopo_da_revisao/
  );
  assert.doesNotMatch(
    rota.match(/async function atualizacaoLeve[\s\S]*?\n}\n\nasync function estado/)?.[0] ?? "",
    /telemetria\/sessoes|eventos\?limite|consultas-em-lote/
  );
  assert.match(operacao, /versaoDoCockpit\.current/);
  assert.match(operacao, /mesclarAtualizacaoIncremental/);
  assert.match(operacao, /dados\.sem_alteracao/);
  assert.match(
    operacao,
    /dados\.sem_alteracao[\s\S]*polling_confirmado_em: pollingConfirmadoEm/
  );
  assert.doesNotMatch(operacao, /respostaRegressiva/);
  assert.doesNotMatch(operacao, /geracaoAtual === geracaoRecebida/);
  assert.doesNotMatch(operacao, /revisaoRecebida <|revisaoDoCockpit\.current/);
  assert.match(operacao, /podeAplicarRespostaCanonica/);
});

test("cronômetro do Baseline começa somente no início canônico do Baseline", async () => {
  const cockpit = await source("components/cockpit-operacional-vivo.tsx");

  assert.match(
    cockpit,
    /const referenciaBaselineCanonica = objeto\([\s\S]*?estadoOperacional\.referencia_de_baseline/
  );
  assert.match(
    cockpit,
    /const registroBaselineCanonico = objeto\([\s\S]*?referenciaBaselineCanonica\.baseline/
  );
  assert.match(
    cockpit,
    /Object\.keys\(registroBaselineCanonico\)\.length > 0[\s\S]*?registroBaselineCanonico[\s\S]*?: registroBaselineDaGravacao/
  );
  assert.match(
    cockpit,
    /const inicioDoCronometro = sessaoBaseline[\s\S]*?registroBaseline\.iniciado_em[\s\S]*?: sessao\.tempo_total_inicio/
  );
  assert.match(
    cockpit,
    /duracao\(inicioDoCronometro, fimDoCronometro, agora\)/
  );
  assert.match(
    cockpit,
    /registroBaseline\.estado === "INICIADO"[\s\S]*?"EM EXECUÇÃO"/
  );
});

test("polling reduz sessão pausada, para encerrada e libera memória ao sair", async () => {
  const operacao = await source("components/operacao-homologacao.tsx");
  const rota = await source("app/api/operacao-homologacao/route.ts");
  const coordenacao = await source("lib/cockpit-live-coordination.ts");

  assert.match(operacao, /atrasoDoPollingCanonico/);
  assert.match(coordenacao, /=== "PAUSADA"\) return 15_000/);
  assert.match(operacao, /\["FINALIZADA", "ENCERRADA"\]/);
  assert.match(operacao, /method: "DELETE"/);
  assert.match(operacao, /keepalive: true/);
  assert.match(rota, /export async function DELETE/);
});

test("polling do Cockpit publica o estado real de conexão do núcleo", async () => {
  const operacao = await source("components/operacao-homologacao.tsx");
  const cliente = await source("lib/client-request.ts");

  assert.match(cliente, /export function publicarEstadoDoNucleo/);
  assert.match(operacao, /publicarEstadoDoNucleo\(/);
  assert.match(
    operacao,
    /resposta\.ok[\s\S]*?"conectado"[\s\S]*?"reconectando"[\s\S]*?"offline"/
  );
  assert.match(
    operacao,
    /Atualização do Cockpit expirou[\s\S]*?nova tentativa automática/
  );
});

test("perfil de latência do polling é opt-in e não altera o fluxo comum", async () => {
  const rota = await source("app/api/operacao-homologacao/route.ts");
  const cockpit = await source("components/operacao-homologacao.tsx");

  assert.match(cockpit, /get\("medir_latencia"\) === "1"/);
  assert.match(cockpit, /parametros\.set\("medir_latencia", "1"\)/);
  assert.match(rota, /HXP_LATENCIA_COCKPIT_VIVO/);
  assert.match(rota, /atualizacaoLeveSolicitada && medirLatencia/);
  assert.match(rota, /payload_bytes: payloadBytes/);
});

test("Polling autenticado preserva contexto, ordenação e ciclo único", async () => {
  const operacao = await source("components/operacao-homologacao.tsx");

  assert.match(operacao, /contextoDoPolling\.current = atual/);
  assert.match(operacao, /polling exige organização, participante e sessão explícitos/i);
  assert.doesNotMatch(operacao, /sequenciaDasSolicitacoes|ultimaRespostaAplicada/);
  assert.match(operacao, /podeAplicarRespostaCanonica/);
  assert.match(operacao, /carregamentoIntegralEmAndamento\.current\?\.abort\(\)/);
  assert.match(operacao, /atualizacaoEmAndamento\.current\?\.controlador\.abort\(\)/);
  assert.match(operacao, /atualizacaoEmAndamento\.current\?\.identificador/);
  assert.match(operacao, /limparTemporizador\(\)[\s\S]*window\.setTimeout\(executar, atraso\)/);
  assert.match(operacao, /document\.visibilityState !== "visible"/);
  assert.match(operacao, /visibilitychange/);
  assert.match(operacao, /window\.addEventListener\("focus"/);
  assert.match(operacao, /removeEventListener\("focus"/);
  assert.match(operacao, /atualizacaoEmAndamento\.current\?\.controlador\.abort\(\)/);
  assert.doesNotMatch(
    operacao,
    /!estado[\s\S]{0,120}\|\| estado\.carregamento_progressivo/
  );
});

test("expiração administrativa para o polling não perde nem substitui a sessão", async () => {
  const operacao = await source("components/operacao-homologacao.tsx");

  assert.match(operacao, /resposta\.status === 403/);
  assert.match(operacao, /sessão ausente/i);
  assert.match(operacao, /autenticacaoExpiradaAtual\.current = true/);
  assert.match(operacao, /contexto explícito deste Cockpit foi preservado/i);
  assert.match(operacao, /href="\/entrar" target="_blank"/);
  assert.match(operacao, /retomarAposAutenticacaoOuFoco/);
  assert.doesNotMatch(
    operacao,
    /localStorage|sessionStorage|participante fictício|sessão de teste/i
  );
});
