import { CardGrid, GlassCard, PageHero, PrimaryButton, SecondaryButton, SectionIntro } from "@/components/ui";
import { companySections } from "@/lib/site-data";

export default function EmpresasPage() {
  const contractSignals = [
    "Reunião estratégica inicial com foco em risco humano, maturidade e aderência institucional",
    "Plano de implementação com fases executivas e linguagem adequada para decisores",
    "Programas contínuos para segurança, liderança, acompanhamento de operadores e performance"
  ];

  return (
    <>
      <PageHero
        eyebrow="Empresas e organizações"
        title="Uma estrutura institucional para líderes que precisam transformar vulnerabilidade humana em decisão, governança e performance."
        description="Página comercial orientada a fechamento de reuniões, desenho de programas contínuos e avanço para implementação institucional em organizações de alta exigência, riscos psicossociais e segurança operacional."
        primary={{ href: "/contato", label: "Agendar Reunião Institucional" }}
        secondary={{ href: "https://wa.me/5592981187777", label: "Falar pelo WhatsApp" }}
      />
      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <SectionIntro
          eyebrow="Programas contínuos"
          title="Estrutura B2B orientada a decisão executiva e implementação institucional."
          description="A proposta comercial foi desenhada para empresários, líderes operacionais, gestores de segurança e organizações que não podem tratar o fator humano, os riscos psicossociais e a estabilidade operacional de forma superficial ou avulsa."
        />
        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {contractSignals.map((item) => (
            <GlassCard key={item} accent="gold" description={item} />
          ))}
        </div>
        <div className="mt-12">
          <CardGrid items={companySections} />
        </div>
        <div className="mt-12 grid gap-6 rounded-[30px] border border-[#C9A34E]/22 bg-[#0B0B0B]/92 p-7 shadow-gold lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-[#C9A34E]">Fechamento comercial</p>
            <h3 className="text-2xl font-semibold text-[#F5F5F5]">
              O próximo passo não é navegar mais no site. É abrir uma conversa de escopo, risco e implementação institucional.
            </h3>
            <p className="max-w-3xl text-base text-[#B8B8B8]">
              Se a sua organização opera sob pressão, com alta responsabilidade e exposição a erro humano, a reunião estratégica inicial é o ponto de partida correto para um programa contínuo.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <PrimaryButton href="/contato">Implementar o Programa</PrimaryButton>
            <SecondaryButton href="https://wa.me/5592981187777">
              Abrir conversa no WhatsApp
            </SecondaryButton>
          </div>
        </div>
      </section>
    </>
  );
}
