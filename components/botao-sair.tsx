"use client";

import { obterChave, protegerLegados, aguardarPersistencia, limparAposLogout, baixarCopiaPrivada } from "@/lib/registro-local-protegido";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function BotaoSair({ csrf }: { csrf: string }) {
  const [saindo, setSaindo] = useState(false);
  const router = useRouter();
  const [aviso, setAviso] = useState("");

  async function sair() {
    setSaindo(true);
    window.dispatchEvent(new Event("humanexus:logout"));
    if (typeof BroadcastChannel !== "undefined") {
      const canal = new BroadcastChannel("humanexus-auth"); canal.postMessage("logout"); canal.close();
    }
    try {
      await aguardarPersistencia();
      const { profissional, chave } = await obterChave();
      await protegerLegados(localStorage, profissional, chave);
    } catch {
      if (baixarCopiaPrivada()) window.alert("O navegador não confirmou a gravação local. Uma cópia cifrada foi disponibilizada para download. Guarde-a e recupere-a com seu perfil em Registros da sessão; sua saída continuará.");
      setAviso("Registros locais preservados para recuperação pelo mesmo profissional. A sincronização não foi confirmada.");
    }
    await fetch("/api/sessao/sair", {
      method: "POST",
      headers: { "x-humanexus-csrf": csrf }
    }).catch(() => { setAviso("Saída local; revogação remota pendente de conexão. Registros preservados."); });
    limparAposLogout(() => localStorage);
    navigator.serviceWorker?.controller?.postMessage({
      tipo: "HXP_LIMPAR_DADOS_LOCAIS"
    });
    router.replace("/entrar");
    router.refresh();
  }

  return (
    <>{aviso ? <p role="status" className="hx-logout-status">{aviso}</p> : null}<button
      type="button"
      title="Notas pendentes ficam protegidas neste navegador para recuperação pelo mesmo profissional."
      aria-description="Notas pendentes ficam protegidas neste navegador para recuperação pelo mesmo profissional."
      onClick={sair}
      disabled={saindo}
      className="hx-logout-button rounded-full border border-[#C9A34E]/40 px-5 py-2.5 text-sm font-semibold text-[#E5CF88] disabled:opacity-50"
    >
      {saindo ? "Encerrando…" : "Sair com segurança"}
    </button></>
  );
}
