import Image from "next/image";
import { PremiumVideo } from "@/components/premium-video";
import { CardGrid, GlassCard, PageHero, SectionIntro } from "@/components/ui";
import { brandAssets } from "@/lib/brand-assets";

const trainingTracks = [
  {
    title: "CRM e coordenação crítica",
    description: "Formação institucional para decisão, comunicação, consciência situacional e disciplina operacional."
  },
  {
    title: "Fatores humanos aplicados",
    description: "Capacitação para liderança, cultura de segurança e leitura de vulnerabilidades humanas."
  },
  {
    title: "Desenvolvimento sob demanda",
    description: "Programas modulados conforme contexto operacional, maturidade institucional e nível de exposição ao risco."
  }
];

export default function FormacaoPage() {
  return (
    <>
      <PageHero
        eyebrow="Formação"
        title="Formação premium para equipes, lideranças e organizações que operam sob pressão."
        description="A formação HUMANEXUS foi desenhada para parecer programa institucional de elite, não curso genérico."
        primary={{ href: "/contato", label: "Agendar Reunião Institucional" }}
        media={{
          src: brandAssets.media.founderStageBlue,
          alt: "Marcos Lázaro Pereira de Alcântara ministrando formação",
          badge: "Formação executiva"
        }}
      />

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
          <PremiumVideo
            src={brandAssets.videos.formationCrm}
            poster={brandAssets.media.founderCongressDownload}
            eyebrow="CRM e treinamento"
            title="Presença de campo, disciplina operacional e narrativa de alto padrão."
            description="A experiência visual da formação reforça seriedade, exigência e contexto real de aplicação."
            className="min-h-[540px]"
            priority
          />
          <div className="space-y-8">
            <SectionIntro
              eyebrow="Estrutura formativa"
              title="Conteúdo aplicado para equipes que precisam decidir, coordenar e sustentar performance."
              description="O HUMANEXUS estrutura a formação como ativo institucional. Não como produto de prateleira."
            />
            <div className="grid gap-4">
              <GlassCard accent="gold" title="Formato" description="Treinamentos sob demanda, jornadas internas, workshops executivos e formação de equipes críticas." />
              <GlassCard title="Foco" description="Fatores humanos, liderança, CRM, cultura operacional, estabilidade humana e decisão sob pressão." />
              <GlassCard title="Aplicação" description="Aviação, organizações críticas, ambientes táticos, saúde, educação corporativa e programas institucionais." />
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#06080d]">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <SectionIntro
            eyebrow="Atuação em campo"
            title="Formação com presença real em auditórios, programas operacionais e ambientes de alta exigência."
            description="As imagens reforçam autoridade aplicada, domínio de sala e contexto institucional concreto."
          />
          <div className="mt-12 grid gap-5 lg:grid-cols-2">
            <div className="relative min-h-[420px] overflow-hidden rounded-[32px] border border-white/10 bg-[#090909] shadow-panel">
              <Image
                src={brandAssets.media.founderSeripaAuditorium}
                alt="Marcos Lázaro Pereira de Alcântara em auditório institucional"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.04),rgba(5,5,5,0.8))]" />
            </div>
            <div className="relative min-h-[420px] overflow-hidden rounded-[32px] border border-white/10 bg-[#090909] shadow-panel">
              <Image
                src={brandAssets.media.founderAeteKeynote}
                alt="Marcos Lázaro Pereira de Alcântara em keynote institucional"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.04),rgba(5,5,5,0.8))]" />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <SectionIntro
          eyebrow="Trilhas"
          title="Programas compactos, recorrentes e compatíveis com ambientes de alta responsabilidade."
          description="A formação é organizada para gerar maturidade, não apenas exposição pontual a conteúdo."
        />
        <div className="mt-12">
          <CardGrid items={trainingTracks} columns="lg:grid-cols-3" />
        </div>
      </section>
    </>
  );
}
