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
    <section className="mx-auto min-h-[70vh] max-w-6xl px-5 py-14 sm:py-20">
      <div className="flex flex-col justify-between gap-6 border-b border-white/10 pb-8 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-[#C9A34E]">
            Área HUMANEXUS
          </p>
          <h1 className="mt-3 text-4xl font-semibold text-white">
            {TITULOS[perfilExigido]}
          </h1>
          <p className="mt-3 text-[#AEB2B9]">
            Sessão autenticada pelo núcleo oficial HUMANEXUS.
          </p>
        </div>
        <BotaoSair csrf={sessao.csrf} />
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <article className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-7">
          <h2 className="text-xl font-semibold text-white">Identidade</h2>
          <dl className="mt-6 space-y-4 text-sm">
            <div>
              <dt className="text-[#8F949C]">Nome</dt>
              <dd className="mt-1 text-[#F2F2F2]">{sessao.usuario.nome}</dd>
            </div>
            <div>
              <dt className="text-[#8F949C]">Perfil</dt>
              <dd className="mt-1 break-words text-[#F2F2F2]">
                {sessao.usuario.perfil}
              </dd>
            </div>
            <div>
              <dt className="text-[#8F949C]">Organização</dt>
              <dd className="mt-1 break-all text-[#F2F2F2]">
                {sessao.usuario.identificador_da_organizacao ??
                  "Escopo sistêmico"}
              </dd>
            </div>
          </dl>
        </article>

        <article className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-7">
          <h2 className="text-xl font-semibold text-white">
            Permissões efetivas
          </h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {sessao.usuario.permissoes.map((permissao) => (
              <li
                key={permissao}
                className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-[#D5D7DB]"
              >
                {permissao}
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={destinoDoPerfil(sessao.usuario.perfil)}
              className="rounded-full bg-[#C9A34E] px-5 py-3 text-sm font-semibold text-black"
            >
              Início do painel
            </Link>
            {perfilExigido === "PROFISSIONAL_HUMANEXUS" ? (
              <Link
                href="/profissional/catalogo"
                className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white"
              >
                Catálogo autoral
              </Link>
            ) : null}
          </div>
        </article>
      </div>
    </section>
  );
}
