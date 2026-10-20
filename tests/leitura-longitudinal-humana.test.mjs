import test from 'node:test';
import assert from 'node:assert/strict';
import {leituraLongitudinalIndividual,leituraLongitudinalOrganizacional} from '../lib/leitura-longitudinal-humana.ts';
test('longitudinal individual conserva zero e não compara sessões incompatíveis',()=>{
 const l={pontos_regulatorios:[{iirh:0,zona:'ZA',comparavel:false},{iirh:95,iirh_valido:false}]};
 const antes=structuredClone(l),s=JSON.stringify(leituraLongitudinalIndividual(l));
 assert.match(s,/IIRH 0\/100/);assert.doesNotMatch(s,/95\/100/);assert.match(s,/Não comparar diretamente/);assert.match(s,/Regulação Funcional/);assert.deepEqual(l,antes);
});
test('coletivo não lê nomes ou escores individuais nem converte volume em evolução',()=>{
 const s=JSON.stringify(leituraLongitudinalOrganizacional({membros:[{nome:'PESSOA_SIGILOSA',iirh:81.123}],elegibilidade_cientifica:{agregacao_permitida:false,participantes_com_sessao_elegivel:3,sessoes_individuais_elegiveis:6}}));
 assert.doesNotMatch(s,/PESSOA_SIGILOSA|81.123/);assert.match(s,/3 participantes com 6 sessões/);assert.match(s,/Quantidade de sessões não mede melhora/);assert.match(s,/não atendem aos critérios/);
});
test('ausência coletiva permanece sem quantidade conhecida e sem média inventada',()=>{
 const s=JSON.stringify(leituraLongitudinalOrganizacional({}));assert.match(s,/ainda não foi informada/);assert.doesNotMatch(s,/0 participantes/);
});
