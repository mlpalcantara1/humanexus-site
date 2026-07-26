import Link from "next/link";
import { BotaoSair } from "@/components/botao-sair";
import { PlatformNavigation } from "@/components/platform-navigation";
import { sessaoAtual } from "@/lib/portal-session";

export async function PlatformShell({ children }: { children: React.ReactNode }) {
  const sessao = await sessaoAtual();
  const podeVerLab = sessao?.usuario.permissoes.includes("acessar_humanexus_lab") ?? false;
  const podeAdministrar = sessao?.usuario.perfil === "ADMINISTRADOR_DO_SISTEMA";
  return (
    <div className="hx-app">
      <div className="hx-app__atmosphere" aria-hidden="true" />
      <header className="hx-app__header">
        <Link className="hx-app__brand" href="/area-humanexus" aria-label="HUMANEXUS">
          <span className="hx-app__brand-mark"><i>H</i><b>X</b></span>
          <span>
            <strong>HUMANEXUS</strong>
            <small>INTELIGÊNCIA REGULATÓRIA</small>
          </span>
        </Link>
        <div className="hx-app__header-meta">
          <span className="hx-app__environment">AMBIENTE PROTEGIDO</span>
          <span className="hx-app__connection"><i />NÚCLEO CONECTADO</span>
          {sessao ? <span className="hx-app__identity"><b>{sessao.usuario.nome}</b><small>{sessao.usuario.perfil.replaceAll("_", " ")}</small></span> : null}
          {sessao ? <BotaoSair csrf={sessao.csrf} /> : null}
        </div>
      </header>
      {sessao ? (
        <PlatformNavigation podeVerLab={podeVerLab} podeAdministrar={podeAdministrar} />
      ) : null}
      <main className={sessao ? "hx-app__content hx-app__content--signed" : "hx-app__content"}>{children}</main>
      <footer className="hx-app__footer">
        <span>HUMANEXUS</span>
        <small>Ciência, tecnologia e proteção de dados · plataforma regulatória.</small>
      </footer>
    </div>
  );
}
