import { InstrumentoIntegrado } from "@/components/instrumento-integrado";
import type { Metadata } from "next";

// A tradução automática altera nomes jurídicos e termos que compõem o hash.
export const metadata: Metadata = {
  title: "Instrumento Integrado Único | HUMANEXUS",
  other: { google: "notranslate" }
};

export default function InstrumentoIntegradoPage() {
  return <InstrumentoIntegrado />;
}
