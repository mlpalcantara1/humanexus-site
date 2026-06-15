import type { Metadata } from "next";
import { AnalyticsScripts } from "@/components/analytics-scripts";
import { brandAssets } from "@/lib/brand-assets";
import { FloatingWhatsApp } from "@/components/floating-whatsapp";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://institutohumanexus.com"),
  title: "Instituto HUMANEXUS | Inteligência Operacional Humana",
  description:
    "Instituto HUMANEXUS: desenvolvimento humano operacional, segurança operacional e acompanhamento contínuo para ambientes críticos.",
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
      "Instituto HUMANEXUS: desenvolvimento humano operacional e segurança operacional para ambientes críticos.",
    images: [brandAssets.socialPreview]
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
        <FloatingWhatsApp />
        <AnalyticsScripts />
      </body>
    </html>
  );
}
