import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
const fonte = fs.readFileSync("components/registro-integrado-sessao.tsx", "utf8");
test("revisão assistida apresenta texto e decisões explícitas", () => {
  for (const texto of ["Revisão assistida das sugestões", "Aceitar e salvar", "Negar e registrar não adoção", "Salvar correção", "Até 6 decisões"]) assert.ok(fonte.includes(texto));
  assert.match(fonte, /acao: "REVISAR_SUGESTOES"/);
  assert.match(fonte, /assinatura_do_rascunho: resumo.assinatura_do_rascunho/);
  assert.match(fonte, /campo: s.campo, assinatura: s.assinatura, decisao/);
});
test("decidir rascunho não é validação final nem comando de sensores", () => {
  const decisao = fonte.split("const decidirSugestoes =")[1].split("const campos =")[0];
  assert.match(decisao, /!resumo\?\.terminal/);
  assert.doesNotMatch(decisao, /acao: "VALIDAR"|INICIAR_|RETOMAR_|confirmacao_final: true/);
  assert.match(fonte, /Confirmo que revisei o conteúdo e assumo a autoria desta versão/);
});
test("correção é opcional, pré-preenchida e conteúdo anterior não recebe sugestão automaticamente", () => {
  assert.match(fonte, /edicoesSugestoes\[s.campo\] \?\? s.texto/);
  assert.match(fonte, /const preservado = !!campos\[s.campo\]\?\.trim\(\)/);
  assert.match(fonte, /const desabilitado = !resumo.terminal \|\| preservado/);
  assert.match(fonte, /Correções manuais opcionais e detalhes técnicos/);
});
test("recuperação de conflito não reaplica decisões com fontes antigas", () => {
  const resolver = fonte.split("const resolver =")[1].split("const revisarNota =")[0];
  assert.match(resolver, /c.acao !== "REVISAR_SUGESTOES"/);
  assert.match(resolver, /setConfirmar\(false\)/);
});
