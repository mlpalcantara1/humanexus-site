import type { Metadata } from "next";
import Image from "next/image";
import { Reveal } from "@/components/reveal";
import { GlassCard, PageHero, SectionIntro } from "@/components/ui";
import { brandAssets } from "@/lib/brand-assets";

export const metadata: Metadata = {
  title: "Teoria da Inteligência Regulatória Humana",
  description:
    "Apresentação institucional da base científica que sustenta o Instituto HUMANEXUS.",
  alternates: {
    canonical: "/pesquisa"
  },
  openGraph: {
    url: "/pesquisa"
  }
};

const theoryFrames = [
  {
    title: "Base científica",
    description: "Fundamentação conceitual própria para leitura da estabilidade humana em contextos de alta exigência."
  },
  {
    title: "Estabilidade humana",
    description: "Direção intelectual orientada à adaptação, à continuidade e à capacidade decisória sob pressão."
  },
  {
    title: "Ambientes operacionais",
    description: "Aplicação institucional em estruturas nas quais segurança, consequência e responsabilidade se encontram."
  },
  {
    title: "Desenvolvimento contínuo",
    description: "Referência científica para programas orientados a evolução humana e maturidade institucional."
  }
];

const theoryPrinciples = [
  "Fundamentação conceitual própria",
  "Segurança operacional e alta exigência",
  "Leitura institucional do fator humano",
  "Autoridade científica do Instituto"
];

export default function PesquisaPage() {
  return (
    <>
      <PageHero
        eyebrow="Teoria"
        title="A base científica que sustenta o Instituto HUMANEXUS."
        description="A Teoria da Inteligência Regulatória Humana organiza a direção conceitual do Instituto e orienta sua aplicação a ambientes operacionais de alta exigência."
      />

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.88fr_1.12fr] lg:items-center">
          <Reveal>
            <div className="relative overflow-hidden rounded-[32px] border border-[#D4AF37]/16 bg-[linear-gradient(180deg,rgba(212,175,55,0.08),rgba(255,255,255,0.012))] p-6 shadow-[0_28px_90px_rgba(0,0,0,0.3)]">
              <div className="relative mx-auto max-w-[360px] overflow-hidden rounded-[24px] border border-white/10 bg-[#050505] shadow-[0_30px_90px_rgba(0,0,0,0.34)]">
                <Image
                  src={brandAssets.media.bookTrhCover}
                  alt="Capa oficial do livro Teoria da Inteligência Regulatória Humana"
                  width={1200}
                  height={1697}
                  className="h-auto w-full object-cover"
                  priority
                />
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <SectionIntro
              eyebrow="Obra fundadora"
              title="Teoria da Inteligência Regulatória Humana"
              description="Obra que apresenta os fundamentos científicos da Teoria da Inteligência Regulatória Humana e sustenta a base conceitual do Instituto HUMANEXUS."
            />
          </Reveal>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#06080d]">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.86fr_1.14fr] lg:items-start">
            <Reveal>
              <SectionIntro
                eyebrow="Eixos conceituais"
                title="A teoria organiza a leitura institucional do fator humano com profundidade científica e linguagem executiva."
                description="O HUMANEXUS apresenta sua base conceitual em uma superfície pública compatível com autoridade, discrição e presença institucional."
              />
            </Reveal>

            <Reveal delay={0.08}>
              <div className="grid gap-5 md:grid-cols-2">
                {theoryFrames.map((item, index) => (
                  <GlassCard key={item.title} accent={index === 0 ? "gold" : "soft"} title={item.title} description={item.description} />
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div>
          <Reveal>
            <SectionIntro
              eyebrow="Presença institucional"
              title="A Teoria da Inteligência Regulatória Humana atua como principal ativo científico do Instituto."
              description="Ela sustenta o posicionamento público do HUMANEXUS e reforça sua legitimidade junto a organizações expostas a alta responsabilidade."
            />
          </Reveal>

          <Reveal delay={0.08} className="mt-12">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {theoryPrinciples.map((item, index) => (
                <GlassCard key={item} accent={index === 0 ? "gold" : "soft"} description={item} />
              ))}
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
