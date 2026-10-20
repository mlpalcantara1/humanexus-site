import test from 'node:test';
import assert from 'node:assert/strict';
import {leituraHumanaDoRelatorio} from '../lib/leitura-humana-relatorio.ts';
test('referência inicial é global: não exige fases de treinamento e mantém leitura parcial',()=>{
 const e={sessao:{tipo_de_sessao:'BASELINE'},projecao:{iirh:{estado:'PARCIAL',valor:65.2037,cobertura:1/3,confianca:.3343},zona:{estado:'PROVISORIA',codigo:'ZA'},vetores:{VR:{magnitude:44.3333,fontes:['participant_self_report']}}}};
 const antes=structuredClone(e),s=JSON.stringify(leituraHumanaDoRelatorio(e));
 assert.match(s,/65,2\/100/);assert.match(s,/leitura provisória/);assert.match(s,/33,33%/);assert.match(s,/Informação da anamnese/);
 assert.doesNotMatch(s,/PRÉ:|TREINO:|PÓS:|pipeline|snapshot/);assert.deepEqual(e,antes);
});
test('valor inválido não é aproveitado e ausência não vira deficiência',()=>{
 const s=JSON.stringify(leituraHumanaDoRelatorio({projecao:{iirh:{estado:'NAO_CALCULAVEL',valor:80}}}));
 assert.doesNotMatch(s,/80\/100/);assert.match(s,/não indicam deficiência/);
});
test('medianas usam pontos recebidos válidos sem mudar entrada nem inventar zero',()=>{
 const e={cockpit:{fontes:[{codigo:'POLAR_H10',series:{hr:[{valor:54,timestamp:'2026-10-20T15:20:00Z'},{valor:58,timestamp:'2026-10-20T15:20:01Z'},{valor:null,timestamp:'2026-10-20T15:20:02Z'}]}}]}};
 const antes=structuredClone(e),s=JSON.stringify(leituraHumanaDoRelatorio(e));assert.match(s,/mediana 56 bpm/);assert.match(s,/2 medidas/);assert.doesNotMatch(s,/FC: indisponível/);assert.deepEqual(e,antes);
});
test('ciclo conserva desempenho e conclusão profissional sem aprovar automaticamente',()=>{
 const s=JSON.stringify(leituraHumanaDoRelatorio({desempenho:{titulo:'Resposta',itens:['PRÉ: erros 0; omissões 2.']},consolidacao:{conclusao:'Recuperação observada pelo profissional.'}}));
 assert.match(s,/erros 0/);assert.match(s,/omissões 2/);assert.match(s,/Recuperação observada pelo profissional/);
});
test('Resultante operacional explícita ausente não recupera magnitude de outra versão',()=>{
 const s=JSON.stringify(leituraHumanaDoRelatorio({projecao:{resultante_operacional:null,resultante:{magnitude:92}}}));
 assert.doesNotMatch(s,/92/);assert.match(s,/magnitude global ainda não/);
});
test('Resultante conserva direção multidimensional, sentido e valor zero',()=>{
 const s=JSON.stringify(leituraHumanaDoRelatorio({projecao:{resultante_operacional:{magnitude_global:0,direcao_funcional:{coordenadas_unitarias:{VT:.3,VAR:.4}},sentido_contextual:'COMPENSATORIO'}}}));
 assert.match(s,/Magnitude registrada: 0/);assert.match(s,/VT 0.300/);assert.match(s,/Compensatório/);
});
