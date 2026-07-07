import Image from "next/image";
import Link from "next/link";
import { brandAssets } from "@/lib/brand-assets";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#080808]">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-10 lg:flex-row lg:items-end lg:justify-between lg:px-8">
        <div className="space-y-4">
          <div className="relative h-12 w-40 sm:h-14 sm:w-44">
            <Image src={brandAssets.logoPremium} alt="Logo oficial HUMANEXUS" fill className="object-contain object-left" />
          </div>
          <p className="max-w-md text-sm leading-7 text-[#98A0AB]">
            Instituto de Inteligência Regulatória Humana aplicado à segurança operacional, à liderança e ao desenvolvimento humano em ambientes de alta exigência.
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 text-sm text-[#98A0AB] lg:items-end">
          <Link href="mailto:contato@institutohumanexus.com" className="text-[#F5F5F5] transition hover:text-[#D4AF37]">
            contato@institutohumanexus.com
          </Link>
          <p className="text-xs uppercase tracking-[0.24em] text-[#6F7680]">Manaus · Amazonas · Brasil</p>
        </div>
      </div>
    </footer>
  );
}
