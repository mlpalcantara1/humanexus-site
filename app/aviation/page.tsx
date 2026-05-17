import Image from "next/image";
import { CardGrid, GlassCard, PageHero, PrimaryButton, SecondaryButton, SectionIntro } from "@/components/ui";
import { brandAssets } from "@/lib/brand-assets";
import { aviationPainPoints } from "@/lib/site-data";

export default function AviationPage() {
  const aviationCommercialSignals = [
    "Táxi aéreo e operadores com pressão real por segurança, escala, fadiga e decisão",
    "Material para DSO, gestão operacional, liderança e programas internos de fatores humanos",
    "Entrega orientada a proposta institucional, reunião técnica e ciclo de desenvolvimento"
  ];

  return (
    <>
      <PageHero
        eyebrow="HUMANEXUS Aviation"
        title="Fatores humanos, segurança operacional e performance para táxi aéreo, operadores e ambientes de voo sob pressão."
        description="Página comercial para decisores da aviação que precisam reduzir vulnerabilidades humanas, fortalecer cultura operacional e elevar a consistência da decisão em voo e em solo."
        primary={{ href: "/contato", label: "Solicitar reunião para operadores aéreos" }}
        secondary={{ href: "https://wa.me/5592981187777", label: "Falar com especialista em Aviation" }}
      />
      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <SectionIntro
          eyebrow="Aviação"
          title="Uma oferta feita para operações em que a degradação humana pode comprometer segurança, reputação e continuidade."
          description="O foco aqui é táxi aéreo, operação aérea, DSO, gestores, pilotos e tripulações que precisam de leitura regulatória humana, evidência e ação."
        />
        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {aviationCommercialSignals.map((item) => (
            <GlassCard key={item} accent="gold" description={item} />
          ))}
        </div>
        <div className="relative mt-12 min-h-[360px] overflow-hidden rounded-[32px] border border-white/10 bg-[#090909]">
          <Image
            src={brandAssets.media.aviationTalk}
            alt="Aplicação do HUMANEXUS em contexto aeronáutico"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,5,5,0.78),rgba(5,5,5,0.24))]" />
          <div className="absolute inset-y-0 left-0 flex max-w-2xl items-center p-8">
            <div className="space-y-4 rounded-[28px] border border-white/10 bg-[#050505]/70 p-6 backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.3em] text-[#C9A34E]">TIRH na aviação</p>
              <h3 className="text-2xl font-semibold text-[#F5F5F5]">
                O HUMANEXUS operacionaliza a Teoria da Inteligência Regulatória Humana para fortalecer segurança operacional, consciência situacional e estabilidade sob pressão.
              </h3>
            </div>
          </div>
        </div>
        <div className="mt-12">
          <CardGrid items={aviationPainPoints} />
        </div>
        <div className="mt-12 grid gap-6 rounded-[30px] border border-[#C9A34E]/22 bg-[#0B0B0B]/92 p-7 shadow-gold lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-[#C9A34E]">Para táxi aéreo e operadores</p>
            <h3 className="text-2xl font-semibold text-[#F5F5F5]">
              Se a sua organização depende de pilotos, tripulações e decisão rápida, o risco humano precisa entrar na mesa executiva.
            </h3>
            <p className="max-w-3xl text-base text-[#B8B8B8]">
              O HUMANEXUS apoia leitura regulatória humana, desenvolvimento, modelagem vetorial e fortalecimento institucional com linguagem compatível com operação aérea.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <PrimaryButton href="/contato">Solicitar reunião para operadores aéreos</PrimaryButton>
            <SecondaryButton href="https://wa.me/5592981187777">
              Falar no WhatsApp agora
            </SecondaryButton>
          </div>
        </div>
      </section>
    </>
  );
}
