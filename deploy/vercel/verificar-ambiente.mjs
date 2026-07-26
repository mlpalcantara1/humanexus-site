const erros = [];
const ambiente = process.env.HUMANEXUS_ENVIRONMENT;
const core = process.env.HUMANEXUS_CORE_API_URL;
const app = process.env.NEXT_PUBLIC_HUMANEXUS_APP_URL;

if (ambiente !== "homologacao") {
  erros.push("HUMANEXUS_ENVIRONMENT deve ser homologacao.");
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
  if (
    url.hostname === "app.institutohumanexus.com" ||
    url.hostname === "www.institutohumanexus.com"
  ) {
    erros.push(`${nome} não pode apontar para a plataforma operacional.`);
  }
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

console.log("Ambiente de homologação validado sem expor segredos.");
