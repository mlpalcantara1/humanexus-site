import Image from "next/image";
import { PremiumVideo } from "@/components/premium-video";
import { CardGrid, PageHero, SectionIntro } from "@/components/ui";
import { brandAssets } from "@/lib/brand-assets";

const trainingTracks = [
  {
    title: "Operações aéreas",
    description: "Formação para equipes, coordenação e responsabilidade decisória em ambientes em que o fator humano interfere diretamente na missão."
  },
  {
    title: "Fatores humanos avançados",
    description: "Capacitação institucional para atenção, adaptação, carga operacional, comunicação e estabilidade funcional."
  },
  {
    title: "Liderança operacional",
    description: "Desenvolvimento aplicado para quem precisa coordenar pessoas, risco e consequência sob pressão contínua."
  }
];

export default function FormacaoPage() {
  return (
    <>
      <PageHero
        eyebrow="Formação"
        title="Desenvolvimento aplicado para equipes que operam sob pressão e responsabilidade crítica."
        description="A formação HUMANEXUS foi estruturada como programa institucional de alto nível, voltado a operação, segurança e consistência humana."
        media={{
          src: brandAssets.media.founderAeteKeynote,
          alt: "Marcos Alcântara em evento institucional",
          badge: "Formação executiva"
        }}
      />

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.04fr_0.96fr] lg:items-center">
          <PremiumVideo
            src={brandAssets.videos.formationInstitutional}
            poster={brandAssets.media.formationInstitutionalPoster}
            eyebrow="Aplicação em campo"
            title="Presença real em ambientes de alta exigência."
            description="Treinamentos, desenvolvimento humano e fortalecimento da capacidade operacional para profissionais que atuam sob pressão e responsabilidade crítica."
            className="min-h-[540px]"
            priority
          />

          <div className="space-y-8">
            <SectionIntro
              eyebrow="Estrutura formativa"
              title="A formação entra como camada institucional de desenvolvimento. Não como entrega avulsa."
              description="Cada jornada é ajustada ao contexto operacional, ao nível de risco e à maturidade da organização."
            />
            <CardGrid items={trainingTracks} columns="lg:grid-cols-1" />
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#06080d]">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <SectionIntro
            eyebrow="Evidências de formação aplicada"
            title="Ambientes reais, público técnico e linguagem compatível com missão."
            description="A atuação formativa do HUMANEXUS foi construída para equipes que precisam responder com mais clareza, disciplina e estabilidade sob pressão."
          />
          <div className="mt-12 grid gap-5 lg:grid-cols-2">
            <div className="relative min-h-[440px] overflow-hidden rounded-[30px] border border-white/10 bg-[#090909] shadow-panel">
              <Image
                src={brandAssets.media.formationTrainingApplied}
                alt="Marcos Alcântara conduzindo formação aplicada"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.04),rgba(5,5,5,0.82))]" />
            </div>
            <div className="relative min-h-[440px] overflow-hidden rounded-[30px] border border-white/10 bg-[#090909] shadow-panel">
              <Image
                src={brandAssets.media.formationControlledEnvironment}
                alt="Ambiente controlado do HUMANEXUS com simulador operacional"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.04),rgba(5,5,5,0.82))]" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
