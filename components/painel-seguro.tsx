import Link from "next/link";
import { redirect } from "next/navigation";
import { BotaoSair } from "@/components/botao-sair";
import { PerfilHumanexus } from "@/lib/humanexus-core";
import { destinoDoPerfil, sessaoAtual } from "@/lib/portal-session";

const TITULOS: Record<PerfilHumanexus, string> = {
  ADMINISTRADOR_DO_SISTEMA: "Administração do Sistema",
  GOVERNANCA_CIENTIFICA: "Governança Científica",
  ADMINISTRADOR_DA_ORGANIZACAO: "Administração Organizacional",
  PROFISSIONAL_HUMANEXUS: "Área Profissional",
  VISUALIZADOR_OPERACIONAL: "Visão Operacional",
  AUDITOR: "Auditoria"
};

export async function PainelSeguro({
  perfilExigido
}: {
  perfilExigido: PerfilHumanexus;
}) {
  const sessao = await sessaoAtual();
  if (!sessao) redirect("/sessao-expirada");
  if (sessao.usuario.perfil !== perfilExigido) redirect("/acesso-negado");

  return (
    <section className="hx-secure-panel">
      <div className="hx-secure-panel__head">
        <div>
          <p>ÁREA HUMANEXUS / GOVERNANÇA</p>
          <h1>{TITULOS[perfilExigido]}</h1>
          <span>Sessão autenticada pelo núcleo oficial HUMANEXUS.</span>
        </div>
        <BotaoSair csrf={sessao.csrf} />
      </div>

      <div className="hx-secure-panel__grid">
        <article>
          <h2>Identidade</h2>
          <dl>
            <div>
              <dt>Nome</dt><dd>{sessao.usuario.nome}</dd>
            </div>
            <div>
              <dt>Perfil</dt><dd>{sessao.usuario.perfil}</dd>
            </div>
            <div>
              <dt>Organização</dt><dd>{sessao.usuario.identificador_da_organizacao ?? "Escopo sistêmico"}</dd>
            </div>
          </dl>
        </article>

        <article>
          <h2>Permissões efetivas</h2>
          <ul>
            {sessao.usuario.permissoes.map((permissao) => (
              <li key={permissao}>{permissao}</li>
            ))}
          </ul>
          <div className="hx-secure-panel__actions">
            <Link href={destinoDoPerfil(sessao.usuario.perfil)}>Início do painel <span>→</span></Link>
            {perfilExigido === "PROFISSIONAL_HUMANEXUS" ? (
              <Link href="/profissional/catalogo">Catálogo autoral</Link>
            ) : null}
          </div>
        </article>
      </div>
    </section>
  );
}
