import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const source = (path) => readFile(new URL(path, root), "utf8");

test("site expõe Área HUMANEXUS sem substituir AGENDAR", async () => {
  const header = await source("components/site-header.tsx");
  const footer = await source("components/site-footer.tsx");
  assert.match(header, /Área HUMANEXUS/);
  assert.match(header, /Agendar/);
  assert.match(footer, /Área HUMANEXUS/);
});

test("perfis oficiais possuem destinos privados exatos", async () => {
  const session = await source("lib/portal-session.ts");
  const expected = {
    ADMINISTRADOR_DO_SISTEMA: "/admin",
    GOVERNANCA_CIENTIFICA: "/governanca",
    ADMINISTRADOR_DA_ORGANIZACAO: "/organizacao",
    PROFISSIONAL_HUMANEXUS: "/profissional",
    VISUALIZADOR_OPERACIONAL: "/operacional",
    AUDITOR: "/auditoria"
  };
  for (const [profile, destination] of Object.entries(expected)) {
    assert.match(session, new RegExp(`${profile}: "${destination}"`));
  }
});

test("alias organizacional converge para a área privada canônica", async () => {
  const alias = await source("app/(platform)/organizacional/page.tsx");
  assert.match(alias, /redirect\("\/organizacao"\)/);
  assert.doesNotMatch(alias, /preparada para evoluir/);
});

test("token de sessão não é armazenado no navegador", async () => {
  const files = [
    "app/(platform)/entrar/page.tsx",
    "components/formulario-entrada.tsx",
    "lib/humanexus-api.ts"
  ];
  for (const file of files) {
    const content = await source(file);
    assert.doesNotMatch(content, /sessionStorage|localStorage/);
  }
  const login = await source("app/api/sessao/entrar/route.ts");
  assert.match(login, /httpOnly: true/);
  assert.match(login, /sameSite: "strict"/);
  assert.match(login, /protocol === "https:"/);
});

test("site e plataforma possuem layouts estruturalmente isolados", async () => {
  const rootLayout = await source("app/layout.tsx");
  const siteLayout = await source("app/(site)/layout.tsx");
  const platformLayout = await source("app/(platform)/layout.tsx");
  const platformShell = await source("components/platform-shell.tsx");

  assert.doesNotMatch(rootLayout, /SiteHeader|SiteFooter|FloatingWhatsApp/);
  assert.match(siteLayout, /SiteHeader/);
  assert.match(siteLayout, /SiteFooter/);
  assert.match(siteLayout, /FloatingWhatsApp/);
  assert.match(platformLayout, /PlatformShell/);
  assert.doesNotMatch(platformShell, /SiteHeader|SiteFooter|FloatingWhatsApp/);
});

test("autenticação provisória está funcionalmente desativada", async () => {
  const legacy = await source("app/api/humanexus/auth/route.ts");
  const security = await source("lib/humanexus-security.ts");
  assert.match(legacy, /status: 410/);
  assert.doesNotMatch(security, /createProfessionalToken|verifyProfessionalCredentials/);
});

test("convite usa a rota canônica", async () => {
  const panel = await source("components/painel-profissional.tsx");
  const route = await source("app/api/humanexus/anamneses/route.ts");
  const client = await source("lib/humanexus-api.ts");
  const config = await source("next.config.ts");
  assert.match(panel, /\/acesso-participante\?token=\$\{/);
  assert.match(panel, /Participante existente/);
  assert.match(panel, /carregarParticipantes/);
  assert.match(route, /\/api\/v1\/anamneses\/convites-seguros/);
  assert.doesNotMatch(route, /\/participantes\/\$\{.*\}\/anamneses/);
  assert.match(client, /fetch\(path/);
  assert.doesNotMatch(client, /NEXT_PUBLIC_HUMANEXUS_API_URL/);
  assert.match(config, /destination: "\/anamnese\/convite\/:token"/);
});

test("sessão e convites preservam o escopo organizacional selecionado", async () => {
  const management = await source("components/gestao-operacional.tsx");
  const managementRoute = await source("app/api/gestao-operacional/route.ts");
  const invitationRoute = await source(
    "app/api/humanexus/gestao-convites/route.ts"
  );
  const panel = await source("components/painel-profissional.tsx");
  assert.match(management, /identificador_da_organizacao:/);
  assert.match(management, /chave_de_idempotencia/);
  assert.match(management, /tipo_de_sessao/);
  assert.match(management, /Baseline/);
  assert.match(management, /PRÉ → TREINO → PÓS/);
  assert.match(management, /INICIAR SESSÃO/);
  assert.match(management, /\/plataforma\/cockpit-vivo\?/);
  assert.match(managementRoute, /x-humanexus-organization-id/);
  assert.match(invitationRoute, /x-humanexus-organization-id/);
  assert.match(panel, /Particulares/);
  assert.match(panel, /Organizacionais/);
});

test("treinamentos usam somente a biblioteca oficial e evidência persistida", async () => {
  const management = await source("components/gestao-operacional.tsx");
  const liveCockpit = await source("components/cockpit-operacional-vivo.tsx");
  assert.match(management, /BIBLIOTECA OFICIAL HUMANEXUS/);
  assert.match(management, /biblioteca_thx_oficial/);
  assert.match(management, /evidencias_regulatorias_treinamento/);
  assert.match(management, /Recomendados/);
  assert.match(management, /Compatíveis/);
  assert.match(management, /Biblioteca completa/);
  assert.match(management, /Ver detalhes operacionais/);
  assert.match(management, /duracao_operacional/);
  assert.match(management, /gatilhos_relacionados/);
  assert.match(management, /rotas_regulatorias_relacionadas/);
  assert.match(management, /conteudo_oficial_confirmado/);
  assert.match(management, /Mostrar mais 24 protocolos/);
  assert.doesNotMatch(management, /Novo treinamento/);
  assert.doesNotMatch(management, /Adicionar ao catálogo/);
  assert.match(liveCockpit, /Baseline como modalidade independente/);
});

test("participantes possuem grupos e busca operacional completa", async () => {
  const management = await source("components/gestao-operacional.tsx");
  for (const field of [
    "buscaParticipante",
    "matricula",
    "unidade",
    "setor",
    "equipe",
    "funcao"
  ]) {
    assert.match(management, new RegExp(field));
  }
  assert.match(management, /Particulares/);
  assert.match(management, /Organizacionais/);
});

test("status jurídico removido do instrumento integrado e de suas cópias", async () => {
  const files = [
    "components/instrumento-integrado.tsx",
    "components/formulario-consentimento.tsx",
    "components/governanca-operacional.tsx",
    "lib/instrumento-integrado-pdf.ts"
  ];
  for (const file of files) {
    const content = await source(file);
    assert.doesNotMatch(content, /pendente.{0,8}homologa.{0,8}jur[ií]d/i);
  }
});

test("evidência aceita pode ser citada idempotentemente na Formulação oficial", async () => {
  const panel = await source("components/painel-profissional.tsx");
  const route = await source("app/api/humanexus/formulacoes/route.ts");
  assert.match(panel, /Citar na Formulação/);
  assert.match(route, /referencias_de_origem/);
  assert.match(route, /evidencias\.includes\(evidencia\)/);
  assert.match(route, /CITACAO_DE_ORIGEM_SEM_INTERPRETACAO_AUTOMATICA/);
  assert.match(route, /exigirMesmaOrigem/);
});

test("módulos operacionais usam gestão real sem ações de fachada", async () => {
  const modules = await source("components/modulo-integrado.tsx");
  assert.match(modules, /ESTADO FUNCIONAL/);
  assert.match(modules, /GestaoOperacional/);
  assert.doesNotMatch(modules, /estado: "PARCIAL"/);
  assert.doesNotMatch(modules, />Criar organização</);
  assert.doesNotMatch(modules, />Cadastrar cliente</);
  assert.doesNotMatch(modules, />Criar sessão</);
  assert.match(modules, /Gerar convite de Anamnese/);
});

test("organização e participante usam ficha completa, versionada e reabrível", async () => {
  const management = await source("components/gestao-operacional.tsx");
  const route = await source("app/api/gestao-operacional/route.ts");

  for (const field of [
    "razao_social",
    "nome_fantasia",
    "cnpj",
    "inscricao_estadual",
    "responsavel_nome",
    "nome_completo",
    "data_de_nascimento",
    "dados_profissionais",
    "documentos",
    "elegibilidade",
    "justificativa_da_elegibilidade"
  ]) {
    assert.match(management, new RegExp(field));
  }
  assert.match(management, /Abrir ficha/);
  assert.match(management, /Salvar nova versão/);
  assert.match(management, /inativar-participante/);
  assert.match(management, /reativar-participante/);
  assert.doesNotMatch(management, /CADASTRO MINIMIZADO/);

  assert.match(route, /\/api\/v1\/gestao\/contexto/);
  assert.match(route, /new URLSearchParams\(\{ modulo \}\)/);
  assert.doesNotMatch(route, /participantes\.flatMap/);
  assert.doesNotMatch(route, /\/api\/v1\/usuarios/);
});

test("painel e gestão evitam waterfall e carga global duplicada", async () => {
  const modules = await source("components/modulo-integrado.tsx");
  const summary = await source("app/api/plataforma/resumo/route.ts");
  const management = await source("app/api/gestao-operacional/route.ts");

  assert.match(summary, /\/api\/v1\/painel\/inicial/);
  assert.doesNotMatch(summary, /FONTES_GERAIS/);
  assert.match(modules, /exigeConsultaGlobal/);
  assert.match(modules, /"painel",\s*"formulacao",\s*"humanexus-lab"/);
  assert.match(management, /\/api\/v1\/gestao\/contexto/);
});

test("admin converge para a ficha canônica e usuários são editáveis", async () => {
  const panel = await source("components/painel-administrador.tsx");
  const route = await source("app/api/administracao/route.ts");

  assert.match(panel, /href="\/plataforma\/organizacoes"/);
  assert.doesNotMatch(panel, /nomeOrganizacao|criarOrganizacao/);
  assert.match(panel, /Ficha do usuário/);
  assert.match(panel, /Abrir ficha/);
  assert.match(panel, /registro_profissional/);
  assert.match(panel, /Salvar nova versão/);
  assert.match(route, /atualizar_usuario/);
  assert.match(route, /method: "PUT"/);
});

test("operações legadas permanecem compatíveis sem reabrir cadastro oficial", async () => {
  const management = await source("components/gestao-operacional.tsx");
  const route = await source("app/api/gestao-operacional/route.ts");

  for (const action of [
    "criar-treinamento",
    "inativar-treinamento",
    "reativar-treinamento",
    "operar-programacao",
    "programar-treinamento"
  ]) {
    assert.match(route, new RegExp(action));
  }
  assert.doesNotMatch(management, /criar-treinamento/);
  assert.doesNotMatch(management, /inativar-treinamento/);
  assert.match(management, /Programações existentes/);
  assert.match(management, /atualizar-contrato/);
  assert.match(management, /Ficha contratual/);
  assert.match(management, /Histórico/);
});

test("middleware cobre todas as áreas privadas", async () => {
  const middleware = await source("middleware.ts");
  for (const route of [
    "/admin",
    "/governanca",
    "/organizacao",
    "/profissional",
    "/operacional",
    "/auditoria",
    "/plataforma",
    "/sair"
  ]) {
    assert.match(middleware, new RegExp(`"${route.replace("/", "\\/")}`));
  }
});

test("TCLE usa aceites separados e recuperação proprietária não expõe token", async () => {
  const consentimento = await source("components/formulario-consentimento.tsx");
  const governanca = await source("components/governanca-operacional.tsx");
  const recuperacao = await source(
    "app/api/sessao/recuperacao/local-proprietario/route.ts"
  );
  const core = await source("lib/humanexus-core.ts");
  const redefinicao = await source("components/formulario-redefinicao.tsx");

  assert.match(consentimento, /value="ACEITO"/);
  assert.match(consentimento, /value="RECUSADO"/);
  assert.match(consentimento, /checked=\{decisao === "ACEITO"\}/);
  assert.doesNotMatch(consentimento, /defaultChecked/);
  for (const tipo of [
    "TCLE",
    "AVISO_PRIVACIDADE",
    "TERMOS_USO",
    "DADOS_SENSIVEIS",
    "AUTORIZACAO_POLAR_H10",
    "AUTORIZACAO_EEG",
    "AUTORIZACAO_REPLAY_TELEMETRIA",
    "AUTORIZACAO_PESQUISA",
    "ASSENTIMENTO_ADOLESCENTE",
    "AUTORIZACAO_RESPONSAVEL_LEGAL"
  ]) {
    assert.match(governanca, new RegExp(tipo));
  }
  assert.match(recuperacao, /HOSPEDES_LOCAIS/);
  assert.match(core, /x-humanexus-local-recovery-secret/);
  assert.match(core, /server-only/);
  assert.match(core, /Núcleo temporariamente indisponível/);
  assert.match(core, /consultaSegura \? 3 : 1/);
  assert.match(redefinicao, /modo.*local/);
  assert.doesNotMatch(redefinicao, /token.*modo.*local/);
});
