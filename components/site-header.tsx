"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { brandAssets } from "@/lib/brand-assets";
import { navigation } from "@/lib/site-data";

function isActive(pathname: string, href: string) {
  const [cleanHref] = href.split("#");
  const target = cleanHref || "/";
  if (href === "/") {
    return pathname === "/";
  }
  return pathname.startsWith(target);
}

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/8 bg-[#050505]/84 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3.5 lg:px-8">
        <Link href="/" className="group flex min-w-0 items-center gap-3">
          <div className="relative h-[54px] w-[124px] shrink-0 transition duration-300 group-hover:opacity-92 sm:h-[72px] sm:w-[190px]">
            <Image src={brandAssets.logoPremium} alt="HUMANEXUS" fill className="object-contain object-left" priority />
          </div>
          <div className="hidden space-y-1 xl:block">
            <p className="font-semibold uppercase tracking-[0.34em] text-[#F5F5F5] transition group-hover:text-white">
              HUMANEXUS
            </p>
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#8E949E] sm:text-xs">
              Instituto de Inteligência Operacional Humana
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-full px-4 py-2 text-sm transition ${
                isActive(pathname, item.href)
                  ? "bg-[#C9A34E]/12 text-[#F5F5F5]"
                  : "text-[#A0A6B1] hover:bg-white/5 hover:text-[#F5F5F5]"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="https://wa.me/5592981187777"
            target="_blank"
            rel="noreferrer"
            className="hidden rounded-full border border-[#C9A34E]/24 bg-[linear-gradient(135deg,#d6b45d,#b98b2d)] px-5 py-2.5 text-sm font-semibold text-[#050505] shadow-[0_14px_34px_rgba(201,163,78,0.18)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_44px_rgba(201,163,78,0.24)] sm:inline-flex"
          >
            Fale Conosco
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
              href="https://wa.me/5592981187777"
              target="_blank"
              rel="noreferrer"
              onClick={() => setOpen(false)}
              className="mt-3 rounded-full bg-[#C9A34E] px-5 py-3 text-center text-sm font-semibold text-[#050505]"
            >
              Fale Conosco
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
