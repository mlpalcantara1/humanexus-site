import assert from 'node:assert/strict';
import test from 'node:test';
import {resumirFasesRegistradas} from '../lib/rastreabilidade-fases.ts';

test('ciclo operacional sem THX ou snapshots científicos permanece rastreável', () => {
  const fases = ['PRE', 'TREINO', 'POS'].map(fase => ({
    identificador: `TESTE-${fase}`, fase, estado: 'FINALIZADA'
  }));
  assert.equal(resumirFasesRegistradas(fases), '3 fases operacionais registradas');
});

test('uma fase parcial é informada sem declarar ciclo completo ou validade científica', () => {
  assert.equal(resumirFasesRegistradas([{identificador:'TESTE-PRE', fase:'PRE', estado:'INICIADA'}]), '1 fase operacional registrada');
});

test('tentativas repetidas não multiplicam fases e ausência não cria registro', () => {
  assert.equal(resumirFasesRegistradas([
    {identificador:'TESTE-1', fase:'PRE'}, {identificador:'TESTE-2', fase:'PRE'},
    {identificador:'TESTE-BASELINE', fase:'BASELINE'}, {fase:'POS'}
  ]), '1 fase operacional registrada');
  assert.equal(resumirFasesRegistradas([]), null);
  assert.equal(resumirFasesRegistradas([{fase:'TREINO'}, {identificador:'', fase:'POS'}]), null);
});
