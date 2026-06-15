import Image from "next/image";
import { LoginMock, PageHero, SectionIntro } from "@/components/ui";
import { brandAssets } from "@/lib/brand-assets";

export default function LoginPage() {
  return (
    <>
      <PageHero
        eyebrow="Placeholder visual"
        title="Ambiente reservado do Instituto HUMANEXUS."
        description="Tela demonstrativa da futura área privada. Sem autenticação real e sem conexão com o sistema operacional."
        secondary={{ href: "/area-humanexus", label: "Voltar para Área HUMANEXUS" }}
      />
      <section className="mx-auto max-w-5xl px-6 py-20 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="space-y-8">
            <SectionIntro
              eyebrow="Mockup"
              title="Visual premium da futura entrada reservada."
              description="Placeholder preparado para uma camada privada futura, sem qualquer vínculo ativo nesta aplicação institucional."
            />
            <div className="relative min-h-[280px] overflow-hidden rounded-[30px] border border-white/10 bg-[#090909]">
              <Image src={brandAssets.media.instituteSpaceWide} alt="Identidade institucional do HUMANEXUS" fill className="object-cover" />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.14),rgba(5,5,5,0.76))]" />
            </div>
          </div>
          <LoginMock />
        </div>
      </section>
    </>
  );
}
