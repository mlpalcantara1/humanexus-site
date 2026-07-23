import Link from "next/link";

export default function SessaoExpiradaPage() {
  return (
    <section className="mx-auto min-h-[65vh] max-w-xl px-5 py-20">
      <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-8">
        <p className="text-xs uppercase tracking-[0.28em] text-[#C9A34E]">
          Segurança HUMANEXUS
        </p>
        <h1 className="mt-4 text-3xl font-semibold text-white">
          Sessão expirada
        </h1>
        <p className="mt-4 leading-7 text-[#AEB2B9]">
          Entre novamente para continuar com segurança.
        </p>
        <Link
          href="/entrar"
          className="mt-7 inline-flex rounded-full bg-[#C9A34E] px-6 py-3 font-semibold text-black"
        >
          Entrar novamente
        </Link>
      </div>
    </section>
  );
}
