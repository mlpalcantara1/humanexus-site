import Link from "next/link";

export function PlatformEntryShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="hx-app hx-app--executive">
      <div className="hx-app__atmosphere" aria-hidden="true" />
      <header className="hx-app__header">
        <Link className="hx-app__brand" href="/" aria-label="HUMANEXUS">
          <span className="hx-app__brand-mark"><i>H</i><b>X</b></span>
          <span>
            <strong>HUMANEXUS</strong>
            <small>INTELIGÊNCIA REGULATÓRIA</small>
          </span>
        </Link>
        <div className="hx-app__product-signature" aria-label="Identidade do produto">
          <small>PORTAL DE ACESSO SEGURO</small>
          <strong>ÁREA HUMANEXUS</strong>
        </div>
        <div className="hx-app__header-meta">
          <span className="hx-app__environment">ENTRADA SEGURA</span>
        </div>
      </header>
      <main className="hx-app__content">{children}</main>
      <footer className="hx-app__footer">
        <span>HUMANEXUS / COMANDO</span>
        <small>Inteligência Regulatória Humana · portal de acesso protegido.</small>
      </footer>
    </div>
  );
}
