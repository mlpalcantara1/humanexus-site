import { existsSync } from "node:fs";
import { join } from "node:path";
import Image from "next/image";
import { Reveal } from "@/components/reveal";
import { PremiumVideo } from "@/components/premium-video";
import { CardGrid, GlassCard, PrimaryButton, SecondaryButton, SectionIntro } from "@/components/ui";
import { brandAssets, theoryFlow } from "@/lib/brand-assets";
import {
  authorityPoints,
  coreMessages,
  formationHighlights,
  psychosocialSolutionCards,
  researchHighlights,
  serviceHighlights
} from "@/lib/site-data";

const authorityPreview = authorityPoints.slice(0, 6);

function buildVideoSources(src: string) {
  const root = join(process.cwd(), "public");
  const normalized = src.startsWith("/") ? src : `/${src}`;
  const base = normalized.replace(/\.(mov|mp4|m4v)$/i, "");
  const candidates = [
    { src: `${base}.mp4`, type: "video/mp4" },
    { src: `${base}.m4v`, type: "video/mp4" },
    { src: `${base}.mov`, type: "video/quicktime" }
  ];

  return candidates.filter((item) => existsSync(join(root, item.src.replace(/^\//, ""))));
}

export default function HomePage() {
  const heroSources = buildVideoSources(brandAssets.videos.heroInstitutional);

  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-white/10">
        <div className="absolute inset-0">
          <video
            className="h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster={brandAssets.media.eegOperatorHero}
            disablePictureInPicture
          >
            {heroSources.map((item) => (
              <source key={item.src} src={item.src} type={item.type} />
            ))}
          </video>
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,3,3,0.55),rgba(3,3,3,0.82)_38%,rgba(3,3,3,0.95))]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(201,163,78,0.18),transparent_18%),radial-gradient(circle_at_82%_20%,rgba(34,84,145,0.22),transparent_22%)]" />
        </div>

        <div className="relative mx-auto flex min-h-[88vh] max-w-7xl items-end px-6 py-16 lg:px-8 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <Reveal>
              <div className="relative max-w-4xl space-y-8">
                <div className="flex items-center gap-4">
                  <div className="relative h-20 w-40 overflow-hidden rounded-[26px] border border-[#C9A34E]/26 bg-[#050505]/50 shadow-gold backdrop-blur-xl sm:h-24 sm:w-48">
                    <Image src={brandAssets.logo} alt="Logo oficial HUMANEXUS" fill className="object-contain p-2.5" priority />
                  </div>
                  <div className="hidden rounded-full border border-[#C9A34E]/28 bg-[#050505]/55 px-4 py-2 text-[11px] uppercase tracking-[0.32em] text-[#C9A34E] backdrop-blur-xl sm:inline-flex">
                    Instituto HUMANEXUS
                  </div>
                </div>
                <div className="absolute right-[-6%] top-10 hidden opacity-[0.08] xl:block">
                  <div className="relative h-[360px] w-[360px]">
                    <Image src={brandAssets.logo} alt="" fill className="object-contain" aria-hidden />
                  </div>
                </div>
                <div className="space-y-5">
                  <h1 className="max-w-5xl text-4xl font-semibold leading-[1.04] text-[#F5F5F5] md:text-6xl lg:text-7xl">
                    O HUMANEXUS operacionaliza a Inteligência Regulatória Humana em ambientes de elevada exigência.
                  </h1>
                  <p className="max-w-3xl text-lg leading-8 text-[#D4D4D4] md:text-xl">
                    Ciência aplicada, fatores humanos e tecnologia operacional em uma estrutura premium de desenvolvimento contínuo para organizações onde estabilidade, decisão e confiança são inegociáveis.
                  </p>
                </div>
                <div className="flex flex-col gap-4 sm:flex-row">
                  <PrimaryButton href="/sobre">Conhecer o Instituto</PrimaryButton>
                  <SecondaryButton href="/contato">Solicitar Avaliação Estratégica</SecondaryButton>
                  <SecondaryButton href="/formacao">Formação HUMANEXUS</SecondaryButton>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.08}>
              <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                {coreMessages.map((item) => (
                  <GlassCard key={item.title} accent="gold" title={item.title} description={item.description} />
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
          <Reveal>
            <SectionIntro
              eyebrow="Posicionamento"
              title="Uma organização avançada para reduzir vulnerabilidades humanas, fortalecer segurança operacional e desenvolver performance sob pressão."
              description="O HUMANEXUS posiciona ciência aplicada, autoridade institucional e tecnologia operacional real em uma experiência premium orientada a decisão, confiança e alto valor."
            />
          </Reveal>
          <Reveal delay={0.08}>
            <div className="grid gap-5 sm:grid-cols-2">
              {[
                "Autoridade institucional para líderes, empresários, DSO e organizações críticas.",
                "Estética premium e discurso estratégico para gerar confiança imediata.",
                "Tecnologia aplicada com discrição: suficiente para impressionar, sem expor a engenharia proprietária.",
                "Narrativa comercial pensada para avançar de interesse para reunião institucional e implementação de programa."
              ].map((item) => (
                <GlassCard key={item} description={item} />
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#06080d]">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <Reveal>
            <SectionIntro
              eyebrow="Da teoria à operação"
              title="A força do HUMANEXUS está em transformar uma arquitetura conceitual proprietária em leitura operacional aplicada."
              description="Sem abrir metodologias sensíveis, o site deixa claro que existe uma base científica proprietária convertida em programas, formação e estruturas contínuas para ambientes críticos."
            />
          </Reveal>
          <div className="mt-12 grid gap-5 lg:grid-cols-4">
            {theoryFlow.map((item, index) => (
              <Reveal key={item.title} delay={index * 0.05}>
                <GlassCard
                  accent={index === 0 ? "gold" : "soft"}
                  title={`${item.step} — ${item.title}`}
                  description={item.description}
                />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#05070c]">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.96fr_1.04fr] lg:items-start">
            <Reveal>
              <SectionIntro
                eyebrow="Conexão regulatória"
                title="Riscos psicossociais, fatores humanos e estabilidade operacional."
                description="Empresas expostas a ambientes de alta exigência precisam demonstrar ações contínuas de prevenção, desenvolvimento humano, gestão de riscos psicossociais, fatores humanos e segurança operacional. O HUMANEXUS apoia organizações na estruturação de programas aplicados à estabilidade humana, tomada de decisão e performance sustentável."
              />
            </Reveal>
            <Reveal delay={0.08}>
              <div className="grid gap-4 sm:grid-cols-2">
                {psychosocialSolutionCards.slice(0, 4).map((item) => (
                  <GlassCard key={item.title} accent="gold" title={item.title} />
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <Reveal>
          <SectionIntro
            eyebrow="Programas HUMANEXUS"
            title="Fatores humanos, neuroergonomia, CRM e leitura operacional em uma estrutura contínua, institucional e sofisticada."
            description="A proposta é clara em poucos segundos: o HUMANEXUS ajuda organizações a compreender, desenvolver e proteger a performance humana em contextos de alta responsabilidade com acompanhamento progressivo."
          />
        </Reveal>
        <Reveal delay={0.08} className="mt-12">
          <CardGrid items={serviceHighlights} columns="xl:grid-cols-4" />
        </Reveal>
        <Reveal delay={0.14} className="mt-12">
          <div className="flex flex-col gap-4 sm:flex-row">
            <PrimaryButton href="/servicos">Conhecer os Protocolos HUMANEXUS</PrimaryButton>
            <SecondaryButton href="/contato">Solicitar Avaliação Estratégica</SecondaryButton>
          </div>
        </Reveal>
      </section>

      <section className="border-y border-white/10 bg-[#05070b]">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
            <Reveal>
              <PremiumVideo
                src={brandAssets.videos.formationCrm}
                poster={brandAssets.media.aviationTalk}
                eyebrow="Formação HUMANEXUS"
                title="Treinamento, CRM e desenvolvimento de equipes em uma linguagem compatível com ambientes operacionais reais."
                description="Vídeo institucional aplicado à formação, cultura operacional e presença profissional em ambientes de elevada exigência."
                className="min-h-[520px]"
              />
            </Reveal>
            <Reveal delay={0.08}>
              <div className="space-y-8">
                <SectionIntro
                  eyebrow="Formação"
                  title="Capacitação premium para organizações que precisam elevar padrão técnico, progressão operacional e presença institucional."
                  description="Formação HUMANEXUS, CRM aplicado, leitura regulatória humana e desenvolvimento de performance sob pressão em uma jornada de alto valor."
                />
                <div className="grid gap-4">
                  {formationHighlights.map((item) => (
                    <GlassCard key={item.title} accent="gold" title={item.title} description={item.description} />
                  ))}
                </div>
                <div className="flex flex-col gap-4 sm:flex-row">
                  <PrimaryButton href="/formacao">Iniciar Desenvolvimento Operacional</PrimaryButton>
                  <SecondaryButton href="/contato">Agendar Reunião Institucional</SecondaryButton>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.96fr_1.04fr] lg:items-center">
          <Reveal>
            <div className="space-y-8">
              <SectionIntro
                eyebrow="Pesquisa e reputação"
                title="Ciência aplicada apresentada com sofisticação, sem abrir a engenharia interna."
                description="O HUMANEXUS deve parecer avançado, exclusivo e difícil de replicar. A comunicação pública mostra arquitetura conceitual, aplicações e autoridade, sem expor modelagens sensíveis."
              />
              <div className="grid gap-4 sm:grid-cols-2">
                {researchHighlights.slice(0, 4).map((item) => (
                  <GlassCard key={item.title} title={item.title} description={item.description} />
                ))}
              </div>
              <div className="flex flex-col gap-4 sm:flex-row">
                <PrimaryButton href="/pesquisa">Conhecer a área de pesquisa</PrimaryButton>
                <SecondaryButton href="/sobre">Ver autoridade institucional</SecondaryButton>
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <PremiumVideo
              src={brandAssets.videos.instituteSignature}
              poster={brandAssets.media.founderCenipa}
              eyebrow="Assinatura institucional"
              title="Presença premium para implementação institucional, reuniões executivas e percepção internacional."
              description="Vídeo institucional para reforçar autoridade, exclusividade e posicionamento de alto valor."
              className="min-h-[480px]"
            />
          </Reveal>
        </div>
      </section>

      <section className="border-y border-white/10 bg-mesh-dark">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.88fr_1.12fr] lg:items-center">
            <Reveal>
              <div className="relative min-h-[520px] overflow-hidden rounded-[34px] border border-[#C9A34E]/20 bg-[#090909] shadow-gold">
                <Image
                  src={brandAssets.media.founderCenipa}
                  alt="Dr. Marcos em contexto institucional"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.16),rgba(5,5,5,0.82))]" />
                <div className="absolute inset-x-6 bottom-6 rounded-[26px] border border-white/10 bg-[#050505]/70 p-5">
                  <p className="text-xs uppercase tracking-[0.3em] text-[#C9A34E]">Direção científica</p>
                  <p className="mt-3 text-lg text-[#F5F5F5]">
                    Liderança, experiência operacional e autoridade científica em uma presença visual contida e credível.
                  </p>
                </div>
              </div>
            </Reveal>
            <Reveal delay={0.08}>
              <div className="space-y-8">
                <SectionIntro
                  eyebrow="Base científica e experiência operacional"
                  title="A credibilidade do HUMANEXUS não depende de volume de texto. Depende de rigor, trajetória e presença."
                  description="O instituto integra psicologia da aviação, fatores humanos, experiência operacional, investigação aeronáutica, educação e tecnologia aplicada em uma proposta premium para ambientes críticos."
                />
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {authorityPreview.map((item) => (
                    <GlassCard key={item.title} accent="gold" title={item.title} />
                  ))}
                </div>
                <div className="flex flex-col gap-4 sm:flex-row">
                  <PrimaryButton href="/sobre">Conhecer o Instituto</PrimaryButton>
                  <SecondaryButton href="/contato">Agendar Reunião Institucional</SecondaryButton>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <Reveal>
          <div className="rounded-[36px] border border-[#C9A34E]/22 bg-[linear-gradient(135deg,rgba(10,12,18,0.96),rgba(6,6,6,0.96))] p-8 shadow-gold sm:p-10">
            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div className="space-y-4">
                <p className="text-xs uppercase tracking-[0.32em] text-[#C9A34E]">Próximo passo</p>
                <h2 className="text-3xl font-semibold leading-tight text-[#F5F5F5] md:text-4xl">
                  Para organizações que não podem tratar desempenho humano como detalhe.
                </h2>
                <p className="max-w-2xl text-base leading-8 text-[#B8B8B8]">
                  Solicite uma avaliação estratégica, receba uma apresentação institucional e entenda como o HUMANEXUS pode apoiar segurança operacional, performance humana, riscos psicossociais e diferenciação executiva.
                </p>
              </div>
              <div className="space-y-4">
                <PrimaryButton href="/contato">Implementar o Programa HUMANEXUS</PrimaryButton>
                <SecondaryButton href="mailto:contato@institutohumanexus.com">contato@institutohumanexus.com</SecondaryButton>
                <SecondaryButton href="https://wa.me/5592981187777">Agendar Reunião Institucional</SecondaryButton>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
