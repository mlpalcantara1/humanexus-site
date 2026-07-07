import type { Metadata } from "next";
import { Reveal } from "@/components/reveal";
import { GlassCard, PageHero, SectionIntro } from "@/components/ui";

export const metadata: Metadata = {
  title: "Pesquisa Aplicada",
  description:
    "Pesquisa aplicada com densidade institucional, reserva estratégica e foco em estabilidade humana para ambientes críticos."
};

const researchFrames = [
  {
    title: "Segurança operacional",
    description: "Base pública voltada ao fortalecimento da confiabilidade humana e da maturidade operacional."
  },
  {
    title: "Fatores humanos avançados",
    description: "Produção técnica aplicada a contextos em que resposta humana, coordenação e consequência caminham juntas."
  },
  {
    title: "Cognição operacional",
    description: "Apoio conceitual para cenários de sobrecarga, decisão sob pressão e alta exigência."
  },
  {
    title: "Riscos psicossociais",
    description: "Leitura institucional contínua para vulnerabilidades que afetam cultura, segurança e estabilidade."
  }
];

const publicPrinciples = [
  "Base técnica com reserva estratégica",
  "Pesquisa aplicada a ambientes críticos",
  "Comunicação executiva sem abrir mecanismo",
  "Diferenciação proprietária preservada"
];

export default function PesquisaPage() {
  return (
    <>
      <PageHero
        eyebrow="Pesquisa"
        title="Base técnica suficiente para gerar confiança. Reserva suficiente para preservar diferenciação."
        description="A pesquisa pública do HUMANEXUS foi organizada para demonstrar consistência e aplicabilidade institucional sem expor mecanismo interno."
      />

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.86fr_1.14fr] lg:items-start">
          <Reveal>
            <SectionIntro
              eyebrow="Campos públicos"
              title="O suficiente para transmitir densidade institucional. Não para ensinar o mecanismo."
              description="O HUMANEXUS comunica valor, consistência e maturidade técnica. O núcleo proprietário permanece fora da superfície pública."
            />
          </Reveal>

          <Reveal delay={0.08}>
            <div className="grid gap-5 md:grid-cols-2">
              {researchFrames.map((item, index) => (
                <GlassCard key={item.title} accent={index === 0 ? "gold" : "soft"} title={item.title} description={item.description} />
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#06080d]">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <Reveal>
            <SectionIntro
              eyebrow="Princípios públicos"
              title="Pesquisa aplicada com linguagem executiva, confidencialidade e aderência institucional."
              description="A camada pública da pesquisa foi desenhada para gerar confiança junto a organizações de alta responsabilidade."
            />
          </Reveal>

          <Reveal delay={0.08} className="mt-12">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {publicPrinciples.map((item, index) => (
                <GlassCard key={item} accent={index === 0 ? "gold" : "soft"} description={item} />
              ))}
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
