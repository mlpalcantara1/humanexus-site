import type { Metadata } from "next";
import { AnalyticsScripts } from "@/components/analytics-scripts";
import { brandAssets } from "@/lib/brand-assets";
import { FloatingWhatsApp } from "@/components/floating-whatsapp";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://humanexus.com"),
  title: "Instituto HUMANEXUS | Inteligência Regulatória Humana e Performance Operacional",
  description:
    "Instituto HUMANEXUS: fatores humanos, neuroergonomia, CRM aviação, EEG operacional e performance humana para segurança operacional e ambientes críticos.",
  keywords: [
    "fatores humanos",
    "neuroergonomia",
    "CRM aviação",
    "psicologia aeronáutica",
    "EEG operacional",
    "performance humana",
    "segurança operacional",
    "inteligência regulatória"
  ],
  openGraph: {
    title: "Instituto HUMANEXUS | Inteligência Regulatória Humana e Performance Operacional",
    description:
      "Instituto HUMANEXUS: fatores humanos, neuroergonomia, CRM aviação, EEG operacional e performance humana para segurança operacional e ambientes críticos.",
    url: "https://humanexus.com",
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
    title: "Instituto HUMANEXUS | Inteligência Regulatória Humana e Performance Operacional",
    description:
      "Instituto HUMANEXUS: fatores humanos, CRM, EEG operacional e performance humana para ambientes críticos.",
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
