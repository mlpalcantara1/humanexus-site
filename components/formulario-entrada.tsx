"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function FormularioEntrada() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [desafio, setDesafio] = useState("");
  const [codigo, setCodigo] = useState("");
  const [destinoMascarado, setDestinoMascarado] = useState("");
  const router = useRouter();

  function dispositivo() {
    const nome = "humanexus_device=";
    let identificador = document.cookie
      .split("; ")
      .find((item) => item.startsWith(nome))
      ?.slice(nome.length);
    if (!identificador) {
      identificador = crypto.randomUUID();
      document.cookie = `${nome}${identificador}; Path=/; Max-Age=31536000; SameSite=Strict`;
    }
    return identificador;
  }

  async function entrar(evento: FormEvent) {
    evento.preventDefault();
    setEnviando(true);
    setMensagem("Validando acesso seguro…");
    try {
      const resposta = await fetch("/api/sessao/entrar", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-humanexus-device-id": dispositivo(),
          "x-humanexus-device-name": navigator.platform || "Navegador",
          "x-humanexus-device-os": (
            navigator as Navigator & {
              userAgentData?: { platform?: string };
            }
          ).userAgentData?.platform
            ?? navigator.platform
            ?? "",
          "x-humanexus-browser": navigator.userAgent.slice(0, 120)
        },
        body: JSON.stringify(
          desafio ? { desafio, codigo } : { email, senha }
        )
      });
      const dados = await resposta.json();
      if (!resposta.ok) {
        throw new Error(dados?.erro?.mensagem ?? "Acesso não autorizado.");
      }
      if (dados.segundo_fator_necessario) {
        setDesafio(String(dados.desafio));
        setDestinoMascarado(String(dados.destino_mascarado));
        setMensagem("Digite o código enviado ao canal de segurança cadastrado.");
        setEnviando(false);
        return;
      }
      const retorno = new URLSearchParams(window.location.search).get("retorno");
      const destinoSeguro = retorno
        && retorno.startsWith("/")
        && !retorno.startsWith("//")
        && (
          retorno.startsWith("/plataforma/")
          || retorno === "/admin"
          || retorno.startsWith("/admin?")
        )
        ? retorno
        : dados.destino;
      router.replace(destinoSeguro);
      router.refresh();
    } catch (erro) {
      setMensagem(
        erro instanceof Error ? erro.message : "Acesso não autorizado."
      );
      setEnviando(false);
    }
  }

  return (
    <form
      onSubmit={entrar}
      className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-7 sm:p-10"
    >
      <p className="text-xs uppercase tracking-[0.28em] text-[#C9A34E]">
        Ecossistema seguro
      </p>
      <h1 className="mt-4 text-3xl font-semibold text-white">
        Entre na Área HUMANEXUS
      </h1>
      <p className="mt-3 leading-7 text-[#AEB2B9]">
        O seu perfil e suas permissões determinam automaticamente a área de
        destino.
      </p>
      {!desafio ? <><label className="mt-8 block text-sm text-[#D5D7DB]">
        E-mail
        <input
          type="email"
          required
          autoComplete="username"
          value={email}
          onChange={(evento) => setEmail(evento.target.value)}
          className="mt-2 w-full rounded-2xl border border-white/12 bg-black/25 px-4 py-3 text-white outline-none focus:border-[#C9A34E]"
        />
      </label>
      <label className="mt-5 block text-sm text-[#D5D7DB]">
        Senha
        <input
          type="password"
          required
          autoComplete="current-password"
          value={senha}
          onChange={(evento) => setSenha(evento.target.value)}
          className="mt-2 w-full rounded-2xl border border-white/12 bg-black/25 px-4 py-3 text-white outline-none focus:border-[#C9A34E]"
        />
      </label></> : <label className="mt-8 block text-sm text-[#D5D7DB]">
        Código de segurança
        <span className="mt-1 block text-xs text-[#AEB2B9]">
          Enviado para {destinoMascarado}
        </span>
        <input
          inputMode="numeric"
          pattern="[0-9]{6}"
          required
          autoComplete="one-time-code"
          value={codigo}
          onChange={(evento) => setCodigo(evento.target.value.replace(/\D/g, "").slice(0, 6))}
          className="mt-2 w-full rounded-2xl border border-white/12 bg-black/25 px-4 py-3 text-center text-xl tracking-[0.4em] text-white outline-none focus:border-[#C9A34E]"
        />
      </label>}
      <button
        disabled={enviando}
        className="mt-7 w-full rounded-full bg-[#C9A34E] px-6 py-4 font-semibold text-black disabled:opacity-50"
      >
        {enviando ? "Validando…" : desafio ? "Confirmar segundo fator" : "Entrar com segurança"}
      </button>
      <div className="mt-5 text-center">
        <Link
          href="/recuperar-acesso"
          className="text-sm font-semibold text-[#D8BC65]"
        >
          Esqueci minha senha
        </Link>
      </div>
      <p aria-live="polite" className="mt-4 text-sm text-[#AEB2B9]">
        {mensagem}
      </p>
    </form>
  );
}
