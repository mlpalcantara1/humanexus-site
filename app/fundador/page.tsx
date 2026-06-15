import Image from "next/image";
import { brandAssets } from "@/lib/brand-assets";
import { GlassCard, PageHero, PrimaryButton, SecondaryButton, SectionIntro } from "@/components/ui";
import { authorityPoints } from "@/lib/site-data";

export default function FundadorPage() {
  return (
    <>
      <PageHero
        eyebrow="Fundador e Diretor Científico"
        title="Dr. Marcos Lázaro Pereira de Alcântara"
        description="Psicólogo de aviação, pesquisador e fundador do Instituto HUMANEXUS."
        primary={{ href: "/sobre", label: "Conhecer o Instituto" }}
        secondary={{ href: "/contato", label: "Agendar Reunião Institucional" }}
        media={{
          src: brandAssets.media.institutionalPortrait,
          alt: "Dr. Marcos Lázaro Pereira de Alcântara",
          badge: "Diretor científico"
        }}
      />

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
          <div className="space-y-8">
            <SectionIntro
              eyebrow="Trajetória"
              title="Trajetória construída em aviação, fatores humanos, segurança operacional e desenvolvimento institucional."
              description="Com trajetória acadêmica, operacional e institucional, Dr. Marcos Alcântara atua na convergência entre psicologia da aviação, fatores humanos, segurança operacional e desenvolvimento de equipes em ambientes críticos."
            />
            <div className="flex flex-col gap-4 sm:flex-row">
              <PrimaryButton href="http://lattes.cnpq.br/2740055296386524">Currículo Lattes</PrimaryButton>
              <SecondaryButton href="https://orcid.org/0000-0002-7610-6229">ORCID</SecondaryButton>
            </div>
            <GlassCard
              accent="gold"
              title="Base técnica e experiência operacional"
              description="O HUMANEXUS nasce da convergência entre ciência comportamental, fatores humanos, experiência operacional em aviação, investigação aeronáutica e desenvolvimento institucional aplicado."
            />
          </div>
          <div className="grid gap-5">
            <div className="relative min-h-[360px] overflow-hidden rounded-[32px] border border-[#C9A34E]/22 bg-[#090909] shadow-gold">
              <Image src={brandAssets.media.founderAviationCeremony} alt="Dr. Marcos em contexto institucional aeronáutico" fill className="object-cover" />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.10),rgba(5,5,5,0.74))]" />
            </div>
            <div className="relative min-h-[280px] overflow-hidden rounded-[32px] border border-white/10 bg-[#090909]">
              <Image src={brandAssets.media.founderCenipa} alt="Dr. Marcos em contexto institucional aeronáutico" fill className="object-cover" />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.14),rgba(5,5,5,0.72))]" />
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#080808]">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <SectionIntro
            eyebrow="Autoridade técnica"
            title="Formação, experiência e presença institucional colocadas a serviço de operações críticas."
            description="Uma camada de legitimidade para programas institucionais, aviação, segurança operacional e ambientes de elevada exigência."
          />
          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {authorityPoints.map((item) => (
              <GlassCard key={item.title} accent="gold" title={item.title} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
