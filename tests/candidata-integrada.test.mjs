import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = path => readFile(new URL('../' + path, import.meta.url), 'utf8');

test('candidata integrada mantém livro e Academia canônicos no desktop e mobile', async () => {
  const header = await source('components/site-header.tsx');
  for (const address of [
    'https://academia.institutohumanexus.com/academia',
    'https://institutohumanexus.com/inteligencia-regulatoria-humana#livro-tirh',
  ]) assert.equal(header.split(`href="${address}"`).length - 1, 2);
  assert.match(header, /<small data-portugues-preservar="true">PERFORMANCE OPERACIONAL<\/small>/);
  assert.equal(header.split('ENTRAR NA PLATAFORMA →').length - 1, 2);
  assert.doesNotMatch(header, /humanexus-revenue-engine|href="\/academia"/);
});

test('lote IICCA e produtos documentais canônicos coexistem na candidata', async () => {
  const management = await source('components/gestao-operacional.tsx');
  const contract = await source('lib/governanca-relatorios.ts');
  const cockpit = await source('components/cockpit-operacional-vivo.tsx');
  assert.match(management, /LoteInstrumentos/);
  assert.match(contract, /produtos_separados/);
  assert.match(contract, /coerencia_documental/);
  assert.match(cockpit, /formatarPercentualCanonico/);
  assert.match(cockpit, /iirhContinuo/);
});
