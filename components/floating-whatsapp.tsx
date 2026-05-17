import Link from "next/link";

export function FloatingWhatsApp() {
  return (
    <Link
      href="https://wa.me/5592981187777"
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-6 right-6 z-50 inline-flex items-center gap-3 rounded-full border border-[#C9A34E]/40 bg-[#0D0D0D]/92 px-5 py-3 text-sm font-medium text-[#F5F5F5] shadow-gold backdrop-blur-xl transition hover:-translate-y-1 hover:bg-[#131313]"
    >
      <span className="grid h-10 w-10 place-items-center rounded-full bg-[#C9A34E] text-[#050505]">
        W
      </span>
      <span>Falar com especialista</span>
    </Link>
  );
}
