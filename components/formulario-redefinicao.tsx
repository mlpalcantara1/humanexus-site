"use client";

import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";

export function FormularioRedefinicao() {
  const params = useSearchParams();
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [mensagem, setMensagem] = useState("");

  async function redefinir(evento: FormEvent) {
    evento.preventDefault();
    if (senha !== confirmacao) {
      setMensagem("As senhas não coincidem.");
      return;
    }
    const local = params.get("modo") === "local";
    const resposta = await fetch(
      local
        ? "/api/sessao/recuperacao/local-proprietario"
        : "/api/sessao/recuperacao/redefinir",
      {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(
        local
          ? { novaSenha: senha }
          : { token: params.get("token"), novaSenha: senha }
      )
    });
    const dados = await resposta.json();
    setMensagem(
      resposta.ok
        ? "Senha alterada. Você já pode entrar."
        : dados?.erro?.mensagem
    );
  }

  return (
    <form onSubmit={redefinir} className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-7 sm:p-10">
      <h1 className="text-3xl font-semibold text-white">Definir nova senha</h1>
      <p className="mt-3 text-[#AEB2B9]">Use ao menos dez caracteres.</p>
      <label className="mt-7 block text-sm text-[#D5D7DB]">Nova senha
        <input type="password" minLength={10} required autoComplete="new-password" value={senha} onChange={(e) => setSenha(e.target.value)} className="mt-2 w-full rounded-2xl border border-white/12 bg-black/25 px-4 py-3 text-white" />
      </label>
      <label className="mt-5 block text-sm text-[#D5D7DB]">Confirmar senha
        <input type="password" minLength={10} required autoComplete="new-password" value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} className="mt-2 w-full rounded-2xl border border-white/12 bg-black/25 px-4 py-3 text-white" />
      </label>
      <button className="mt-7 w-full rounded-full bg-[#C9A34E] px-6 py-4 font-semibold text-black">Alterar senha</button>
      <p aria-live="polite" className="mt-4 text-sm text-[#AEB2B9]">{mensagem}</p>
    </form>
  );
}
