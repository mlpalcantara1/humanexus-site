import type { Metadata } from "next";
import { Reveal } from "@/components/reveal";
import { PremiumVideo } from "@/components/premium-video";
import { GlassCard, PageHero, SectionIntro } from "@/components/ui";
import { brandAssets } from "@/lib/brand-assets";

export const metadata: Metadata = {
  title: "Instituto",
  description:
    "Conheça o posicionamento institucional, a direção científica e a estrutura própria do Instituto HUMANEXUS.",
  alternates: {
    canonical: "/sobre"
  },
  openGraph: {
    url: "/sobre"
  }
};

const pillars = [
  {
    title: "Missão",
    description: "Desenvolver estabilidade humana, inteligência regulatória e capacidade decisória em ambientes de elevada exigência."
  },
  {
    title: "Visão",
    description: "Ser referência em Inteligência Regulatória Humana aplicada à segurança, à performance e ao desenvolvimento institucional."
  },
  {
    title: "Posicionamento",
    description: "Instituto voltado a organizações que tratam o fator humano como ativo estratégico de continuidade, liderança e segurança."
  }
];

const authoritySignals = [
  "Criador da Teoria da Inteligência Regulatória Humana",
  "Psicólogo de aviação",
  "Mestre e Doutor em Educação",
  "Forças Armadas e ambientes críticos"
];

export default function SobrePage() {
  return (
    <>
      <PageHero
        eyebrow="Instituto HUMANEXUS"
        title="O Instituto que apresenta a Teoria da Inteligência Regulatória Humana."
        description="O HUMANEXUS reúne direção científica, presença institucional e programas contínuos para organizações que operam sob responsabilidade, risco e consequência."
        media={{
          src: brandAssets.media.founderExecutive,
          alt: "Retrato institucional de Marcos Alcântara",
          badge: "Direção institucional"
        }}
      />

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-3">
          {pillars.map((item, index) => (
            <Reveal key={item.title} delay={index * 0.05}>
              <GlassCard accent={index === 0 ? "gold" : "soft"} title={item.title} description={item.description} />
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#06080d]">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
            <Reveal>
              <PremiumVideo
                src={brandAssets.videos.instituteSignature}
                poster={brandAssets.media.institutionalPortrait}
                eyebrow="Presença institucional"
                title="Uma identidade construída para dialogar com liderança, confiança e alta responsabilidade."
                description="O Instituto foi desenhado para expressar densidade institucional, clareza científica e relacionamento reservado com organizações de alta exigência."
                className="min-h-[560px]"
              />
            </Reveal>

            <Reveal delay={0.08}>
              <div className="space-y-8">
                <SectionIntro
                  eyebrow="Direção científica"
                  title="A base científica do Instituto nasce da Teoria da Inteligência Regulatória Humana."
                  description="Criado por Marcos Lázaro Pereira de Alcântara, o HUMANEXUS articula psicologia da aviação, fatores humanos e experiência aplicada a ambientes operacionais de alta responsabilidade."
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  {authoritySignals.map((item, index) => (
                    <GlassCard key={item} accent={index === 0 ? "gold" : "soft"} description={item} />
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
