const erros = [];
const ambiente = process.env.HUMANEXUS_ENVIRONMENT;
const core = process.env.HUMANEXUS_CORE_API_URL;
const app = process.env.NEXT_PUBLIC_HUMANEXUS_APP_URL;
const banco = process.env.DATABASE_URL;
const producao = ambiente === "producao" || ambiente === "production";
const bypassDoCore = process.env.HUMANEXUS_CORE_PROTECTION_BYPASS_SECRET;
const coreCandidato =
  process.env.HUMANEXUS_EXPECTED_PREVIEW_CORE_HOSTNAME?.trim() ?? "";
const endpointBancoProduction = "ep-dark-firefly-ac54nu73-pooler";
const endpointBancoPreview = "ep-dry-bar-acj2wv8r-pooler";

if (!producao && ambiente !== "homologacao") {
  erros.push(
    "HUMANEXUS_ENVIRONMENT deve ser homologacao, producao ou production."
  );
}

for (const [nome, valor] of [
  ["HUMANEXUS_CORE_API_URL", core],
  ["NEXT_PUBLIC_HUMANEXUS_APP_URL", app]
]) {
  if (!valor) {
    erros.push(`${nome} ausente.`);
    continue;
  }
  let url;
  try {
    url = new URL(valor);
  } catch {
    erros.push(`${nome} não é uma URL válida.`);
    continue;
  }
  if (url.protocol !== "https:") erros.push(`${nome} deve usar HTTPS.`);
  if (producao) {
    const hostnameEsperado =
      nome === "HUMANEXUS_CORE_API_URL"
        ? "api.institutohumanexus.com"
        : "app.institutohumanexus.com";
    if (url.hostname !== hostnameEsperado) {
      erros.push(`${nome} deve apontar para ${hostnameEsperado} em produção.`);
    }
  } else if (
    ["app.institutohumanexus.com", "www.institutohumanexus.com"].includes(
      url.hostname
    )
  ) {
    erros.push(
      `${nome} não pode apontar para a plataforma operacional de produção na homologação.`
    );
  }
}

if (!producao) {
  let hostnameDoCore = "";
  try {
    hostnameDoCore = new URL(core).hostname;
  } catch {}
  if (
    !/^humanexus-core-[a-z0-9-]+\.vercel\.app$/.test(coreCandidato)
    || hostnameDoCore !== coreCandidato
  ) {
    erros.push(`Preview deve consumir o Core candidato protegido ${coreCandidato}.`);
  }
  if (!bypassDoCore || bypassDoCore.length < 32) {
    erros.push("HUMANEXUS_CORE_PROTECTION_BYPASS_SECRET ausente ou fraco no Preview.");
  }
} else if (bypassDoCore) {
  erros.push("HUMANEXUS_CORE_PROTECTION_BYPASS_SECRET deve permanecer exclusivo do Preview.");
}

let hostnameDoBanco = "";
try {
  hostnameDoBanco = new URL(banco).hostname.toLowerCase();
} catch {
  erros.push("DATABASE_URL ausente ou inválida.");
}
if (
  !producao
  && hostnameDoBanco
  && (
    !hostnameDoBanco.includes(endpointBancoPreview)
    || hostnameDoBanco.includes(endpointBancoProduction)
  )
) {
  erros.push("Preview deve usar exclusivamente o endpoint Neon isolado autorizado.");
}
if (
  producao
  && hostnameDoBanco
  && (
    !hostnameDoBanco.includes(endpointBancoProduction)
    || hostnameDoBanco.includes(endpointBancoPreview)
  )
) {
  erros.push("Production deve usar exclusivamente o endpoint Neon canônico de produção.");
}

if (
  process.env.NEXT_PUBLIC_HUMANEXUS_CORE_PROTECTION_BYPASS_SECRET
  || process.env.NEXT_PUBLIC_VERCEL_AUTOMATION_BYPASS_SECRET
) {
  erros.push("Segredo de bypass do Core não pode ser exposto ao browser.");
}

if (process.env.HUMANEXUS_LOCAL_RECOVERY_SECRET) {
  erros.push("Recuperação local não pode estar habilitada na nuvem.");
}

if (
  !process.env.HUMANEXUS_INVITE_SECRET ||
  process.env.HUMANEXUS_INVITE_SECRET.length < 32
) {
  erros.push("HUMANEXUS_INVITE_SECRET ausente ou fraco.");
}

if (erros.length) {
  console.error(`BLOQUEIO_DE_AMBIENTE:\n- ${erros.join("\n- ")}`);
  process.exit(1);
}

console.log(`Ambiente de ${producao ? "produção" : "homologação"} validado sem expor segredos.`);
