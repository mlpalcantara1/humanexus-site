import assert from 'node:assert/strict';
import test from 'node:test';
import { synchronizeAnswers, resolveAnswerConflict, sameAnswer } from '../lib/anamnese-sync.ts';

const pending = (answer, revision = 0, question = 'test-question') => ({ pergunta: question, versao: 'test-only', resposta: answer, controle: revision });
const conflictError = () => Object.assign(new Error('CONFLITO_DE_CONCORRENCIA'), { status: 400 });

function harness(queue, server) {
  let local = structuredClone(queue);
  let remote = structuredClone(server);
  let writes = 0;
  const revisions = {};
  const deps = {
    read: async () => local,
    write: async next => { local = structuredClone(next); },
    remote: async () => structuredClone(remote),
    acknowledged: (question, revision) => { revisions[question] = revision; },
    save: async item => {
      const prior = remote.find(row => row.question_id === item.pergunta);
      if (prior && prior.control_version !== item.controle) throw conflictError();
      writes++;
      const version = (prior?.control_version ?? 0) + 1;
      remote = remote.filter(row => row.question_id !== item.pergunta);
      remote.push({ question_id: item.pergunta, answer: item.resposta, control_version: version });
      return version;
    }
  };
  return { deps, queue: () => local, remote: () => remote, writes: () => writes, revisions };
}

test('resposta já persistida após perda da confirmação é reconhecida sem nova gravação', async () => {
  const h = harness([pending('sintético')], [{ question_id: 'test-question', answer: 'sintético', control_version: 1 }]);
  assert.equal(await synchronizeAnswers(h.deps), null);
  assert.equal(h.writes(), 0);
  assert.deepEqual(h.queue(), []);
  assert.equal(h.revisions['test-question'], 1);
});

test('conflito HTTP 400 preserva versão remota, texto local e restante da fila', async () => {
  const queue = [pending('local'), pending('outra', 0, 'other')];
  const h = harness(queue, [{ question_id: 'test-question', answer: 'remota', control_version: 2 }]);
  const conflict = await synchronizeAnswers(h.deps);
  assert.equal(conflict.remote.answer, 'remota');
  assert.equal(h.writes(), 0);
  assert.deepEqual(h.queue(), queue);
  await h.deps.write(resolveAnswerConflict(h.queue(), conflict, true));
  assert.equal(await synchronizeAnswers(h.deps), null);
  assert.equal(h.remote()[0].answer, 'local');
  assert.equal(h.remote()[0].control_version, 3);
});

test('escolher servidor não reenvia a versão rejeitada', async () => {
  const h = harness([pending('local')], [{ question_id: 'test-question', answer: 'remota', control_version: 2 }]);
  const conflict = await synchronizeAnswers(h.deps);
  await h.deps.write(resolveAnswerConflict(h.queue(), conflict, false));
  assert.equal(await synchronizeAnswers(h.deps), null);
  assert.equal(h.writes(), 0);
  assert.equal(h.remote()[0].answer, 'remota');
});

test('mudança após comparação exige nova comparação; não elimina a edição mais recente', async () => {
  const h = harness([pending('local')], [{ question_id: 'test-question', answer: 'remota', control_version: 2 }]);
  const conflict = await synchronizeAnswers(h.deps);
  assert.equal(resolveAnswerConflict([pending('edição nova')], conflict, false), null);
  assert.equal(resolveAnswerConflict([], conflict, true), null);
});

test('nova revisão do servidor durante a escolha produz novo conflito sem sobrescrita', async () => {
  const oldConflict = { pending: pending('local'), remote: { question_id: 'test-question', answer: 'remota', control_version: 2 } };
  const rebased = resolveAnswerConflict([oldConflict.pending], oldConflict, true);
  const h = harness(rebased, [{ question_id: 'test-question', answer: 'mais recente', control_version: 3 }]);
  assert.equal((await synchronizeAnswers(h.deps)).remote.answer, 'mais recente');
  assert.equal(h.writes(), 0);
});

test('falha transitória preserva apenas respostas não confirmadas e permite retomar', async () => {
  const h = harness([pending('a'), pending('b', 0, 'other')], []);
  const save = h.deps.save;
  h.deps.save = async item => { if (item.pergunta === 'other') throw new Error('rede'); return save(item); };
  await assert.rejects(synchronizeAnswers(h.deps), /rede/);
  assert.deepEqual(h.queue(), [pending('b', 0, 'other')]);
  h.deps.save = save;
  assert.equal(await synchronizeAnswers(h.deps), null);
  assert.equal(h.writes(), 2);
});

test('comparação ignora ordem de propriedades, mas não altera conteúdo nem ordem de escolhas', () => {
  assert.equal(sameAnswer({ valor: 'x', outro: 'y' }, { outro: 'y', valor: 'x' }), true);
  assert.equal(sameAnswer('nome', 'nome '), false);
  assert.equal(sameAnswer(['a', 'b'], ['b', 'a']), false);
});
