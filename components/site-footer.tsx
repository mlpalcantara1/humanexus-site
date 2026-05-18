import Image from "next/image";
import Link from "next/link";
import { brandAssets } from "@/lib/brand-assets";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#080808]">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 lg:grid-cols-[1.2fr_0.9fr_0.7fr] lg:px-8">
        <div className="space-y-4">
          <div className="relative h-24 w-44 overflow-hidden rounded-3xl border border-[#C9A34E]/24 bg-black/60">
            <Image src={brandAssets.logoPremium} alt="Logo oficial HUMANEXUS" fill className="object-contain p-2" />
          </div>
          <div className="space-y-2 text-sm text-[#B8B8B8]">
            <p>Instituto Humanexus de Performance Operacional LTDA</p>
            <p>O HUMANEXUS operacionaliza a Inteligência Regulatória Humana em ambientes de elevada exigência.</p>
            <p>Manaus - Amazonas</p>
            <p>humanexus.com</p>
            <p>Todos os direitos reservados.</p>
          </div>
        </div>
        <div className="space-y-4">
          <p className="text-sm uppercase tracking-[0.22em] text-[#F5F5F5]">Contato</p>
          <div className="space-y-2 text-sm text-[#B8B8B8]">
            <p>WhatsApp: (92) 98118-7777</p>
            <p>E-mail: contato@institutohumanexus.com</p>
            <p>Manaus - AM</p>
          </div>
        </div>
        <div className="space-y-4">
          <p className="text-sm uppercase tracking-[0.22em] text-[#F5F5F5]">Canal institucional</p>
          <Link
            href="mailto:contato@institutohumanexus.com"
            className="inline-flex rounded-full border border-white/10 px-4 py-2 text-sm text-[#F5F5F5] transition hover:border-[#C9A34E]/40 hover:bg-white/5"
          >
            contato@institutohumanexus.com
          </Link>
        </div>
      </div>
    </footer>
  );
}
