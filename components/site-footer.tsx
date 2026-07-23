import Link from "next/link";

export function SiteFooter() {
  return (
    <footer>
      <div className="container footer-top">
        <div className="footer-brand">
          <Link href="/" className="brand" aria-label="HUMANEXUS — início">
            <span className="brand-mark">
              <i>H</i>
              <b>X</b>
            </span>
            <span className="brand-name">
              <strong>HUMANEXUS</strong>
              <small>PERFORMANCE OPERACIONAL</small>
            </span>
          </Link>
          <p>
            Ciência, tecnologia e comportamento humano aplicados à performance
            em sistemas complexos.
          </p>
          <div className="footer-contact">
            <Link href="tel:+5592981187777">+55 92 98118-7777</Link>
            <Link href="mailto:contato@institutohumanexus.com">
              contato@institutohumanexus.com
            </Link>
          </div>
        </div>
        <div>
          <h4>Navegação</h4>
          <Link href="/o-instituto">O Instituto</Link>
          <Link href="/solucoes">Soluções</Link>
          <Link href="/tecnologia-humanexus">Tecnologia</Link>
          <Link href="/areas-de-atuacao">Áreas de atuação</Link>
        </div>
        <div>
          <h4>Institucional</h4>
          <Link href="/performance-operacional">Performance Operacional</Link>
          <Link href="/inteligencia-regulatoria-humana">
            Inteligência Regulatória
          </Link>
          <Link href="/empresas-e-organizacoes">
            Empresas e Organizações
          </Link>
          <Link href="/contato">Contato</Link>
        </div>
        <div>
          <h4>Conecte-se</h4>
          <Link
            href="https://www.instagram.com/institutohumanexus"
            target="_blank"
            rel="noreferrer"
          >
            @institutohumanexus ↗
          </Link>
          <Link
            href="https://wa.me/5592981187777"
            target="_blank"
            rel="noreferrer"
          >
            WhatsApp ↗
          </Link>
          <Link href="mailto:contato@institutohumanexus.com">
            E-mail institucional ↗
          </Link>
          <Link href="mailto:institutohumanexus@gmail.com">Gmail ↗</Link>
        </div>
      </div>
      <div className="container footer-ip">
        <span>PROPRIEDADE INTELECTUAL</span>
        <p>
          A TIRH e a arquitetura metodológica HUMANEXUS constituem produção
          intelectual autoral desenvolvida pelo Dr. Marcos Alcântara.
        </p>
      </div>
      <div className="container footer-bottom">
        <span>© 2026 Instituto Humanexus de Performance Operacional LTDA</span>
        <span>Manaus · Amazonas · Brasil</span>
        <span>Todos os direitos reservados</span>
      </div>
    </footer>
  );
}
