import Image from "next/image";
import { Reveal } from "@/components/reveal";
import {
  CardGrid,
  DashboardMock,
  GlassCard,
  PageHero,
  PrimaryButton,
  SecondaryButton,
  SectionIntro
} from "@/components/ui";
import { brandAssets, theoryFlow } from "@/lib/brand-assets";
import {
  audiences,
  authorityPoints,
  benefitCards,
  pillarCards,
  programCards,
  regulatoryCards,
  solutionCards,
  technologyItems
} from "@/lib/site-data";

const visualGallery = [
  {
    title: "Identidade institucional oficial",
    description: "Caderno de marca, aplicações e ecossistema visual oficial HUMANEXUS.",
    image: brandAssets.brandBoard
  },
  {
    title: "Cockpit e simulação operacional",
    description: "Ambiente de elevada exigência para leitura regulatória humana aplicada.",
    image: brandAssets.media.cockpitSimulator
  },
  {
    title: "Teoria em ambiente institucional",
    description: "Aplicação da TIRH em contexto formativo, executivo e operacional.",
    image: brandAssets.media.tirhPresentation
  },
  {
    title: "Aviação e segurança operacional",
    description: "Presença real em contextos aéreos e ambientes de alta responsabilidade.",
    image: brandAssets.media.aviationTalk
  },
  {
    title: "Operação e infraestrutura crítica",
    description: "Material visual institucional para autoridade, legitimidade e confiança.",
    image: brandAssets.media.hangarOperations
  },
  {
    title: "Tecnologia aplicada à operação",
    description: "Simulador, cockpit e leitura operacional em ambiente controlado.",
    image: brandAssets.media.simulatorAviation
  }
];

export default function HomePage() {
  return (
    <>
      <PageHero
        eyebrow="Teoria da Inteligência Regulatória Humana"
        title="O HUMANEXUS operacionaliza a Teoria da Inteligência Regulatória Humana em ambientes de elevada exigência operacional."
        description="Leitura regulatória humana, estabilidade adaptativa, modelagem vetorial, EEG, HRV, cockpit, protocolos e relatórios executivos para organizações onde o erro humano custa caro."
        primary={{ href: "/contato", label: "Solicitar apresentação institucional" }}
        secondary={{ href: "https://wa.me/5592981187777", label: "Falar com especialista" }}
        media={{
          src: brandAssets.media.eegOperatorHero,
          alt: "Dr. Marcos aplicando EEG em operador real",
          badge: "EEG em operação real"
        }}
      />

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.88fr_1.12fr] lg:items-end">
          <Reveal>
            <div className="space-y-8">
              <SectionIntro
                eyebrow="Posicionamento em menos de 10 segundos"
                title="Não é um software isolado. Não é um dashboard solto. É ciência aplicada à estabilidade humana sob pressão."
                description="O HUMANEXUS transforma a Teoria da Inteligência Regulatória Humana em leitura operacional, tecnologia aplicada e entregáveis institucionais para aviação, táxi aéreo, segurança operacional e ambientes críticos."
              />
              <div className="grid gap-4">
                {[
                  "Reduz vulnerabilidades humanas silenciosas antes que elas impactem a operação.",
                  "Fortalece segurança operacional com leitura regulatória humana e análise de estabilidade adaptativa.",
                  "Apoia liderança, DSO e gestores com evidências executivas e linguagem institucional.",
                  "Posiciona a organização com uma metodologia proprietária, premium e de alto valor."
                ].map((point) => (
                  <GlassCard key={point} accent="gold" description={point} />
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="relative min-h-[520px] overflow-hidden rounded-[32px] border border-[#C9A34E]/22 bg-[#090909] shadow-gold">
                <Image
                  src={brandAssets.media.eegSetup}
                  alt="Configuração de EEG em operador real"
                  fill
                  className="object-cover object-top"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.14),rgba(5,5,5,0.82))]" />
                <div className="absolute inset-x-6 top-6 flex items-center justify-between">
                  <span className="rounded-full border border-[#C9A34E]/28 bg-[#050505]/75 px-4 py-2 text-[11px] uppercase tracking-[0.28em] text-[#C9A34E]">
                    EEG EPOC X
                  </span>
                  <span className="rounded-full border border-white/10 bg-[#050505]/75 px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-[#F5F5F5]">
                    Captura real
                  </span>
                </div>
                <div className="absolute inset-x-6 bottom-6 rounded-[26px] border border-white/10 bg-[#050505]/76 p-5 backdrop-blur-xl">
                  <p className="text-xs uppercase tracking-[0.28em] text-[#C9A34E]">Tecnologia operacional aplicada</p>
                  <p className="mt-3 text-xl font-semibold text-[#F5F5F5]">
                    A teoria ganha valor quando é transformada em leitura regulatória humana com tecnologia real.
                  </p>
                </div>
              </div>
              <div className="grid gap-5">
                <div className="relative min-h-[250px] overflow-hidden rounded-[32px] border border-white/10 bg-[#090909]">
                  <Image
                    src={brandAssets.media.tirhPresentation}
                    alt="Dr. Marcos apresentando a Teoria da Inteligência Regulatória Humana"
                    fill
                    className="object-cover object-top"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.08),rgba(5,5,5,0.72))]" />
                  <div className="absolute inset-x-5 bottom-5">
                    <p className="text-xs uppercase tracking-[0.28em] text-[#C9A34E]">Base científica proprietária</p>
                    <p className="mt-2 text-lg font-semibold text-[#F5F5F5]">
                      TIRH: teoria proprietária aplicada à operação.
                    </p>
                  </div>
                </div>
                <div className="relative min-h-[250px] overflow-hidden rounded-[32px] border border-white/10 bg-[#090909]">
                  <Image
                    src={brandAssets.brandBoard}
                    alt="Identidade oficial HUMANEXUS"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.16),rgba(5,5,5,0.78))]" />
                  <div className="absolute inset-x-5 bottom-5">
                    <p className="text-xs uppercase tracking-[0.28em] text-[#C9A34E]">Identidade oficial</p>
                    <p className="mt-2 text-lg font-semibold text-[#F5F5F5]">
                      Marca, aplicações e posicionamento premium institucional.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#080808]">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <Reveal>
            <SectionIntro
              eyebrow="Da teoria à operação"
              title="A arquitetura conceitual do HUMANEXUS começa na TIRH e termina em decisão operacional aplicada."
              description="Esta é a sequência que organiza a metodologia proprietária, a percepção de alto valor e a utilidade institucional do HUMANEXUS."
            />
          </Reveal>
          <div className="mt-12 grid gap-5 lg:grid-cols-4">
            {theoryFlow.map((item, index) => (
              <Reveal key={item.title} delay={index * 0.06}>
                <GlassCard accent={index === 0 ? "gold" : "soft"} title={`${item.step} — ${item.title}`} description={item.description} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.94fr_1.06fr] lg:items-start">
          <Reveal>
            <SectionIntro
              eyebrow="Problema operacional"
              title="O maior risco operacional nem sempre está no equipamento. Muitas vezes, ele começa na degradação adaptativa humana."
              description="Fadiga, sobrecarga cognitiva, pressão operacional, perda de consciência situacional e instabilidade funcional podem comprometer segurança, decisão e reputação antes de a organização perceber."
            />
          </Reveal>
          <Reveal delay={0.08}>
            <CardGrid
              items={[
                { title: "Fadiga operacional", description: "Desgaste silencioso que reduz estabilidade funcional." },
                { title: "Carga cognitiva operacional", description: "Exigência decisória, ambiguidade e pressão temporal." },
                { title: "Risco psicossocial operacional", description: "Vulnerabilidades humanas com impacto em segurança e performance." },
                { title: "Degradação adaptativa", description: "Perda progressiva de estabilidade sob pressão contínua." },
                { title: "Consciência situacional", description: "Queda de percepção aplicada e antecipação regulatória." },
                { title: "Tomada de decisão sob pressão", description: "Erro, custo interno e fragilidade humana em contexto crítico." }
              ]}
            />
          </Reveal>
        </div>
      </section>

      <section className="border-y border-white/10 bg-mesh-dark">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <Reveal>
            <SectionIntro
              eyebrow="Operacionalização"
              title="O HUMANEXUS converte teoria proprietária em leitura regulatória humana e ação institucional."
              description="A metodologia combina leitura operacional, monitoramento humano, simulação, protocolos e relatórios executivos para apoiar segurança operacional, fatores humanos e performance sustentável."
            />
          </Reveal>
          <Reveal delay={0.1} className="mt-12">
            <CardGrid items={solutionCards} />
          </Reveal>
          <Reveal delay={0.16} className="mt-12">
            <GlassCard accent="gold">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.32em] text-[#C9A34E]">Próximo passo institucional</p>
                  <h3 className="text-2xl font-semibold text-[#F5F5F5]">
                    Solicite uma apresentação institucional e avalie como a TIRH pode ser operacionalizada na sua organização.
                  </h3>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <PrimaryButton href="/contato">Solicitar apresentação institucional</PrimaryButton>
                  <SecondaryButton href="https://wa.me/5592981187777">Falar pelo WhatsApp</SecondaryButton>
                </div>
              </div>
            </GlassCard>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <Reveal>
          <SectionIntro
            eyebrow="Pilares"
            title="A narrativa institucional se ancora em estabilidade funcional, vetores humanos e performance sustentável."
            description="Os pilares do HUMANEXUS organizam o discurso de alto valor para liderança, segurança operacional, CRM, treinamento e desenvolvimento humano sob pressão."
          />
        </Reveal>
        <Reveal delay={0.1} className="mt-12">
          <CardGrid items={pillarCards} />
        </Reveal>
      </section>

      <section className="border-y border-white/10 bg-[#080808]">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <Reveal>
            <SectionIntro
              eyebrow="Tecnologia aplicada"
              title="EEG, HRV, cockpit, dashboards e modelagem vetorial a serviço da leitura regulatória humana."
              description="A tecnologia no HUMANEXUS não é espetáculo. Ela existe para ampliar leitura operacional, estabilidade cognitiva, análise de performance operacional e evidência executiva."
            />
          </Reveal>
          <div className="mt-12 grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <Reveal>
              <DashboardMock />
            </Reveal>
            <Reveal delay={0.08}>
              <CardGrid items={technologyItems} columns="lg:grid-cols-2" />
            </Reveal>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <Reveal>
          <SectionIntro
            eyebrow="Mercados de aplicação"
            title="Desenvolvido para organizações onde a estabilidade humana e a decisão sob pressão são variáveis estratégicas."
            description="Aviação, táxi aéreo, operações críticas, segurança pública, medicina, esporte de alta performance e ambientes corporativos sob elevada exigência."
          />
        </Reveal>
        <Reveal delay={0.1} className="mt-12">
          <CardGrid items={audiences} columns="lg:grid-cols-4" />
        </Reveal>
      </section>

      <section className="border-y border-white/10 bg-[#080808]">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <Reveal>
          <SectionIntro
            eyebrow="Valor institucional"
            title="O que sua organização compra quando contrata o HUMANEXUS?"
            description="Não é um software comum. É inteligência regulatória aplicada à segurança, à liderança e à performance humana sob pressão."
          />
          </Reveal>
          <Reveal delay={0.1} className="mt-12">
            <CardGrid items={benefitCards} columns="lg:grid-cols-3" />
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <Reveal>
          <SectionIntro
            eyebrow="Conexão regulatória"
            title="Mais que treinamento: uma camada estratégica para fatores humanos, segurança operacional e performance sustentável."
            description="O HUMANEXUS apoia organizações na estruturação de ações em fatores humanos, segurança operacional, gestão de fadiga, riscos psicossociais, ergonomia cognitiva, estabilidade adaptativa e tomada de decisão."
          />
        </Reveal>
        <Reveal delay={0.12} className="mt-10">
          <p className="max-w-4xl text-base leading-8 text-[#B8B8B8]">
            A metodologia apoia, fortalece, complementa, gera evidências, organiza ações e contribui
            para programas internos. Não substitui exigências legais ou auditorias.
          </p>
        </Reveal>
        <Reveal delay={0.18} className="mt-12">
          <CardGrid items={regulatoryCards} columns="lg:grid-cols-3" />
        </Reveal>
      </section>

      <section className="border-y border-white/10 bg-mesh-dark">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <Reveal>
            <SectionIntro
              eyebrow="Programas"
              title="Estruturas comerciais para entrada, expansão e recorrência institucional."
              description="Programas configurados para proposta institucional, escopo evolutivo e avanço para contratos premium."
            />
          </Reveal>
          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            {programCards.map((program, index) => (
              <Reveal key={program.name} delay={0.08 * index}>
                <GlassCard accent="gold" title={program.name} description={program.description}>
                  <ul className="space-y-3 text-sm text-[#B8B8B8]">
                    {program.items.map((item) => (
                      <li key={item} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                        {item}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6">
                    <PrimaryButton href="/contato">{program.cta}</PrimaryButton>
                  </div>
                </GlassCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <Reveal>
          <SectionIntro
            eyebrow="Autoridade"
            title="Base científica, experiência operacional e tecnologia proprietária."
            description="O HUMANEXUS foi estruturado a partir da Teoria da Inteligência Regulatória Humana, criada pelo Dr. Marcos Lázaro Pereira de Alcântara, integrando fatores humanos, modelagem regulatória e tecnologia aplicada à operação."
          />
        </Reveal>
        <Reveal delay={0.12} className="mt-12">
          <CardGrid items={authorityPoints} columns="lg:grid-cols-4" />
        </Reveal>
        <Reveal delay={0.16} className="mt-12">
          <div className="flex flex-col gap-4 sm:flex-row">
            <PrimaryButton href="/fundador">Conhecer a base científica do HUMANEXUS</PrimaryButton>
            <SecondaryButton href="/contato">Solicitar apresentação institucional</SecondaryButton>
          </div>
        </Reveal>
      </section>

      <section className="border-y border-white/10 bg-[#080808]">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <Reveal>
            <SectionIntro
              eyebrow="Prova visual"
              title="Do fundamento científico à presença operacional: materiais oficiais HUMANEXUS."
              description="Fotos reais, identidade oficial, simulação, aviação e presença institucional para aumentar autoridade, legitimidade e confiança comercial."
            />
          </Reveal>
          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {visualGallery.map((item, index) => (
              <Reveal key={item.title} delay={index * 0.05}>
                <GlassCard title={item.title} description={item.description}>
                  <div className="relative h-56 overflow-hidden rounded-[24px] border border-white/10">
                    <Image src={item.image} alt={item.title} fill className="object-cover" />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.12),rgba(5,5,5,0.68))]" />
                  </div>
                </GlassCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-[#080808]">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
          <Reveal>
            <GlassCard accent="gold">
              <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
                <div className="space-y-4">
                  <p className="text-xs uppercase tracking-[0.32em] text-[#C9A34E]">CTA final</p>
                  <h2 className="max-w-4xl text-3xl font-semibold leading-tight text-[#F5F5F5] md:text-5xl">
                    Se a sua organização opera sob pressão, o fator humano já precisa estar no nível da decisão estratégica.
                  </h2>
                  <p className="max-w-3xl text-lg text-[#B8B8B8]">
                    Solicite uma apresentação institucional do HUMANEXUS e conheça como a Teoria da
                    Inteligência Regulatória Humana pode ser operacionalizada com leitura regulatória,
                    tecnologia aplicada e desenvolvimento humano de alto valor.
                  </p>
                </div>
                <div className="flex flex-col gap-4 sm:flex-row lg:flex-col">
                  <PrimaryButton href="/contato">Solicitar apresentação institucional</PrimaryButton>
                  <SecondaryButton href="https://wa.me/5592981187777">Falar pelo WhatsApp</SecondaryButton>
                </div>
              </div>
            </GlassCard>
          </Reveal>
        </div>
      </section>
    </>
  );
}
