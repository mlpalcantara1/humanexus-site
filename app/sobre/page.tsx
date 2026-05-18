import Image from "next/image";
import { PremiumVideo } from "@/components/premium-video";
import { CardGrid, GlassCard, PageHero, PrimaryButton, SecondaryButton, SectionIntro } from "@/components/ui";
import { brandAssets } from "@/lib/brand-assets";
import { authorityPoints, instituteValues } from "@/lib/site-data";

export default function SobrePage() {
  return (
    <>
      <PageHero
        eyebrow="Sobre o Instituto"
        title="Autoridade institucional, experiência operacional e ciência aplicada em uma mesma assinatura."
        description="O Instituto HUMANEXUS foi estruturado para posicionar fatores humanos, performance operacional e Inteligência Regulatória Humana em um padrão premium, estratégico, institucional e contínuo."
        primary={{ href: "/contato", label: "Agendar Reunião Institucional" }}
        secondary={{ href: "/pesquisa", label: "Conhecer a área de pesquisa" }}
        media={{
          src: brandAssets.media.founderCenipa,
          alt: "Dr. Marcos em contexto institucional",
          badge: "Autoridade institucional"
        }}
      />

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <GlassCard
            accent="gold"
            title="Missão"
            description="Integrar ciência aplicada, fatores humanos e tecnologia operacional para desenvolver estabilidade, segurança e performance humana em contextos de alta exigência."
          />
          <GlassCard
            title="Visão"
            description="Consolidar o HUMANEXUS como referência de elite em Inteligência Regulatória Humana, performance operacional e neurotecnologia aplicada."
          />
          <GlassCard
            title="Posicionamento"
            description="Instituto premium para líderes, operadores e organizações que tratam o fator humano como ativo estratégico e desenvolvimento contínuo."
          />
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#06080d]">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
            <div className="space-y-8">
              <SectionIntro
                eyebrow="Fundador"
                title="Dr. Marcos Lázaro Pereira de Alcântara"
                description="Psicólogo, Psicólogo de Aviação, Mestre e Doutor, com trajetória vinculada a fatores humanos, ambientes críticos e presença operacional. O HUMANEXUS nasce dessa convergência entre formação acadêmica, vivência institucional e visão estratégica."
              />
              <div className="grid gap-4 sm:grid-cols-2">
                {authorityPoints.slice(0, 8).map((item) => (
                  <GlassCard key={item.title} accent="gold" title={item.title} />
                ))}
              </div>
              <div className="flex flex-col gap-4 sm:flex-row">
                <PrimaryButton href="/fundador">Ver perfil completo</PrimaryButton>
                <SecondaryButton href="/contato">Iniciar Desenvolvimento Operacional</SecondaryButton>
              </div>
            </div>
            <div className="relative min-h-[560px] overflow-hidden rounded-[34px] border border-white/10 bg-[#090909] shadow-panel">
              <Image
                src={brandAssets.media.institutionalPortrait}
                alt="Retrato institucional do fundador"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.12),rgba(5,5,5,0.84))]" />
              <div className="absolute inset-x-6 bottom-6 rounded-[26px] border border-white/10 bg-[#050505]/68 p-5">
                <p className="text-xs uppercase tracking-[0.28em] text-[#C9A34E]">Liderança científica</p>
                <p className="mt-3 text-lg text-[#F5F5F5]">
                  Presença institucional sóbria, experiência operacional e linguagem compatível com ambientes de alta responsabilidade.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <PremiumVideo
            src={brandAssets.videos.instituteSignature}
            poster={brandAssets.media.tirhPresentation}
            eyebrow="Assinatura institucional"
            title="Presença visual premium para reforçar confiança, autoridade e sofisticação."
            description="O Instituto HUMANEXUS comunica ciência aplicada e maturidade operacional sem excesso de exposição técnica."
            className="min-h-[500px]"
          />
          <div className="space-y-8">
            <SectionIntro
              eyebrow="Valores"
              title="Excelência, segurança operacional e inovação aplicada como padrão de relacionamento institucional."
              description="Os valores do Instituto HUMANEXUS organizam confiança, ética, consistência técnica e performance sustentável em uma narrativa adequada a clientes de alto nível."
            />
            <CardGrid items={instituteValues} columns="lg:grid-cols-2" />
          </div>
        </div>
      </section>
    </>
  );
}
