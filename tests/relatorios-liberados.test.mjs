import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const source = (path) => readFile(new URL(path, root), "utf8");

test("cliente particular e organização possuem áreas autenticadas distintas", async () => {
  const particular = await source("app/(platform)/meus-relatorios/page.tsx");
  const organizacao = await source("app/(platform)/organizacao/relatorios/page.tsx");
  assert.match(particular, /VISUALIZADOR_OPERACIONAL/);
  assert.doesNotMatch(particular, /ADMINISTRADOR_DA_ORGANIZACAO/);
  assert.match(organizacao, /ADMINISTRADOR_DA_ORGANIZACAO/);
  assert.doesNotMatch(organizacao, /VISUALIZADOR_OPERACIONAL/);
  const acessos = await source("app/(platform)/organizacao/relatorios/acessos/page.tsx");
  assert.match(acessos, /ADMINISTRADOR_DA_ORGANIZACAO/);
  assert.match(acessos, /GestaoDeAcessosRelatorios/);
});

test("gestão organizacional concede e revoga destinatários sem acessar conteúdo individual", async () => {
  const componente = await source("components/gestao-acessos-relatorios.tsx");
  assert.match(componente, /Conceder acesso nominal/);
  assert.match(componente, /Revogar acesso nominal/);
  assert.match(componente, /relatórios individuais permanecem isolados/);
  assert.match(componente, /GESTOR_AUTORIZADO/);
  assert.match(componente, /PARTICIPANTE/);
  assert.doesNotMatch(componente, /secoes_json|interpretacao_profissional/);
});

test("consulta e download usam somente a rota de relatórios liberados", async () => {
  const biblioteca = await source("lib/relatorios-liberados.ts");
  const download = await source("app/api/relatorios-liberados/[id]/pdf/route.ts");
  assert.match(biblioteca, /\/api\/v1\/meus-relatorios/);
  assert.match(download, /\/api\/v1\/meus-relatorios/);
  assert.match(download, /COOKIE_SESSAO/);
  assert.match(download, /private, no-store/);
  assert.doesNotMatch(download, /operacao-homologacao/);
});

test("governança interna abre, baixa e imprime o relatório autenticado", async () => {
  const pagina = await source("app/(platform)/profissional/relatorios/[id]/page.tsx");
  const detalhe = await source("components/detalhe-relatorio-governanca.tsx");
  const download = await source("app/api/governanca-relatorios/[id]/pdf/route.ts");
  const impressao = await source("components/botao-imprimir-relatorio.tsx");
  assert.match(pagina, /obterRelatorioEmGovernanca/);
  assert.match(pagina, /PERFIS/);
  assert.match(detalhe, /Baixar PDF/);
  assert.match(detalhe, /BotaoImprimirRelatorio/);
  assert.match(detalhe, /ANEXO TÉCNICO-CIENTÍFICO \/ AUDITORIA/);
  assert.match(download, /\/api\/v1\/relatorios\/\$\{encodeURIComponent\(id\)\}\/pdf/);
  assert.match(download, /COOKIE_SESSAO/);
  assert.match(download, /private, no-store/);
  assert.match(impressao, /window\.print/);
  assert.match(impressao, /Imprimir relatório/);
});

test("relatório externo oferece leitura TIRH humana e auditoria documental separada", async () => {
  const componente = await source("components/relatorios-liberados.tsx");
  assert.match(componente, /LEITURA TIRH/);
  assert.match(componente, /treinamento cognitivo operacional/);
  assert.match(componente, /Consultar versões e referência metodológica/);
  assert.doesNotMatch(componente, /EXECUTIVAS/);
  assert.doesNotMatch(componente, /replaceAll\("_", " "\)/);
  assert.match(componente, /Ainda não há relatórios disponíveis nesta área/);
  for (const termo of [
    "payload", "endpoint", "snapshot", "schema", "JSON", "cache", "query",
    "fallback", "runtime", "version hash",
  ]) assert.doesNotMatch(componente, new RegExp(`>${termo}<`, "i"));
});

test("ciclo documental exige validação, destinatário nominal e liberação explícita", async () => {
  const componente = await source("components/governanca-relatorios.tsx");
  const rota = await source("app/api/governanca-relatorios/route.ts");
  assert.match(componente, /Enviar para validação/);
  assert.match(componente, /Concluir validação/);
  assert.match(componente, /Autorizar destinatário/);
  assert.match(componente, /Revogar acesso do destinatário/);
  assert.match(componente, /Liberar versão concluída/);
  assert.match(componente, /Revogar liberação/);
  assert.match(componente, /E-mail do cliente autorizado/);
  assert.match(rota, /TRANSICIONAR/);
  assert.match(rota, /AUTORIZAR_DESTINATARIO/);
  assert.match(rota, /REVOGAR_ACESSO/);
  assert.match(rota, /LIBERAR/);
  assert.match(rota, /REVOGAR_LIBERACAO/);
  assert.match(rota, /exigirCsrf/);
});

test("governança cria nova versão TIRH sem substituir o documento anterior", async () => {
  const componente = await source("components/governanca-relatorios.tsx");
  const rota = await source("app/api/governanca-relatorios/route.ts");
  const contrato = await source("lib/governanca-relatorios.ts");
  assert.match(componente, /RELATORIOS-TIRH-TCO-3\.0/);
  assert.match(componente, /Atualizar leitura TIRH/);
  assert.match(componente, /CRIAR_NOVA_VERSAO_TIRH/);
  assert.match(rota, /CRIAR_NOVA_VERSAO_TIRH/);
  assert.match(rota, /\/api\/v1\/relatorios\/\$\{encodeURIComponent\(identificador\)\}\/versoes/);
  assert.match(contrato, /versao_do_contrato/);
});

test("auditoria externa recolhida mostra origem, validação, versões e liberação", async () => {
  const componente = await source("components/relatorios-liberados.tsx");
  for (const texto of [
    "AUDITORIA DOCUMENTAL", "Organização", "Participante", "Validação profissional",
    "Versão", "Liberado em", "Responsável",
  ]) assert.match(componente, new RegExp(texto));
});

test("governança separa leitura humana do anexo técnico-científico", async () => {
  const componente = await source("components/detalhe-relatorio-governanca.tsx");
  const contrato = await source("lib/governanca-relatorios.ts");
  assert.match(componente, /Leitura operacional TIRH/);
  assert.match(componente, /ANEXO TÉCNICO-CIENTÍFICO \/ AUDITORIA/);
  assert.match(componente, /Consultar anexo científico e rastreabilidade/);
  assert.match(contrato, /anexo_tecnico/);
});
