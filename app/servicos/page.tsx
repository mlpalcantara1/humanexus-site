import { CardGrid, GlassCard, PageHero, PrimaryButton, SecondaryButton, SectionIntro } from "@/components/ui";
import {
  programCards,
  psychosocialAudiences,
  psychosocialDeliverables,
  psychosocialPainCards,
  psychosocialSolutionCards,
  serviceHighlights
} from "@/lib/site-data";

const sectors = [
  "Aviação e táxi aéreo",
  "Segurança operacional",
  "Forças de segurança",
  "Medicina de alta demanda",
  "Lideranças e equipes críticas",
  "Organizações de alta responsabilidade"
];

export default function ServicosPage() {
  const psychosocialProgram = programCards.find((item) =>
    item.name.includes("Riscos Psicossociais e Estabilidade Operacional")
  );

  return (
    <>
      <PageHero
        eyebrow="Programas HUMANEXUS"
        title="Uma estrutura contínua para organizações que precisam tratar performance humana com rigor estratégico."
        description="Programas compactos, objetivos e sofisticados para fortalecer fatores humanos, leitura operacional, CRM, estabilidade adaptativa e desenvolvimento de equipes sob pressão."
        primary={{ href: "/contato", label: "Implementar o Programa HUMANEXUS" }}
        secondary={{ href: "/contato", label: "Solicitar Avaliação Estratégica" }}
      />

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <SectionIntro
          eyebrow="Estruturas de desenvolvimento"
          title="Programas desenhados para transmitir valor institucional, continuidade e utilidade operacional."
          description="A comunicação pública do HUMANEXUS mostra resultado, maturidade e exclusividade sem revelar a engenharia profunda do sistema."
        />
        <div className="mt-12">
          <CardGrid items={serviceHighlights} columns="xl:grid-cols-4" />
        </div>
      </section>

      {psychosocialProgram ? (
        <section className="border-y border-white/10 bg-[#06080d]">
          <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
              <SectionIntro
                eyebrow="Programa contínuo"
                title={psychosocialProgram.name}
                description={psychosocialProgram.description}
              />
              <GlassCard accent="gold">
                <div className="space-y-4">
                  <p className="text-xs uppercase tracking-[0.32em] text-[#C9A34E]">Aplicações</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {psychosocialProgram.items.map((item) => (
                      <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-[#F5F5F5]">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </GlassCard>
            </div>
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <SectionIntro
          eyebrow="Riscos e vulnerabilidades"
          title="Onde o HUMANEXUS apoia organizações a estruturar ações contínuas."
          description="O programa foi desenhado para ambientes em que fatores humanos, risco psicossocial, fadiga e pressão decisória precisam ser tratados com acompanhamento, evidência e progressão."
        />
        <div className="mt-12">
          <CardGrid items={psychosocialPainCards} columns="xl:grid-cols-5" />
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#05070b]">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <SectionIntro
            eyebrow="Soluções HUMANEXUS"
            title="Estrutura aplicada para leitura regulatória humana, estabilidade funcional e fortalecimento institucional."
            description="O HUMANEXUS apoia, organiza e complementa programas internos com ações contínuas voltadas à prevenção, desenvolvimento humano operacional e performance sustentável."
          />
          <div className="mt-12">
            <CardGrid items={psychosocialSolutionCards} columns="xl:grid-cols-5" />
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#06080d]">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.94fr_1.06fr] lg:items-start">
            <SectionIntro
              eyebrow="Aplicação"
              title="Programas voltados a setores em que o erro humano tem custo operacional, reputacional e estratégico."
              description="A proposta do Instituto HUMANEXUS é modular, institucional e adequada a reuniões executivas, implementação por ciclo e jornadas recorrentes."
            />
            <div className="grid gap-4 sm:grid-cols-2">
              {sectors.map((item) => (
                <GlassCard key={item} accent="gold" description={item} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_1fr]">
          <div>
            <SectionIntro
              eyebrow="O que o HUMANEXUS entrega"
              title="Uma trilha institucional de acompanhamento, leitura e desenvolvimento."
              description="Sem substituir exigências legais, auditorias ou programas formais internos, o HUMANEXUS contribui para organizar ações contínuas, gerar evidências e fortalecer a gestão do fator humano."
            />
            <div className="mt-12">
              <CardGrid items={psychosocialDeliverables} columns="xl:grid-cols-2" />
            </div>
          </div>
          <div>
            <SectionIntro
              eyebrow="Para quem"
              title="Organizações e equipes que precisam transformar instabilidade humana em estrutura operacional."
              description="A proposta se encaixa em ambientes críticos que demandam leitura aplicada, progressão longitudinal e reforço de cultura operacional."
            />
            <div className="mt-12">
              <CardGrid items={psychosocialAudiences} columns="xl:grid-cols-2" />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="rounded-[34px] border border-[#C9A34E]/20 bg-[#0A0C11]/94 p-8 shadow-gold sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.32em] text-[#C9A34E]">Conversa comercial</p>
              <h2 className="text-3xl font-semibold text-[#F5F5F5]">
                O formato correto de avançar é uma conversa sobre risco humano, jornada regulatória e implementação institucional.
              </h2>
              <p className="max-w-3xl text-base leading-8 text-[#B8B8B8]">
                O HUMANEXUS foi desenhado para gerar confiança imediata, percepção premium e decisão executiva, não para parecer uma entrega genérica ou avulsa.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <PrimaryButton href="/contato">Implementar o Programa HUMANEXUS</PrimaryButton>
              <SecondaryButton href="/contato">Solicitar Avaliação Estratégica</SecondaryButton>
              <SecondaryButton href="https://wa.me/5592981187777">Agendar Reunião Institucional</SecondaryButton>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
