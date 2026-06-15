import Image from "next/image";
import { CardGrid, GlassCard, PageHero, SectionIntro } from "@/components/ui";
import { brandAssets } from "@/lib/brand-assets";

const researchFrames = [
  {
    title: "Segurança operacional",
    description: "Estudos aplicados para fortalecer confiabilidade humana, disciplina institucional e maturidade operacional."
  },
  {
    title: "Fatores humanos avançados",
    description: "Produção técnica voltada a contextos em que resposta humana, coordenação e consequência caminham juntas."
  },
  {
    title: "Cognição operacional",
    description: "Base aplicada para apoiar organizações em cenários de sobrecarga, decisão sob pressão e alta exigência."
  },
  {
    title: "Riscos psicossociais",
    description: "Abordagem contínua para vulnerabilidades que afetam cultura, segurança e performance sustentável."
  }
];

export default function PesquisaPage() {
  return (
    <>
      <PageHero
        eyebrow="Pesquisa"
        title="Base técnica com densidade institucional e reserva estratégica."
        description="A pesquisa pública do HUMANEXUS foi organizada para demonstrar consistência, sem expor mecanismo, lógica interna ou ativos proprietários."
        media={{
          src: brandAssets.media.founderAviationKeynote,
          alt: "Apresentação institucional do HUMANEXUS",
          badge: "Pesquisa aplicada"
        }}
      />

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="space-y-8">
              <SectionIntro
                eyebrow="Base conceitual"
                title="Conhecimento suficiente para gerar confiança. Reserva suficiente para preservar diferenciação."
                description="O HUMANEXUS comunica consistência, experiência e aplicabilidade com clareza executiva, sem abrir modelagens sensíveis ou estruturas proprietárias."
              />
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  "Base institucional reservada",
                  "Pesquisa aplicada a operações críticas",
                  "Produção técnica com discrição",
                  "Valor institucional preservado"
                ].map((item, index) => (
                  <GlassCard key={item} accent={index === 0 ? "gold" : "soft"} description={item} />
              ))}
            </div>
          </div>

          <div className="relative min-h-[560px] overflow-hidden rounded-[30px] border border-white/10 bg-[#090909] shadow-panel">
            <Image
              src={brandAssets.media.founderHangarCommand}
              alt="Contexto operacional do HUMANEXUS em ambiente crítico"
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
            description="Os campos abaixo representam a camada pública da pesquisa. O núcleo proprietário permanece preservado."
          />
          <div className="mt-12">
            <CardGrid items={researchFrames} columns="xl:grid-cols-4" />
          </div>
        </div>
      </section>
    </>
  );
}
