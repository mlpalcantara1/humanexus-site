import Link from "next/link";

export function FloatingWhatsApp() {
  return (
    <Link
      href="https://wa.me/5592981187777"
      target="_blank"
      rel="noreferrer"
      aria-label="WhatsApp institucional"
      className="fixed bottom-4 right-4 z-50 inline-flex items-center gap-2 rounded-full border border-[#C9A34E]/22 bg-[#0D0D0D]/84 px-2.5 py-2.5 text-sm font-medium text-[#F5F5F5] shadow-[0_14px_32px_rgba(0,0,0,0.3)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-[#C9A34E]/38 hover:bg-[#111214] sm:bottom-5 sm:right-5"
    >
      <span className="grid h-9 w-9 place-items-center rounded-full bg-[#C9A34E] text-[11px] font-semibold tracking-[0.18em] text-[#050505]">
        WA
      </span>
      <span className="hidden pr-2 text-xs uppercase tracking-[0.24em] sm:inline">WhatsApp</span>
    </Link>
  );
}
