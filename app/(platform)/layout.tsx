import type { Metadata } from "next";
import { PlatformShell } from "@/components/platform-shell";
import "./platform-command.css";
import "./report-command.css";

export const metadata: Metadata = {
  title: "Área HUMANEXUS",
  description: "Ambiente seguro da plataforma HUMANEXUS.",
  robots: { index: false, follow: false }
};

export default function PlatformLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return <PlatformShell>{children}</PlatformShell>;
}
