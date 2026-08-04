import Link from "next/link";
import { BotaoSair } from "@/components/botao-sair";
import { PlatformNavigation } from "@/components/platform-navigation";
import { ExperienceModeControl } from "@/components/experience-mode-control";
import { NucleoConnectionBadge } from "@/components/nucleo-connection-badge";
import { sessaoAtual } from "@/lib/portal-session";
import { ErroDoNucleo } from "@/lib/humanexus-core";

export async function PlatformShell({ children }: { children: React.ReactNode }) {
  let sessao: Awaited<ReturnType<typeof sessaoAtual>> = null;
  let nucleoIndisponivel = false;
  try {
    sessao = await sessaoAtual();
  } catch (erro) {
    if (erro instanceof ErroDoNucleo && [502, 503, 504].includes(erro.status)) {
      nucleoIndisponivel = true;
    } else {
      throw erro;
    }
  }
  const podeVerLab = sessao?.usuario.permissoes.includes("acessar_humanexus_lab") ?? false;
  const podeAdministrar = [
    "ADMINISTRADOR_PROPRIETARIO",
    "ADMINISTRADOR_DO_SISTEMA"
  ].includes(String(sessao?.usuario.perfil));
  const contextoPreservado = Boolean(sessao || nucleoIndisponivel);
  return (
    <div className="hx-app hx-app--executive">
      <div className="hx-app__atmosphere" aria-hidden="true" />
      <header className="hx-app__header">
        <Link className="hx-app__brand" href="/area-humanexus" aria-label="HUMANEXUS">
          <span className="hx-app__brand-mark"><i>H</i><b>X</b></span>
          <span>
            <strong>HUMANEXUS</strong>
            <small>INTELIGÊNCIA REGULATÓRIA</small>
          </span>
        </Link>
        <div className="hx-app__product-signature" aria-label="Identidade do produto">
          <small>CENTRO DE INTELIGÊNCIA OPERACIONAL</small>
          <strong>HUMANEXUS COMMAND</strong>
        </div>
        <div className="hx-app__header-meta">
          {contextoPreservado ? <ExperienceModeControl /> : null}
          <span className="hx-app__environment">AMBIENTE PROTEGIDO</span>
          <NucleoConnectionBadge estadoInicial={nucleoIndisponivel ? "reconectando" : "verificando"} />
          {sessao ? <span className="hx-app__identity"><b>{sessao.usuario.nome}</b><small>{sessao.usuario.perfil === "ADMINISTRADOR_PROPRIETARIO" ? "Administrador Proprietário" : sessao.usuario.perfil.replaceAll("_", " ")}</small></span> : null}
          {sessao ? <BotaoSair csrf={sessao.csrf} /> : null}
        </div>
      </header>
      {contextoPreservado ? (
        <PlatformNavigation
          podeVerLab={podeVerLab}
          podeAdministrar={podeAdministrar}
          escopoDePersistencia={sessao?.usuario.identificador ?? "sessao-indisponivel"}
        />
      ) : null}
      <main className={contextoPreservado ? "hx-app__content hx-app__content--signed" : "hx-app__content"}>{children}</main>
      <footer className="hx-app__footer">
        <span>HUMANEXUS / COMMAND</span>
        <small>Inteligência Regulatória Humana · ambiente operacional protegido.</small>
      </footer>
    </div>
  );
}
