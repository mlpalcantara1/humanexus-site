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
    ADMINISTRADOR_PROPRIETARIO: "/admin",
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

test("Administrador Proprietário possui autoridade operacional exclusiva no portal", async () => {
  const core = await source("lib/humanexus-core.ts");
  const shell = await source("components/platform-shell.tsx");
  const securePanel = await source("components/painel-seguro.tsx");
  const management = await source("components/gestao-operacional.tsx");
  const operation = await source("components/operacao-homologacao.tsx");
  const administration = await source("components/painel-administrador.tsx");

  assert.match(core, /"ADMINISTRADOR_PROPRIETARIO"/);
  assert.match(shell, /"Administrador Proprietário"/);
  assert.match(securePanel, /perfil !== "ADMINISTRADOR_PROPRIETARIO"/);
  assert.match(management, /permissoesDoUsuario\.includes\("conduzir_sessao"\)/);
  assert.match(operation, /includes\("conduzir_sessao"\)/);
  assert.match(administration, /Acesso protegido/);
  assert.match(administration, /mecanismo extraordinário|perfil e escopo protegidos/);
  assert.doesNotMatch(
    administration,
    /\["ADMINISTRADOR_PROPRIETARIO","ADMINISTRADOR_DO_SISTEMA"/
  );
});

test("alias organizacional converge para a área privada canônica", async () => {
  const alias = await source("app/(platform)/organizacional/page.tsx");
  assert.match(alias, /redirect\("\/organizacao"\)/);
  assert.doesNotMatch(alias, /preparada para evoluir/);
});

test("token de sessão não é armazenado no navegador", async () => {
  const files = [
    "app/(entry)/entrar/page.tsx",
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

test("entrada diferencia bloqueio, inatividade e indisponibilidade sem revelar credenciais", async () => {
  const login = await source("app/api/sessao/entrar/route.ts");
  const core = await source("lib/humanexus-core.ts");
  assert.match(login, /AUTENTICACAO_TEMPORARIAMENTE_BLOQUEADA/);
  assert.match(login, /status: 423/);
  assert.match(login, /CONTA_INATIVA/);
  assert.match(login, /status: 403/);
  assert.match(login, /NUCLEO_TEMPORARIAMENTE_INDISPONIVEL/);
  assert.match(login, /status: 503/);
  assert.match(login, /CREDENCIAIS_INVALIDAS/);
  assert.match(login, /E-mail ou senha inválidos\./);
  assert.match(login, /301, 302, 303, 307, 308/);
  assert.match(core, /redirect: "manual"/);
});

test("bypass do Core Preview permanece exclusivamente servidor-a-servidor", async () => {
  const core = await source("lib/humanexus-core.ts");
  const client = await source("lib/humanexus-api.ts");
  assert.match(core, /HUMANEXUS_CORE_PROTECTION_BYPASS_SECRET/);
  assert.match(core, /"x-vercel-protection-bypass"/);
  assert.match(core, /import "server-only"/);
  assert.doesNotMatch(client, /PROTECTION_BYPASS|x-vercel-protection-bypass/);
  assert.doesNotMatch(core, /NEXT_PUBLIC_.*BYPASS/);
});

test("site e plataforma possuem layouts estruturalmente isolados", async () => {
  const rootLayout = await source("app/layout.tsx");
  const siteLayout = await source("app/(site)/layout.tsx");
  const entryLayout = await source("app/(entry)/layout.tsx");
  const platformLayout = await source("app/(platform)/layout.tsx");
  const entryShell = await source("components/platform-entry-shell.tsx");
  const platformShell = await source("components/platform-shell.tsx");

  assert.doesNotMatch(rootLayout, /SiteHeader|SiteFooter|FloatingWhatsApp/);
  assert.match(siteLayout, /SiteHeader/);
  assert.match(siteLayout, /SiteFooter/);
  assert.match(siteLayout, /FloatingWhatsApp/);
  assert.match(entryLayout, /PlatformEntryShell/);
  assert.doesNotMatch(entryShell, /PlatformNavigation|SessionContinuity|sessaoAtual/);
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
  const navigation = await source("components/platform-navigation.tsx");
  const navigationContext = await source("lib/contexto-navegacao.ts");
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
  assert.match(management, /PREPARAR SESSÃO/);
  assert.match(management, /ABRIR PAINEL OPERACIONAL/);
  assert.match(management, /\/plataforma\/cockpit-vivo\?/);
  assert.match(management, /Sessão criada e contexto preservado/);
  assert.doesNotMatch(management, /iniciarSessaoDiretamente/);
  assert.doesNotMatch(management, />\s*(?:INICIAR SESSÃO|PAUSAR|RETOMAR)\s*</);
  assert.match(management, /atualizarContextoNaUrl/);
  for (const key of ["organizacao", "participante", "sessao", "thx"]) {
    assert.match(`${navigation}\n${navigationContext}`, new RegExp(`"${key}"`));
  }
  assert.match(managementRoute, /x-humanexus-organization-id/);
  assert.match(invitationRoute, /x-humanexus-organization-id/);
  assert.match(panel, /Particulares/);
  assert.match(panel, /Organizacionais/);
});

test("criação da sessão exige escolhas profissionais e Cockpit não reutiliza contexto", async () => {
  const management = await source("components/gestao-operacional.tsx");
  const cockpit = await source("components/operacao-homologacao.tsx");
  const route = await source("app/api/operacao-homologacao/route.ts");

  for (const evidence of [
    "Sugestões oficiais da MMFTR e Biblioteca THX",
    "ACATAR RECOMENDAÇÃO",
    "NÃO ACATAR",
    "SUBSTITUIR",
    "DEIXAR SEM SELEÇÃO",
    "Justificativa profissional",
    "Finalidade editável"
  ]) {
    assert.match(management, new RegExp(evidence));
  }
  assert.doesNotMatch(
    management,
    /finalidade: "HOMOLOGAÇÃO FÍSICA FINAL/
  );
  assert.doesNotMatch(management, /primeiroThx/);
  assert.match(cockpit, /Selecione o contexto operacional/);
  assert.match(cockpit, /NENHUM CONTEXTO ANTERIOR SERÁ REUTILIZADO/);
  assert.match(cockpit, /atualizacaoEmAndamento/);
  assert.doesNotMatch(route, /\?\? sessoes\[0\]/);
  assert.match(
    route,
    /Selecione explicitamente o participante antes de abrir o painel operacional/
  );
  assert.match(
    route,
    /Sessão não pertence ao participante e à organização selecionados/
  );
  assert.match(route, /sessao\.detalhes_operacionais/);
  assert.match(
    route,
    /Object\.keys\(detalhesOperacionaisConsultados\)\.length/
  );
  assert.doesNotMatch(
    route,
    /identificador_do_profissional:\s*usuario\.identificador/
  );
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
  assert.match(management, /Favoritos/);
  assert.match(management, /humanexus:thx-favoritos:v1/);
  assert.match(management, /aria-pressed=\{favorito\}/);
  assert.match(management, /Ver detalhes operacionais/);
  assert.match(management, /duracao_operacional/);
  assert.match(management, /gatilhos_relacionados/);
  assert.match(management, /rotas_regulatorias_relacionadas/);
  assert.match(management, /conteudo_oficial_confirmado/);
  assert.match(management, /Mostrar mais 24 protocolos/);
  assert.doesNotMatch(management, /Novo treinamento/);
  assert.doesNotMatch(management, /Adicionar ao catálogo/);
  assert.match(liveCockpit, /Referência inicial como modalidade independente/);
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

test("ficha do participante é reaberta pela URL sem cair em formulário vazio", async () => {
  const management = await source("components/gestao-operacional.tsx");
  assert.match(management, /participanteDaNavegacao \|\| participanteSelecionado/);
  assert.match(management, /String\(item\.identificador\) === identificadorDoParticipanteAberto/);
  assert.match(management, /setParticipanteSelecionado\(identificadorDoParticipanteAberto\)/);
  assert.match(management, /preencherParticipante\(participanteAberto\)/);
  assert.match(management, /atualizarContextoNaUrl\(\{ participante: "", sessao: "" \}\)/);
});

test("anamnese respeita o contexto explícito e falha fechada sem fallback organizacional", async () => {
  const painel = await source("components/painel-profissional.tsx");
  assert.match(painel, /parametros\.get\("organizacao"\)/);
  assert.match(painel, /parametros\.get\("participante"\)/);
  assert.match(
    painel,
    /carregarParticipantes\(organizacao, participante\)/
  );
  assert.match(painel, /organizacaoAtual !== organizacao/);
  assert.match(
    painel,
    /O Núcleo não confirmou a organização solicitada/
  );
  assert.match(painel, /participanteSolicitado && !participanteAtual/);
  assert.match(painel, /atualizarContextoDaAnamnese\(form\.organizacao, identificador\)/);
});

test("rótulo individual usa a autoridade do participante e separa referência", async () => {
  const management = await source("components/gestao-operacional.tsx");
  assert.match(
    management,
    /resolverIdentidadeDocumental\(registro[\s\S]*\.nomeCompleto/
  );
  assert.match(
    management,
    /identidade\.referenciaOperacional !== identidade\.nomeCompleto[\s\S]*\$\{identidade\.nomeCompleto\} — \$\{identidade\.referenciaOperacional\}/
  );
  const rotulo = management.slice(
    management.indexOf("function rotuloDoParticipante"),
    management.indexOf("function normalizar")
  );
  assert.doesNotMatch(rotulo, /nome_social|nome_preferencial|referencia_externa/);
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

test("painel não apresenta o total autorizado como organizações ativas", async () => {
  const modules = await source("components/modulo-integrado.tsx");
  assert.match(modules, /Organizações autorizadas/);
  assert.doesNotMatch(modules, /Organização ativa/);
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

  assert.match(management, /function participanteAtivo/);
  assert.match(management, /function organizacaoAtiva/);
  assert.match(management, /const participantesAtivos = [\s\S]*filter\([\s\S]*participanteAtivo/);
  assert.match(management, /const organizacoesAtivas = [\s\S]*filter\([\s\S]*organizacaoAtiva/);
  assert.doesNotMatch(management, /\{dados\.participantes\.map/);
  assert.doesNotMatch(management, /\{dados\?\.organizacoes\.map/);
  assert.match(
    management,
    /participanteAtivo\(item\) &&[\s\S]*identificador_do_participante/
  );

  assert.match(route, /\/api\/v1\/gestao\/contexto/);
  assert.match(route, /new URLSearchParams\(\{ modulo \}\)/);
  assert.doesNotMatch(route, /participantes\.flatMap/);
  assert.doesNotMatch(route, /\/api\/v1\/usuarios/);
});

test("cockpit exclui participante inativo do seletor e recusa contexto direto", async () => {
  const cockpit = await source("components/operacao-homologacao.tsx");
  const route = await source("app/api/operacao-homologacao/route.ts");

  assert.match(cockpit, /function participanteAtivo/);
  assert.match(
    cockpit,
    /contexto\.participantes\.filter\([\s\S]*participanteAtivo/
  );
  assert.match(
    cockpit,
    /contextoRecebido\.participantes[\s\S]*\.filter\(participanteAtivo\)[\s\S]*\.map/
  );
  assert.match(route, /function participanteAtivo/);
  assert.match(
    route,
    /contextoBase\.participantes\.filter\(participanteAtivo\)/
  );
  assert.doesNotMatch(
    cockpit,
    /contexto\.participantes\.map\(\(item\) => \(\s*<option/
  );
});

test("governança de cadastros separa proprietário, profissional e volume técnico", async () => {
  const management = await source("components/gestao-operacional.tsx");
  const styles = await source("app/operational.css");
  assert.match(
    management,
    /const podeGerenciarParticipantes = administradorProprietario \|\| \([\s\S]*PROFISSIONAL_HUMANEXUS[\s\S]*gerenciar_participantes/
  );
  assert.match(
    management,
    /const podeCriarOrganizacao =[\s\S]*administradorProprietario[\s\S]*criar_organizacao/
  );
  assert.match(management, /resumo_humano_do_impacto/);
  assert.match(management, /Evidências técnicas preservadas/);
  assert.match(management, /Senha do profissional autorizado/);
  assert.doesNotMatch(
    management,
    /Dependências encontradas:[\s\S]{0,500}PARTICIPANTE/
  );
  assert.match(styles, /hx-management-table--organizations article/);
  assert.match(styles, /hx-management-table--participants article/);
});

test("organização possui bases estruturadas e painel agregado com filtros B2B", async () => {
  const management = await source("components/gestao-operacional.tsx");
  const route = await source("app/api/gestao-operacional/route.ts");
  const styles = await source("app/humanexus-design-system.css");

  assert.match(management, /type BaseOperacional/);
  assert.match(management, /Bases operacionais/);
  assert.match(management, /Adicionar base operacional/);
  assert.match(management, /Base operacional<select/);
  assert.match(management, /Painel organizacional/);
  assert.match(management, /Somente agregados reais do escopo autorizado/);
  for (const filtro of [
    "empresa", "base", "funcao", "qualificacao", "status",
    "periodo_inicio", "periodo_fim", "treinamento", "dominio"
  ]) {
    assert.match(management, new RegExp(filtro));
    assert.match(route, new RegExp(`"${filtro}"`));
  }
  assert.match(management, /Consolidação vetorial organizacional indisponível/);
  assert.match(styles, /hx-organizational-filters/);
  assert.match(styles, /hx-organizational-columns/);
});

test("novos cadastros preservam escopo e proprietário reautentica ações críticas", async () => {
  const management = await source("components/gestao-operacional.tsx");
  const route = await source("app/api/gestao-operacional/route.ts");

  assert.match(management, /const organizacaoDoCadastro/);
  assert.match(management, /identificador_do_participante: identificador/);
  assert.match(management, /await carregar\(organizacaoDoCadastro\)/);
  assert.match(
    management,
    /async function carregar[\s\S]*?setEntregaDeConsentimento\(null\)/
  );
  assert.match(management, /administrador_proprietario === true/);
  assert.match(management, /Autonomia exclusiva do proprietário/);
  assert.match(management, /Confirmação da edição proprietária/);
  assert.match(management, /autoComplete="current-password"/);
  assert.match(management, /new FormData\(/);
  assert.match(management, /name="senha_do_proprietario"/);
  assert.match(management, /name="confirmacao_do_proprietario"/);
  assert.match(management, /formulario\.get\("senha_do_proprietario"\)/);
  assert.match(management, /formulario\.get\("confirmacao_do_proprietario"\)/);
  assert.match(management, /senha_do_proprietario/);
  assert.match(management, /confirmacao_do_proprietario/);
  assert.match(management, /Verificar impacto da exclusão/);
  assert.match(management, /transferirParticipanteSelecionado/);
  assert.match(management, /EXCLUSAO_CONTROLADA/);
  assert.doesNotMatch(management, /localStorage.*senha/i);

  for (const action of [
    "impacto-exclusao-organizacao",
    "excluir-organizacao",
    "impacto-exclusao-participante",
    "transferir-participante",
    "excluir-participante"
  ]) {
    assert.match(route, new RegExp(action));
  }
});

test("painel e gestão evitam waterfall e carga global duplicada", async () => {
  const modules = await source("components/modulo-integrado.tsx");
  const lab = await source("app/api/plataforma/lab/route.ts");
  const summary = await source("app/api/plataforma/resumo/route.ts");
  const management = await source("app/api/gestao-operacional/route.ts");

  assert.match(summary, /\/api\/v1\/painel\/inicial/);
  assert.doesNotMatch(summary, /FONTES_GERAIS/);
  assert.match(modules, /exigeConsultaGlobal/);
  assert.match(modules, /"painel",\s*"formulacao",\s*"humanexus-lab"/);
  assert.match(lab, /\/api\/v1\/humanexus-lab\?modo=indice/);
  assert.match(modules, /await Promise\.all\(/);
  assert.match(modules, /setResposta[\s\S]*?const avisos/);
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

test("administração traduz permissões e exige organização dos perfis restritos", async () => {
  const seguro = await source("components/painel-seguro.tsx");
  const admin = await source("components/painel-administrador.tsx");
  assert.match(seguro, /ROTULOS_DAS_PERMISSOES/);
  assert.match(seguro, /Todas as organizações autorizadas/);
  assert.match(admin, /PERFIS_DE_ESCOPO_ORGANIZACIONAL/);
  assert.match(admin, /required=\{exigeOrganizacao\}/);
  assert.match(admin, /O acesso não é herdado por outras organizações/);
});

test("Configurações explica e opera somente contratos e vínculos", async () => {
  const modulo = await source("components/modulo-integrado.tsx");
  const gestao = await source("components/gestao-operacional.tsx");
  assert.match(modulo, /Contratos e vínculos do contexto autorizado/);
  assert.doesNotMatch(modulo, /configuracoes:[^\n]*versao_cientifica/);
  assert.match(gestao, /Novo vínculo contratual/);
  assert.match(gestao, /Cada alteração cria uma nova versão auditável/);
});

test("operações legadas permanecem compatíveis sem reabrir cadastro oficial", async () => {
  const management = await source("components/gestao-operacional.tsx");
  const route = await source("app/api/gestao-operacional/route.ts");

  for (const action of [
    "criar-treinamento",
    "inativar-treinamento",
    "reativar-treinamento",
    "operar-programacao",
    "programar-treinamento",
    "atualizar-programacao",
    "historico-sessao"
  ]) {
    assert.match(route, new RegExp(action));
  }
  assert.doesNotMatch(management, /criar-treinamento/);
  assert.doesNotMatch(management, /inativar-treinamento/);
  assert.match(management, /Programações existentes/);
  assert.match(management, /Editar programação/);
  assert.match(management, /historico\.length/);
  assert.match(management, /Inativar programação/);
  assert.match(management, /Cancelar sessão/);
  assert.match(management, /Ver histórico/);
  assert.match(route, /metodo = "GET"/);
  assert.match(route, /metodo = "PUT"/);
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

test("anamnese alimenta sugestões MMFTR com decisão e programação profissionais", async () => {
  const management = await source("components/gestao-operacional.tsx");
  const route = await source("app/api/gestao-operacional/route.ts");

  assert.match(management, /sugestoes_pre_baseline/);
  assert.match(management, /PROJEÇÃO REGULATÓRIA ANTERIOR À REFERÊNCIA INICIAL/);
  assert.match(management, /Preparar para validação/);
  assert.match(management, /Confirmar/);
  assert.match(management, /Recusar/);
  assert.match(management, /Substituir seleção/);
  assert.match(management, /Programar treinamento/);
  assert.match(management, /identificador_da_sessao/);
  assert.match(management, /duracao_minutos/);
  assert.match(management, /sequencia/);
  assert.match(route, /materializar-sugestao-pre-baseline/);
  assert.match(route, /decidir-recomendacao-thx/);
  assert.doesNotMatch(management, /selecao_automatica:\s*true/);
});

test("sessão exige nome, decisão explícita e comandos completos no Cockpit", async () => {
  const management = await source("components/gestao-operacional.tsx");
  const operation = await source("components/operacao-homologacao.tsx");
  const cockpit = await source("components/cockpit-operacional-vivo.tsx");
  const route = await source("app/api/gestao-operacional/route.ts");

  assert.match(management, /Nome da sessão/);
  assert.match(management, /nome_da_sessao/);
  assert.match(management, /ACATAR RECOMENDAÇÃO/);
  assert.match(management, /NÃO ACATAR/);
  assert.match(management, /SUBSTITUIR/);
  assert.match(management, /DEIXAR SEM SELEÇÃO/);
  assert.match(management, /Biblioteca Oficial completa/);
  assert.doesNotMatch(
    management,
    /decisao_profissional:\s*"NAO_SELECIONAR"/
  );
  assert.match(route, /atualizar-sessao/);
  assert.match(route, /configuracao-operacional/);
  assert.match(cockpit, /contextoSessao\.nome_operacional/);
  assert.match(operation, /PREPARAR SESSÃO/);
  assert.match(operation, /INICIAR_PRE: "Iniciar PRÉ"/);
  assert.match(operation, /PAUSAR_PRE: "Pausar PRÉ"/);
  assert.match(operation, /RETOMAR_PRE: "Retomar PRÉ"/);
  assert.match(operation, /ENCERRAR SESSÃO/);
  assert.match(operation, /rotuloDoComandoCentral/);
});

test("fechamento da Fase 1 preserva contexto e remove bloqueios cadastrais", async () => {
  const management = await source("components/gestao-operacional.tsx");
  const invites = await source("components/painel-profissional.tsx");
  const session = await source("components/session-continuity.tsx");
  const renewal = await source("app/api/sessao/renovar/route.ts");
  const login = await source("components/formulario-entrada.tsx");
  const cep = await source("app/api/endereco/cep/[cep]/route.ts");
  const design = await source("app/humanexus-design-system.css");

  assert.match(management, /profissionalPadrao/);
  assert.match(management, /corpo\.profissionais\?\.length === 1/);
  assert.match(management, /rotuloDoParticipante/);
  assert.match(management, /elegibilidade_anterior/);
  assert.match(management, /elegibilidade_nova/);
  assert.match(management, /Organização de vínculo reutilizada/);
  assert.match(management, /replay: false/);
  assert.match(management, /relatorio: false/);
  assert.match(management, /longitudinal: false/);

  assert.match(invites, /selecionarParticipanteExistente/);
  assert.match(invites, /telefone: cadastrais\?\.telefone/);
  assert.match(invites, /tipo_atendimento !== "PARTICULAR"/);
  assert.match(invites, /dados_profissionais\?\.funcao/);
  assert.match(
    invites,
    /não pode ser reclassificado por este convite/
  );
  assert.match(
    invites,
    /disabled=\{form\.modo === "EXISTENTE" && Boolean\(form\.participante\)\}/
  );

  assert.match(cep, /viacep\.com\.br/);
  assert.match(cep, /AbortSignal\.timeout\(4_000\)/);
  assert.match(cep, /Preencha o endereço manualmente/);
  assert.match(session, /8 \* 60 \* 60/);
  assert.match(session, /Continuar conectado/);
  assert.match(session, /x-humanexus-csrf/);
  assert.match(renewal, /expira_em_segundos/);
  assert.match(renewal, /COOKIE_CSRF/);
  assert.match(login, /retorno\.startsWith\("\/plataforma\/"\)/);
  assert.match(design, /grid-template-columns: minmax\(250px/);
  assert.match(design, /flex-wrap: wrap/);
});

test("relatório oferece PDF para download e impressão autenticada", async () => {
  const operation = await source("components/operacao-homologacao.tsx");
  const pdf = await source("app/api/operacao-homologacao/pdf/route.ts");

  assert.match(operation, /Baixar PDF final/);
  assert.match(operation, /Abrir impressão final/);
  assert.match(operation, /cicloDoRelatorioAtual\.finalDisponivel/);
  assert.match(operation, /modo=impressao/);
  assert.match(pdf, /modoImpressao/);
  assert.match(pdf, /inline/);
  assert.match(pdf, /attachment/);
  assert.match(pdf, /cache-control.*private, no-store/s);
});
