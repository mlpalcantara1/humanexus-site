import Image from "next/image";
import Link from "next/link";
import { brandAssets } from "@/lib/brand-assets";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#080808]">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-10 lg:flex-row lg:items-end lg:justify-between lg:px-8">
        <div className="space-y-4">
          <div className="relative h-16 w-40">
            <Image src={brandAssets.logoPremium} alt="Logo oficial HUMANEXUS" fill className="object-contain object-left" />
          </div>
          <div className="space-y-2 text-sm text-[#98A0AB]">
            <p>Instituto Humanexus de Performance Operacional LTDA</p>
            <p>Inteligência operacional humana para ambientes de alta criticidade.</p>
          </div>
        </div>
        <div className="flex flex-col items-start gap-3 lg:items-end">
          <Link
            href="/contato"
            className="inline-flex rounded-full border border-[#C9A34E]/18 bg-[#C9A34E]/10 px-4 py-2 text-sm text-[#F5F5F5] transition hover:border-[#C9A34E]/34 hover:bg-[#C9A34E]/14"
          >
            Contato
          </Link>
          <p className="text-xs uppercase tracking-[0.24em] text-[#6F7680]">Manaus · Amazonas · Brasil</p>
        </div>
      </div>
    </footer>
  );
}
