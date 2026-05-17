import { CardGrid, PageHero, SectionIntro } from "@/components/ui";
import { solutionPageCards } from "@/lib/site-data";

export default function SolucoesPage() {
  return (
    <>
      <PageHero
        eyebrow="Soluções"
        title="Programas e frentes de atuação para risco humano, performance e segurança operacional."
        description="Soluções comerciais organizadas para facilitar proposta institucional, reunião técnica e contratação por escopo."
        primary={{ href: "/contato", label: "Agendar conversa estratégica" }}
        secondary={{ href: "/aviation", label: "Conhecer Aviation" }}
      />
      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <SectionIntro
          eyebrow="Portfólio"
          title="Frentes comerciais centrais do HUMANEXUS."
          description="Cada solução pode ser apresentada isoladamente ou como parte de um programa institucional completo."
        />
        <div className="mt-12">
          <CardGrid items={solutionPageCards} />
        </div>
      </section>
    </>
  );
}
