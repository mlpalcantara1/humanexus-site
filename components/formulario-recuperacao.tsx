"use client";

import { FormEvent, useState } from "react";

export function FormularioRecuperacao() {
  const [email, setEmail] = useState("");
  const [mensagem, setMensagem] = useState("");

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    if (
      email.trim().toLowerCase() === "institutohumanexus@gmail.com" &&
      ["localhost", "127.0.0.1"].includes(window.location.hostname)
    ) {
      window.location.assign("/redefinir-senha?modo=local");
      return;
    }
    const resposta = await fetch("/api/sessao/recuperacao/solicitar", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email })
    });
    const dados = await resposta.json();
    setMensagem(dados.mensagem);
  }

  return (
    <form onSubmit={enviar} className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-7 sm:p-10">
      <p className="text-xs uppercase tracking-[0.28em] text-[#C9A34E]">Recuperação segura</p>
      <h1 className="mt-4 text-3xl font-semibold text-white">Recuperar acesso</h1>
      <p className="mt-3 leading-7 text-[#AEB2B9]">Enviaremos uma ligação de uso único, válida por 20 minutos.</p>
      <label className="mt-8 block text-sm text-[#D5D7DB]">E-mail
        <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 w-full rounded-2xl border border-white/12 bg-black/25 px-4 py-3 text-white" />
      </label>
      <button className="mt-7 w-full rounded-full bg-[#C9A34E] px-6 py-4 font-semibold text-black">Enviar instruções</button>
      <p aria-live="polite" className="mt-4 text-sm text-[#AEB2B9]">{mensagem}</p>
    </form>
  );
}
