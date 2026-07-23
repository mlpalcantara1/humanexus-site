"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { humanexusApi } from "@/lib/humanexus-api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage("Validando acesso…");
    try {
      const result = await humanexusApi<{ token_de_acesso: string }>(
        "/api/v1/autenticacao/entrar",
        { method: "POST", body: JSON.stringify({ email, senha: password }) }
      );
      sessionStorage.setItem("humanexus_professional_token", result.token_de_acesso);
      router.push("/profissional");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Acesso não autorizado.");
    }
  }

  return (
    <section className="mx-auto min-h-[72vh] max-w-lg px-5 py-20">
      <form onSubmit={submit} className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-7 sm:p-10">
        <p className="text-xs uppercase tracking-[0.28em] text-[#C9A34E]">Acesso profissional</p>
        <h1 className="mt-4 text-3xl font-semibold text-white">Entre na Área HUMANEXUS</h1>
        <label className="mt-8 block text-sm text-[#D5D7DB]">E-mail
          <input type="email" required autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-2xl border border-white/12 bg-black/25 px-4 py-3 text-white outline-none focus:border-[#C9A34E]" />
        </label>
        <label className="mt-5 block text-sm text-[#D5D7DB]">Senha
          <input type="password" required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-2xl border border-white/12 bg-black/25 px-4 py-3 text-white outline-none focus:border-[#C9A34E]" />
        </label>
        <button className="mt-7 w-full rounded-full bg-[#C9A34E] px-6 py-4 font-semibold text-black">Entrar com segurança</button>
        <p aria-live="polite" className="mt-4 text-sm text-[#AEB2B9]">{message}</p>
      </form>
    </section>
  );
}
