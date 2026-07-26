"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function FormularioAlteracaoSenha({ csrf }: { csrf: string }) {
  const [atual, setAtual] = useState("");
  const [nova, setNova] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [mensagem, setMensagem] = useState("");
  const router = useRouter();

  async function alterar(evento: FormEvent) {
    evento.preventDefault();
    if (nova !== confirmacao) return setMensagem("As senhas não coincidem.");
    const resposta = await fetch("/api/sessao/alterar-senha", {
      method: "POST",
      headers: { "content-type": "application/json", "x-humanexus-csrf": csrf },
      body: JSON.stringify({ senhaAtual: atual, novaSenha: nova })
    });
    const dados = await resposta.json();
    if (!resposta.ok) return setMensagem(dados?.erro?.mensagem);
    router.replace(dados.destino);
    router.refresh();
  }

  return (
    <form onSubmit={alterar} className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-7 sm:p-10">
      <h1 className="text-3xl font-semibold text-white">Alterar senha</h1>
      <p className="mt-3 text-[#AEB2B9]">A troca encerra todas as sessões anteriores.</p>
      {[
        ["Senha atual", atual, setAtual, "current-password"],
        ["Nova senha", nova, setNova, "new-password"],
        ["Confirmar nova senha", confirmacao, setConfirmacao, "new-password"]
      ].map(([rotulo, valor, definir, auto]) => (
        <label key={rotulo as string} className="mt-5 block text-sm text-[#D5D7DB]">
          {rotulo as string}
          <input type="password" minLength={10} required autoComplete={auto as string} value={valor as string} onChange={(e) => (definir as (v: string) => void)(e.target.value)} className="mt-2 w-full rounded-2xl border border-white/12 bg-black/25 px-4 py-3 text-white" />
        </label>
      ))}
      <button className="mt-7 w-full rounded-full bg-[#C9A34E] px-6 py-4 font-semibold text-black">Salvar e encerrar sessões</button>
      <p aria-live="polite" className="mt-4 text-sm text-[#AEB2B9]">{mensagem}</p>
    </form>
  );
}
