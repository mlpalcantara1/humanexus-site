import { CardGrid, GlassCard, PageHero, PrimaryButton, SecondaryButton, SectionIntro } from "@/components/ui";
import { serviceHighlights } from "@/lib/site-data";

const sectors = [
  "Aviação e táxi aéreo",
  "Segurança operacional",
  "Forças de segurança",
  "Medicina de alta demanda",
  "Lideranças e equipes críticas",
  "Organizações de alta responsabilidade"
];

export default function ServicosPage() {
  return (
    <>
      <PageHero
        eyebrow="Serviços"
        title="Uma oferta premium para organizações que precisam tratar performance humana com rigor estratégico."
        description="Serviços compactos, objetivos e sofisticados para fortalecer fatores humanos, leitura operacional, CRM e desenvolvimento de equipes sob pressão."
        primary={{ href: "/contato", label: "Solicitar proposta institucional" }}
        secondary={{ href: "/formacao", label: "Conhecer Formação HUMANEXUS" }}
      />

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <SectionIntro
          eyebrow="Portfólio principal"
          title="Soluções desenhadas para transmitir valor institucional e utilidade operacional."
          description="A comunicação pública do HUMANEXUS mostra resultado, maturidade e exclusividade sem revelar a engenharia profunda do sistema."
        />
        <div className="mt-12">
          <CardGrid items={serviceHighlights} columns="xl:grid-cols-4" />
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#06080d]">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.94fr_1.06fr] lg:items-start">
            <SectionIntro
              eyebrow="Aplicação"
              title="Serviços voltados a setores em que o erro humano tem custo operacional, reputacional e estratégico."
              description="A proposta do Instituto HUMANEXUS é modular, institucional e adequada a reuniões executivas, contratos por escopo e programas recorrentes."
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
        <div className="rounded-[34px] border border-[#C9A34E]/20 bg-[#0A0C11]/94 p-8 shadow-gold sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.32em] text-[#C9A34E]">Conversa comercial</p>
              <h2 className="text-3xl font-semibold text-[#F5F5F5]">
                O formato correto de avançar é uma conversa sobre risco humano, escopo e oportunidade institucional.
              </h2>
              <p className="max-w-3xl text-base leading-8 text-[#B8B8B8]">
                O HUMANEXUS foi desenhado para gerar confiança imediata, percepção premium e decisão executiva, não para competir em preço com soluções genéricas.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <PrimaryButton href="/contato">Agendar Avaliação</PrimaryButton>
              <SecondaryButton href="https://wa.me/5592981187777">Falar no WhatsApp</SecondaryButton>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
