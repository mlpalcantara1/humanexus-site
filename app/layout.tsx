import type { Metadata } from "next";
import "./globals.css";
import "./operational.css";
import "./humanexus-design-system.css";
import "./anamnese-operacional.css";
import { PwaRuntime } from "@/components/pwa-runtime";
import { CamadaPortuguesVisivel } from "@/components/camada-portugues-visivel";

export const metadata: Metadata = {
  manifest: "/manifest.webmanifest",
  metadataBase: new URL("https://www.institutohumanexus.com"),
  icons: {
    icon: "/icon.png",
    apple: "/icon.png"
  },
  title: {
    default: "HUMANEXUS | Inteligência Humana para Operações Aéreas",
    template: "%s"
  },
  description:
    "Inteligência Regulatória Humana, neurotecnologia e desenvolvimento contínuo para aviação, segurança operacional, comandantes e tripulações.",
  keywords: [
    "inteligência regulatória humana",
    "teoria da inteligência regulatória humana",
    "fatores humanos",
    "riscos psicossociais",
    "segurança operacional",
    "desenvolvimento humano aplicado",
    "liderança sob pressão",
    "operações críticas",
    "aviação operacional",
    "tomada de decisão sob pressão"
  ],
  openGraph: {
    title: "HUMANEXUS | Inteligência Humana para Operações Aéreas",
    description:
      "Ciência e tecnologia aplicadas à segurança, decisão e desempenho humano em operações aéreas.",
    url: "https://www.institutohumanexus.com",
    siteName: "HUMANEXUS",
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: "/media/hero-command-center.png",
        width: 1672,
        height: 941,
        alt: "HUMANEXUS — inteligência humana para operações críticas"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "HUMANEXUS",
    description:
      "Inteligência Regulatória Humana aplicada à aviação e à segurança operacional.",
    images: ["/media/hero-command-center.png"]
  },
  alternates: {
    canonical: "https://www.institutohumanexus.com"
  }
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Instituto HUMANEXUS",
  alternateName: "HUMANEXUS",
  url: "https://www.institutohumanexus.com",
  logo: "https://www.institutohumanexus.com/media/humanexus-logo.png",
  email: ["contato@institutohumanexus.com", "institutohumanexus@gmail.com"],
  telephone: "+55 92 98118-7777",
  founder: {
    "@type": "Person",
    name: "Dr. Marcos Alcântara"
  },
  address: {
    "@type": "PostalAddress",
    addressLocality: "Manaus",
    addressRegion: "AM",
    addressCountry: "BR"
  },
  description:
    "Inteligência Regulatória Humana e tecnologia aplicada à segurança e ao desempenho operacional.",
  areaServed: "BR"
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "HUMANEXUS",
  url: "https://www.institutohumanexus.com"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" data-scroll-behavior="smooth">
      <head>
        <link
          rel="preload"
          href="/media/hero-command-center.webp"
          as="image"
          type="image/webp"
          fetchPriority="high"
        />
      </head>
      <body className="antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        {children}
        <CamadaPortuguesVisivel />
        <PwaRuntime />
      </body>
    </html>
  );
}
