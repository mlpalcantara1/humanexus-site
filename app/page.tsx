import Image from "next/image";
import { Reveal } from "@/components/reveal";
import { PremiumVideo } from "@/components/premium-video";
import { CardGrid, DashboardMock, GlassCard, PrimaryButton, SectionIntro, SecondaryButton } from "@/components/ui";
import { brandAssets } from "@/lib/brand-assets";

const heroBadges = [
  "SEGURANÇA OPERACIONAL",
  "FATORES HUMANOS",
  "ESTRUTURA PROPRIETÁRIA",
  "PROGRAMA CONTÍNUO",
  "INTELIGÊNCIA OPERACIONAL",
  "OPERAÇÕES CRÍTICAS"
];

const authoritySignals = [
  "Psicólogo de aviação",
  "21 anos de atuação",
  "Forças Armadas e ambientes críticos",
  "Pesquisa aplicada ao fator humano"
];

const operatingAreas = [
  {
    title: "Aviação operacional",
    description: "Operadores aéreos, táxi aéreo, operações aeromédicas e equipes em que a resposta humana interfere diretamente na missão."
  },
  {
    title: "Operações críticas",
    description: "Ambientes em que carga decisória, comunicação, coordenação e disciplina operacional precisam de maior confiabilidade humana."
  },
  {
    title: "Segurança operacional",
    description: "Leitura institucional para apoiar maturidade operacional, prevenção, cultura de segurança e tomada de decisão."
  },
  {
    title: "Performance cognitiva",
    description: "Estabilidade funcional, atenção, pressão, adaptação e capacidade decisória em contextos de alta exigência."
  },
  {
    title: "Liderança sob pressão",
    description: "Desenvolvimento de lideranças responsáveis por ambientes em que risco, tempo e consequência caminham juntos."
  },
  {
    title: "Gestão de fatores humanos",
    description: "Apoio institucional para fortalecer cultura operacional, coordenação entre equipes e maior confiabilidade humana."
  },
  {
    title: "Desenvolvimento institucional",
    description: "Programas contínuos para organizações que tratam estabilidade humana e segurança operacional como ativos estratégicos."
  }
];

const deliverables = [
  {
    title: "Segurança Operacional",
    description: "Fortalecimento da capacidade humana em ambientes de alta responsabilidade."
  },
  {
    title: "Desenvolvimento Contínuo",
    description: "Programas estruturados para evolução individual e institucional."
  },
  {
    title: "Riscos Psicossociais",
    description: "Apoio às iniciativas relacionadas à NR-1 e NR-17."
  },
  {
    title: "Tomada de Decisão",
    description: "Informações relevantes para acompanhamento institucional."
  },
  {
    title: "Treinamento Aplicado",
    description: "Desenvolvimento supervisionado para contextos operacionais complexos."
  },
  {
    title: "Acompanhamento Longitudinal",
    description: "Monitoramento contínuo da evolução organizacional."
  }
];

const evidenceCards = [
  {
    src: brandAssets.media.founderHangarElite,
    alt: "Marcos Alcântara em hangar aeronáutico",
    title: "Aviação e autoridade operacional",
    description: "Experiência real em ambientes onde a disciplina humana, a coordenação e o risco fazem parte da rotina."
  },
  {
    src: brandAssets.media.founderSeripaLecture,
    alt: "Marcos Alcântara conduzindo treinamento em auditório operacional",
    title: "Treinamento aplicado",
    description: "Formação conduzida para públicos operacionais de alta responsabilidade, com linguagem compatível com comando e missão."
  },
  {
    src: brandAssets.media.instituteSpaceWide,
    alt: "Estrutura física do Instituto HUMANEXUS",
    title: "Instituto HUMANEXUS",
    description: "Ambiente preparado para leitura humana, atendimento executivo e desenvolvimento contínuo com identidade própria."
  },
  {
    src: brandAssets.media.cockpitSimulator,
    alt: "Cockpit e ambiente de simulação HUMANEXUS",
    title: "Ambiente controlado",
    description: "Estrutura preparada para desenvolvimento supervisionado em contextos que exigem disciplina, resposta e confiabilidade."
  }
];

export default function HomePage() {
  return (
    <>
      <section className="hero-premium grain-overlay relative isolate overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_12%,rgba(212,175,55,0.14),transparent_24%),radial-gradient(circle_at_86%_16%,rgba(31,78,138,0.16),transparent_24%),linear-gradient(180deg,rgba(4,4,6,0.88),rgba(4,4,6,0.98)_58%,rgba(4,4,6,1))]" />
        <div className="relative mx-auto max-w-7xl px-6 py-14 lg:px-8 lg:py-20">
          <div className="grid gap-10 xl:grid-cols-[0.78fr_1.22fr] xl:items-center">
            <Reveal>
              <div className="max-w-3xl space-y-8">
                <div className="relative h-16 w-[250px] sm:h-20 sm:w-[320px]">
                  <Image src={brandAssets.logoPremium} alt="HUMANEXUS" fill priority className="object-contain object-left" />
                </div>

                <div className="space-y-5">
                  <p className="text-[10px] uppercase tracking-[0.42em] text-[#D4AF37]">Instituto de Inteligência Operacional Humana</p>
                  <h1 className="max-w-4xl text-[3rem] font-semibold leading-[0.92] text-[#F5F5F5] sm:text-5xl md:text-6xl xl:text-[5.1rem]">
                    Inteligência operacional humana para ambientes de alta criticidade.
                  </h1>
                  <p className="max-w-2xl text-lg leading-8 text-[#A7ADB7] md:text-xl">
                    O HUMANEXUS apoia organizações que precisam reduzir vulnerabilidades humanas, fortalecer liderança e sustentar segurança operacional sob pressão.
                  </p>
                </div>

                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {heroBadges.map((badge) => (
                    <div
                      key={badge}
                      className="rounded-full border border-[#D4AF37]/18 bg-[#0B0D10]/82 px-4 py-2 text-[10px] uppercase tracking-[0.28em] text-[#D4AF37]"
                    >
                      {badge}
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-4 sm:flex-row">
                  <PrimaryButton href="/contato">Agendar Reunião Institucional</PrimaryButton>
                  <SecondaryButton href="/servicos">Conhecer o Programa</SecondaryButton>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.08}>
              <PremiumVideo
                src={brandAssets.videos.institutionalHero}
                poster={brandAssets.media.instituteSpaceFront}
                className="min-h-[520px]"
                priority
              />
            </Reveal>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {authoritySignals.map((signal, index) => (
            <Reveal key={signal} delay={index * 0.05}>
              <GlassCard accent={index === 0 ? "gold" : "soft"} description={signal} />
            </Reveal>
          ))}
        </div>
      </section>

      <section id="areas" className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.86fr_1.14fr] lg:items-start">
          <Reveal>
            <SectionIntro
              eyebrow="Áreas de atuação"
              title="O fator humano tratado como infraestrutura estratégica da operação."
              description="O HUMANEXUS opera onde a estabilidade humana, a segurança operacional e a capacidade decisória exigem estrutura contínua, não resposta improvisada."
            />
          </Reveal>
          <Reveal delay={0.08}>
            <CardGrid items={operatingAreas} columns="xl:grid-cols-2" />
          </Reveal>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#06080d]">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <Reveal>
            <SectionIntro
              eyebrow="O que o HUMANEXUS entrega"
              title="Entregas institucionais desenhadas para ambientes em que o fator humano tem impacto direto no risco."
              description="Valor entregue com linguagem executiva, continuidade de programa e confidencialidade operacional preservada."
            />
          </Reveal>
          <Reveal delay={0.08} className="mt-12">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {deliverables.map((step) => (
                <div
                  key={step.title}
                  className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.012))] p-5"
                >
                  <p className="text-[10px] uppercase tracking-[0.34em] text-[#D4AF37]">{step.title}</p>
                  <p className="mt-4 text-sm leading-7 text-[#B5BBC4]">{step.description}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section id="plataforma" className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <Reveal>
          <SectionIntro
            eyebrow="Visão executiva"
            title="Acompanhamento institucional organizado para decisão, continuidade e desenvolvimento."
            description="O HUMANEXUS traduz valor operacional em linguagem compatível com liderança, gestão de risco e acompanhamento estratégico."
          />
        </Reveal>
        <Reveal delay={0.08} className="mt-12">
          <DashboardMock />
        </Reveal>
      </section>

      <section id="autoridade" className="border-y border-white/10 bg-[#06080d]">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <Reveal>
            <SectionIntro
              eyebrow="Evidências de experiência aplicada"
              title="Aviação, treinamento, estrutura própria e presença institucional mostrados com reserva."
              description="Cada bloco abaixo representa frentes reais de atuação, sem banco de imagens, sem narrativa artificial e sem exposição de mecanismo interno."
            />
          </Reveal>

          <div className="mt-12 grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
            {evidenceCards.map((item, index) => (
              <Reveal key={item.title} delay={index * 0.06}>
                <div className="relative min-h-[420px] overflow-hidden rounded-[28px] border border-white/10 bg-[#090909] shadow-panel">
                  <Image src={item.src} alt={item.alt} fill className="object-cover" />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.04),rgba(5,5,5,0.84))]" />
                  <div className="absolute inset-x-5 bottom-5 rounded-[22px] border border-white/10 bg-[#050505]/72 p-4 backdrop-blur-xl">
                    <p className="text-[10px] uppercase tracking-[0.28em] text-[#D4AF37]">{item.title}</p>
                    <p className="mt-3 text-sm leading-7 text-[#E1E5EB]">{item.description}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <Reveal>
          <div className="rounded-[32px] border border-[#D4AF37]/18 bg-[linear-gradient(180deg,rgba(10,12,16,0.96),rgba(7,8,10,0.96))] p-8 shadow-[0_28px_100px_rgba(212,175,55,0.08)] sm:p-10 lg:p-12">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
              <div className="space-y-4">
                <p className="text-[10px] uppercase tracking-[0.34em] text-[#D4AF37]">Fechamento institucional</p>
                <h2 className="max-w-4xl text-3xl font-semibold leading-tight text-[#F5F5F5] md:text-5xl">
                  Estruture a resposta humana como parte da sua infraestrutura operacional.
                </h2>
                <p className="max-w-2xl text-base leading-8 text-[#9EA3AE]">
                  O HUMANEXUS foi desenhado para organizações que tratam segurança, estabilidade humana e confiabilidade operacional como ativos estratégicos.
                </p>
                <p className="text-base leading-8 text-[#E0E4EA]">contato@institutohumanexus.com</p>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
