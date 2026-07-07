import type { Metadata } from "next";
import { AnalyticsScripts } from "@/components/analytics-scripts";
import { brandAssets } from "@/lib/brand-assets";
import { FloatingWhatsApp } from "@/components/floating-whatsapp";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://institutohumanexus.com"),
  title: {
    default: "Instituto HUMANEXUS | Inteligência Operacional Humana",
    template: "%s | Instituto HUMANEXUS"
  },
  description:
    "Instituto HUMANEXUS: inteligência operacional humana para organizações que operam sob alta responsabilidade, pressão e consequência.",
  keywords: [
    "inteligência operacional humana",
    "fatores humanos",
    "riscos psicossociais",
    "segurança operacional",
    "desenvolvimento humano operacional",
    "liderança sob pressão",
    "operações críticas",
    "aviação operacional",
    "tomada de decisão sob pressão"
  ],
  openGraph: {
    title: "Instituto HUMANEXUS | Inteligência Operacional Humana",
    description:
      "Instituto HUMANEXUS: desenvolvimento humano operacional, segurança operacional e acompanhamento contínuo para ambientes críticos.",
    url: "https://institutohumanexus.com",
    siteName: "HUMANEXUS",
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: brandAssets.socialPreview,
        width: 1400,
        height: 1164,
        alt: "Identidade oficial HUMANEXUS"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Instituto HUMANEXUS | Inteligência Operacional Humana",
    description:
      "Instituto HUMANEXUS: inteligência operacional humana para ambientes críticos.",
    images: [brandAssets.socialPreview]
  },
  alternates: {
    canonical: "https://institutohumanexus.com"
  }
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Instituto HUMANEXUS",
  url: "https://institutohumanexus.com",
  email: "contato@institutohumanexus.com",
  description:
    "Instituto de inteligência operacional humana para ambientes de alta criticidade.",
  areaServed: "BR",
  sameAs: ["https://www.institutohumanexus.com"]
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Instituto HUMANEXUS",
  url: "https://institutohumanexus.com"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
        <FloatingWhatsApp />
        <AnalyticsScripts />
      </body>
    </html>
  );
}
