import type { Metadata } from "next";
import { PlatformEntryShell } from "@/components/platform-entry-shell";

export const metadata: Metadata = {
  title: "Entrada segura | HUMANEXUS",
  description: "Portal de entrada segura da plataforma HUMANEXUS.",
  robots: { index: false, follow: false }
};

export default function EntryLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return <PlatformEntryShell>{children}</PlatformEntryShell>;
}
