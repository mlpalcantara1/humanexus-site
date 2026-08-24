"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AcessoParticipantePage() {
  const [token, setToken] = useState("");
  const router = useRouter();
  useEffect(() => {
    const recebido = new URLSearchParams(window.location.search).get("token")?.trim();
    if (recebido) router.replace(`/anamnese/convite/${encodeURIComponent(recebido)}`);
  }, [router]);
  function submit(event: FormEvent) {
    event.preventDefault();
    const value = token.trim();
    if (value && !value.includes("/") && !value.includes("?")) {
      router.push(`/anamnese/convite/${encodeURIComponent(value)}`);
    }
  }
  return (
    <section className="mx-auto min-h-[72vh] max-w-xl px-5 py-20">
      <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-7 sm:p-10">
        <p className="text-xs uppercase tracking-[0.28em] text-[#C9A34E]">Participante</p>
        <h1 className="mt-4 text-3xl font-semibold text-white">Acesse sua anamnese</h1>
        <p className="mt-4 leading-7 text-[#AEB2B9]">Use preferencialmente a ligação recebida. Se recebeu apenas o código seguro, informe-o abaixo.</p>
        <form onSubmit={submit} className="mt-8">
          <label className="text-sm text-[#D5D7DB]" htmlFor="token">Código do convite</label>
          <input id="token" value={token} onChange={(e) => setToken(e.target.value)} className="mt-2 w-full rounded-2xl border border-white/12 bg-black/30 px-4 py-4 text-white outline-none focus:border-[#C9A34E]" autoComplete="off" />
          <button className="mt-5 w-full rounded-full bg-[#C9A34E] px-5 py-3.5 font-semibold text-black">Continuar com segurança</button>
        </form>
      </div>
    </section>
  );
}
