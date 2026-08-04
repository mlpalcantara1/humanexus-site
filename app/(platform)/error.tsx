"use client";

import { useEffect } from "react";
import { PlatformErrorState } from "@/components/platform-error-state";

export default function PlatformError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[HUMANEXUS_PORTAL]", JSON.stringify({
      instante: new Date().toISOString(),
      modulo: "PLATAFORMA",
      rota: window.location.pathname,
      tipo: "ERRO_DE_RENDERIZACAO",
      digest: error.digest ?? null
    }));
  }, [error]);
  return <PlatformErrorState tentarNovamente={reset} />;
}
