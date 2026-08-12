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

test("relatório externo oferece duas camadas em linguagem humana", async () => {
  const componente = await source("components/relatorios-liberados.tsx");
  assert.match(componente, /Leitura executiva/);
  assert.match(componente, /Leitura técnica · Fatores Humanos/);
  assert.match(componente, /O que foi observado, seu significado operacional/);
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

test("linhagem externa mostra origem, validação, versões e liberação", async () => {
  const componente = await source("components/relatorios-liberados.tsx");
  for (const texto of [
    "LINHAGEM DOCUMENTAL", "Organização", "Participante", "Validação profissional",
    "Versão", "Liberado em", "Responsável",
  ]) assert.match(componente, new RegExp(texto));
});
