import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="brand">
          <span className="brand-mark">
            <i>H</i>
            <b>X</b>
          </span>
          <span className="brand-name">
            <strong>HUMANEXUS</strong>
            <small>PERFORMANCE OPERACIONAL</small>
          </span>
        </Link>
        <nav>
          <Link href="/o-instituto">Instituto</Link>
          <Link href="/#aviacao">Aviação</Link>
          <Link href="/solucoes">Soluções</Link>
          <Link href="/tecnologia-humanexus">Tecnologia</Link>
          <Link href="/inteligencia-regulatoria-humana">TIRH</Link>
          <Link href="/empresas-e-organizacoes">Empresas</Link>
        </nav>
        <Link
          href="https://app.institutohumanexus.com/recuperar-acesso"
          className="header-area"
          aria-label="Área HUMANEXUS — entrar na plataforma"
        >
          Entrar na Plataforma
        </Link>
        <Link href="/contato" className="header-cta">
          Agendar <span>↗</span>
        </Link>
        <details className="mobile-menu">
          <summary aria-label="Abrir menu">
            <i />
            <i />
          </summary>
          <div>
            <Link href="/o-instituto">Instituto</Link>
            <Link href="/#aviacao">Aviação</Link>
            <Link href="/solucoes">Soluções</Link>
            <Link href="/tecnologia-humanexus">Tecnologia</Link>
            <Link href="/inteligencia-regulatoria-humana">TIRH</Link>
            <Link href="/empresas-e-organizacoes">Empresas</Link>
            <Link href="/performance-operacional">Performance</Link>
            <Link href="https://app.institutohumanexus.com/recuperar-acesso">
              Entrar na Plataforma
            </Link>
            <Link href="/contato">Agendar apresentação</Link>
          </div>
        </details>
      </div>
    </header>
  );
}
