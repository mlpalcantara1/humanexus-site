import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import postcss from "postcss";

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
        html: main[2].replaceAll(' aria-label="HUMANEXUS — início"', ""),
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

const recoveredPrelude = recoveredCss.slice(0, designTokenStart);
const flattenedPrelude = [];
postcss.parse(recoveredPrelude).walkRules((rule) => {
  flattenedPrelude.push(rule.clone().toString());
});

const recoveredMonoFont = `@font-face {
  font-family: "Geist Mono";
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
  src: url("/fonts/geist-mono-latin-ext.woff2") format("woff2");
  unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;
}
@font-face {
  font-family: "Geist Mono";
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
  src: url("/fonts/geist-mono-latin.woff2") format("woff2");
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
.antialiased {
  --font-geist-mono: "Geist Mono", sans-serif;
}`;

const optimizedPremiumCss = recoveredCss
  .slice(designTokenStart)
  .replaceAll(
    "/media/hero-command-center.png",
    "/media/hero-command-center.webp"
  )
  .replaceAll("/media/eeg-neurotech.png", "/media/eeg-neurotech.webp")
  .trimEnd();

const qualityOverrides = `/* Ajustes não visuais ou de contraste mínimo validados após a equivalência. */
.real-signature > span {
  color: #806c46;
}
.position-section .eyebrow {
  color: #6d5935;
}
.position-section .eyebrow > span {
  background: #6d5935;
}
.footer-ip p,
.footer-bottom {
  color: #7c7e79;
}
.footer-contact a {
  min-height: 24px;
  display: flex;
  align-items: center;
}
.footer-top .footer-heading {
  color: var(--gold);
  letter-spacing: .16em;
  text-transform: uppercase;
  margin: 2px 0 12px;
  font: 8px monospace;
}`;

writeFileSync(
  join(root, "app", "globals.css"),
  `/* Fonte variável recuperada da referência autoral do ChatGPT Sites. */\n` +
    `${recoveredMonoFont}\n` +
    `/* Preâmbulo global recuperado da referência autoral do ChatGPT Sites.\n` +
    ` * Os wrappers @layer foram removidos para compatibilidade com o pipeline atual;\n` +
    ` * a ordem e as declarações originais permanecem preservadas. */\n` +
    `${flattenedPrelude.join("\n")}\n` +
    `/* CSS premium autoral — somente URLs dos ativos otimizados foram substituídas. */\n` +
    `${optimizedPremiumCss}\n` +
    `${qualityOverrides}\n`,
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
