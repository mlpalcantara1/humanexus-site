import test from 'node:test';
import assert from 'node:assert/strict';
import {capturaProfissionalPermitida} from '../lib/paused-phase-presentation.ts';

test('pausa canônica bloqueia paleta científica ainda marcada como iniciada', () => {
  assert.equal(capturaProfissionalPermitida({sessao:{fase_atual:'PRE', estados_das_fases:{PRE:'PAUSADA'}}}, {codigo:'PRE',estado:'INICIADA'}), false);
});
test('retomada canônica libera paleta ainda marcada como pausada', () => {
  assert.equal(capturaProfissionalPermitida({sessao:{fase_atual:'PRE', estados_das_fases:{PRE:'INICIADA'}}}, {codigo:'PRE',estado:'PAUSADA'}), true);
});
test('sessão encerrada ou fase finalizada impede captura com paleta desatualizada', () => {
  assert.equal(capturaProfissionalPermitida({sessao:{estado:'FINALIZADA'}}, {estado:'INICIADA'}), false);
  assert.equal(capturaProfissionalPermitida({sessao:{fase_atual:'PRE',estados_das_fases:{PRE:'FINALIZADA'}}}, {estado:'INICIADA'}), false);
  assert.equal(capturaProfissionalPermitida({}, {}), false);
});
