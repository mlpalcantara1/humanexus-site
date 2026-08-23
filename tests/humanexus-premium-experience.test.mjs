import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const css = await readFile(
  new URL("../app/humanexus-design-system.css", import.meta.url),
  "utf8"
);

test("Premium Experience consolida uma única camada visual compartilhada", () => {
  assert.match(css, /HUMANEXUS PREMIUM EXPERIENCE 2\.0/);
  assert.match(css, /\.hx-app--executive \.hx-app__header/);
  assert.match(css, /\.hx-app--executive \.hx-nav/);
  assert.match(css, /\.hx-management-grid/);
  assert.match(css, /\.hx-admin__table-wrap/);
  assert.match(css, /\.hx-live-vector-stage/);
  assert.match(css, /\.hx-live-intelligence-instruments/);
});

test("HUD preserva oito posições dinâmicas canônicas e responde sem rolagem horizontal", () => {
  assert.match(
    css,
    /HUMANEXUS PREMIUM EXPERIENCE 2\.0[\s\S]*?\.hx-live-hud\s*\{[\s\S]*?grid-template-columns:\s*repeat\(8,[^;]+\);/
  );
  assert.match(css, /\.hx-live-hud\s*\{[\s\S]*?grid-auto-rows:\s*minmax\(88px, auto\);/);
  assert.match(css, /\.hx-live-hud > div\s*\{[\s\S]*?min-height:\s*88px;[\s\S]*?height:\s*auto;/);
  assert.match(css, /\.hx-live-hud__detail\s*\{[\s\S]*?min-height:\s*0 !important;/);
  assert.match(css, /@media \(max-width: 1560px\)[\s\S]*?\.hx-live-hud\s*\{[\s\S]*?grid-template-columns:\s*repeat\(4,/);
  assert.match(css, /@media \(max-width: 520px\)[\s\S]*?\.hx-app--executive \.hx-live-hud\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2,/);
  assert.doesNotMatch(css, /\.hx-app--executive \.hx-live-hud > div:last-child\s*\{[\s\S]*?grid-column:\s*1 \/ -1;/);
});

test("Sessões usa composição larga e empilha antes de comprimir a tabela", () => {
  assert.match(css, /\.hx-management-grid--sessions\s*\{[\s\S]*?grid-template-columns:\s*minmax\(400px, \.78fr\) minmax\(640px, 1\.22fr\);/);
  assert.match(css, /\.hx-management-grid--sessions > \.hx-session-preparation-workspace[\s\S]*?grid-column:\s*1 \/ -1;/);
  assert.match(css, /@media \(max-width: 1360px\)[\s\S]*?\.hx-management-grid\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\);/);
});

test("radar permanece protagonista e ausência continua visualmente distinta", () => {
  assert.match(css, /\.hx-live-vector-stage \.hx-vector-radar-live/);
  assert.match(css, /\.hx-live-vector-stage\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\) minmax\(0, 1fr\);/);
  assert.match(css, /\.hx-live-vector-stage \.hx-live-vector-list > div/);
  assert.match(css, /\.hx-live-vector-stage \.hx-live-vector-identity\s*\{[\s\S]*?white-space:\s*nowrap;/);
  assert.match(css, /\.hx-vector-radar-live__label-state/);
  assert.doesNotMatch(css, /\.hx-live-vector-stage[^}]*content:\s*["']0/);
});

test("Cockpit mantém a inspeção científica acessível somente na profundidade científica", () => {
  assert.match(css, /\.hx-app:has\(\.hx-cockpit-workspace\) \.hx-experience-mode\s*\{[\s\S]*?display:\s*none;/);
  assert.match(css, /\[data-hx-experience-mode="executivo"\] \.hx-live-cockpit > #hx-inspection-level/);
  const bloqueioIncondicional = css.match(
    /\/\* A superfície operacional não replica documentação científica\.[\s\S]*?\n\}/
  )?.[0] ?? "";
  assert.ok(bloqueioIncondicional);
  assert.doesNotMatch(bloqueioIncondicional, /#hx-inspection-level/);
});

test("responsividade cobre notebook, tablet e celular sem nova dependência", () => {
  for (const breakpoint of [1560, 1240, 1080, 760, 520]) {
    assert.match(css, new RegExp(`@media \\(max-width: ${breakpoint}px\\)`));
  }
  assert.match(css, /\.hx-live-intelligence-instruments\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2/);
  assert.match(css, /@media \(max-width: 1240px\)[\s\S]*?\.hx-live-intelligence-instruments\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\)/);
});

test("atmosfera operacional não depende de fotografia pesada", () => {
  const secaoPremium = css.split("HUMANEXUS PREMIUM EXPERIENCE 2.0")[1] ?? "";
  assert.doesNotMatch(secaoPremium, /url\("\/media\/hero-command-center\.webp"\)/);
  assert.doesNotMatch(css, /cockpit-simulator\.jpg/);
});

test("camada visual não introduz integração, polling ou cálculo científico", () => {
  const secaoPremium = css.split("HUMANEXUS PREMIUM EXPERIENCE 2.0")[1] ?? "";
  assert.doesNotMatch(secaoPremium, /fetch\s*\(/);
  assert.doesNotMatch(secaoPremium, /WebSocket/);
  assert.doesNotMatch(secaoPremium, /setInterval/);
  assert.doesNotMatch(secaoPremium, /localStorage/);
  assert.doesNotMatch(secaoPremium, /formula|fórmula|fallback/i);
});
