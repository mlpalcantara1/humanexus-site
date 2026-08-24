import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const caminho = new URL("../lib/escape-html.ts", import.meta.url);
const fonte = await readFile(caminho, "utf8");
const javascript = ts.transpileModule(fonte, {
  compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 }
}).outputText;
const { escaparHtml } = await import(`data:text/javascript;charset=utf-8,${encodeURIComponent(javascript)}`);

const casosMaliciosos = [
  ["script", "<script>alert('TIRH')</script>", "&lt;script&gt;alert(&#039;TIRH&#039;)&lt;/script&gt;"],
  ["onerror", "<img src=x onerror=alert(1)>", "&lt;img src=x onerror=alert(1)&gt;"],
  ["protocolo javascript", "javascript:alert(1)", "javascript:alert(1)"],
  ["SVG malicioso", "<svg><a href=\"javascript:alert(1)\"><text>abrir</text></a></svg>", "&lt;svg&gt;&lt;a href=&quot;javascript:alert(1)&quot;&gt;&lt;text&gt;abrir&lt;/text&gt;&lt;/a&gt;&lt;/svg&gt;"],
  ["caracteres HTML especiais", "<&>\"'", "&lt;&amp;&gt;&quot;&#039;"]
];

for (const [nome, entrada, esperado] of casosMaliciosos) {
  test(`neutraliza ${nome} em conteúdo de tooltip`, () => {
    const resultado = escaparHtml(entrada);
    assert.equal(resultado, esperado);
    assert.equal(/<(?:script|img|svg|a)\b/i.test(resultado), false);
  });
}

test("preserva texto operacional legítimo nos tooltips", () => {
  assert.equal(escaparHtml("PRÉ · Fonte: Núcleo"), "PRÉ · Fonte: Núcleo");
  assert.equal(escaparHtml(null), "");
});

test("todos os campos textuais dinâmicos dos tooltips passam pelo escape central", async () => {
  const componente = await readFile(
    new URL("../components/hx-command-visualizations.tsx", import.meta.url),
    "utf8"
  );

  for (const usoSeguro of [
    "escaparHtml(dado.phase)",
    "escaparHtml(dado.source)",
    "escaparHtml(dado.connection)",
    "escaparHtml(dado.event)",
    "escaparHtml(phase?.name ?? \"\")",
    "escaparHtml(phase?.sources.join(\", \") || \"não registradas\")",
    "escaparHtml(phase?.gaps.join(\", \") || \"nenhuma declarada\")",
    "escaparHtml(item.seriesName ?? \"\")",
    "escaparHtml(item.data?.event ?? item.data?.label ?? \"REGISTRO\")",
    "escaparHtml(item.data?.source ?? \"núcleo oficial\")"
  ]) {
    assert.equal(componente.includes(usoSeguro), true, `escape ausente: ${usoSeguro}`);
  }
});
