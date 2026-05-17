import type { Metadata } from "next";
import { brandAssets } from "@/lib/brand-assets";
import { FloatingWhatsApp } from "@/components/floating-whatsapp";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://humanexus.com"),
  title: "HUMANEXUS | Teoria da Inteligência Regulatória Humana e Performance Operacional",
  description:
    "O HUMANEXUS operacionaliza a Teoria da Inteligência Regulatória Humana com leitura regulatória, EEG, HRV, simulação e performance operacional para aviação, táxi aéreo e ambientes críticos.",
  openGraph: {
    title: "HUMANEXUS | Teoria da Inteligência Regulatória Humana e Performance Operacional",
    description:
      "O HUMANEXUS operacionaliza a Teoria da Inteligência Regulatória Humana com leitura regulatória, EEG, HRV, simulação e performance operacional para aviação, táxi aéreo e ambientes críticos.",
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
    title: "HUMANEXUS | Teoria da Inteligência Regulatória Humana e Performance Operacional",
    description:
      "HUMANEXUS: Teoria da Inteligência Regulatória Humana operacionalizada para aviação, segurança operacional e performance sob pressão.",
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
      </body>
    </html>
  );
}
