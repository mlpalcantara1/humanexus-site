import Image from "next/image";
import { CardGrid, LoginMock, PageHero, PrimaryButton, SectionIntro } from "@/components/ui";
import { brandAssets } from "@/lib/brand-assets";
import { areaProfiles } from "@/lib/site-data";

export default function AreaHumanexusPage() {
  return (
    <>
      <PageHero
        eyebrow="Área HUMANEXUS"
        title="Um ambiente reservado para relacionamento institucional e acompanhamento privado."
        description="Área demonstrativa, sem autenticação real e sem qualquer acesso ao sistema operacional do HUMANEXUS."
        primary={{ href: "/login", label: "Acessar área reservada" }}
        secondary={{ href: "/contato", label: "Fale Conosco" }}
      />
      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <SectionIntro
              eyebrow="Perfis"
              title="Perfis previstos para relacionamento institucional."
              description="Página comercial para representar o ambiente reservado do Instituto, sem exposição de lógica interna, método proprietário ou recurso reservado."
            />
            <div className="mt-12">
              <CardGrid items={areaProfiles} columns="lg:grid-cols-1" />
            </div>
            <div className="mt-10">
              <PrimaryButton href="/login">Acessar área reservada</PrimaryButton>
            </div>
            <div className="relative mt-10 min-h-[260px] overflow-hidden rounded-[30px] border border-white/10 bg-[#090909]">
              <Image src={brandAssets.media.instituteSpaceFront} alt="Ambiente institucional do HUMANEXUS" fill className="object-cover" />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.14),rgba(5,5,5,0.76))]" />
              <div className="absolute inset-x-5 bottom-5 rounded-[22px] border border-white/10 bg-[#050505]/72 px-5 py-4 text-sm text-[#B8B8B8]">
                Área demonstrativa para representar a camada reservada de relacionamento institucional do HUMANEXUS.
              </div>
            </div>
          </div>
          <LoginMock />
        </div>
      </section>
    </>
  );
}
