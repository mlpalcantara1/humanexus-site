import Image from "next/image";
import { Reveal } from "@/components/reveal";
import { PremiumVideo } from "@/components/premium-video";
import { CardGrid, DashboardMock, GlassCard, PrimaryButton, SecondaryButton, SectionIntro } from "@/components/ui";
import { brandAssets } from "@/lib/brand-assets";

const heroBadges = [
  "Programa contínuo",
  "Plataforma proprietária",
  "Segurança operacional",
  "Fatores humanos"
];

const instituteAreas = [
  { title: "SGSO", description: "Leitura humana aplicada ao fortalecimento da segurança operacional." },
  { title: "Operações Complexas", description: "Coordenação, comunicação e disciplina operacional em equipes críticas." },
  { title: "RH", description: "Acompanhamento longitudinal para desenvolvimento humano em contexto institucional." },
  { title: "Lideranças", description: "Capacidade decisória, estabilidade e presença executiva sob pressão." },
  { title: "Riscos Psicossociais", description: "Apoio a iniciativas contínuas de prevenção e maturidade organizacional." },
  { title: "Prontidão Operacional", description: "Confiabilidade humana como camada estratégica da operação." },
  { title: "Confiabilidade Humana", description: "Redução de incerteza sobre resposta humana em cenários críticos." },
  { title: "Tomada de Decisão", description: "Clareza operacional em contextos de risco, tempo e responsabilidade." }
];

const flowSteps = ["Sensores", "Dados", "IA", "Indicadores", "Protocolos THX", "Treinamento", "Relatórios", "Evolução Operacional"];

const programAreas = [
  {
    title: "Aviação",
    description: "Segurança operacional, fatores humanos avançados, SGSO, prontidão operacional e desenvolvimento de tripulantes."
  },
  {
    title: "Empresas",
    description: "Liderança, tomada de decisão, gestão de pressão, confiabilidade humana e desenvolvimento organizacional."
  },
  {
    title: "Saúde",
    description: "Desempenho humano, carga mental, atenção, regulação e resposta sob pressão em ambientes assistenciais."
  },
  {
    title: "Segurança Pública",
    description: "Resposta humana, tomada de decisão, estresse operacional e desempenho em ambientes críticos."
  }
];

const platformSignals = [
  "Dashboard",
  "Relatórios",
  "Indicadores",
  "IIRH",
  "Assinatura regulatória",
  "Protocolos THX"
];

const programCycle = ["Implementar", "Identificar", "Desenvolver", "Treinar", "Monitorar", "Fortalecer", "Evoluir"];

const authoritySignals = [
  "Psicólogo de aviação",
  "Mais de 20 anos de atuação",
  "Mestre e Doutor",
  "Forças Armadas e segurança operacional"
];

const authorityGallery = [
  {
    src: brandAssets.media.founderStageBlue,
    alt: "Marcos Alcântara ministrando formação em auditório",
    title: "Formação aplicada a públicos operacionais de alta responsabilidade."
  },
  {
    src: brandAssets.media.founderAviationCeremony,
    alt: "Marcos Alcântara em contexto institucional de aviação",
    title: "Presença institucional alinhada a aviação, cultura operacional e liderança."
  },
  {
    src: brandAssets.media.founderSeripaAuditorium,
    alt: "Marcos Alcântara em auditório com militares",
    title: "Ambientes reais, linguagem técnica e autoridade aplicada."
  }
];

export default function HomePage() {
  return (
    <>
      <section className="hero-premium grain-overlay relative isolate overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_16%,rgba(212,175,55,0.16),transparent_22%),radial-gradient(circle_at_84%_14%,rgba(38,74,128,0.18),transparent_22%),linear-gradient(180deg,rgba(4,4,6,0.88),rgba(4,4,6,0.98)_56%,rgba(4,4,6,1))]" />
        <div className="relative mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
          <div className="grid gap-12 xl:grid-cols-[0.84fr_1.16fr] xl:items-center">
            <Reveal>
              <div className="min-w-0 max-w-3xl space-y-8">
                <div className="relative h-14 w-[250px] max-w-full sm:h-20 sm:w-[350px]">
                  <Image src={brandAssets.logoPremium} alt="HUMANEXUS" fill priority className="object-contain object-left" />
                </div>

                <div className="grid max-w-2xl gap-2 sm:grid-cols-2">
                  {heroBadges.map((badge) => (
                    <div
                      key={badge}
                      className="rounded-full border border-[#C9A34E]/18 bg-[#0B0D10]/84 px-4 py-2 text-[10px] uppercase tracking-[0.3em] text-[#C9A34E]"
                    >
                      {badge}
                    </div>
                  ))}
                </div>

                <div className="space-y-5">
                  <h1 className="max-w-4xl text-[3.15rem] font-semibold leading-[0.94] text-[#F5F5F5] sm:text-5xl md:text-6xl xl:text-[5.2rem]">
                    Inteligência operacional humana para ambientes de alta criticidade.
                  </h1>
                  <p className="max-w-2xl text-lg leading-8 text-[#A7ADB7] md:text-xl">
                    O HUMANEXUS integra fatores humanos, tecnologia, dados e treinamento para fortalecer segurança operacional,
                    confiabilidade humana e tomada de decisão sob pressão.
                  </p>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row">
                  <PrimaryButton href="/contato">Agendar reunião institucional</PrimaryButton>
                  <SecondaryButton href="/#programa">Conhecer o programa</SecondaryButton>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.08}>
              <div className="min-w-0 xl:hidden">
                <GlassCard accent="gold">
                  <div className="space-y-5">
                    <p className="text-[10px] uppercase tracking-[0.34em] text-[#C9A34E]">Painel institucional</p>
                    <h2 className="text-3xl font-semibold leading-[0.98] text-[#F5F5F5]">
                      Leitura executiva para ambientes de missão.
                    </h2>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {[
                        "Operação crítica",
                        "Leitura institucional",
                        "Acompanhamento contínuo",
                        "Escopo longitudinal"
                      ].map((item, index) => (
                        <GlassCard key={item} accent={index === 0 ? "gold" : "soft"} description={item} />
                      ))}
                    </div>
                  </div>
                </GlassCard>
              </div>
              <div className="hidden min-w-0 xl:block">
                <DashboardMock />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section id="programa" className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <Reveal>
            <SectionIntro
              eyebrow="O que é o HUMANEXUS"
              title="Uma estrutura contínua para fortalecer a resposta humana na operação."
              description="O HUMANEXUS atua ao lado de organizações que precisam desenvolver pessoas em ambientes onde pressão, decisão, erro, atenção, comunicação e adaptação influenciam diretamente a segurança e o desempenho."
            />
          </Reveal>
          <Reveal delay={0.08}>
            <CardGrid items={instituteAreas} columns="xl:grid-cols-2" />
          </Reveal>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#06080d]">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <Reveal>
            <SectionIntro
              eyebrow="Como funciona"
              title="Da leitura fisiológica à evolução operacional."
              description="A plataforma transforma sinais fisiológicos, contexto operacional, observação técnica e protocolos estruturados em informação útil para desenvolvimento, prevenção e decisão institucional."
            />
          </Reveal>
          <Reveal delay={0.08} className="mt-12">
            <div className="grid gap-4 md:grid-cols-4 xl:grid-cols-8">
              {flowSteps.map((step, index) => (
                <div key={step} className="relative">
                  <div className="flex min-h-[122px] items-end rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] p-5 text-base font-medium text-[#F5F5F5]">
                    {step}
                  </div>
                  {index < flowSteps.length - 1 ? (
                    <div className="pointer-events-none absolute -right-2 top-1/2 hidden h-px w-4 bg-[linear-gradient(90deg,rgba(212,175,55,0.7),transparent)] xl:block" />
                  ) : null}
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section id="areas" className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <Reveal>
          <SectionIntro
            eyebrow="Programas"
            title="Aplicações institucionais para setores em que o fator humano tem impacto direto na missão."
            description="O HUMANEXUS se adapta ao contexto operacional sem perder rigor, reserva e leitura executiva."
          />
        </Reveal>
        <Reveal delay={0.08} className="mt-12">
          <CardGrid items={programAreas} columns="xl:grid-cols-4" />
        </Reveal>
      </section>

      <section id="plataforma" className="border-y border-white/10 bg-[#05070b]">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
            <Reveal>
              <PremiumVideo
                src={brandAssets.videos.heroInstitutional}
                poster={brandAssets.media.cockpitSimulator}
                eyebrow="Plataforma HUMANEXUS"
                title="Painel operacional unificado."
                description="A plataforma organiza dados, indicadores, sessões, relatórios, protocolos e evolução longitudinal em uma estrutura executiva para acompanhamento da resposta humana."
                className="min-h-[560px]"
                priority
              />
            </Reveal>
            <Reveal delay={0.08}>
              <div className="space-y-8">
                <SectionIntro
                  eyebrow="Leitura institucional"
                  title="Tecnologia aplicada como suporte à decisão. Não como ruído."
                  description="A camada visual do HUMANEXUS foi desenhada para executivos, segurança operacional, RH e liderança que precisam ler risco humano com mais clareza."
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  {platformSignals.map((signal, index) => (
                    <GlassCard key={signal} accent={index === 0 ? "gold" : "soft"} description={signal} />
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <Reveal>
          <SectionIntro
            eyebrow="Programa contínuo"
            title="Segurança operacional é processo. Não evento isolado."
            description="O HUMANEXUS organiza o desenvolvimento humano como ciclo contínuo, com acompanhamento e maturidade institucional."
          />
        </Reveal>
        <Reveal delay={0.08} className="mt-12">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-7">
            {programCycle.map((step, index) => (
              <div
                key={step}
                className={`rounded-[24px] border p-5 text-sm uppercase tracking-[0.24em] ${
                  index === 0
                    ? "border-[#C9A34E]/22 bg-[#C9A34E]/10 text-[#F5F5F5]"
                    : "border-white/10 bg-white/[0.02] text-[#B4BAC4]"
                }`}
              >
                {step}
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      <section id="autoridade" className="border-y border-white/10 bg-[#06080d]">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
            <Reveal>
              <div className="space-y-8">
                <SectionIntro
                  eyebrow="Autoridade técnica"
                  title="Autoridade técnica aplicada à operação."
                  description="O HUMANEXUS foi desenvolvido por Dr. Marcos Alcântara, psicólogo, especialista em Psicologia da Aviação, investigador de acidentes aeronáuticos, mestre e doutor, criador da Teoria da Inteligência Regulatória Humana."
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  {authoritySignals.map((item, index) => (
                    <GlassCard key={item} accent={index === 0 ? "gold" : "soft"} description={item} />
                  ))}
                </div>
                <p className="max-w-2xl text-base leading-8 text-[#9EA3AE]">
                  Mais de 20 anos de atuação em comportamento humano, fatores humanos, treinamento e desenvolvimento, com
                  experiência aplicada à segurança operacional, operações críticas, prevenção e investigação de acidentes aeronáuticos.
                </p>
              </div>
            </Reveal>
            <Reveal delay={0.08}>
              <div className="relative min-h-[580px] overflow-hidden rounded-[32px] border border-white/10 bg-[#090909] shadow-panel">
                <Image
                  src={brandAssets.media.founderHangarCommand}
                  alt="Marcos Alcântara em hangar aeronáutico"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.02),rgba(5,5,5,0.82))]" />
                <div className="absolute inset-x-6 bottom-6 rounded-[24px] border border-white/10 bg-[#050505]/70 p-5 backdrop-blur-xl">
                  <p className="text-[10px] uppercase tracking-[0.32em] text-[#C9A34E]">Ambientes críticos</p>
                  <p className="mt-3 text-base leading-7 text-[#E5E8EC]">
                    Atuação aplicada a segurança operacional, formação institucional, operações aéreas e liderança sob pressão.
                  </p>
                </div>
              </div>
            </Reveal>
          </div>

          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {authorityGallery.map((item, index) => (
              <Reveal key={item.title} delay={index * 0.06}>
                <div className="relative min-h-[360px] overflow-hidden rounded-[28px] border border-white/10 bg-[#090909] shadow-panel">
                  <Image src={item.src} alt={item.alt} fill className="object-cover" />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.04),rgba(5,5,5,0.82))]" />
                  <div className="absolute inset-x-5 bottom-5 rounded-[22px] border border-white/10 bg-[#050505]/68 p-4 backdrop-blur-xl">
                    <p className="text-sm leading-7 text-[#F5F5F5]">{item.title}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <Reveal>
          <div className="rounded-[32px] border border-[#C9A34E]/18 bg-[linear-gradient(180deg,rgba(10,12,16,0.96),rgba(7,8,10,0.96))] p-8 shadow-[0_28px_100px_rgba(201,163,78,0.08)] sm:p-10 lg:p-12">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
              <div className="space-y-4">
                <p className="text-[10px] uppercase tracking-[0.34em] text-[#C9A34E]">Chamada final</p>
                <h2 className="max-w-4xl text-3xl font-semibold leading-tight text-[#F5F5F5] md:text-5xl">
                  Transforme fatores humanos em confiabilidade operacional.
                </h2>
                <p className="max-w-2xl text-base leading-8 text-[#9EA3AE]">
                  Conheça o Programa HUMANEXUS e descubra como estruturar uma camada contínua de desenvolvimento humano,
                  segurança operacional e inteligência regulatória aplicada à sua organização.
                </p>
                <p className="max-w-2xl text-base leading-8 text-[#D8DCE3]">contato@institutohumanexus.com</p>
              </div>
              <PrimaryButton href="/contato">Agendar reunião institucional</PrimaryButton>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
