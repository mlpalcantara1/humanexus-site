import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const raiz = new URL("../", import.meta.url);
const ler = (caminho) => readFile(new URL(caminho, raiz), "utf8");

test("conclusão móvel usa correlação, idempotência e leitura posterior", async () => {
  const [participante, proxy] = await Promise.all([
    ler("components/anamnese-participante.tsx"),
    ler("app/api/humanexus/convites/[token]/route.ts")
  ]);

  assert.match(participante, /async function conclusionKey/);
  assert.match(participante, /crypto\.subtle\.digest\("SHA-256"/);
  assert.match(participante, /x-humanexus-correlation-id/);
  assert.match(participante, /x-humanexus-idempotency-key/);
  assert.match(
    participante,
    /const correlation = correlationId\(\);[\s\S]*for \(let attempt = 0; attempt < 2/
  );
  assert.match(participante, /keepalive: true/);
  assert.match(participante, /persistenceConfirmed/);
  assert.match(participante, /read_after_write === "CONCLUIDO_100_PERCENT"/);
  assert.match(participante, /duplicacoes_persistidas === 0/);
  assert.match(participante, /for \(let attempt = 0; attempt < 2; attempt \+= 1\)/);
  assert.match(proxy, /crypto\.subtle\.digest/);
  assert.match(proxy, /"SHA-256"/);
  assert.match(proxy, /x-humanexus-correlation-id/);
  assert.match(proxy, /x-humanexus-idempotency-key/);
  assert.doesNotMatch(proxy, /console\.(?:log|error)\([^)]*token/);
  assert.doesNotMatch(proxy, /console\.(?:log|error)\([^)]*resposta/);
});

test("atendimento particular separa tenant de vínculo empresarial", async () => {
  const [painel, gestao, rota] = await Promise.all([
    ler("components/painel-profissional.tsx"),
    ler("components/gestao-operacional.tsx"),
    ler("app/api/humanexus/anamneses/route.ts")
  ]);

  assert.match(painel, /Ambiente protegido HUMANEXUS/);
  assert.match(painel, /não representa vínculo do cliente com uma empresa/);
  assert.match(painel, /tipo_atendimento/);
  assert.match(painel, /identificador_da_organizacao_de_vinculo/);
  assert.match(painel, /Cliente particular/);
  assert.match(painel, /disabled=\{form\.modo === "EXISTENTE"/);
  assert.doesNotMatch(painel, /<option value="MISTO">/);

  assert.match(gestao, /Tipo de atendimento/);
  assert.match(gestao, /A reclassificação exige procedimento separado e auditado/);
  assert.match(gestao, /participante\.tipo_atendimento === "ORGANIZACIONAL"/);
  assert.match(gestao, /identificador_da_organizacao_de_vinculo/);
  assert.match(gestao, /dados_profissionais: participante\.tipo_atendimento === "ORGANIZACIONAL"/);
  assert.match(gestao, /empresa: ""/);
  assert.match(gestao, /cargo: ""/);
  assert.match(gestao, /funcao: ""/);
  assert.doesNotMatch(
    gestao,
    /Tipo de atendimento<select[^>]*>[^]*<option>MISTO<\/option>/
  );

  assert.match(rota, /tipo_atendimento: corpo\.tipo_atendimento/);
  assert.match(rota, /identificador_da_organizacao_de_vinculo/);
});

test("projeção particular não adiciona campos organizacionais artificiais", async () => {
  const [painel, gestao] = await Promise.all([
    ler("components/painel-profissional.tsx"),
    ler("components/gestao-operacional.tsx")
  ]);

  assert.match(
    painel,
    /form\.tipo_atendimento === "ORGANIZACIONAL"\s*\? form\.funcao\s*:\s*""/
  );
  assert.match(
    gestao,
    /participante\.tipo_atendimento === "PARTICULAR" \? "Dados profissionais pessoais"/
  );
  assert.match(
    gestao,
    /tipoAtendimento === "PARTICULAR" \? "Cliente particular · não se aplica"/
  );
});

test("regressão da hidratação administrativa permanece protegida", async () => {
  const [camada, painel] = await Promise.all([
    ler("components/camada-portugues-visivel.tsx"),
    ler("components/painel-profissional.tsx")
  ]);
  assert.match(camada, /ativarTraducaoDepoisDaHidratacaoInicial/);
  assert.match(painel, /data-portugues-preservar="true"/);
  assert.doesNotMatch(camada, /suppressHydrationWarning/);
});

test("relatório particular não apresenta o tenant como empresa do cliente", async () => {
  const { resolverIdentidadeDocumental } = await import(
    "../lib/humanexus-report-authority.ts"
  );
  const particular = resolverIdentidadeDocumental(
    {
      identificador: "participante-sintetico",
      identificador_da_organizacao: "tenant-humanexus",
      tipo_atendimento: "PARTICULAR",
      identidade_individual_autoritativa: {
        identificador_do_participante: "participante-sintetico",
        identificador_da_organizacao: "tenant-humanexus",
        tipo_atendimento: "PARTICULAR",
        escopo_validado: true,
        nome_completo: "Pessoa Sintética",
        cpf: "12345678901",
        referencia_operacional: "REF-SINTETICA"
      }
    },
    { identificador: "tenant-humanexus", nome: "Instituto HUMANEXUS" }
  );
  assert.equal(
    particular.organizacao,
    "ATENDIMENTO PARTICULAR — VÍNCULO EMPRESARIAL NÃO SE APLICA"
  );
  assert.equal(particular.ambienteProtegido, "Instituto HUMANEXUS");
  assert.equal(particular.tipoAtendimento, "PARTICULAR");
});

test("troca de tenant descarta o participante anterior antes da nova consulta", async () => {
  const gestao = await ler("components/gestao-operacional.tsx");
  assert.match(
    gestao,
    /setOrganizacaoSelecionada\(identificador\);[\s\S]*setDados\(null\);[\s\S]*setParticipanteSelecionado\(""\);[\s\S]*setParticipanteDoCatalogo\(""\);[\s\S]*preencherParticipante\(null\);[\s\S]*void carregar\(identificador\);/
  );
});

test("instrumento público preserva somente credenciais da própria origem", async () => {
  const instrumento = await ler("components/instrumento-integrado.tsx");
  assert.match(instrumento, /credentials: "same-origin"/);
  assert.doesNotMatch(instrumento, /credentials: "omit"/);
});
