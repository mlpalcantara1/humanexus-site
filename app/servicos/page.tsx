import { CardGrid, GlassCard, PageHero, SectionIntro } from "@/components/ui";

const programs = [
  {
    title: "Aviação",
    description: "Segurança operacional, fatores humanos avançados, SGSO, prontidão operacional e desenvolvimento de tripulantes."
  },
  {
    title: "Empresas",
    description: "Liderança, pressão decisória, confiabilidade humana e desenvolvimento organizacional contínuo."
  },
  {
    title: "Saúde",
    description: "Resposta humana sob alta exigência, carga mental, estabilidade e segurança assistencial."
  },
  {
    title: "Segurança Pública",
    description: "Tomada de decisão, resistência à pressão e desempenho humano em ambientes críticos."
  }
];

const deliveries = [
  {
    title: "Objetivo",
    description: "Fortalecer confiabilidade humana, capacidade decisória e maturidade operacional."
  },
  {
    title: "Estrutura",
    description: "Programa contínuo, protocolos HUMANEXUS, leitura institucional e acompanhamento longitudinal."
  },
  {
    title: "Entregas",
    description: "Relatórios executivos, sessões estruturadas, indicadores e reuniões de devolutiva."
  },
  {
    title: "Resultado esperado",
    description: "Mais clareza, estabilidade, desenvolvimento de operadores e fortalecimento de cultura operacional."
  }
];

export default function ServicosPage() {
  return (
    <>
      <PageHero
        eyebrow="Programa"
        title="Programa contínuo para fortalecer a resposta humana em operações críticas."
        description="O HUMANEXUS não vende consultoria avulsa. Ele implementa uma estrutura recorrente de leitura, desenvolvimento e acompanhamento da resposta humana."
        primary={{ href: "/contato", label: "Agendar Reunião Institucional" }}
      />

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <SectionIntro
          eyebrow="Áreas de atuação"
          title="Programas desenhados para contratos recorrentes e decisão institucional."
          description="Cada frente do HUMANEXUS foi organizada para operar com reserva, continuidade e aderência a ambientes de alta responsabilidade."
        />
        <div className="mt-12">
          <CardGrid items={programs} columns="xl:grid-cols-4" />
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#06080d]">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.86fr_1.14fr] lg:items-start">
            <SectionIntro
              eyebrow="Estrutura do programa"
              title="Uma jornada institucional com início claro, continuidade e leitura executiva."
              description="O cliente entra em um programa que organiza desenvolvimento, acompanhamento e fortalecimento da operação humana com método."
            />
            <div className="grid gap-4 sm:grid-cols-2">
              {deliveries.map((item, index) => (
                <GlassCard key={item.title} accent={index === 0 ? "gold" : "soft"} title={item.title} description={item.description} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
