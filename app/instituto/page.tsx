import Image from "next/image";
import { CardGrid, GlassCard, PageHero, PrimaryButton, SectionIntro } from "@/components/ui";
import { brandAssets } from "@/lib/brand-assets";
import { authorityPoints, instituteValues } from "@/lib/site-data";

export default function InstitutoPage() {
  return (
    <>
      <PageHero
        eyebrow="Instituto"
        title="Instituto de performance operacional, inteligência regulatória humana e tecnologia aplicada."
        description="O HUMANEXUS é um instituto de performance operacional, inteligência regulatória humana e tecnologia aplicada ao desenvolvimento humano em ambientes de alta exigência."
        primary={{ href: "/contato", label: "Solicitar apresentação institucional" }}
        secondary={{ href: "/empresas", label: "Conhecer soluções" }}
      />
      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <GlassCard
            accent="gold"
            title="Propósito"
            description="Desenvolver estabilidade humana, inteligência regulatória e performance operacional sustentável em ambientes de alta exigência."
          />
          <GlassCard
            title="Missão"
            description="Desenvolver sistemas, protocolos e programas aplicados à performance operacional humana, integrando ciência, tecnologia e inteligência regulatória para potencializar adaptação, segurança, estabilidade e tomada de decisão em ambientes críticos."
          />
          <GlassCard
            title="Visão"
            description="Tornar-se referência nacional e internacional em inteligência regulatória humana, performance operacional e tecnologia aplicada ao desenvolvimento humano em ambientes de elevada exigência."
          />
          <GlassCard
            title="Posicionamento"
            description="Uma marca premium entre fatores humanos, neurotecnologia, simulação e leitura operacional aplicada."
          />
        </div>
      </section>
      <section className="border-y border-white/10 bg-[#080808]">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <SectionIntro
            eyebrow="Valores"
            title="Direção institucional orientada por rigor, segurança e inovação aplicada."
            description="Os valores estruturam a percepção de confiança, consistência técnica e alto valor."
          />
          <div className="mt-12">
            <CardGrid items={instituteValues} columns="lg:grid-cols-3" />
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <div>
            <SectionIntro
              eyebrow="Base científica e experiência operacional"
              title="A legitimidade do HUMANEXUS nasce da integração entre ciência comportamental, fatores humanos, experiência operacional em aviação, investigação aeronáutica e tecnologia aplicada à performance humana."
              description="Sua arquitetura conceitual é sustentada pela Teoria da Inteligência Regulatória Humana, desenvolvida pelo Dr. Marcos Lázaro Pereira de Alcântara."
            />
            <div className="mt-12">
              <CardGrid items={authorityPoints} columns="lg:grid-cols-2" />
            </div>
            <div className="mt-12">
              <PrimaryButton href="/fundador">Conhecer o fundador e diretor científico</PrimaryButton>
            </div>
          </div>
          <div className="relative min-h-[620px] overflow-hidden rounded-[34px] border border-[#C9A34E]/22 bg-[#090909] shadow-gold">
            <Image
              src={brandAssets.media.founderCenipa}
              alt="Dr. Marcos em contexto institucional ligado à investigação aeronáutica"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.18),rgba(5,5,5,0.78))]" />
            <div className="absolute inset-x-6 bottom-6 rounded-[24px] border border-white/10 bg-[#050505]/74 p-5">
              <p className="text-xs uppercase tracking-[0.28em] text-[#C9A34E]">Direção científica e operacional</p>
              <p className="mt-3 text-lg text-[#F5F5F5]">
                TIRH, fatores humanos, investigação aeronáutica e operacionalização aplicada em um mesmo ecossistema.
              </p>
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-6 pb-20 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <GlassCard
            title="Identidade institucional"
            description="Instituto premium de tecnologia operacional voltado à leitura, desenvolvimento e proteção da performance humana."
          />
          <GlassCard
            title="Diferenciais"
            description="Metodologia própria, leitura regulatória, simulação, biometria, relatórios executivos e linguagem B2B segura."
          />
          <GlassCard
            title="Ambiente de atuação"
            description="Aviação, segurança, medicina de alta demanda, liderança operacional, esporte e contextos críticos."
          />
        </div>
      </section>
    </>
  );
}
