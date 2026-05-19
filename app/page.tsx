import Image from "next/image";
import { Reveal } from "@/components/reveal";
import { PremiumVideo } from "@/components/premium-video";
import { CardGrid, DashboardMock, GlassCard, PrimaryButton, SecondaryButton, SectionIntro } from "@/components/ui";
import { brandAssets } from "@/lib/brand-assets";

const authoritySignals = [
  "Psicólogo de Aviação",
  "21 anos de atuação",
  "Mestre e Doutor",
  "Forças Armadas e CRM"
];

const domains = [
  {
    title: "Aviação",
    description: "Programas institucionais para operadores aéreos, táxi aéreo, CRM, cultura de segurança e estabilidade decisória."
  },
  {
    title: "Operações Críticas",
    description: "Estruturas aplicadas para ambientes em que o erro humano compromete continuidade, reputação e missão."
  },
  {
    title: "Performance Cognitiva",
    description: "Leitura estratégica de estabilidade, pressão operacional e consistência humana sob exigência elevada."
  },
  {
    title: "CRM",
    description: "Coordenação, comunicação, consciência situacional e tomada de decisão em equipes de alta responsabilidade."
  },
  {
    title: "Segurança Operacional",
    description: "Apoio à maturidade institucional para tratar fatores humanos como parte da infraestrutura de segurança."
  },
  {
    title: "Liderança sob pressão",
    description: "Desenvolvimento de líderes capazes de sustentar clareza, disciplina e estabilidade em cenários críticos."
  },
  {
    title: "Inteligência Regulatória Humana",
    description: "Arquitetura conceitual proprietária aplicada ao desenvolvimento contínuo de pessoas, equipes e organizações."
  }
];

const systemLayers = [
  {
    title: "Leitura humana aplicada",
    description: "Biometria, observação operacional e indicadores executivos convertidos em leitura institucional útil."
  },
  {
    title: "Protocolos HUMANEXUS",
    description: "Estruturas proprietárias desenhadas para acompanhamento longitudinal, maturidade operacional e confidencialidade."
  },
  {
    title: "Decisão executiva",
    description: "Síntese premium para liderança, segurança operacional, desenvolvimento humano e gestão institucional."
  }
];

const authorityGallery = [
  {
    src: brandAssets.media.founderSeripaAuditorium,
    alt: "Dr. Marcos em auditório institucional",
    eyebrow: "Formação em campo",
    title: "Atuação direta com públicos operacionais de alta responsabilidade."
  },
  {
    src: brandAssets.media.founderAeteKeynote,
    alt: "Dr. Marcos ministrando keynote institucional",
    eyebrow: "Presença executiva",
    title: "Briefings e formação com linguagem compatível com ambientes críticos."
  },
  {
    src: brandAssets.media.founderHangarAircraft,
    alt: "Dr. Marcos em hangar de aeronave",
    eyebrow: "Aviação",
    title: "Autoridade aplicada a fatores humanos, CRM e segurança operacional."
  }
];

export default function HomePage() {
  return (
    <>
      <section className="hero-premium grain-overlay relative isolate overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(201,163,78,0.14),transparent_18%),radial-gradient(circle_at_82%_12%,rgba(34,88,148,0.14),transparent_20%),linear-gradient(180deg,rgba(3,3,5,0.72),rgba(3,3,5,0.94)_48%,rgba(3,3,5,1))]" />
        <div className="relative mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
          <div className="grid gap-12 xl:grid-cols-[0.88fr_1.12fr] xl:items-center">
            <Reveal>
              <div className="max-w-3xl space-y-8">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="rounded-full border border-[#C9A34E]/22 bg-[#0B0C10]/82 px-4 py-2 text-[10px] uppercase tracking-[0.32em] text-[#C9A34E]">
                    Instituto HUMANEXUS
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[10px] uppercase tracking-[0.28em] text-[#98A0AB]">
                    Programa contínuo
                  </div>
                </div>

                <div className="relative h-16 w-[290px] max-w-full sm:h-20 sm:w-[360px]">
                  <Image src={brandAssets.logoPremium} alt="HUMANEXUS" fill priority className="object-contain object-left" />
                </div>

                <div className="space-y-5">
                  <h1 className="max-w-4xl text-4xl font-semibold leading-[0.95] text-[#F5F5F5] md:text-6xl xl:text-[5rem]">
                    Inteligência operacional humana para ambientes de alta criticidade.
                  </h1>
                  <p className="max-w-2xl text-lg leading-8 text-[#A7ADB7] md:text-xl">
                    O HUMANEXUS desenvolve estabilidade humana, segurança operacional e performance sob pressão para
                    organizações que tratam o fator humano como infraestrutura estratégica.
                  </p>
                </div>

                <div className="grid max-w-3xl gap-3 sm:grid-cols-3">
                  {[
                    "Instituto de Inteligência Operacional Humana",
                    "Programas recorrentes para ambientes críticos",
                    "Arquitetura institucional de alto valor"
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-4 text-sm leading-6 text-[#D8DCE3]"
                    >
                      {item}
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-4 sm:flex-row">
                  <PrimaryButton href="/contato">Agendar Reunião Institucional</PrimaryButton>
                  <SecondaryButton href="https://wa.me/5592981187777">Falar com o Instituto</SecondaryButton>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.08}>
              <DashboardMock />
            </Reveal>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
          <Reveal>
            <div className="space-y-8">
              <SectionIntro
                eyebrow="Autoridade aplicada"
                title="Ciência, aviação, CRM e operações críticas em uma assinatura institucional única."
                description="Criado por Marcos Lázaro Pereira de Alcântara, o HUMANEXUS reúne formação acadêmica, experiência operacional e leitura estratégica do fator humano em uma estrutura desenhada para clientes de alta exigência."
              />
              <div className="grid gap-3 sm:grid-cols-2">
                {authoritySignals.map((item, index) => (
                  <GlassCard key={item} accent={index === 0 ? "gold" : "soft"} description={item} />
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="relative min-h-[560px] overflow-hidden rounded-[36px] border border-[#C9A34E]/16 bg-[#090909] shadow-[0_36px_120px_rgba(0,0,0,0.42)]">
              <Image
                src={brandAssets.media.founderExecutive}
                alt="Marcos Lázaro Pereira de Alcântara em retrato institucional"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,4,4,0.1),rgba(4,4,4,0.84))]" />
              <div className="absolute inset-x-6 bottom-6 rounded-[28px] border border-white/10 bg-[#050505]/70 p-5 backdrop-blur-xl">
                <p className="text-[10px] uppercase tracking-[0.34em] text-[#C9A34E]">Fundador e diretor científico</p>
                <p className="mt-3 text-2xl font-semibold text-[#F5F5F5]">Marcos Lázaro Pereira de Alcântara</p>
                <p className="mt-3 text-sm leading-7 text-[#A5ABB5]">
                  Psicólogo, Psicólogo de Aviação, Mestre e Doutor, com atuação em fatores humanos, liderança,
                  segurança operacional e desenvolvimento humano em ambientes críticos.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#06080d]">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <Reveal>
              <SectionIntro
                eyebrow="Áreas de atuação"
                title="Uma estrutura premium para organizações que operam sob pressão, risco e alta responsabilidade."
              description="O HUMANEXUS não se apresenta como fornecedor genérico. Ele opera como núcleo aplicado de desenvolvimento humano operacional."
              />
          </Reveal>
          <Reveal delay={0.08} className="mt-12">
            <CardGrid items={domains} columns="xl:grid-cols-4" />
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <Reveal>
            <div className="space-y-8">
              <SectionIntro
                eyebrow="HUMANEXUS System"
                title="Uma camada reservada de leitura operacional, acompanhamento longitudinal e inteligência aplicada."
                description="A tecnologia aparece como parte da estrutura, não como espetáculo. O valor está na conversão da complexidade humana em clareza institucional."
              />
              <div className="grid gap-4">
                {systemLayers.map((item, index) => (
                  <GlassCard key={item.title} accent={index === 0 ? "gold" : "soft"} title={item.title} description={item.description} />
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <PremiumVideo
              src={brandAssets.videos.heroInstitutional}
              poster={brandAssets.media.eegOperatorHero}
              eyebrow="Operação em campo"
              title="Presença real em formação, ambientes críticos e aplicação institucional."
              description="A dimensão visual do HUMANEXUS reforça autoridade, discrição tecnológica e maturidade operacional."
              className="min-h-[560px]"
              priority
            />
          </Reveal>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#05070b]">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <Reveal>
            <SectionIntro
              eyebrow="Provas de autoridade"
              title="Formação, briefing e presença institucional em contextos de alta exigência."
              description="As imagens funcionam como evidência de campo. Não como decoração."
            />
          </Reveal>
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {authorityGallery.map((item, index) => (
              <Reveal key={item.title} delay={index * 0.06}>
                <div className="relative min-h-[420px] overflow-hidden rounded-[32px] border border-white/10 bg-[#090909] shadow-panel">
                  <Image src={item.src} alt={item.alt} fill className="object-cover" />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.04),rgba(5,5,5,0.82))]" />
                  <div className="absolute inset-x-5 bottom-5 rounded-[24px] border border-white/10 bg-[#050505]/68 p-4 backdrop-blur-xl">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-[#C9A34E]">{item.eyebrow}</p>
                    <p className="mt-3 text-base leading-7 text-[#F5F5F5]">{item.title}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <Reveal>
          <div className="rounded-[36px] border border-[#C9A34E]/18 bg-[linear-gradient(180deg,rgba(10,12,16,0.96),rgba(7,8,10,0.96))] p-8 shadow-[0_28px_100px_rgba(201,163,78,0.08)] sm:p-10 lg:p-12">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
              <div className="space-y-4">
                <p className="text-[10px] uppercase tracking-[0.34em] text-[#C9A34E]">Fechamento institucional</p>
                <h2 className="max-w-4xl text-3xl font-semibold leading-tight text-[#F5F5F5] md:text-5xl">
                  O HUMANEXUS foi desenhado para organizações que não podem tratar o fator humano como variável secundária.
                </h2>
                <p className="max-w-2xl text-base leading-8 text-[#9EA3AE]">
                  contato@institutohumanexus.com
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <PrimaryButton href="/contato">Agendar Reunião Institucional</PrimaryButton>
                <SecondaryButton href="https://wa.me/5592981187777">Falar com o Instituto</SecondaryButton>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
