import Link from "next/link";

export function FloatingWhatsApp() {
  return (
    <Link
      href="https://wa.me/5592981187777?text=Ol%C3%A1%2C%20gostaria%20de%20conhecer%20a%20solu%C3%A7%C3%A3o%20HUMANEXUS%20para%20a%20minha%20opera%C3%A7%C3%A3o."
      target="_blank"
      rel="noreferrer"
      aria-label="HX — Fale com o HUMANEXUS pelo WhatsApp"
      className="floating-contact"
    >
      <span>HX</span>
      <div>
        <small>CANAL DIRETO</small>
        <strong>Fale com o HUMANEXUS</strong>
      </div>
      <b>↗</b>
    </Link>
  );
}
