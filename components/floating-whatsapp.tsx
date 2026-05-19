import Link from "next/link";

export function FloatingWhatsApp() {
  return (
    <Link
      href="https://wa.me/5592981187777"
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-3 rounded-full border border-[#C9A34E]/28 bg-[#0D0D0D]/88 px-3 py-3 text-sm font-medium text-[#F5F5F5] shadow-[0_18px_40px_rgba(0,0,0,0.36)] backdrop-blur-xl transition hover:-translate-y-1 hover:border-[#C9A34E]/42 hover:bg-[#131313] sm:bottom-6 sm:right-6 sm:px-4"
    >
      <span className="grid h-10 w-10 place-items-center rounded-full bg-[#C9A34E] text-base font-semibold text-[#050505]">
        WA
      </span>
      <span className="hidden sm:inline">Falar com o Instituto</span>
    </Link>
  );
}
