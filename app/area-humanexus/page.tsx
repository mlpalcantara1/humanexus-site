import Image from "next/image";
import { CardGrid, LoginMock, PageHero, PrimaryButton, SectionIntro } from "@/components/ui";
import { brandAssets } from "@/lib/brand-assets";
import { areaProfiles } from "@/lib/site-data";

export default function AreaHumanexusPage() {
  return (
    <>
      <PageHero
        eyebrow="Área HUMANEXUS"
        title="Um ambiente exclusivo para operadores, especialistas e organizações acompanharem programas, protocolos, indicadores e evolução da performance operacional."
        description="Área privada apenas demonstrativa, sem autenticação real e sem integração com o sistema principal."
        primary={{ href: "/login", label: "Acessar plataforma" }}
        secondary={{ href: "/contato", label: "Solicitar apresentação institucional" }}
      />
      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <SectionIntro
              eyebrow="Perfis"
              title="Três camadas de relacionamento com a futura plataforma."
              description="Página comercial para vender visão de ecossistema, não uma integração real."
            />
            <div className="mt-12">
              <CardGrid items={areaProfiles} columns="lg:grid-cols-1" />
            </div>
            <div className="mt-10">
              <PrimaryButton href="/login">Acessar plataforma</PrimaryButton>
            </div>
            <div className="relative mt-10 min-h-[260px] overflow-hidden rounded-[30px] border border-white/10 bg-[#090909]">
              <Image src={brandAssets.brandBoard} alt="Ecossistema visual oficial HUMANEXUS" fill className="object-cover" />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.14),rgba(5,5,5,0.76))]" />
              <div className="absolute inset-x-5 bottom-5 rounded-[22px] border border-white/10 bg-[#050505]/72 px-5 py-4 text-sm text-[#B8B8B8]">
                Área demonstrativa para representar a futura interface entre teoria, leitura regulatória humana, protocolos e indicadores operacionais.
              </div>
            </div>
          </div>
          <LoginMock />
        </div>
      </section>
    </>
  );
}
