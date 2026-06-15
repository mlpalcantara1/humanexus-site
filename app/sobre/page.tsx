import Image from "next/image";
import { PremiumVideo } from "@/components/premium-video";
import { CardGrid, GlassCard, PageHero, SectionIntro } from "@/components/ui";
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
    description: "Instituto premium para organizações que tratam o fator humano como infraestrutura estratégica."
  }
];

const instituteSignals = [
  "Estrutura contínua para ambientes críticos",
  "Autoridade aplicada à aviação e fatores humanos",
  "Leitura operacional com linguagem executiva",
  "Programa institucional, não entrega pontual"
];

export default function SobrePage() {
  return (
    <>
      <PageHero
        eyebrow="Sobre o Instituto"
        title="Uma assinatura institucional criada para organizações que operam sob pressão."
        description="O HUMANEXUS reúne ciência aplicada, experiência operacional e leitura estratégica do fator humano em uma estrutura premium de desenvolvimento contínuo."
        primary={{ href: "/contato", label: "Agendar Reunião Institucional" }}
        media={{
          src: brandAssets.media.founderExecutive,
          alt: "Retrato institucional de Marcos Lázaro Pereira de Alcântara",
          badge: "Direção científica"
        }}
      />

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <CardGrid items={institutePillars} columns="lg:grid-cols-3" />
      </section>

      <section className="border-y border-white/10 bg-[#06080d]">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
            <PremiumVideo
              src={brandAssets.videos.instituteSignature}
              poster={brandAssets.media.founderAviationKeynote}
              eyebrow="Presença institucional"
              title="Rigor técnico, discrição visual e compatibilidade com decisão de alto nível."
              description="O HUMANEXUS foi desenhado para dialogar com presidência, segurança operacional, SGSO, RH e lideranças que tratam risco humano com seriedade."
              className="min-h-[540px]"
            />

            <div className="space-y-8">
              <SectionIntro
                eyebrow="Por que existe"
                title="Porque operações críticas não podem depender apenas de reação tardia."
                description="O Instituto organiza o desenvolvimento humano como camada estratégica da operação, com acompanhamento, leitura institucional e continuidade."
              />
              <div className="grid gap-4">
                {instituteSignals.map((item, index) => (
                  <GlassCard key={item} accent={index === 0 ? "gold" : "soft"} description={item} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="space-y-8">
            <SectionIntro
              eyebrow="Autoridade operacional"
              title="A trajetória acadêmica existe para sustentar operação, não para ocupar o centro da narrativa."
              description="A força institucional do HUMANEXUS está na convergência entre psicologia da aviação, fatores humanos, segurança operacional e desenvolvimento de pessoas em ambientes críticos."
            />
            <GlassCard accent="gold" description="Mais de duas décadas de atuação em comportamento humano, treinamento, liderança e segurança operacional." />
          </div>

          <div className="relative min-h-[520px] overflow-hidden rounded-[30px] border border-white/10 bg-[#090909] shadow-panel">
            <Image
              src={brandAssets.media.founderOperationalBriefing}
              alt="Marcos Alcântara em briefing operacional"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.06),rgba(5,5,5,0.84))]" />
          </div>
        </div>
      </section>
    </>
  );
}
