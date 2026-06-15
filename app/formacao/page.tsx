import Image from "next/image";
import { PremiumVideo } from "@/components/premium-video";
import { CardGrid, GlassCard, PageHero, SectionIntro } from "@/components/ui";
import { brandAssets } from "@/lib/brand-assets";

const trainingTracks = [
  {
    title: "Operações aéreas",
    description: "Desenvolvimento de equipes, tripulantes e lideranças em contexto operacional de alta responsabilidade."
  },
  {
    title: "Fatores humanos avançados",
    description: "Capacitação institucional para atenção, decisão, adaptação, comunicação e confiabilidade operacional."
  },
  {
    title: "Liderança sob pressão",
    description: "Formação aplicada para ambientes em que a resposta humana interfere diretamente na missão."
  }
];

export default function FormacaoPage() {
  return (
    <>
      <PageHero
        eyebrow="Formação"
        title="Desenvolvimento humano para equipes que operam sob exigência real."
        description="A formação HUMANEXUS foi desenhada como programa institucional de alto nível, voltado a operação, disciplina e decisão sob pressão."
        primary={{ href: "/contato", label: "Agendar Reunião Institucional" }}
        media={{
          src: brandAssets.media.founderAeteKeynote,
          alt: "Marcos Alcântara ministrando formação institucional",
          badge: "Formação executiva"
        }}
      />

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
          <PremiumVideo
            src={brandAssets.videos.formationOperational}
            poster={brandAssets.media.founderBriefingStage}
            eyebrow="Aplicação em campo"
            title="Presença real em programas operacionais e ambientes de alta exigência."
            description="A formação é orientada por contexto, liderança, segurança operacional e consistência humana."
            className="min-h-[540px]"
            priority
          />
          <div className="space-y-8">
            <SectionIntro
              eyebrow="Estrutura formativa"
              title="Conteúdo aplicado para quem precisa decidir, coordenar e sustentar desempenho."
              description="O HUMANEXUS organiza a formação como camada de desenvolvimento institucional, não como curso genérico."
            />
            <div className="grid gap-4">
              <GlassCard accent="gold" title="Formato" description="Jornadas internas, capacitação sob demanda, workshops executivos e desenvolvimento de equipes críticas." />
              <GlassCard title="Foco" description="Segurança operacional, fatores humanos, estabilidade funcional, liderança e decisão sob pressão." />
              <GlassCard title="Aplicação" description="Aviação, operações críticas, segurança pública, saúde e ambientes corporativos de alta responsabilidade." />
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#06080d]">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <SectionIntro
            eyebrow="Atuação em campo"
            title="Formação conduzida com linguagem compatível com comando, operação e responsabilidade institucional."
            description="As imagens reforçam ambiente real, público técnico e autoridade aplicada."
          />
          <div className="mt-12 grid gap-5 lg:grid-cols-2">
            <div className="relative min-h-[420px] overflow-hidden rounded-[30px] border border-white/10 bg-[#090909] shadow-panel">
              <Image
                src={brandAssets.media.founderHangarAircraft}
                alt="Marcos Alcântara em hangar com aeronave"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.02),rgba(5,5,5,0.82))]" />
            </div>
            <div className="relative min-h-[420px] overflow-hidden rounded-[30px] border border-white/10 bg-[#090909] shadow-panel">
              <Image
                src={brandAssets.media.founderBriefingStageAlt}
                alt="Marcos Alcântara conduzindo formação institucional"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.02),rgba(5,5,5,0.82))]" />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <SectionIntro
          eyebrow="Trilhas"
          title="Programas compactos, contínuos e compatíveis com ambientes de missão."
          description="Cada trilha é ajustada ao nível de risco, maturidade institucional e responsabilidade da equipe."
        />
        <div className="mt-12">
          <CardGrid items={trainingTracks} columns="lg:grid-cols-3" />
        </div>
      </section>
    </>
  );
}
