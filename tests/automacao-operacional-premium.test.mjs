import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const raiz = new URL("../", import.meta.url);
const ler = (caminho) => readFileSync(new URL(caminho, raiz), "utf8");

test("preparação modular possui ação explícita e não inicia baseline", () => {
  const componente = ler("components/controle-gravacao-multimodal.tsx");
  const cockpit = ler("components/operacao-homologacao.tsx");
  const sessoes = ler("components/gestao-operacional.tsx");
  assert.match(componente, />\s*PREPARAR SESSÃO\s*</);
  assert.match(componente, /executar\("preparar"/);
  assert.match(componente, /Baseline nunca é iniciado automaticamente/);
  assert.match(componente, /id="preparar-sessao"/);
  assert.match(componente, /!painel\?\.configuracoes\.length/);
  assert.match(
    cockpit,
    /acaoPrincipal === "PREPARAR_SESSAO"[\s\S]*?\/plataforma\/sessoes\?\$\{parametrosDoContexto\}/
  );
  assert.match(sessoes, /PREPARAR SESSÃO/);
  assert.match(sessoes, /<ControleGravacaoMultimodal sessao=\{sessaoParaPreparar\}/);
  assert.match(
    cockpit,
    /const controleDeBaseline = \[[\s\S]*?"PREPARAR_SESSAO"/
  );
  const preparar = componente.slice(
    componente.indexOf("async function prepararSessao"),
    componente.indexOf("async function definirReferenciaBaseline")
  );
  assert.doesNotMatch(preparar, /executar\("baseline"/);
});

test("preparação sem hardware não é classificada como falha técnica", () => {
  const componente = ler("components/controle-gravacao-multimodal.tsx");
  assert.match(componente, /const aguardandoHardware = Boolean\(/);
  assert.match(componente, /AGUARDANDO_FONTE_OPCIONAL/);
  assert.match(componente, /DISPOSITIVO FÍSICO AUSENTE — HOMOLOGAÇÃO PENDENTE/);
  assert.match(componente, />AGUARDANDO HARDWARE</);
  assert.match(
    componente,
    /Nenhuma ausência é tratada como falha ou evidência atual\./
  );
});

test("baseline é referência opcional separada do fluxo científico", () => {
  const componente = ler("components/controle-gravacao-multimodal.tsx");
  const cockpit = ler("components/operacao-homologacao.tsx");
  const rota = ler("app/api/operacao-homologacao/route.ts");
  for (const decisao of [
    "REALIZAR_NOVO_BASELINE",
    "UTILIZAR_BASELINE_ANTERIOR",
    "DISPENSAR_BASELINE_NESTA_SESSAO",
    "PROSSEGUIR_SEM_REFERENCIA_DE_BASELINE"
  ]) {
    assert.match(componente, new RegExp(decisao));
  }
  assert.match(componente, /FLUXO CIENTÍFICO PADRÃO/);
  assert.match(componente, /ENCERRAR BASELINE/);
  assert.match(cockpit, /DEFINIR_REFERENCIA_BASELINE/);
  assert.match(componente, /id="referencia-baseline"/);
  assert.match(rota, /estado-operacional/);
  assert.match(rota, /comandos-operacionais/);
});

test("módulos são opcionais e cobrem as fontes oficiais", () => {
  const componente = ler("components/controle-gravacao-multimodal.tsx");
  for (const fonte of [
    "POLAR_H10",
    "EPOC_X",
    "OUTRO_EEG_HOMOLOGADO",
    "IPHONE_INTEGRADO",
    "CAMERA_MAC",
    "MICROFONE_MAC",
    "CAMERA_IPHONE",
    "MICROFONE_IPHONE",
    "SIMULADOR",
    "ESTIMULO_PADRONIZADO",
    "TELEMETRIA_TAREFA",
    "REGISTROS_PROFISSIONAIS",
    "REPLAY"
  ]) {
    assert.match(componente, new RegExp(fonte));
  }
  assert.match(componente, /const FONTES_PADRAO: string\[\] = \[\]/);
});

test("quatro modos de mídia preservam SEM GRAVAÇÃO como padrão", () => {
  const componente = ler("components/controle-gravacao-multimodal.tsx");
  for (const modo of ["NENHUM", "AUDIO", "VIDEO", "AUDIO_E_VIDEO"]) {
    assert.match(componente, new RegExp(modo));
  }
  assert.match(componente, /useState<Modo>\("NENHUM"\)/);
  assert.match(componente, /SEM GRAVAÇÃO não cria token/);
});

test("configuração da estação usa somente referências protegidas", () => {
  const componente = ler("components/configuracao-estacao-humanexus.tsx");
  const rota = ler("app/api/plataforma/estacao-humanexus/route.ts");
  assert.match(componente, /ENV:HUMANEXUS_CORTEX_CLIENT_ID/);
  assert.match(componente, /KEYCHAIN:HUMANEXUS_CORTEX/);
  assert.match(componente, /Nenhum segredo foi devolvido ao navegador/);
  assert.match(rota, /exigirCsrf/);
  assert.match(rota, /requisitarNucleoAutenticado/);
});

test("tema gráfico remove azul-neon e prioriza dourado", () => {
  const tema = ler("lib/humanexus-chart-theme.ts");
  assert.match(tema, /gold: "#c9aa63"/);
  assert.match(tema, /cyan: "#6f8987"/);
  assert.doesNotMatch(tema, /#68c9cf|#55d7d1|#00ffff|#00e5ff/i);
  const indiceDourado = tema.indexOf("HX_CHART_COLORS.gold");
  const indiceBranco = tema.indexOf("HX_CHART_COLORS.warmWhite");
  assert.ok(indiceDourado > 0 && indiceDourado < indiceBranco);
});

test("camada premium preserva fundo e responsividade", () => {
  const global = ler("app/globals.css");
  const premium = ler("app/anamnese-operacional.css");
  assert.match(global, /url\(\/media\/hero-command-center\.webp\)/);
  assert.match(premium, /--hx-gold-matte:#c9aa63/);
  assert.match(premium, /\.hx-station/);
  assert.match(premium, /@media\(max-width:700px\)/);
  assert.match(premium, /focus-visible/);
});

test("instrumento integrado mantém escolhas visualmente equivalentes", () => {
  const instrumento = ler("app/anamnese-operacional.css");
  assert.match(
    instrumento,
    /\.hxiicca__resposta fieldset\{[\s\S]*?grid-template-columns:repeat\(2/
  );
  assert.doesNotMatch(
    instrumento,
    /\.hxiicca__resposta label:nth-of-type\(1\)[\s\S]*?(background|transform)/
  );
});
