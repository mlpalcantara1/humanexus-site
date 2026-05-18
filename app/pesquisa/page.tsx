import { PremiumVideo } from "@/components/premium-video";
import { CardGrid, GlassCard, PageHero, PrimaryButton, SecondaryButton, SectionIntro } from "@/components/ui";
import { brandAssets, theoryFlow } from "@/lib/brand-assets";
import { researchHighlights } from "@/lib/site-data";

export default function PesquisaPage() {
  return (
    <>
      <PageHero
        eyebrow="Pesquisa"
        title="Ciência aplicada apresentada com sofisticação, discrição e autoridade."
        description="O HUMANEXUS comunica Inteligência Regulatória Humana, EEG operacional e adaptação sob pressão em um tom institucional e científico premium, sem expor estruturas sensíveis."
        primary={{ href: "/contato", label: "Agendar Reunião Institucional" }}
        secondary={{ href: "/sobre", label: "Conhecer o Instituto" }}
      />

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.94fr_1.06fr] lg:items-center">
          <div className="space-y-8">
            <SectionIntro
              eyebrow="Arquitetura conceitual"
              title="A comunicação pública da pesquisa mostra profundidade suficiente para gerar confiança, sem abrir a engenharia proprietária."
              description="A área de pesquisa posiciona o HUMANEXUS como organização avançada: sofisticada, científica, difícil de replicar e claramente voltada a performance humana em ambientes críticos."
            />
            <div className="grid gap-4">
              {[
                "Inteligência Regulatória Humana apresentada como núcleo conceitual do Instituto.",
                "EEG operacional, estabilidade funcional e variabilidade humana em linguagem institucional.",
                "Ênfase em ciência aplicada e utilidade operacional, não em excesso de jargão técnico."
              ].map((item) => (
                <GlassCard key={item} accent="gold" description={item} />
              ))}
            </div>
          </div>
          <PremiumVideo
            src={brandAssets.videos.instituteSignature}
            poster={brandAssets.media.tirhPresentation}
            eyebrow="Ciência aplicada"
            title="Pesquisa como posicionamento de autoridade, não como vitrine acadêmica excessiva."
            description="Conteúdo científico apresentado com visual premium, proteção de propriedade intelectual e foco em legitimidade institucional."
            className="min-h-[520px]"
          />
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#06080d]">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <SectionIntro
            eyebrow="Conceitos-chave"
            title="Leitura regulatória humana, estabilidade funcional e adaptação operacional."
            description="Conceitos suficientes para transmitir profundidade, sem revelar modelagens, pipelines ou estruturas matemáticas internas."
          />
          <div className="mt-12">
            <CardGrid items={researchHighlights} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <SectionIntro
          eyebrow="Estrutura"
          title="Da Inteligência Regulatória Humana à operação."
          description="O site mostra a sequência lógica da proposta HUMANEXUS em um formato elegante, enxuto e confiável."
        />
        <div className="mt-12 grid gap-5 lg:grid-cols-4">
          {theoryFlow.map((item, index) => (
            <GlassCard
              key={item.title}
              accent={index === 0 ? "gold" : "soft"}
              title={`${item.step} — ${item.title}`}
              description={item.description}
            />
          ))}
        </div>
        <div className="mt-12 flex flex-col gap-4 sm:flex-row">
          <PrimaryButton href="/contato">Agendar Reunião Institucional</PrimaryButton>
          <SecondaryButton href="/formacao">Conhecer Formação HUMANEXUS</SecondaryButton>
        </div>
      </section>
    </>
  );
}
