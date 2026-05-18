"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
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
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050505]/85 backdrop-blur-xl">
      <div className="border-b border-[#C9A34E]/18 bg-[#0A0A0A]">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-2 text-[11px] uppercase tracking-[0.22em] text-[#C9A34E] sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <span>Programa contínuo de desenvolvimento humano operacional para ambientes críticos</span>
          <Link href="/contato" className="text-[#F5F5F5] transition hover:text-[#C9A34E]">
            Agendar reunião institucional
          </Link>
        </div>
      </div>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4 lg:px-8">
        <Link href="/" className="group flex items-center gap-4">
          <div className="relative h-[74px] w-[152px] overflow-hidden rounded-[26px] border border-[#C9A34E]/30 bg-[linear-gradient(180deg,rgba(8,8,12,0.92),rgba(5,5,5,0.92))] shadow-[0_0_44px_rgba(201,163,78,0.14)] transition duration-300 group-hover:border-[#C9A34E]/56 group-hover:shadow-[0_0_62px_rgba(201,163,78,0.22)] sm:h-[84px] sm:w-[176px]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(201,163,78,0.18),transparent_36%)]" />
            <Image src={brandAssets.logo} alt="HUMANEXUS" fill className="object-contain p-2" />
          </div>
          <div className="space-y-1">
            <p className="font-semibold uppercase tracking-[0.36em] text-[#F5F5F5] transition group-hover:text-white">
              HUMANEXUS
            </p>
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#D0D4DC] sm:text-xs">
              Instituto de Inteligência Operacional Humana
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
            Solicitar Avaliação Estratégica
          </Link>
          <Link
            href="https://wa.me/5592981187777"
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-[#C9A34E] px-4 py-2 text-sm font-semibold text-[#050505] shadow-gold transition hover:bg-[#d6b56a]"
          >
            WhatsApp
          </Link>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 text-[#F5F5F5] transition hover:border-[#C9A34E]/40 hover:bg-white/5 lg:hidden"
            aria-label="Abrir navegação"
            aria-expanded={open}
          >
            <span className="space-y-1.5">
              <span className="block h-0.5 w-5 bg-current" />
              <span className="block h-0.5 w-5 bg-current" />
              <span className="block h-0.5 w-5 bg-current" />
            </span>
          </button>
        </div>
      </div>
      {open ? (
        <div className="border-t border-white/10 bg-[#080808]/98 px-6 py-5 lg:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-2">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`rounded-2xl px-4 py-3 text-sm transition ${
                  isActive(pathname, item.href)
                    ? "border border-[#C9A34E]/28 bg-[#C9A34E]/10 text-[#F5F5F5]"
                    : "border border-white/10 text-[#B8B8B8] hover:bg-white/5 hover:text-[#F5F5F5]"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/contato"
              onClick={() => setOpen(false)}
              className="mt-3 rounded-full bg-[#C9A34E] px-5 py-3 text-center text-sm font-semibold text-[#050505]"
            >
              Solicitar Avaliação Estratégica
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
