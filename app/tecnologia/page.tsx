import { CardGrid, DashboardMock, PageHero, SectionIntro } from "@/components/ui";
import { technologyBlocks } from "@/lib/site-data";

export default function TecnologiaPage() {
  return (
    <>
      <PageHero
        eyebrow="Tecnologia"
        title="Cockpit, biometria, dashboard e leitura regulatória em uma arquitetura visual premium."
        description="Página institucional para apresentar stack tecnológica sem expor o sistema real, mantendo a integração futura apenas como narrativa visual."
        primary={{ href: "/contato", label: "Solicitar apresentação institucional" }}
        secondary={{ href: "/area-humanexus", label: "Ver área HUMANEXUS" }}
      />
      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <SectionIntro
            eyebrow="Stack"
            title="Tecnologia aplicada ao fator humano, não tecnologia como espetáculo."
            description="Cockpit de simulação, EEG, HRV, dashboard, leitura regulatória, protocolos de simulação e relatórios executivos em linguagem institucional."
          />
          <DashboardMock />
        </div>
        <div className="mt-12">
          <CardGrid items={technologyBlocks} />
        </div>
      </section>
    </>
  );
}
