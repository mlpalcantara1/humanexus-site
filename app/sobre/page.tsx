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
    description: "Desenvolver estabilidade humana, inteligência operacional e capacidade decisória em ambientes de elevada exigência."
  },
  {
    title: "Visão",
    description: "Ser referência em inteligência operacional humana aplicada à segurança, performance e desenvolvimento institucional."
  },
  {
    title: "Posicionamento",
    description: "Instituto voltado a organizações que tratam o fator humano como camada estratégica da operação."
  }
];

const authoritySignals = [
  "Psicólogo de aviação",
  "Mestre e Doutor em Educação",
  "21 anos de atuação profissional",
  "Atuação em ambientes críticos"
];

export default function SobrePage() {
  return (
    <>
      <PageHero
        eyebrow="Instituto HUMANEXUS"
        title="Uma estrutura criada para ambientes em que confiança operacional não pode ser improvisada."
        description="O HUMANEXUS organiza desenvolvimento humano, presença institucional e linguagem executiva para organizações que precisam operar com mais estabilidade sob pressão."
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
                title="Uma identidade construída para dialogar com liderança, operação e segurança."
                description="O Instituto foi desenhado para transmitir reserva estratégica, densidade institucional e alto padrão de relacionamento."
                className="min-h-[560px]"
              />
            </Reveal>

            <Reveal delay={0.08}>
              <div className="space-y-8">
                <SectionIntro
                  eyebrow="Direção científica"
                  title="Autoridade técnica apresentada com sobriedade, não como currículo inflado."
                  description="Criado por Marcos Lázaro Pereira de Alcântara, o HUMANEXUS reúne psicologia da aviação, fatores humanos, desenvolvimento institucional e experiência aplicada a operações de alta responsabilidade."
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
