import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const sources = {
  home: "/tmp/hx-premium-reference.html",
  "o-instituto": "/tmp/hx-o-instituto.html",
  solucoes: "/tmp/hx-solucoes.html",
  "tecnologia-humanexus": "/tmp/hx-tecnologia-humanexus.html",
  "inteligencia-regulatoria-humana": "/tmp/hx-inteligencia-regulatoria-humana.html",
  "empresas-e-organizacoes": "/tmp/hx-empresas-e-organizacoes.html",
  "performance-operacional": "/tmp/hx-performance-operacional.html",
  "areas-de-atuacao": "/tmp/hx-areas-de-atuacao.html",
  contato: "/tmp/hx-contato.html"
};

function decode(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#x27;", "'")
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

const pages = Object.fromEntries(
  Object.entries(sources).map(([slug, source]) => {
    const html = readFileSync(source, "utf8");
    const main = html.match(/<main(?: class="([^"]*)")?>([\s\S]*?)<\/main>/);
    const title = html.match(/<title>([\s\S]*?)<\/title>/);
    const description = html.match(
      /<meta name="description" content="([^"]*)"/
    );

    if (!main || !title || !description) {
      throw new Error(`Não foi possível recuperar a página premium: ${slug}`);
    }

    return [
      slug,
      {
        className: main[1] ?? "",
        description: decode(description[1]),
        html: main[2],
        title: decode(title[1])
      }
    ];
  })
);

const recoveredCss = readFileSync("/tmp/hx-premium.css", "utf8");
const designTokenStart = recoveredCss.indexOf(":root{--black:");
if (designTokenStart === -1) {
  throw new Error("A folha de estilos premium não contém os tokens esperados.");
}
writeFileSync(
  join(root, "app", "globals.css"),
  `/* Recuperado da referência visual autoral do ChatGPT Sites. */\n${recoveredCss.slice(designTokenStart)}\n`,
  "utf8"
);

mkdirSync(join(root, "lib"), { recursive: true });
writeFileSync(
  join(root, "lib", "premium-pages.generated.ts"),
  `// Gerado de forma determinística a partir da referência autoral do ChatGPT Sites.\n` +
    `// Não editar manualmente; execute scripts/recover-premium-pages.mjs.\n` +
    `export const premiumPages = ${JSON.stringify(pages, null, 2)} as const;\n`,
  "utf8"
);

for (const slug of Object.keys(sources).filter((item) => item !== "home")) {
  const directory = join(root, "app", slug);
  const isContact = slug === "contato";
  mkdirSync(directory, { recursive: true });
  writeFileSync(
    join(directory, "page.tsx"),
    `import {\n` +
      `  metadataForPremiumPage,\n` +
      `  PremiumReferencePage\n` +
      `} from "@/components/premium-reference-page";\n` +
      (isContact
        ? `import { ContactFormBehavior } from "@/components/contact-form-behavior";\n`
        : "") +
      `\nexport const metadata = metadataForPremiumPage(${JSON.stringify(slug)});\n` +
      `\nexport default function Page() {\n` +
      (isContact
        ? `  return <><PremiumReferencePage slug=${JSON.stringify(slug)} /><ContactFormBehavior /></>;\n`
        : `  return <PremiumReferencePage slug=${JSON.stringify(slug)} />;\n`) +
      `}\n`,
    "utf8"
  );
}
