import type { Metadata } from "next";
import Image from "next/image";
import { Reveal } from "@/components/reveal";
import { PremiumVideo } from "@/components/premium-video";
import { DashboardMock, PrimaryButton, SecondaryButton, SectionIntro } from "@/components/ui";
import { brandAssets } from "@/lib/brand-assets";

export const metadata: Metadata = {
  title: "Instituto de Inteligência Regulatória Humana",
  description:
    "O HUMANEXUS apresenta a Teoria da Inteligência Regulatória Humana aplicada à segurança operacional, à liderança e ao desenvolvimento humano em ambientes críticos.",
  alternates: {
    canonical: "/"
  },
  openGraph: {
    url: "/"
  }
};

const trustSignals = [
  "Teoria própria",
  "21 anos de atuação",
  "Forças Armadas e aviação",
  "Ambientes críticos"
];

const remoteAnamneseUrl =
  process.env.NEXT_PUBLIC_HUMANEXUS_APP_URL?.replace(/\/$/, "") ?? "/contato";

const sectors = [
  {
    title: "Táxi aéreo e aviação operacional",
    description: "Operações em que coordenação, disciplina e resposta humana interferem diretamente na missão."
  },
  {
    title: "Operações aeromédicas",
    description: "Contextos em que tempo, decisão e responsabilidade clínica exigem maior estabilidade operacional."
  },
  {
    title: "Forças Armadas e segurança pública",
    description: "Ambientes de comando em que liderança, pressão e consequência caminham juntas."
  },
  {
    title: "Saúde e alta responsabilidade",
    description: "Equipes sujeitas a fadiga, sobrecarga e decisões com impacto humano e institucional."
  },
  {
    title: "Energia e infraestrutura crítica",
    description: "Operações que exigem confiabilidade humana contínua e cultura de segurança madura."
  },
  {
    title: "Lideranças estratégicas",
    description: "Dirigentes que precisam tratar o fator humano como ativo estruturante da operação."
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
    kind: "image",
    src: brandAssets.media.founderAviationCeremony,
    alt: "Marcos Alcântara em contexto aeronáutico institucional",
    title: "Aviação e autoridade operacional",
    description: "Presença real em ambientes em que o fator humano tem impacto direto na segurança da missão."
  },
  {
    kind: "video",
    src: brandAssets.videos.homeAuthorityInstitutional,
    poster: brandAssets.media.homeAuthorityInstitutionalPoster,
    alt: "Marcos Alcântara conduzindo formação institucional em ambiente de alta exigência",
    title: "Formação institucional",
    description: "Atuação direta na condução de desenvolvimento humano aplicado para organizações que exigem clareza, disciplina e responsabilidade."
  },
  {
    kind: "image",
    src: brandAssets.media.instituteSpaceWide,
    alt: "Estrutura física do Instituto HUMANEXUS",
    title: "Instituto HUMANEXUS",
    description: "Estrutura própria para relacionamento executivo, desenvolvimento supervisionado e acompanhamento contínuo."
  },
  {
    kind: "image",
    src: brandAssets.media.cockpitSimulator,
    alt: "Ambiente controlado do Instituto HUMANEXUS",
    title: "Ambiente controlado",
    description: "Espaço preparado para formação aplicada, supervisão técnica e trabalho em contexto reservado."
  }
];

export default function HomePage() {
  return (
    <>
      <section className="hero-premium grain-overlay relative isolate overflow-hidden border-b border-white/10 bg-[#040507]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_14%,rgba(212,175,55,0.14),transparent_24%),radial-gradient(circle_at_86%_18%,rgba(29,73,129,0.15),transparent_24%),linear-gradient(180deg,rgba(4,5,7,0.94),rgba(4,5,7,0.98)_58%,rgba(4,5,7,1))]" />
        <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,0.024)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] [background-size:144px_144px] [mask-image:radial-gradient(circle_at_center,black,transparent_84%)]" />
        <div className="relative mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
          <div className="grid gap-12 xl:grid-cols-[0.78fr_1.22fr] xl:items-center">
            <Reveal>
              <div className="max-w-3xl space-y-8">
                <div className="relative h-20 w-[320px] sm:h-24 sm:w-[380px]">
                  <Image src={brandAssets.logoPremium} alt="HUMANEXUS" fill priority className="object-contain object-left" />
                </div>

                <div className="space-y-5">
                  <p className="text-[10px] uppercase tracking-[0.42em] text-[#D4AF37] md:text-[11px]">
                    Instituto de Inteligência Regulatória Humana
                  </p>
                  <h1 className="max-w-4xl text-[3rem] font-semibold leading-[0.9] text-[#F5F5F5] sm:text-5xl md:text-6xl xl:text-[5.2rem]">
                    O HUMANEXUS apresenta a Teoria da Inteligência Regulatória Humana.
                  </h1>
                  <p className="max-w-2xl text-lg leading-8 text-[#9EA6B1] md:text-xl">
                    Base científica e institucional para programas contínuos voltados à segurança operacional, à liderança e ao desenvolvimento humano em ambientes de alta exigência.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {trustSignals.map((signal) => (
                    <div
                      key={signal}
                      className="rounded-full border border-white/10 bg-[#0B0D11]/82 px-4 py-2 text-[10px] uppercase tracking-[0.28em] text-[#D4AF37]"
                    >
                      {signal}
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-4 sm:flex-row">
                  <PrimaryButton href={`${remoteAnamneseUrl}/anamnese`}>
                    Responder Anamnese
                  </PrimaryButton>
                  <PrimaryButton href="/contato">Fale Conosco</PrimaryButton>
                  <SecondaryButton href="/servicos">Ver Programas</SecondaryButton>
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
        <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <Reveal>
            <SectionIntro
              eyebrow="Frentes prioritárias"
              title="Aplicado a operações em que vulnerabilidade humana custa caro."
              description="O HUMANEXUS foi desenhado para estruturas que não podem tratar desenvolvimento humano como resposta improvisada."
            />
          </Reveal>
          <Reveal delay={0.08}>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {sectors.map((item) => (
                <div
                  key={item.title}
                  className="rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.025),rgba(255,255,255,0.01))] p-5"
                >
                  <p className="text-sm font-semibold leading-6 text-[#F5F5F5]">{item.title}</p>
                  <p className="mt-3 text-sm leading-7 text-[#97A0AC]">{item.description}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#06080d]">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <Reveal>
            <SectionIntro
              eyebrow="O que o HUMANEXUS entrega"
              title="Programas contínuos para fortalecer estabilidade humana, decisão e consistência institucional."
              description="O Instituto organiza desenvolvimento contínuo para ambientes em que responsabilidade, consequência e segurança caminham juntas."
            />
          </Reveal>
          <Reveal delay={0.08} className="mt-12">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {deliverables.map((item) => (
                <div
                  key={item.title}
                  className="rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.012))] p-5"
                >
                  <p className="text-[10px] uppercase tracking-[0.34em] text-[#D4AF37]">{item.title}</p>
                  <p className="mt-4 text-sm leading-7 text-[#B2B8C2]">{item.description}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
          <Reveal>
            <PremiumVideo
              src={brandAssets.videos.institutionalHero}
              poster={brandAssets.media.instituteSpaceFront}
              eyebrow="Presença institucional"
              title="Uma linguagem visual compatível com decisão, comando e confiança."
              description="O Instituto opera com densidade institucional, presença própria e relação reservada com organizações de alta responsabilidade."
              className="min-h-[560px]"
              priority
            />
          </Reveal>

          <Reveal delay={0.08}>
            <div className="space-y-8">
              <SectionIntro
                eyebrow="Posicionamento"
                title="A teoria que originou o Instituto."
                description="A Teoria da Inteligência Regulatória Humana sustenta a presença institucional do HUMANEXUS e orienta sua aplicação em ambientes operacionais de alta exigência."
              />
              <div className="space-y-4 border-l border-[#D4AF37]/30 pl-5 text-sm leading-8 text-[#9CA4AE]">
                <p>Base científica própria.</p>
                <p>Aplicação voltada a segurança operacional e liderança.</p>
                <p>Programas contínuos para organizações que exigem estabilidade sob pressão.</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#06080d]">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <Reveal>
            <SectionIntro
              eyebrow="Evidências de atuação"
              title="Presença real em aviação, prevenção, estrutura própria e ambiente controlado."
              description="Sem banco de imagens. Sem narrativa artificial. Apenas sinais concretos de autoridade institucional."
            />
          </Reveal>

          <div className="mt-12 grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
            {evidenceCards.map((item, index) => (
              <Reveal key={item.title} delay={index * 0.06}>
                <div className="relative min-h-[420px] overflow-hidden rounded-[28px] border border-white/10 bg-[#090909] shadow-panel">
                  {item.kind === "video" ? (
                    <video
                      className="h-full w-full object-cover"
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      poster={item.poster}
                      disablePictureInPicture
                    >
                      <source src={item.src} type="video/mp4" />
                    </video>
                  ) : (
                    <Image src={item.src} alt={item.alt} fill className="object-cover" />
                  )}
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.02),rgba(5,5,5,0.84))]" />
                  <div className="absolute inset-x-5 bottom-5 rounded-[22px] border border-white/10 bg-[#050505]/74 p-4 backdrop-blur-xl">
                    <p className="text-[10px] uppercase tracking-[0.32em] text-[#D4AF37]">{item.title}</p>
                    <p className="mt-3 text-sm leading-7 text-[#D6DAE1]">{item.description}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <Reveal>
          <div className="rounded-[34px] border border-[#D4AF37]/16 bg-[linear-gradient(180deg,rgba(255,255,255,0.025),rgba(255,255,255,0.01))] px-8 py-10 text-center shadow-[0_26px_90px_rgba(0,0,0,0.28)]">
            <p className="text-[10px] uppercase tracking-[0.42em] text-[#D4AF37]">Instituto HUMANEXUS</p>
            <h2 className="mt-4 text-3xl font-semibold leading-[0.98] text-[#F5F5F5] md:text-5xl">
              Inteligência Regulatória Humana para organizações que operam sob alta responsabilidade.
            </h2>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <PrimaryButton href="/contato">Fale Conosco</PrimaryButton>
              <SecondaryButton href="/pesquisa">Conhecer a teoria</SecondaryButton>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
