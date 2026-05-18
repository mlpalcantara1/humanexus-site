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
        description="Psicólogo, pesquisador, especialista em Psicologia da Aviação e criador da Teoria da Inteligência Regulatória Humana."
        primary={{ href: "/pesquisa", label: "Conhecer a base científica do HUMANEXUS" }}
        secondary={{ href: "/contato", label: "Solicitar apresentação institucional" }}
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
              title="Psicologia, fatores humanos, segurança operacional, educação, aviação e tecnologia em uma mesma arquitetura aplicada."
              description="Com trajetória acadêmica, operacional e institucional, Dr. Marcos Alcântara integra Psicologia, Fatores Humanos, Segurança Operacional, Educação, Aviação e Tecnologia para estruturar o HUMANEXUS como um ecossistema aplicado de Inteligência Regulatória Humana."
            />
            <div className="flex flex-col gap-4 sm:flex-row">
              <PrimaryButton href="http://lattes.cnpq.br/2740055296386524">Currículo Lattes</PrimaryButton>
              <SecondaryButton href="https://orcid.org/0000-0002-7610-6229">ORCID</SecondaryButton>
            </div>
            <GlassCard
              accent="gold"
              title="Base científica e experiência operacional"
              description="O HUMANEXUS nasce da integração entre ciência comportamental, fatores humanos, experiência operacional em aviação, investigação aeronáutica e tecnologia aplicada à performance humana. Sua arquitetura conceitual é sustentada pela Teoria da Inteligência Regulatória Humana, desenvolvida pelo Dr. Marcos Lázaro Pereira de Alcântara."
            />
          </div>
          <div className="grid gap-5">
            <div className="relative min-h-[360px] overflow-hidden rounded-[32px] border border-[#C9A34E]/22 bg-[#090909] shadow-gold">
              <Image src={brandAssets.media.eegOperatorHero} alt="Dr. Marcos aplicando EEG em operador real" fill className="object-cover" />
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
            eyebrow="Autoridade científica"
            title="Formação, experiência e credenciais que sustentam a TIRH e a operacionalização HUMANEXUS."
            description="Uma camada de legitimidade para contratos institucionais, aviação, segurança operacional e ambientes de elevada exigência."
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
