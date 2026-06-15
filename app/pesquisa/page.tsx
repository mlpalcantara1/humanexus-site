import Image from "next/image";
import { CardGrid, GlassCard, PageHero, SectionIntro } from "@/components/ui";
import { brandAssets } from "@/lib/brand-assets";

const researchFrames = [
  {
    title: "Inteligência Regulatória Humana",
    description: "Base conceitual do Instituto voltada à estabilidade funcional, adaptação sob pressão e capacidade decisória."
  },
  {
    title: "Fatores humanos",
    description: "Leitura institucional da interação entre pessoa, contexto, missão, pressão e desempenho."
  },
  {
    title: "Cognição operacional",
    description: "Aplicação da ciência ao comportamento humano em ambientes onde erro, fadiga e sobrecarga têm alto custo."
  },
  {
    title: "Riscos psicossociais",
    description: "Abordagem estratégica e contínua para vulnerabilidades que afetam cultura, segurança e performance."
  }
];

const boundaries = [
  "Arquitetura conceitual proprietária",
  "Método próprio com confidencialidade operacional",
  "Pesquisa aplicada com valor institucional",
  "Tecnologia mostrada com discrição"
];

export default function PesquisaPage() {
  return (
    <>
      <PageHero
        eyebrow="Pesquisa"
        title="Ciência aplicada apresentada com densidade institucional e reserva estratégica."
        description="A área de pesquisa do HUMANEXUS comunica profundidade suficiente para gerar confiança, sem expor a engenharia interna do método."
        primary={{ href: "/contato", label: "Agendar Reunião Institucional" }}
        media={{
          src: brandAssets.media.founderBriefingStageAlt,
          alt: "Marcos Alcântara em apresentação institucional de pesquisa aplicada",
          badge: "Pesquisa aplicada"
        }}
      />

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="space-y-8">
            <SectionIntro
              eyebrow="Base conceitual"
              title="O HUMANEXUS apresenta profundidade. Não entrega a fórmula."
              description="A pesquisa pública foi organizada para sustentar reputação, confiança e diferenciação institucional."
            />
            <div className="grid gap-3 sm:grid-cols-2">
              {boundaries.map((item, index) => (
                <GlassCard key={item} accent={index === 0 ? "gold" : "soft"} description={item} />
              ))}
            </div>
          </div>

          <div className="relative min-h-[520px] overflow-hidden rounded-[30px] border border-white/10 bg-[#090909] shadow-panel">
            <Image
              src={brandAssets.media.founderStageRoom}
              alt="Marcos Alcântara em apresentação institucional"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.05),rgba(5,5,5,0.82))]" />
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#06080d]">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <SectionIntro
            eyebrow="Campos de investigação"
            title="Pesquisa aplicada à estabilidade humana, cultura operacional e decisão sob pressão."
            description="Os conceitos são apresentados com clareza suficiente para decisores, sem abrir modelagens sensíveis."
          />
          <div className="mt-12">
            <CardGrid items={researchFrames} columns="xl:grid-cols-4" />
          </div>
        </div>
      </section>
    </>
  );
}
