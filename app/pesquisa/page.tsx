import { PremiumVideo } from "@/components/premium-video";
import { CardGrid, GlassCard, PageHero, SectionIntro } from "@/components/ui";
import { brandAssets } from "@/lib/brand-assets";

const researchFrames = [
  {
    title: "Inteligência Regulatória Humana",
    description: "Núcleo conceitual do Instituto, voltado à estabilidade funcional, adaptação sob pressão e capacidade decisória."
  },
  {
    title: "Fatores humanos",
    description: "Leitura institucional da interação entre pessoa, missão, pressão, contexto e desempenho."
  },
  {
    title: "Cognição operacional",
    description: "Aplicação da ciência ao comportamento humano em ambientes onde erro, fadiga e sobrecarga têm alto custo."
  },
  {
    title: "Riscos psicossociais",
    description: "Abordagem estratégica e contínua para vulnerabilidades invisíveis que afetam cultura, segurança e performance."
  }
];

const publicBoundaries = [
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
      />

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
          <div className="space-y-8">
            <SectionIntro
              eyebrow="Base conceitual"
              title="O HUMANEXUS mostra a base científica. Não entrega a fórmula."
              description="A pesquisa pública foi desenhada para posicionar o Instituto como avançado, sofisticado e difícil de replicar."
            />
            <div className="grid gap-3 sm:grid-cols-2">
              {publicBoundaries.map((item, index) => (
                <GlassCard key={item} accent={index === 0 ? "gold" : "soft"} description={item} />
              ))}
            </div>
          </div>
          <PremiumVideo
            src={brandAssets.videos.instituteSignature}
            poster={brandAssets.media.founderStageRoom}
            eyebrow="Pesquisa aplicada"
            title="Autoridade científica apresentada com visual executivo, não com excesso acadêmico."
            description="A comunicação pública sustenta reputação, confiança e valor institucional."
            className="min-h-[520px]"
          />
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
