"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function BotaoSair({ csrf }: { csrf: string }) {
  const [saindo, setSaindo] = useState(false);
  const router = useRouter();

  async function sair() {
    setSaindo(true);
    await fetch("/api/sessao/sair", {
      method: "POST",
      headers: { "x-humanexus-csrf": csrf }
    });
    router.replace("/entrar");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={sair}
      disabled={saindo}
      className="rounded-full border border-[#C9A34E]/40 px-5 py-2.5 text-sm font-semibold text-[#E5CF88] disabled:opacity-50"
    >
      {saindo ? "Encerrando…" : "Sair com segurança"}
    </button>
  );
}
