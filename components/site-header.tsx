"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { brandAssets } from "@/lib/brand-assets";
import { navigation } from "@/lib/site-data";

function isActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === href;
  }
  return pathname.startsWith(href);
}

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050505]/85 backdrop-blur-xl">
      <div className="border-b border-[#C9A34E]/18 bg-[#0A0A0A]">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-2 text-[11px] uppercase tracking-[0.22em] text-[#C9A34E] sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <span>Agenda institucional para aviação, táxi aéreo e operações críticas</span>
          <Link href="/contato" className="text-[#F5F5F5] transition hover:text-[#C9A34E]">
            Solicitar reunião estratégica
          </Link>
        </div>
      </div>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4 lg:px-8">
        <Link href="/" className="flex items-center gap-4">
          <div className="relative h-14 w-28 overflow-hidden rounded-2xl border border-[#C9A34E]/24 bg-black/55 shadow-gold">
            <Image src={brandAssets.logo} alt="HUMANEXUS" fill className="object-contain p-1.5" />
          </div>
          <div>
            <p className="font-semibold uppercase tracking-[0.28em] text-[#F5F5F5]">
              HUMANEXUS
            </p>
            <p className="text-xs text-[#B8B8B8]">
              Teoria da Inteligência Regulatória Humana
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 lg:flex">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-full px-4 py-2 text-sm transition ${
                isActive(pathname, item.href)
                  ? "bg-[#C9A34E]/14 text-[#F5F5F5]"
                  : "text-[#B8B8B8] hover:bg-white/5 hover:text-[#F5F5F5]"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/contato"
            className="hidden rounded-full border border-[#C9A34E]/24 bg-white/[0.03] px-4 py-2 text-sm text-[#F5F5F5] transition hover:border-[#C9A34E]/50 hover:bg-white/5 lg:inline-flex"
          >
            Solicitar apresentação institucional
          </Link>
          <Link
            href="https://wa.me/5592981187777"
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-[#C9A34E] px-4 py-2 text-sm font-semibold text-[#050505] shadow-gold transition hover:bg-[#d6b56a]"
          >
            WhatsApp imediato
          </Link>
        </div>
      </div>
    </header>
  );
}
