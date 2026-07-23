import Link from "next/link";

const accesses = [
  {
    title: "Responder Anamnese",
    description: "Abra o link seguro recebido do seu profissional e retome do ponto em que parou.",
    href: "/acesso-participante",
    label: "Acesso do participante"
  },
  {
    title: "Área Profissional",
    description: "Cadastre participantes, gere convites e acompanhe anamneses em revisão.",
    href: "/entrar",
    label: "Entrar no painel"
  },
  {
    title: "Área Organizacional",
    description: "Acesso preparado para gestão institucional com separação de finalidades e permissões.",
    href: "/entrar",
    label: "Entrar com segurança"
  }
];

export default function AreaHumanexusPage() {
  return (
    <section className="relative overflow-hidden px-5 py-20 sm:py-28">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(212,175,55,0.14),transparent_36%)]" />
      <div className="relative mx-auto max-w-6xl">
        <p className="text-xs uppercase tracking-[0.32em] text-[#C9A34E]">Ecossistema seguro</p>
        <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-[-0.04em] text-white sm:text-6xl">
          Área HUMANEXUS
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-[#AEB2B9]">
          Anamnese Regulatória, acompanhamento longitudinal e revisão profissional em um ambiente criado para preservar contexto, autoria e confidencialidade.
        </p>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {accesses.map((access) => (
            <article key={access.href} className="flex min-h-72 flex-col rounded-[2rem] border border-white/10 bg-white/[0.035] p-7 shadow-2xl shadow-black/20">
              <div className="h-px w-16 bg-[#C9A34E]" />
              <h2 className="mt-8 text-2xl font-semibold text-white">{access.title}</h2>
              <p className="mt-4 flex-1 leading-7 text-[#AEB2B9]">{access.description}</p>
              <Link href={access.href} className="mt-8 inline-flex text-sm font-semibold text-[#D8BC65]">
                {access.label} →
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
