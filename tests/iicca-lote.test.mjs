import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import {
  dadosDaApresentacaoGeral, dadosDoParticipanteDoLote,
  lerLoteCsv, nichoDaOrganizacao, referenciaDoLote, emailValidoDoLote
} from "../lib/iicca-lote.ts";

test("planilha CTA exportada em CSV lê nome, e-mail e função sem inferir aceite", async () => {
  const linhas = lerLoteCsv(
    "ORD;NOMES;NOME DE GUERRA;FUNÇÃO;DATA DE ADM;DATA NASCIMENTO;TELEFONE;EMAIL;OBS\r\n"
    + "1;Pessoa Sintética;PS;Piloto;;;(00) 0000-0000;pessoa@example.invalid;\r\n"
  );
  assert.equal(linhas.length, 1);
  assert.equal(linhas[0].nome, "Pessoa Sintética");
  assert.equal(linhas[0].email, "pessoa@example.invalid");
  assert.equal(linhas[0].funcao, "Piloto");
  const referencia = await referenciaDoLote(linhas[0]);
  assert.match(referencia, /^B2B-[a-f0-9]{32}$/);
  assert.equal(referencia, await referenciaDoLote(linhas[0]));
  const cadastro = dadosDoParticipanteDoLote(linhas[0], "org-1", "CTA", referencia);
  assert.equal(cadastro.identificador_da_organizacao_de_vinculo, "org-1");
  assert.equal(cadastro.tipo_atendimento, "ORGANIZACIONAL");
  assert.equal(cadastro.dados_profissionais.funcao, "Piloto");
  const apresentacao = dadosDaApresentacaoGeral("org-1", "p-1", true);
  assert.equal(apresentacao.identificador_da_sessao, null);
  assert.equal(apresentacao.entregar_por_email, true);
  assert.equal(apresentacao.recursos.coletivo, false);
  assert.equal("decisoes" in apresentacao, false);
});

test("ramo da anamnese deriva do setor cadastrado e não do nome do cliente", () => {
  assert.equal(nichoDaOrganizacao("Transporte aéreo e aviação"), "AVIACAO");
  assert.equal(nichoDaOrganizacao("Saúde integrativa"), "SAUDE");
  assert.equal(nichoDaOrganizacao(""), null);
});

test("CSV aceita vírgulas/aspas e rejeita duplicidade ou contato ausente", () => {
  const linhas = lerLoteCsv(
    'nome,email,funcao\n"Pessoa, Sintética",teste@example.invalid,"Função ""A"""\n'
  );
  assert.equal(linhas[0].nome, "Pessoa, Sintética");
  assert.equal(linhas[0].funcao, 'Função "A"');
  assert.throws(() => lerLoteCsv(
    "nome;email\nPessoa A;a@example.invalid\nPessoa B;A@example.invalid"
  ), /e-mail repetido/);
  assert.throws(() => lerLoteCsv("nome;email\nPessoa A;"), /referência estável/);
});

test("cadastro sem e-mail exige referência estável, não inventa contato nem conflita com outro vazio", async () => {
  const linhas = lerLoteCsv("nome;referencia;funcao\nPessoa A;MA-1;Mecânico\nPessoa B;MA-2;Técnico");
  assert.equal(linhas.length, 2);
  assert.equal(linhas[0].email, "");
  assert.equal(await referenciaDoLote(linhas[0]), "MA-1");
  assert.equal(await referenciaDoLote(linhas[1]), "MA-2");
  assert.equal(dadosDoParticipanteDoLote(linhas[0], "org", "Empresa", "MA-1").dados_cadastrais.email, "");
  assert.throws(() => lerLoteCsv("nome;referencia\nPessoa A;MA-1\nPessoa B;ma-1"), /referência repetida/);
  assert.throws(() => lerLoteCsv("nome;email;referencia\nPessoa A;invalido;MA-1"), /inválido/);
  await assert.rejects(referenciaDoLote({ ...linhas[0], referencia: "" }), /obrigatório/);
  assert.equal(emailValidoDoLote(""), false);
  assert.equal(emailValidoDoLote("sem-arroba.gmail.com"), false);
  assert.equal(emailValidoDoLote("pessoa@example.invalid"), true);
});

test("geração de links não solicita envio e mantém escolhas do participante ausentes", () => {
  const dados = dadosDaApresentacaoGeral("org", "pessoa", false);
  assert.equal(dados.entregar_por_email, false);
  assert.equal(dados.identificador_da_sessao, null);
  assert.equal("decisoes" in dados, false);
});

test("lote só usa endpoints autenticados existentes e não chama manifestação", () => {
  const fonte = readFileSync(new URL("../components/lote-instrumentos.tsx", import.meta.url), "utf8");
  assert.match(fonte, /\/api\/gestao-operacional/);
  assert.match(fonte, /x-humanexus-csrf/);
  assert.match(fonte, /apresentar-instrumento-integrado/);
  assert.match(fonte, /\/api\/humanexus\/anamneses/);
  assert.match(fonte, /convite_da_anamnese: conviteAnamnese/);
  assert.match(fonte, /Cadastrar sem enviar convites/);
  assert.doesNotMatch(fonte, /confirmar-instrumento|manifestar-instrumento/);
  assert.match(fonte, /Parar após a pessoa atual/);
  assert.match(fonte, /histórico antes de repetir/);
});
