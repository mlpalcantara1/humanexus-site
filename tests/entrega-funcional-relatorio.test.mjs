import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("autoridade documental usa cadastro civil, CPF e organização reais", async () => {
  const { resolverIdentidadeDocumental } = await import(
    "../lib/humanexus-report-authority.ts"
  );
  const autoridade = await source("lib/humanexus-report-authority.ts");
  const rota = await source("app/api/operacao-homologacao/route.ts");
  const participante = {
    identificador: "PARTICIPANTE-AUTORITATIVO-001",
    identificador_da_organizacao: "ORGANIZACAO-AUTORIZADA-001",
    nome: "USUARIO-AUTENTICADO-NAO-E-PARTICIPANTE",
    referencia_externa: "TITULO-DA-SESSAO-NAO-E-REFERENCIA",
    profissional_responsavel: "PROFISSIONAL-NAO-E-PARTICIPANTE",
    perfil_operacional: {
      dados_cadastrais: {
        nome_completo: "NOME-DE-PERFIL-SECUNDARIO",
        nome_social: "NOME-SOCIAL-DISTINTO",
        cpf: "11111111111"
      },
      dados_minimizados: {
        referencia_operacional: "REF-PERFIL-SECUNDARIA"
      }
    },
    identidade_individual_autoritativa: {
      identificador_do_participante: "PARTICIPANTE-AUTORITATIVO-001",
      identificador_da_organizacao: "ORGANIZACAO-AUTORIZADA-001",
      nome_completo: "PARTICIPANTE CIVIL AUTORITATIVO",
      cpf: "12345678901",
      referencia_operacional: "REF-AUTORITATIVA-001",
      fonte: "IDENTIDADE_LONGITUDINAL_DA_ANAMNESE_NO_ESCOPO",
      escopo_validado: true
    }
  };
  const organizacao = {
    identificador: "ORGANIZACAO-AUTORIZADA-001",
    nome: "ORGANIZAÇÃO AUTORITATIVA"
  };
  const projetada = resolverIdentidadeDocumental(participante, organizacao);
  assert.equal(projetada.nomeCompleto, "PARTICIPANTE CIVIL AUTORITATIVO");
  assert.equal(projetada.cpf, "123.456.789-01");
  assert.equal(projetada.referenciaOperacional, "REF-AUTORITATIVA-001");
  assert.equal(projetada.organizacao, "ORGANIZAÇÃO AUTORITATIVA");
  assert.equal(projetada.origemDoNome, "PARTICIPANT_ONLY");
  assert.equal(projetada.origemDoCpf, "PARTICIPANT_ONLY");
  assert.equal(projetada.origemDaReferencia, "REFERENCE_ONLY");
  const serializada = JSON.stringify(projetada);
  for (const proibido of [
    "USUARIO-AUTENTICADO-NAO-E-PARTICIPANTE",
    "PROFISSIONAL-NAO-E-PARTICIPANTE",
    "TITULO-DA-SESSAO-NAO-E-REFERENCIA",
    "NOME-DE-PERFIL-SECUNDARIO",
    "NOME-SOCIAL-DISTINTO",
    "REF-PERFIL-SECUNDARIA"
  ]) assert.doesNotMatch(serializada, new RegExp(proibido));
  assert.throws(
    () => resolverIdentidadeDocumental(
      participante,
      { identificador: "ORGANIZACAO-CRUZADA", nome: "OUTRA" }
    ),
    /FORA_DO_ESCOPO_ORGANIZACIONAL/
  );

  const semReferencia = structuredClone(participante);
  delete semReferencia.identidade_individual_autoritativa.referencia_operacional;
  delete semReferencia.perfil_operacional.dados_minimizados.referencia_operacional;
  assert.equal(
    resolverIdentidadeDocumental(semReferencia, organizacao).referenciaOperacional,
    "REFERÊNCIA OPERACIONAL NÃO INFORMADA NO CADASTRO"
  );

  assert.match(autoridade, /identidade_individual_autoritativa/);
  assert.doesNotMatch(autoridade, /participante\.nome\s*\?\?/);
  assert.doesNotMatch(autoridade, /participante\.referencia_externa\s*\?\?/);
  assert.match(rota, /nome: identidadeDocumental\.nomeCompleto/);
  assert.match(rota, /cpf_documental: identidadeDocumental\.cpf/);
  assert.match(rota, /referencia_operacional: identidadeDocumental\.referenciaOperacional/);
  assert.doesNotMatch(rota, /nome:\s*nomeDoParticipante\s*\?\?/);
});

test("consolidação profissional possui quatorze campos, não autosalva e cria versão somente por acréscimo", async () => {
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
  assert.match(rota, /Consolidação profissional somente por acréscimo/);
});

test("ciclo documental ordena versões e gera chave idempotente estável", async () => {
  const {
    chaveIdempotenteDocumental,
    ordenarRelatoriosPorVersao
  } = await import("../lib/humanexus-report-authority.ts");
  const desordenados = [
    { identificador: "A", numero_da_versao: 2, criado_em: "2026-08-23T20:00:00Z" },
    { identificador: "Z", numero_da_versao: 1, criado_em: "2026-08-23T19:00:00Z" }
  ];
  assert.deepEqual(
    ordenarRelatoriosPorVersao(desordenados).map((item) => item.numero_da_versao),
    [1, 2]
  );
  const contexto = { sessao: "SESSAO-001", relatorio: "RELATORIO-V1", versao: 1 };
  const payload = { conclusao: "Conclusão profissional preservada." };
  const primeira = chaveIdempotenteDocumental(
    "consolidar-relatorio", contexto, payload
  );
  const repetida = chaveIdempotenteDocumental(
    "consolidar-relatorio", contexto, structuredClone(payload)
  );
  const alterada = chaveIdempotenteDocumental(
    "consolidar-relatorio",
    contexto,
    { conclusao: "Conclusão profissional revisada." }
  );
  assert.equal(primeira, repetida);
  assert.notEqual(primeira, alterada);
});

test("interface documental bloqueia repetição e confirma persistência autoritativa", async () => {
  const componente = await source("components/consolidacao-profissional-relatorio.tsx");
  const cockpit = await source("components/operacao-homologacao.tsx");
  const validacao = await source("components/sintese-validacao-tirh-v1.tsx");
  const rota = await source("app/api/operacao-homologacao/route.ts");
  assert.match(componente, /conteudoJaPreservado/);
  assert.match(componente, /VERSÃO CONSOLIDADA JÁ PRESERVADA/);
  assert.match(componente, /disabled=\{ocupado \|\| conteudoJaPreservado\}/);
  assert.match(cockpit, /acaoDocumentalEmAndamento/);
  assert.match(cockpit, /ENVIANDO PARA VALIDAÇÃO/);
  assert.match(cockpit, /justificativa profissional foi preservada/);
  assert.match(cockpit, /Núcleo não confirmou a transição/);
  assert.match(validacao, /validacaoEmAndamento/);
  assert.match(validacao, /chaveIdempotenteDocumental/);
  assert.doesNotMatch(validacao, /chave_de_idempotencia: crypto\.randomUUID/);
  assert.match(rota, /chave_de_idempotencia: corpo\.chave_de_idempotencia/);
  assert.match(rota, /ordenarRelatoriosPorVersao/);
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
  assert.match(cockpit, /ENVIAR PARA VALIDAÇÃO/);
  assert.match(cockpit, /VALIDAR RELATÓRIO FINAL/);
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
  const identidadePdf = pdf.slice(
    pdf.indexOf("function identificacaoDocumental"),
    pdf.indexOf("function desenharRadarVetorial")
  );
  assert.match(pdf, /resolverIdentidadeDocumental/);
  assert.match(identidadePdf, /entrada\.organizacao/);
  assert.doesNotMatch(identidadePdf, /identidadeDoCore\.nome_completo|valor\("nome completo:"\)|valor\("cpf:"\)/);
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

test("camada visível traduz termos estrangeiros sem alterar contratos internos", async () => {
  const {
    portuguesNoHtmlVisivel,
    portuguesVisivel,
    portuguesVisivelPreservandoEspacos,
    TERMOS_ESTRANGEIROS_PROIBIDOS_NA_APRESENTACAO
  } = await import("../lib/portugues-visivel.ts");
  const amostra = [
    "Baseline", "Replay", "Cockpit", "claims", "snapshots",
    "dashboard", "performance", "status", "fallback", "Print",
    "Preview", "Production", "runtime", "payload", "endpoint",
    "polling", "cache", "feedback", "loading", "download", "upload",
    "submit", "save", "mobile", "tooltip", "layout", "benchmark",
    "e-book", "premium", "site", "web", "append-only", "read-only",
    "backend", "frontend", "hardware", "software", "handoff", "lease",
    "stale", "stream", "httpOnly", "CSRF", "API", "JSON", "DOM",
    "URL", "Git", "link", "desktop", "core", "gate", "login", "logout",
    "online", "offline", "live", "score", "insights", "QR Code",
    "email", "e-mail", "token", "worker", "schema", "query", "boolean",
    "hash", "command center", "design system", "intelligence", "command",
    "experience", "system", "design", "demo", "radar", "HUD", "LAB",
    "bridge", "alias", "client", "secret", "power", "raw", "mock",
    "scrubber", "zoom", "tablet", "notebook", "regulatory", "cognitive",
    "autonomic", "adaptive", "aviation", "real time", "HRV", "CRM"
  ].join(" · ");
  const traduzida = portuguesVisivel(amostra).toLowerCase();
  for (const termo of TERMOS_ESTRANGEIROS_PROIBIDOS_NA_APRESENTACAO) {
    assert.doesNotMatch(traduzida, new RegExp(`\\b${termo}\\b`, "i"));
  }
  assert.match(traduzida, /referência inicial/);
  assert.match(traduzida, /reprodução histórica/);
  assert.match(traduzida, /afirmações científicas/);
  assert.match(traduzida, /substituição implícita/);
  assert.equal(
    portuguesVisivelPreservandoEspacos("  Preview em Production  "),
    "  Homologação em Produção  "
  );
  assert.equal(portuguesVisivel("ENVIADO_CONFIRMADO"), "ENVIADO CONFIRMADO");

  const { premiumPages } = await import("../lib/premium-pages.generated.ts");
  for (const pagina of Object.values(premiumPages)) {
    const visivel = [
      portuguesVisivel(pagina.title),
      portuguesVisivel(pagina.description),
      portuguesNoHtmlVisivel(pagina.html).replace(/<[^>]+>/g, " ")
    ].join(" ").toLowerCase();
    for (const termo of TERMOS_ESTRANGEIROS_PROIBIDOS_NA_APRESENTACAO) {
      assert.doesNotMatch(visivel, new RegExp(`\\b${termo}\\b`, "i"));
    }
  }

  const contrato = await source("app/api/operacao-homologacao/route.ts");
  assert.match(contrato, /chave_de_idempotencia/);
  assert.match(contrato, /validar-claim-tirh-v1/);

  const camadaGlobal = await source("components/camada-portugues-visivel.tsx");
  const leiauteGlobal = await source("app/layout.tsx");
  assert.match(camadaGlobal, /MutationObserver/);
  assert.match(camadaGlobal, /attributeFilter: \[\.\.\.ATRIBUTOS_VISIVEIS\]/);
  assert.match(camadaGlobal, /ELEMENTOS_PRESERVADOS/);
  assert.match(leiauteGlobal, /<CamadaPortuguesVisivel \/>/);
});
