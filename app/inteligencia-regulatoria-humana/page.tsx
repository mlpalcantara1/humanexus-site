import Image from "next/image";
import { CardGrid, GlassCard, PageHero, PrimaryButton, SectionIntro } from "@/components/ui";
import { brandAssets, theoryFlow } from "@/lib/brand-assets";
import { irhSections } from "@/lib/site-data";

export default function InteligenciaRegulatoriaPage() {
  return (
    <>
      <PageHero
        eyebrow="Teoria da Inteligência Regulatória Humana"
        title="A espinha dorsal científica do HUMANEXUS."
        description="A Teoria da Inteligência Regulatória Humana organiza estabilidade funcional, adaptação sob pressão, vetores humanos, consciência situacional, degradação adaptativa e tomada de decisão em ambientes críticos."
        primary={{ href: "/contato", label: "Solicitar apresentação institucional" }}
        secondary={{ href: "/aviation", label: "Ver aplicações operacionais" }}
      />

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
          <div className="space-y-8">
            <SectionIntro
              eyebrow="Fundamento proprietário"
              title="O HUMANEXUS existe para operacionalizar a teoria, não para competir com ela."
              description="Criada pelo Dr. Marcos Lázaro Pereira de Alcântara, a TIRH sustenta a leitura regulatória humana, a modelagem vetorial, a análise de estabilidade adaptativa e a organização de tecnologia aplicada à performance operacional."
            />
            <div className="grid gap-4">
              {[
                "Inteligência regulatória como capacidade de manter estabilidade funcional diante de pressão, risco e complexidade.",
                "Vetores humanos como estruturas aplicadas à leitura de foco, recuperação, carga, decisão e adaptação.",
                "Estabilidade cognitiva e consciência situacional como variáveis críticas para segurança operacional e performance sustentável."
              ].map((item) => (
                <GlassCard key={item} accent="gold" description={item} />
              ))}
            </div>
          </div>

          <div className="grid gap-5">
            <div className="relative min-h-[360px] overflow-hidden rounded-[32px] border border-[#C9A34E]/22 bg-[#090909] shadow-gold">
              <Image
                src={brandAssets.media.tirhPresentation}
                alt="Apresentação institucional da TIRH"
                fill
                className="object-cover object-top"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.16),rgba(5,5,5,0.74))]" />
              <div className="absolute inset-x-6 bottom-6 rounded-[24px] border border-white/10 bg-[#050505]/74 p-5">
                <p className="text-xs uppercase tracking-[0.28em] text-[#C9A34E]">Leitura regulatória humana</p>
                <p className="mt-3 text-xl font-semibold text-[#F5F5F5]">
                  A teoria sustenta a passagem da observação humana para a modelagem operacional aplicada.
                </p>
              </div>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <div className="relative min-h-[220px] overflow-hidden rounded-[30px] border border-white/10 bg-[#090909]">
                <Image src={brandAssets.media.institutionalPortrait} alt="Dr. Marcos Lázaro Pereira de Alcântara" fill className="object-cover" />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.10),rgba(5,5,5,0.74))]" />
              </div>
              <GlassCard
                title="Da teoria à tecnologia aplicada"
                description="EEG, HRV, cockpit, dashboards, leitura regulatória, indicadores operacionais humanos e protocolos existem para ampliar a capacidade de análise regulatória humana, não para substituí-la."
              />
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#080808]">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <SectionIntro
            eyebrow="Estrutura conceitual"
            title="A TIRH organiza o HUMANEXUS em quatro níveis claros."
            description="Teoria, operacionalização, aplicações e tecnologia aplicada compõem a lógica institucional e científica do ecossistema."
          />
          <div className="mt-12 grid gap-5 lg:grid-cols-4">
            {theoryFlow.map((item, index) => (
              <GlassCard
                key={item.title}
                accent={index === 0 ? "gold" : "soft"}
                title={`${item.step} — ${item.title}`}
                description={item.description}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <SectionIntro
          eyebrow="Elementos centrais"
          title="Estabilidade regulatória, adaptação sob pressão e modelagem vetorial humana."
          description="A página organiza o núcleo teórico em linguagem científica, premium, operacional e institucional."
        />
        <div className="mt-12">
          <CardGrid items={irhSections} />
        </div>
      </section>

      <section className="border-y border-white/10 bg-mesh-dark">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <SectionIntro
              eyebrow="Aplicação em ambientes críticos"
              title="A teoria encontra utilidade quando fortalece estabilidade funcional, decisão e performance sustentável."
              description="Aviação, táxi aéreo, segurança pública, medicina de alta demanda, esporte de alta performance e ambientes corporativos podem se beneficiar de leitura regulatória humana e tecnologia aplicada."
            />
            <div className="relative min-h-[360px] overflow-hidden rounded-[32px] border border-white/10 bg-[#090909]">
              <Image src={brandAssets.media.hangarOperations} alt="Aplicação operacional em ambiente aeronáutico" fill className="object-cover" />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.12),rgba(5,5,5,0.72))]" />
              <div className="absolute inset-x-6 bottom-6 rounded-[24px] border border-white/10 bg-[#050505]/72 p-5 text-sm text-[#B8B8B8]">
                A TIRH não é abstrata. Ela ganha valor quando é operacionalizada com contexto, leitura humana e tecnologia aplicada.
              </div>
            </div>
          </div>
          <div className="mt-12">
            <PrimaryButton href="/contato">Agendar conversa estratégica</PrimaryButton>
          </div>
        </div>
      </section>
    </>
  );
}
