import Link from "next/link";
import { sessaoAtual } from "@/lib/portal-session";

const NAVEGACAO = [
  ["Painel", "/plataforma/painel"], ["Organizações", "/plataforma/organizacoes"],
  ["Clientes", "/plataforma/clientes"], ["Sessões", "/plataforma/sessoes"],
  ["Treinamentos", "/plataforma/treinamentos"], ["PRÉ / TREINO / PÓS", "/plataforma/pre-treino-pos"],
  ["Formulação", "/plataforma/formulacao"], ["Longitudinal", "/plataforma/longitudinal"],
  ["Indicador Coletivo", "/plataforma/indicador-coletivo"], ["Relatórios", "/plataforma/relatorios"],
  ["Cockpit Vivo", "/plataforma/cockpit-vivo"], ["Conectores", "/plataforma/conectores"],
  ["Telemetria", "/plataforma/telemetria"], ["Acesso Móvel", "/plataforma/movel"],
  ["Replay", "/plataforma/replay"], ["Configurações", "/plataforma/configuracoes"]
] as const;

export async function PlatformShell({ children }: { children: React.ReactNode }) {
  const sessao = await sessaoAtual();
  const podeVerLab = sessao?.usuario.permissoes.includes("acessar_humanexus_lab") ?? false;
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
      {sessao ? (
        <nav className="platform-nav" aria-label="Navegação principal da plataforma">
          <div className="platform-nav__scroll">
            {NAVEGACAO.map(([rotulo, href]) => <Link key={href} href={href}>{rotulo}</Link>)}
            {podeVerLab ? <Link className="platform-nav__lab" href="/plataforma/humanexus-lab">HUMANEXUS LAB</Link> : null}
            {sessao.usuario.perfil === "ADMINISTRADOR_DO_SISTEMA" ? <Link href="/admin">Administração</Link> : null}
          </div>
        </nav>
      ) : null}
      <main className="platform-content">{children}</main>
      <footer className="platform-footer">
        <span>HUMANEXUS</span>
        <small>Ciência, tecnologia e proteção de dados.</small>
      </footer>
    </div>
  );
}
