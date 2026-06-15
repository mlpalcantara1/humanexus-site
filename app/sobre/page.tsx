import Image from "next/image";
import { PremiumVideo } from "@/components/premium-video";
import { GlassCard, PageHero, SectionIntro } from "@/components/ui";
import { brandAssets } from "@/lib/brand-assets";

const institutePillars = [
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
    description: "Estrutura premium para organizações que tratam o fator humano como camada estratégica da operação."
  }
];

const authoritySignals = [
  "Psicólogo de aviação",
  "Mestre e Doutor",
  "21 anos de atuação",
  "Pesquisa aplicada à resposta humana"
];

export default function SobrePage() {
  return (
    <>
      <PageHero
        eyebrow="Instituto HUMANEXUS"
        title="Uma estrutura criada para organizações que precisam de mais confiabilidade humana em contextos críticos."
        description="O HUMANEXUS combina presença institucional, desenvolvimento contínuo e visão executiva para fortalecer operações que não podem depender apenas de reação tardia."
        media={{
          src: brandAssets.media.instituteSpaceDesk,
          alt: "Estrutura física do Instituto HUMANEXUS",
          badge: "Estrutura própria"
        }}
      />

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-3">
          {institutePillars.map((item, index) => (
            <GlassCard key={item.title} accent={index === 0 ? "gold" : "soft"} title={item.title} description={item.description} />
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#06080d]">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
            <PremiumVideo
              src={brandAssets.videos.instituteSignature}
              poster={brandAssets.media.institutionalPortrait}
              eyebrow="Presença institucional"
              title="Uma identidade construída para dialogar com presidência, operação, segurança e liderança."
              description="O Instituto foi desenhado para apresentar densidade institucional, reserva estratégica e compatibilidade com decisão executiva."
              className="min-h-[540px]"
            />

            <div className="space-y-8">
              <SectionIntro
                eyebrow="Por que existe"
                title="Porque operações críticas exigem desenvolvimento humano contínuo, não ação pontual."
                description="O HUMANEXUS organiza desenvolvimento, continuidade e acompanhamento institucional do fator humano para ambientes de alta responsabilidade."
              />
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  "Instituto próprio",
                  "Confidencialidade operacional",
                  "Linguagem executiva",
                  "Acompanhamento longitudinal"
                ].map((item, index) => (
                  <GlassCard key={item} accent={index === 0 ? "gold" : "soft"} description={item} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.88fr_1.12fr] lg:items-center">
          <div className="space-y-8">
              <SectionIntro
                eyebrow="Autoridade aplicada"
                title="A formação acadêmica sustenta a operação. Não ocupa o centro da narrativa."
                description="Criado por Marcos Lázaro Pereira de Alcântara, o HUMANEXUS reúne psicologia da aviação, fatores humanos, segurança operacional e desenvolvimento institucional em uma atuação de longo curso."
              />
            <div className="grid gap-3 sm:grid-cols-2">
              {authoritySignals.map((item, index) => (
                <GlassCard key={item} accent={index === 0 ? "gold" : "soft"} description={item} />
              ))}
            </div>
          </div>

          <div className="relative min-h-[560px] overflow-hidden rounded-[30px] border border-white/10 bg-[#090909] shadow-panel">
            <Image
              src={brandAssets.media.founderExecutive}
              alt="Retrato institucional de Marcos Alcântara"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.08),rgba(5,5,5,0.82))]" />
          </div>
        </div>
      </section>
    </>
  );
}
