import type { Metadata } from "next";
import { Reveal } from "@/components/reveal";
import { PageHero, PrimaryButton, SectionIntro } from "@/components/ui";
import { brandAssets } from "@/lib/brand-assets";

export const metadata: Metadata = {
  title: "Programas HUMANEXUS",
  description:
    "Programas contínuos para desenvolvimento do fator humano, estabilidade operacional e evolução institucional.",
  alternates: {
    canonical: "/servicos"
  },
  openGraph: {
    url: "/servicos"
  }
};

const programs = [
  {
    title: "Programa HUMANEXUS de Desenvolvimento Humano Operacional",
    description:
      "Estrutura longitudinal para organizações que precisam fortalecer estabilidade humana, disciplina operacional e capacidade decisória."
  },
  {
    title: "Programa HUMANEXUS de Riscos Psicossociais e Estabilidade Operacional",
    description:
      "Frente contínua para apoiar ações relacionadas à prevenção, maturidade institucional e vulnerabilidades humanas em ambientes de alta exigência."
  },
  {
    title: "Programa para Aviação Operacional, Táxi Aéreo e Operações Aeromédicas",
    description:
      "Aplicação voltada a operações em que coordenação, resposta humana e segurança da missão caminham juntas."
  },
  {
    title: "Programa de Liderança sob Pressão",
    description:
      "Desenvolvimento direcionado a lideranças responsáveis por ambientes em que erro humano tem alto custo operacional e reputacional."
  },
  {
    title: "Pesquisa Aplicada e Desenvolvimento Institucional",
    description:
      "Base de apoio para organizações que precisam consolidar maturidade operacional, continuidade e visão estratégica sobre o fator humano."
  }
];

const segments = [
  "Táxi aéreo",
  "Operações aeromédicas",
  "Forças Armadas",
  "Segurança pública",
  "Saúde",
  "Energia e infraestrutura crítica"
];

export default function ServicosPage() {
  return (
    <>
      <PageHero
        eyebrow="Programas HUMANEXUS"
        title="Programas contínuos para organizações que operam sob exigência real."
        description="O HUMANEXUS não foi desenhado para entrega avulsa. Ele estrutura continuidade, desenvolvimento humano e visão institucional em ambientes críticos."
        media={{
          src: brandAssets.media.founderHangarSignature,
          alt: "Marcos Alcântara em hangar aeronáutico",
          badge: "Programa contínuo"
        }}
      />

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.84fr_1.16fr] lg:items-start">
          <Reveal>
            <SectionIntro
              eyebrow="Estruturas de desenvolvimento"
              title="Portfólio organizado para contrato recorrente, decisão executiva e evolução institucional."
              description="Cada frente foi desenhada para ambientes em que o fator humano não pode ser tratado como tema periférico."
            />
          </Reveal>

          <Reveal delay={0.08}>
            <div className="space-y-4">
              {programs.map((item, index) => (
                <div
                  key={item.title}
                  className={`rounded-[28px] border p-6 ${
                    index === 0
                      ? "border-[#D4AF37]/20 bg-[linear-gradient(180deg,rgba(212,175,55,0.08),rgba(255,255,255,0.015))]"
                      : "border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.025),rgba(255,255,255,0.01))]"
                  }`}
                >
                  <p className="text-sm font-semibold leading-7 text-[#F5F5F5]">{item.title}</p>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-[#9EA6B1]">{item.description}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#06080d]">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-center">
            <Reveal>
              <SectionIntro
                eyebrow="Segmentos atendidos"
                title="Aplicado a estruturas em que liderança, risco e consequência se encontram todos os dias."
                description="O programa foi organizado para organizações de alta confiabilidade, não para comunicação genérica de mercado."
              />
            </Reveal>

            <Reveal delay={0.08}>
              <div className="grid gap-3 sm:grid-cols-2">
                {segments.map((item) => (
                  <div
                    key={item}
                    className="rounded-full border border-white/10 bg-[#0B0D11]/82 px-4 py-3 text-center text-[11px] uppercase tracking-[0.2em] text-[#E2E6EC]"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.12} className="mt-12">
            <div className="flex justify-start">
              <PrimaryButton href="/contato">Fale Conosco</PrimaryButton>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
