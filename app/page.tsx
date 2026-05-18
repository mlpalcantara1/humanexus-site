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

export default function HomePage() {
  return (
    <>
      <section className="hero-premium relative isolate overflow-hidden border-b border-white/10">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,4,6,0.68),rgba(4,4,6,0.88)_42%,rgba(4,4,6,0.98))]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(201,163,78,0.18),transparent_20%),radial-gradient(circle_at_84%_22%,rgba(23,78,143,0.18),transparent_22%),radial-gradient(circle_at_50%_100%,rgba(255,255,255,0.06),transparent_30%)]" />
          <div className="absolute inset-0 opacity-50 [background-image:linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] [background-size:140px_140px] [mask-image:radial-gradient(circle_at_center,black,transparent_82%)]" />
        </div>

        <div className="relative mx-auto flex min-h-[90vh] max-w-7xl items-center px-6 py-14 lg:px-8 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[0.98fr_1.02fr] lg:items-center">
            <Reveal>
              <div className="relative max-w-4xl space-y-8">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="rounded-full border border-[#C9A34E]/28 bg-[#050505]/62 px-4 py-2 text-[11px] uppercase tracking-[0.32em] text-[#C9A34E] backdrop-blur-xl">
                    Instituto HUMANEXUS
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[11px] uppercase tracking-[0.28em] text-[#D4D4D4] backdrop-blur-xl">
                    Programa contínuo de desenvolvimento humano operacional
                  </div>
                </div>
                <div className="space-y-5">
                  <h1 className="max-w-5xl text-4xl font-semibold leading-[1.02] text-[#F5F5F5] md:text-6xl lg:text-[4.8rem]">
                    O HUMANEXUS operacionaliza a Inteligência Regulatória Humana em ambientes de elevada exigência.
                  </h1>
                  <p className="max-w-3xl text-lg leading-8 text-[#D4D4D4] md:text-xl">
                    Ciência aplicada, fatores humanos e tecnologia operacional em uma estrutura premium de desenvolvimento contínuo para organizações onde estabilidade, decisão e confiança são inegociáveis.
                  </p>
                </div>
                <div className="grid max-w-3xl gap-3 sm:grid-cols-3">
                  {[
                    "HUMANEXUS",
                    "Instituto de Inteligência Operacional Humana",
                    "Programa contínuo para ambientes críticos"
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-sm leading-6 text-[#E5E5E5] backdrop-blur-xl"
                    >
                      {item}
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:flex-wrap">
                  <PrimaryButton href="/sobre">Conhecer o Instituto</PrimaryButton>
                  <SecondaryButton href="/contato">Solicitar Avaliação Estratégica</SecondaryButton>
                  <SecondaryButton href="/formacao">Formação HUMANEXUS</SecondaryButton>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.08}>
              <div className="relative overflow-hidden rounded-[36px] border border-[#C9A34E]/24 bg-[linear-gradient(180deg,rgba(10,10,14,0.96),rgba(6,8,12,0.96))] p-6 shadow-[0_0_80px_rgba(201,163,78,0.12)] backdrop-blur-2xl sm:p-8">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_22%,rgba(201,163,78,0.18),transparent_18%),radial-gradient(circle_at_30%_82%,rgba(36,92,164,0.18),transparent_24%)]" />
                <div className="absolute right-[-6%] top-[-8%] opacity-[0.09]">
                  <div className="relative h-[360px] w-[360px] sm:h-[420px] sm:w-[420px]">
                    <Image src={brandAssets.logo} alt="" fill className="object-contain" aria-hidden />
                  </div>
                </div>
                <div className="relative space-y-8">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.32em] text-[#C9A34E]">HUMANEXUS</p>
                      <p className="mt-3 text-sm uppercase tracking-[0.18em] text-[#BFC6D4]">
                        Instituto de Inteligência Operacional Humana
                      </p>
                    </div>
                    <div className="relative h-24 w-40 overflow-hidden rounded-[28px] border border-[#C9A34E]/30 bg-black/45 shadow-gold sm:h-28 sm:w-48">
                      <Image src={brandAssets.logo} alt="Assinatura HUMANEXUS" fill className="object-contain p-2.5" />
                    </div>
                  </div>
                  <div className="rounded-[28px] border border-white/10 bg-[#050505]/54 p-5 backdrop-blur-xl">
                    <p className="text-sm uppercase tracking-[0.26em] text-[#C9A34E]">Assinatura institucional</p>
                    <h2 className="mt-4 text-3xl font-semibold leading-tight text-[#F5F5F5] sm:text-[2.5rem]">
                      Organização avançada para estabilidade humana, segurança operacional e performance sob pressão.
                    </h2>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    {coreMessages.map((item) => (
                      <GlassCard key={item.title} accent="gold" title={item.title} description={item.description} />
                    ))}
                  </div>
                </div>
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
                src={brandAssets.videos.heroInstitutional}
                poster={brandAssets.media.eegOperatorHero}
                eyebrow="Prova institucional"
                title="Atuação operacional real, presença institucional e tecnologia aplicada em campo."
                description="O vídeo principal sai da primeira dobra e passa a funcionar como prova institucional, bastidor operacional e legitimidade visual do HUMANEXUS."
                className="min-h-[520px]"
              />
            </Reveal>
            <Reveal delay={0.08}>
              <div className="space-y-8">
                <SectionIntro
                  eyebrow="Presença operacional"
                  title="Tecnologia humana aplicada com sobriedade, autoridade e leitura institucional clara."
                  description="O HUMANEXUS não precisa de ruído visual para parecer avançado. A experiência institucional combina presença de marca, rigor operacional e narrativa de alto valor."
                />
                <div className="grid gap-4">
                  {formationHighlights.map((item) => (
                    <GlassCard key={item.title} accent="gold" title={item.title} description={item.description} />
                  ))}
                </div>
                <div className="flex flex-col gap-4 sm:flex-row">
                  <PrimaryButton href="/contato">Implementar o Programa HUMANEXUS</PrimaryButton>
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
            <div className="relative min-h-[480px] overflow-hidden rounded-[34px] border border-white/10 bg-[#050505] shadow-panel">
              <Image
                src={brandAssets.media.eegSetup}
                alt="Configuração operacional HUMANEXUS"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,10,24,0.12),rgba(5,5,5,0.84))]" />
              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                <div className="max-w-2xl rounded-[28px] border border-white/10 bg-[#050505]/66 p-5 backdrop-blur-xl">
                  <p className="text-xs uppercase tracking-[0.3em] text-[#C9A34E]">Arquitetura aplicada</p>
                  <h3 className="mt-3 text-2xl font-semibold text-[#F5F5F5]">
                    Presença premium, discrição tecnológica e autoridade científica em uma mesma linguagem visual.
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-[#B8B8B8]">
                    A comunicação pública mostra profundidade suficiente para gerar interesse, sem expor engenharia interna ou competir com a marca.
                  </p>
                </div>
              </div>
            </div>
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
