import type { Metadata } from "next";
import Image from "next/image";
import { Reveal } from "@/components/reveal";
import { PremiumVideo } from "@/components/premium-video";
import { PageHero, SectionIntro } from "@/components/ui";
import { brandAssets } from "@/lib/brand-assets";

export const metadata: Metadata = {
  title: "Formação Aplicada",
  description:
    "Formação institucional para equipes que operam sob pressão, responsabilidade crítica e necessidade de maior confiabilidade humana."
};

const formationTracks = [
  {
    title: "Aviação operacional",
    description: "Desenvolvimento aplicado para equipes em que resposta humana, coordenação e disciplina afetam a missão."
  },
  {
    title: "Fatores humanos avançados",
    description: "Capacitação institucional voltada a estabilidade funcional, comunicação e tomada de decisão sob pressão."
  },
  {
    title: "Liderança operacional",
    description: "Formação dirigida a quem coordena pessoas, risco e consequência em ambientes de elevada exigência."
  }
];

export default function FormacaoPage() {
  return (
    <>
      <PageHero
        eyebrow="Formação"
        title="Desenvolvimento aplicado para equipes que operam com responsabilidade crítica."
        description="A formação HUMANEXUS foi estruturada como programa institucional de alto nível, com linguagem compatível com missão, disciplina e continuidade."
        media={{
          src: brandAssets.media.founderTrainingSignature,
          alt: "Marcos Alcântara conduzindo treinamento operacional",
          badge: "Formação aplicada"
        }}
      />

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.04fr_0.96fr] lg:items-center">
          <Reveal>
            <PremiumVideo
              src={brandAssets.videos.formationInstitutional}
              poster={brandAssets.media.formationInstitutionalPoster}
              eyebrow="Presença em campo"
              title="Formação para públicos técnicos e ambientes de alta exigência."
              description="Desenvolvimento humano aplicado para organizações que precisam fortalecer clareza, disciplina e resposta sob pressão."
              className="min-h-[560px]"
              priority
            />
          </Reveal>

          <Reveal delay={0.08}>
            <div className="space-y-8">
              <SectionIntro
                eyebrow="Estrutura formativa"
                title="A formação entra como camada institucional de desenvolvimento, não como aula isolada."
                description="Cada jornada é ajustada ao contexto operacional, ao nível de responsabilidade e à maturidade da organização."
              />
              <div className="space-y-4">
                {formationTracks.map((item, index) => (
                  <div
                    key={item.title}
                    className={`rounded-[26px] border p-5 ${
                      index === 0
                        ? "border-[#D4AF37]/20 bg-[linear-gradient(180deg,rgba(212,175,55,0.08),rgba(255,255,255,0.015))]"
                        : "border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.025),rgba(255,255,255,0.01))]"
                    }`}
                  >
                    <p className="text-sm font-semibold leading-7 text-[#F5F5F5]">{item.title}</p>
                    <p className="mt-3 text-sm leading-7 text-[#9EA6B1]">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#06080d]">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.84fr_1.16fr] lg:items-center">
            <Reveal>
              <SectionIntro
                eyebrow="Ambiente supervisionado"
                title="Estrutura física preparada para desenvolvimento aplicado, acompanhamento e trabalho em ambiente controlado."
                description="O Instituto mantém espaço próprio para jornadas supervisionadas e relacionamento institucional com alto padrão de apresentação."
              />
            </Reveal>

            <Reveal delay={0.08}>
              <div className="relative min-h-[500px] overflow-hidden rounded-[30px] border border-white/10 bg-[#090909] shadow-panel">
                <Image
                  src={brandAssets.media.formationControlledEnvironment}
                  alt="Ambiente supervisionado do Instituto HUMANEXUS"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.04),rgba(5,5,5,0.82))]" />
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
