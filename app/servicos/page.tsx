import Image from "next/image";
import { CardGrid, GlassCard, PageHero, SectionIntro } from "@/components/ui";
import { brandAssets } from "@/lib/brand-assets";

const programs = [
  {
    title: "Desenvolvimento Humano Operacional",
    description: "Programa longitudinal para fortalecer estabilidade humana, confiabilidade operacional e capacidade decisória."
  },
  {
    title: "Riscos Psicossociais e Estabilidade Operacional",
    description: "Estrutura contínua para leitura de vulnerabilidades humanas, pressão operacional e maturidade preventiva."
  },
  {
    title: "Operações Aeromédicas e Aviação Operacional",
    description: "Acompanhamento aplicado a operadores aéreos, equipes críticas e cenários em que missão, tempo e risco caminham juntos."
  },
  {
    title: "Liderança sob Pressão",
    description: "Desenvolvimento de lideranças responsáveis por ambientes em que erro humano tem alto custo operacional e institucional."
  },
  {
    title: "Pesquisa Aplicada e Desenvolvimento Institucional",
    description: "Frente estratégica para organizações que precisam consolidar conhecimento, continuidade e maturidade operacional."
  }
];

const deliveries = [
  {
    title: "Segurança Operacional",
    description: "Fortalecimento da capacidade humana em ambientes de alta responsabilidade."
  },
  {
    title: "Desenvolvimento Contínuo",
    description: "Programas estruturados para evolução individual e institucional."
  },
  {
    title: "Riscos Psicossociais",
    description: "Apoio às iniciativas relacionadas à NR-1 e NR-17."
  },
  {
    title: "Tomada de Decisão",
    description: "Informações relevantes para acompanhamento institucional."
  },
  {
    title: "Treinamento Aplicado",
    description: "Desenvolvimento supervisionado para contextos operacionais complexos."
  },
  {
    title: "Acompanhamento Longitudinal",
    description: "Monitoramento contínuo da evolução organizacional."
  }
];

export default function ServicosPage() {
  return (
    <>
      <PageHero
        eyebrow="Programas HUMANEXUS"
        title="Programas contínuos para organizações que operam sob exigência real."
        description="O HUMANEXUS não oferece entrega avulsa. Ele estrutura programas contínuos para segurança operacional, desenvolvimento institucional e estabilidade humana."
      />

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <SectionIntro
          eyebrow="Portfólio institucional"
          title="Frentes desenhadas para contratos recorrentes, ambientes críticos e decisão de alto nível."
          description="Cada programa foi organizado para suportar operação, liderança, segurança e evolução institucional com reserva e consistência."
        />
        <div className="mt-12">
          <CardGrid items={programs} columns="xl:grid-cols-3" />
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#06080d]">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.96fr_1.04fr] lg:items-center">
            <div className="space-y-8">
              <SectionIntro
                eyebrow="O que o HUMANEXUS entrega"
                title="Entregas institucionais para decisão, prevenção e continuidade."
                description="A estrutura foi desenhada para apoiar organizações críticas sem expor mecanismo, lógica interna ou ativos proprietários."
              />
              <div className="grid gap-3 sm:grid-cols-2">
                {deliveries.map((item, index) => (
                  <GlassCard key={item.title} accent={index === 0 ? "gold" : "soft"} title={item.title} description={item.description} />
                ))}
              </div>
            </div>

            <div className="relative min-h-[560px] overflow-hidden rounded-[30px] border border-white/10 bg-[#090909] shadow-panel">
              <Image
                src={brandAssets.media.founderOperationalBriefing}
                alt="Sessão institucional do HUMANEXUS em ambiente reservado"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.06),rgba(5,5,5,0.84))]" />
              <div className="absolute inset-x-6 bottom-6 rounded-[24px] border border-white/10 bg-[#050505]/70 p-5 backdrop-blur-xl">
                <p className="text-[10px] uppercase tracking-[0.32em] text-[#D4AF37]">Estrutura aplicada</p>
                <p className="mt-3 text-sm leading-7 text-[#E1E5EB]">
                  Desenvolvimento humano operacional organizado para continuidade, supervisão institucional e fortalecimento da operação.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
