import Link from "next/link";
import { FormularioEntrada } from "@/components/formulario-entrada";
import { destinoDoPerfil, sessaoAtual } from "@/lib/portal-session";

export default async function EntrarPage() {
  const sessao = await sessaoAtual();
  const destino = sessao ? destinoDoPerfil(sessao.usuario.perfil) : null;

  return (
    <section className="platform-login min-h-[72vh] px-5 py-20">
      <div className="platform-login__media" aria-hidden="true" />
      <div className="relative mx-auto max-w-lg">
        {destino ? (
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-7 sm:p-10">
            <p className="text-xs uppercase tracking-[0.28em] text-[#C9A34E]">
              Sessão segura ativa
            </p>
            <h1 className="mt-4 text-3xl font-semibold text-white">
              Continuar para a Área HUMANEXUS
            </h1>
            <p className="mt-3 leading-7 text-[#AEB2B9]">
              A sua autenticação e o segundo fator permanecem válidos. A plataforma só será aberta após a sua confirmação explícita.
            </p>
            <Link
              href={destino}
              className="mt-7 flex w-full justify-center rounded-full bg-[#C9A34E] px-6 py-4 font-semibold text-black"
            >
              Continuar sessão segura
            </Link>
            <Link
              href="/area-humanexus"
              className="mt-5 block text-center text-sm font-semibold text-[#D8BC65]"
            >
              Voltar à entrada
            </Link>
          </div>
        ) : (
          <FormularioEntrada />
        )}
      </div>
    </section>
  );
}
