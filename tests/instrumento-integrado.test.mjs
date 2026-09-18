import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const raiz = new URL("../", import.meta.url);
const fonte = (caminho) => readFile(new URL(caminho, raiz), "utf8");

test("instrumento integrado usa página única e confirmação final única", async () => {
  const componente = await fonte("components/instrumento-integrado.tsx");
  const pagina = await fonte(
    "app/(participant)/instrumento-integrado/[id]/page.tsx"
  );
  assert.match(pagina, /InstrumentoIntegrado/);
  assert.match(componente, /SUMÁRIO NAVEGÁVEL/);
  assert.match(
    componente,
    /CONFIRMAR MINHA RESPOSTA/
  );
  assert.match(componente, /UMA ÚNICA RESPOSTA/);
  assert.doesNotMatch(componente, /Autorizar tudo|AUTORIZAR_TUDO/);
  assert.match(componente, /if \(!consulta\.fluxo_simplificado\)/);
  assert.match(componente, /name=\{`decisao-\$\{secao\.codigo\}`\}/);
  assert.doesNotMatch(componente, /defaultChecked|localStorage|sessionStorage/);
});

test("versão genérica exige atos independentes sem ativar a versão candidata", async () => {
  const componente = await fonte("components/instrumento-integrado.tsx");
  assert.match(componente, /decisao_obrigatoria/);
  assert.match(componente, /escolhasCompletas/);
  assert.match(componente, /decisoes: decisoesIndependentes/);
  assert.match(componente, /hash_do_documento: consulta\.instrumento\.hash_do_documento/);
  assert.match(componente, /PRESTADOR.*consulta\.identificacao\.instituto/s);
  assert.match(componente, /nenhuma escolha é presumida/i);
  assert.match(componente, /if \(!consulta\.fluxo_simplificado\)/);
  assert.doesNotMatch(componente, /defaultChecked|localStorage|sessionStorage/);
});

test("novos convites pedem a versão integral 1.3 sem recuar à 1.1/1.2", async () => {
  const gestao = await fonte("components/gestao-operacional.tsx");
  assert.match(gestao, /versao_do_instrumento: "1\.3"/);
  assert.match(gestao, /servico_efetivo: consentimento\.servico_efetivo/);
  assert.match(gestao, /fichas_do_programa: Object\.fromEntries/);
  assert.match(gestao, /setFichasDoPrograma\(\{\}\)/);
  assert.match(gestao, /Se ainda estiver em revisão, nenhuma manifestação será criada/);
  assert.doesNotMatch(gestao, /IICCA-HXP-1\.1 · RESPOSTA ÚNICA/);
});

test("contexto e fichas concretas aparecem na leitura e na cópia integral", async () => {
  const componente = await fonte("components/instrumento-integrado.tsx");
  const pdf = await fonte("lib/instrumento-integrado-pdf.ts");
  assert.match(componente, /Finalidades concretas deste programa/);
  assert.match(componente, /contextoDaApresentacao\.fichas_do_programa/);
  assert.match(componente, /Ficha do programa: \$\{codigo\}/);
  assert.match(pdf, /manifestacao\.contexto_json/);
  assert.match(pdf, /Ficha do programa: \$\{valor\(codigo\)\}/);
});

test("somente AUTORIZO e NÃO AUTORIZO são respostas visíveis", async () => {
  const componente = await fonte("components/instrumento-integrado.tsx");
  assert.match(componente, /name="resposta-operacional-unica"/);
  assert.match(componente, /checked=\{resposta === "AUTORIZO"\}/);
  assert.match(componente, /checked=\{resposta === "NAO_AUTORIZO"\}/);
  assert.match(componente, /AUTORIZO, DE FORMA LIVRE, INFORMADA E INEQUÍVOCA/);
  assert.match(
    componente,
    /NÃO AUTORIZO AS MODALIDADES OPERACIONAIS OPCIONAIS/
  );
  assert.doesNotMatch(componente, /LI_E_ESTOU_CIENTE|NAO_SE_APLICA/);
  assert.doesNotMatch(componente, /useState<[^>]*>\("AUTORIZO"\)/);
});

test("pesquisa e finalidades externas permanecem fora da resposta única", async () => {
  const componente = await fonte("components/instrumento-integrado.tsx");
  const pdf = await fonte("lib/instrumento-integrado-pdf.ts");
  assert.match(componente, /MODALIDADES EXCLUÍDAS/);
  assert.doesNotMatch(
    componente,
    /value="PESQUISA"|value="RECONHECIMENTO_FACIAL"/
  );
  assert.match(pdf, /modalidades_excluidas/);
});

test("proxy público protege origem e não persiste token", async () => {
  const rota = await fonte(
    "app/api/humanexus/instrumento-integrado/[id]/route.ts"
  );
  const componente = await fonte("components/instrumento-integrado.tsx");
  assert.match(rota, /exigirMesmaOrigem/);
  assert.match(rota, /requisitarNucleoPublico/);
  assert.match(rota, /x-humanexus-context-source/);
  assert.match(rota, /instrument-token/);
  assert.match(rota, /private, no-store, no-cache/);
  assert.doesNotMatch(
    rota,
    /COOKIE_SESSAO|cookies\(\)|requisitarNucleoAutenticado|authorization/i
  );
  assert.match(componente, /credentials: "same-origin"/);
  assert.doesNotMatch(componente, /credentials: "omit"/);
  assert.match(componente, /new AbortController\(\)/);
  assert.match(componente, /setConsulta\(null\)/);
  assert.match(
    componente,
    /contexto_do_token\?\.identificador_do_participante[\s\S]*dados\.apresentacao\.identificador_do_participante/
  );
  assert.match(
    componente,
    /contexto_do_token\?\.identificador_da_organizacao[\s\S]*dados\.apresentacao\.identificador_da_organizacao/
  );
  assert.doesNotMatch(rota, /console\.(log|error)|localStorage|sessionStorage/);
});

test("troca de organização elimina contexto anterior do instrumento", async () => {
  const gestao = await fonte("components/gestao-operacional.tsx");
  assert.match(
    gestao,
    /setConsentimento\(\(estado\) => \(\{[\s\S]*identificador_do_participante: ""[\s\S]*identificador_da_sessao: ""/
  );
  assert.match(
    gestao,
    /participanteDaNavegacao \|\| estado\.identificador_do_participante/
  );
  assert.match(
    gestao,
    /proximoParticipante === estado\.identificador_do_participante[\s\S]*\? estado\.identificador_da_sessao[\s\S]*: ""/
  );
});

test("PDF contém cópia integral, resposta única, hashes e estado jurídico", async () => {
  const rota = await fonte(
    "app/api/humanexus/instrumento-integrado/[id]/pdf/route.ts"
  );
  const gerador = await fonte("lib/instrumento-integrado-pdf.ts");
  assert.match(rota, /private, no-store/);
  assert.match(rota, /gerarPdfInstrumentoIntegrado/);
  for (const contrato of [
    "Texto integral do instrumento",
    "RESPOSTA ESCOLHIDA",
    "MODALIDADES ABRANGIDAS",
    "MODALIDADES EXCLUÍDAS",
    "Hash do documento",
    "Hash das decisões",
    "Integridade SHA-256",
    "PENDENTE"
  ]) {
    assert.match(
      gerador,
      new RegExp(contrato.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i")
    );
  }
});

test("mídia operacional respeita as modalidades autorizadas no backend", async () => {
  const controle = await fonte("components/controle-gravacao-multimodal.tsx");
  const gestao = await fonte("components/gestao-operacional.tsx");
  const instrumento = await fonte("components/instrumento-integrado.tsx");
  assert.match(controle, /modalidades_de_midia_permitidas/);
  assert.match(controle, /NÃO AUTORIZADO/);
  assert.match(controle, /useState<Modo>\("NENHUM"\)/);
  assert.match(gestao, /Política de armazenamento da mídia/);
  assert.match(gestao, /ATE_VALIDACAO_DO_RELATORIO/);
  assert.match(gestao, /consentimento\.politica_de_retencao/);
  assert.match(instrumento, /MÍDIA PLANEJADA/);
  assert.match(instrumento, /POLÍTICA DE ARMAZENAMENTO/);
  assert.doesNotMatch(
    instrumento,
    /<small>PADRÃO DE MÍDIA<\/small>\s*<span>SEM GRAVAÇÃO<\/span>/
  );
});

test("identificação pública distingue cliente particular e organização", async () => {
  const componente = await fonte("components/instrumento-integrado.tsx");
  assert.match(componente, /tipo_de_vinculo/);
  assert.match(componente, /rotulo_do_cliente/);
  assert.match(componente, /consulta\.identificacao\.cliente/);
  assert.doesNotMatch(
    componente,
    /<small>ORGANIZAÇÃO<\/small><strong>\{consulta\.identificacao\.organizacao/
  );
});

test("governança mínima do instrumento é exclusiva da sessão proprietária", async () => {
  const rota = await fonte(
    "app/api/plataforma/governanca-operacional/route.ts"
  );
  const painel = await fonte("components/governanca-operacional.tsx");
  assert.match(rota, /COOKIE_SESSAO/);
  assert.match(rota, /instrumento-integrado\/lab/);
  assert.match(painel, /INSTRUMENTO INTEGRADO · ADMINISTRADOR PROPRIETÁRIO/);
  assert.match(painel, /Resposta operacional única/);
  assert.match(painel, /Versão vigente/);
  assert.match(painel, /Opções pré-marcadas/);
});

test("layout responsivo cobre computador, tablet e celular", async () => {
  const estilos = await fonte("app/globals.css");
  assert.match(estilos, /@media \(max-width: 900px\)[\s\S]*hxiicca/);
  assert.match(estilos, /@media \(max-width: 600px\)[\s\S]*hxiicca/);
  assert.match(estilos, /prefers-reduced-motion/);
  assert.match(estilos, /focus-visible/);
});
