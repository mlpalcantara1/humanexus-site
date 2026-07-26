import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Anamnese Regulatória | HUMANEXUS",
  description: "Acesso seguro do participante à Anamnese Regulatória HUMANEXUS.",
  robots: { index: false, follow: false }
};

export default function ParticipantLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="hx-participant-shell">
      <header className="hx-participant-shell__header">
        <Link href="/acesso-participante" aria-label="HUMANEXUS — acesso do participante">
          <span>H</span><i>X</i>
          <strong>HUMANEXUS</strong>
          <small>ACESSO DO PARTICIPANTE</small>
        </Link>
        <em>AMBIENTE SEGURO</em>
      </header>
      {children}
      <footer className="hx-participant-shell__footer">
        HUMANEXUS · ciência, privacidade e rastreabilidade.
      </footer>
    </div>
  );
}
