import Link from "next/link";

export function PlatformShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="platform-shell">
      <header className="platform-header">
        <Link className="platform-brand" href="/area-humanexus" aria-label="HUMANEXUS">
          <span className="platform-brand-mark">HX</span>
          <span>
            <strong>HUMANEXUS</strong>
            <small>PLATAFORMA REGULATÓRIA</small>
          </span>
        </Link>
        <div className="platform-security">
          <span aria-hidden="true" />
          Ambiente seguro
        </div>
      </header>
      <main className="platform-content">{children}</main>
      <footer className="platform-footer">
        <span>HUMANEXUS</span>
        <small>Ciência, tecnologia e proteção de dados.</small>
      </footer>
    </div>
  );
}
