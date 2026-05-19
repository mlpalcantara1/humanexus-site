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
    "Instituto HUMANEXUS: inteligência operacional humana, fatores humanos, CRM, riscos psicossociais, segurança operacional e desenvolvimento contínuo para ambientes críticos.",
  keywords: [
    "inteligência operacional humana",
    "fatores humanos",
    "neuroergonomia",
    "CRM aviação",
    "riscos psicossociais",
    "segurança operacional",
    "performance humana",
    "liderança sob pressão",
    "inteligência regulatória"
  ],
  openGraph: {
    title: "Instituto HUMANEXUS | Inteligência Operacional Humana",
    description:
      "Instituto HUMANEXUS: inteligência operacional humana, fatores humanos, segurança operacional e desenvolvimento contínuo para ambientes críticos.",
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
      "Instituto HUMANEXUS: inteligência operacional humana, fatores humanos e segurança operacional para ambientes críticos.",
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
