import assert from 'node:assert/strict';
import test from 'node:test';
import { apresentarResultante } from '../lib/resultante-apresentacao.ts';

test('apresenta a magnitude e a direção no formato entregue pelo motor Tipo B', () => {
  const recebido = {estado:'CALCULAVEL', magnitude_global:72.31, valor:72.31, direcao_funcional:{coordenadas_unitarias:{VH:.6,VT:.8}}, sentido_contextual:'COMPENSATORIO'};
  const antes = JSON.stringify(recebido);
  const resultado = apresentarResultante(recebido);
  assert.equal(resultado.magnitude,72.31);
  assert.equal(resultado.direcaoTexto,'VH 0.600 · VT 0.800');
  assert.equal(resultado.sentidoTexto,'COMPENSATORIO');
  assert.equal(resultado.graus,null);
  assert.equal(JSON.stringify(recebido),antes);
});
test('ausência V1 não é substituída pela magnitude legacy nem pela dominância', () => {
  const resultado = apresentarResultante({estado:'PLENA',valor:null,magnitude_global:null,magnitude_operacional_legacy:{valor:89},vetor_dominante:'VH'});
  assert.equal(resultado.magnitude,null);
  assert.equal(resultado.direcaoTexto,'NÃO DETERMINÁVEL');
});
test('zero é preservado e números não finitos não são apresentados', () => {
  assert.equal(apresentarResultante({magnitude_global:0,valor:90}).magnitude,0);
  assert.equal(apresentarResultante({magnitude_global:NaN,valor:90}).magnitude,null);
  assert.equal(apresentarResultante({magnitude_global:true}).magnitude,null);
});
