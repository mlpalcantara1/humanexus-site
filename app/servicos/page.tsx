import { CardGrid, GlassCard, PageHero, SectionIntro } from "@/components/ui";

const programCards = [
  {
    title: "Programa HUMANEXUS de Desenvolvimento Humano Operacional",
    description: "Estrutura contínua para estabilidade humana, cultura operacional, liderança e capacidade decisória em ambientes críticos."
  },
  {
    title: "Riscos Psicossociais e Estabilidade Operacional",
    description: "Programa recorrente para vulnerabilidades humanas, carga operacional, práticas preventivas e evidências institucionais."
  },
  {
    title: "Formação em Fatores Humanos, CRM e Liderança",
    description: "Capacitação premium para equipes que precisam elevar coordenação, disciplina operacional e cultura de segurança."
  },
  {
    title: "Pesquisa Aplicada e Inteligência Regulatória Humana",
    description: "Camada conceitual e executiva para organizações que desejam sustentar seus programas com base proprietária."
  },
  {
    title: "Núcleo Aviation HUMANEXUS",
    description: "Aplicação orientada a operadores aéreos, táxi aéreo, equipes de voo, gestores e segurança operacional."
  }
];

const programStructure = [
  {
    title: "Objetivo",
    description: "Transformar o fator humano em capacidade estratégica por meio de acompanhamento, leitura operacional e desenvolvimento contínuo."
  },
  {
    title: "Para quem",
    description: "Organizações críticas, operadores aéreos, lideranças operacionais, saúde, segurança e ambientes de alta responsabilidade."
  },
  {
    title: "Entregas",
    description: "Leitura institucional, relatórios executivos, protocolos HUMANEXUS, formação, reuniões de devolutiva e progressão longitudinal."
  },
  {
    title: "Resultado esperado",
    description: "Mais estabilidade, clareza decisória, fortalecimento de cultura operacional e maior maturidade humana em contexto de missão."
  }
];

const applicationAreas = [
  "Aviação e táxi aéreo",
  "Segurança operacional",
  "Riscos psicossociais",
  "CRM e coordenação crítica",
  "Liderança sob pressão",
  "Organizações de alta responsabilidade"
];

export default function ServicosPage() {
  return (
    <>
      <PageHero
        eyebrow="Programas HUMANEXUS"
        title="Uma estrutura recorrente para organizações que precisam tratar performance humana com rigor institucional."
        description="O HUMANEXUS não vende intervenção avulsa. Ele implementa programas contínuos de desenvolvimento humano operacional."
        primary={{ href: "/contato", label: "Agendar Reunião Institucional" }}
      />

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <SectionIntro
          eyebrow="Portfólio institucional"
          title="Programas desenhados para contratos recorrentes, confiança executiva e aplicação real."
          description="Cada núcleo foi concebido para sustentar desenvolvimento longitudinal, não entrega pontual."
        />
        <div className="mt-12">
          <CardGrid items={programCards} columns="xl:grid-cols-3" />
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#06080d]">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.88fr_1.12fr] lg:items-start">
            <SectionIntro
              eyebrow="Arquitetura do programa"
              title="Pouco ruído. Estrutura clara. Valor institucional alto."
              description="O HUMANEXUS organiza a relação com o cliente em torno de objetivo, contexto, acompanhamento e resultados observáveis."
            />
            <div className="grid gap-4 sm:grid-cols-2">
              {programStructure.map((item, index) => (
                <GlassCard key={item.title} accent={index === 0 ? "gold" : "soft"} title={item.title} description={item.description} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-start">
          <div className="space-y-8">
            <SectionIntro
              eyebrow="Aplicações"
              title="Projetado para setores em que a instabilidade humana se converte rapidamente em risco operacional."
              description="O Instituto atua em contextos nos quais liderança, tomada de decisão, coordenação e cultura de segurança precisam ser tratadas com método e continuidade."
            />
            <div className="grid gap-3 sm:grid-cols-2">
              {applicationAreas.map((item, index) => (
                <GlassCard key={item} accent={index === 0 ? "gold" : "soft"} description={item} />
              ))}
            </div>
          </div>
          <GlassCard accent="gold">
            <div className="space-y-4">
              <p className="text-[10px] uppercase tracking-[0.32em] text-[#C9A34E]">Direção comercial</p>
              <h2 className="text-3xl font-semibold leading-tight text-[#F5F5F5]">
                A decisão correta não é contratar um serviço isolado. É implementar uma jornada operacional.
              </h2>
              <p className="text-base leading-8 text-[#9EA3AE]">
                O posicionamento do HUMANEXUS é recorrente, institucional e orientado a construção de capacidade humana em médio e longo prazo.
              </p>
            </div>
          </GlassCard>
        </div>
      </section>
    </>
  );
}
