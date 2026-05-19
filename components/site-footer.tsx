import Image from "next/image";
import Link from "next/link";
import { brandAssets } from "@/lib/brand-assets";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#080808]">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 lg:grid-cols-[1.2fr_0.8fr] lg:px-8">
        <div className="space-y-5">
          <div className="relative h-24 w-44 overflow-hidden rounded-3xl border border-[#C9A34E]/20 bg-black/60">
            <Image src={brandAssets.logoPremium} alt="Logo oficial HUMANEXUS" fill className="object-contain p-2" />
          </div>
          <div className="space-y-2 text-sm text-[#98A0AB]">
            <p>Instituto Humanexus de Performance Operacional LTDA</p>
            <p>Inteligência operacional humana para ambientes de alta criticidade.</p>
            <p>Manaus - Amazonas</p>
            <p>Todos os direitos reservados.</p>
          </div>
        </div>
        <div className="space-y-4 lg:justify-self-end">
          <p className="text-sm uppercase tracking-[0.22em] text-[#F5F5F5]">Contato institucional</p>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <Link
              href="https://wa.me/5592981187777"
              target="_blank"
              rel="noreferrer"
              className="inline-flex rounded-full border border-[#C9A34E]/18 bg-[#C9A34E]/10 px-4 py-2 text-sm text-[#F5F5F5] transition hover:border-[#C9A34E]/34 hover:bg-[#C9A34E]/14"
            >
              Falar com o Instituto
            </Link>
            <Link
              href="mailto:contato@institutohumanexus.com"
              className="inline-flex rounded-full border border-white/10 px-4 py-2 text-sm text-[#F5F5F5] transition hover:border-[#C9A34E]/28 hover:bg-white/5"
            >
              Enviar e-mail institucional
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
