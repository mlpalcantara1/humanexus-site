import { PremiumVideo } from "@/components/premium-video";
import { CardGrid, GlassCard, PageHero, PrimaryButton, SecondaryButton, SectionIntro } from "@/components/ui";
import { brandAssets } from "@/lib/brand-assets";
import { formationHighlights } from "@/lib/site-data";

const trainingTracks = [
  {
    title: "Formação HUMANEXUS",
    description: "Capacitação orientada a fatores humanos, performance sob pressão e posicionamento profissional de alto nível."
  },
  {
    title: "CRM aplicado",
    description: "Conteúdo e prática direcionados a coordenação, segurança operacional e tomada de decisão em ambientes de alta responsabilidade."
  },
  {
    title: "Desenvolvimento institucional",
    description: "Programas customizados para organizações que desejam elevar cultura operacional, progressão humana e maturidade decisória."
  }
];

export default function FormacaoPage() {
  return (
    <>
      <PageHero
        eyebrow="Formação"
        title="Formação HUMANEXUS para profissionais, equipes e organizações que operam sob pressão."
        description="Programas premium em fatores humanos, CRM, leitura operacional e performance cognitiva para ambientes críticos."
        primary={{ href: "/contato", label: "Solicitar agenda de formação" }}
        secondary={{ href: "https://wa.me/5592981187777", label: "Falar com especialista" }}
      />

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.04fr_0.96fr] lg:items-center">
          <PremiumVideo
            src={brandAssets.videos.formationCrm}
            poster={brandAssets.media.aviationTalk}
            eyebrow="Vídeo institucional"
            title="Formação, CRM e desenvolvimento com presença institucional forte."
            description="Um posicionamento visual alinhado a disciplina, profissionalismo e cultura operacional."
            className="min-h-[540px]"
            priority
          />
          <div className="space-y-8">
            <SectionIntro
              eyebrow="Experiência premium"
              title="A formação HUMANEXUS não parece curso comum. Parece padrão institucional de elite."
              description="A proposta visual e conceitual foi desenhada para empresas, operadores aéreos, lideranças e contextos que exigem maturidade técnica e percepção de alto valor."
            />
            <div className="grid gap-4">
              {formationHighlights.map((item) => (
                <GlassCard key={item.title} accent="gold" title={item.title} description={item.description} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#06080d]">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <SectionIntro
            eyebrow="Trilhas"
            title="Programas compactos e sofisticados para diferentes níveis de maturidade operacional."
            description="O site apresenta a direção da formação sem expor metodologias sensíveis, preservando exclusividade e valor percebido."
          />
          <div className="mt-12">
            <CardGrid items={trainingTracks} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="rounded-[34px] border border-white/10 bg-[#0A0C11]/94 p-8 shadow-panel sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.32em] text-[#C9A34E]">Próximo passo</p>
              <h2 className="text-3xl font-semibold text-[#F5F5F5]">
                Leve a Formação HUMANEXUS para sua equipe ou conheça a agenda institucional disponível.
              </h2>
              <p className="max-w-3xl text-base leading-8 text-[#B8B8B8]">
                O objetivo é transformar interesse em reunião e reunião em programa institucional, sem ruído e sem promessas superficiais.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <PrimaryButton href="/contato">Agendar Reunião Institucional</PrimaryButton>
              <SecondaryButton href="/servicos">Conhecer os Programas HUMANEXUS</SecondaryButton>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
