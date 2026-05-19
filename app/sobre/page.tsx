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

const authoritySignals = [
  "Psicólogo de Aviação",
  "Mestre e Doutor",
  "Formação em Fatores Humanos",
  "Experiência em Forças Armadas",
  "CRM e segurança operacional",
  "Programas para ambientes críticos"
];

export default function SobrePage() {
  return (
    <>
      <PageHero
        eyebrow="Sobre o Instituto"
        title="Um instituto desenhado para tratar o fator humano como capacidade estratégica."
        description="O HUMANEXUS integra ciência aplicada, experiência operacional e linguagem institucional de alto nível para organizações que operam sob pressão."
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
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div className="space-y-8">
              <SectionIntro
                eyebrow="Fundação institucional"
                title="O HUMANEXUS nasce da convergência entre aviação, fatores humanos, liderança e desenvolvimento contínuo."
                description="A assinatura do Instituto foi construída para dialogar com executivos, operadores, organizações críticas e ambientes em que segurança operacional e estabilidade humana precisam coexistir."
              />
              <div className="grid gap-3 sm:grid-cols-2">
                {authoritySignals.map((item, index) => (
                  <GlassCard key={item} accent={index === 0 ? "gold" : "soft"} description={item} />
                ))}
              </div>
            </div>

            <div className="relative min-h-[560px] overflow-hidden rounded-[34px] border border-white/10 bg-[#090909] shadow-panel">
              <Image
                src={brandAssets.media.founderAviationCeremony}
                alt="Marcos Lázaro Pereira de Alcântara em contexto institucional militar"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.04),rgba(5,5,5,0.82))]" />
              <div className="absolute inset-x-6 bottom-6 rounded-[26px] border border-white/10 bg-[#050505]/68 p-5 backdrop-blur-xl">
                <p className="text-[10px] uppercase tracking-[0.32em] text-[#C9A34E]">Autoridade aplicada</p>
                <p className="mt-3 text-base leading-7 text-[#E1E5EA]">
                  A presença institucional do Instituto é resultado de trajetória real em formação, operação, cultura de segurança e fatores humanos.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.04fr_0.96fr] lg:items-center">
          <PremiumVideo
            src={brandAssets.videos.instituteSignature}
            poster={brandAssets.media.founderStageBlue}
            eyebrow="Presença institucional"
            title="Uma assinatura visual e conceitual projetada para confiança executiva."
            description="O HUMANEXUS comunica sofisticação, rigor e discrição tecnológica sem se confundir com treinamento genérico ou oferta indiferenciada."
            className="min-h-[520px]"
          />
          <div className="space-y-8">
            <SectionIntro
              eyebrow="Por que existe"
              title="Porque ambientes críticos exigem mais do que conhecimento técnico isolado."
              description="O HUMANEXUS existe para organizar, desenvolver e sustentar a dimensão humana da operação com profundidade institucional, acompanhamento contínuo e linguagem compatível com decisão de alto nível."
            />
            <div className="grid gap-4">
              <GlassCard accent="gold" title="Modelo contínuo" description="Programas recorrentes, leitura longitudinal e evolução operacional humana." />
              <GlassCard title="Clientes de alta exigência" description="Organizações que operam com risco, pressão e responsabilidade elevada." />
              <GlassCard title="Posição de mercado" description="Instituto premium, reservado e difícil de replicar." />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
