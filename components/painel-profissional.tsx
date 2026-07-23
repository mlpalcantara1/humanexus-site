"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { humanexusApi } from "@/lib/humanexus-api";

const niches = ["AVIACAO", "SEGURANCA_PUBLICA", "SAUDE", "HOSPITALAR", "EMPRESARIAL", "EDUCACAO", "TRANSPORTE", "MARITIMO", "ESPORTIVO", "PARTICULAR", "OUTROS"];

export function PainelProfissional() {
  const [participant, setParticipant] = useState("");
  const [identity, setIdentity] = useState("");
  const [bond, setBond] = useState("");
  const [niche, setNiche] = useState("AVIACAO");
  const [invite, setInvite] = useState("");
  const [status, setStatus] = useState("");

  async function create(event: FormEvent) {
    event.preventDefault();
    setStatus("Gerando convite…");
    try {
      const anamnesis = await humanexusApi<{ identificador: string }>(
        `/api/v1/participantes/${encodeURIComponent(participant)}/anamneses`,
        {
          method: "POST",
          body: JSON.stringify({
            identificador_da_identidade_longitudinal: identity,
            identificador_do_vinculo: bond,
            finalidade: "ANAMNESE",
            nicho: niche
          })
        }
      );
      const generated = await humanexusApi<{ token_de_entrega_unica: string }>(
        `/api/v1/anamneses/${anamnesis.identificador}/convites`,
        { method: "POST", body: "{}" }
      );
      setInvite(`${window.location.origin}/anamnese/${generated.token_de_entrega_unica}`);
      setStatus("Convite criado");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Não foi possível criar o convite.");
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(invite);
    setStatus("Link copiado com segurança");
  }

  return (
    <section className="mx-auto max-w-6xl px-5 py-14">
      <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-[#C9A34E]">Painel profissional</p>
          <h1 className="mt-3 text-4xl font-semibold text-white">Nova anamnese</h1>
        </div>
        <Link href="/profissional/catalogo" className="text-sm font-semibold text-[#D8BC65]">Revisar catálogo autoral →</Link>
      </div>
      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_.8fr]">
        <form onSubmit={create} className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 sm:p-8">
          <p className="mb-6 leading-7 text-[#AEB2B9]">Informe os identificadores seguros já cadastrados. Dados pessoais não são incluídos no link.</p>
          {[
            ["Participante", participant, setParticipant],
            ["Identidade longitudinal", identity, setIdentity],
            ["Vínculo", bond, setBond]
          ].map(([label, value, setter]) => (
            <label className="mb-5 block" key={label as string}>
              <span className="text-sm text-[#D5D7DB]">{label as string}</span>
              <input required value={value as string} onChange={(e) => (setter as (value: string) => void)(e.target.value)} className="mt-2 w-full rounded-2xl border border-white/12 bg-black/25 px-4 py-3 text-white outline-none focus:border-[#C9A34E]" />
            </label>
          ))}
          <label className="block">
            <span className="text-sm text-[#D5D7DB]">Nicho principal</span>
            <select value={niche} onChange={(e) => setNiche(e.target.value)} className="mt-2 w-full rounded-2xl border border-white/12 bg-[#111] px-4 py-3 text-white">
              {niches.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <button className="mt-7 w-full rounded-full bg-[#C9A34E] px-6 py-4 font-semibold text-black">Gerar convite seguro</button>
        </form>
        <aside className="rounded-[2rem] border border-white/10 bg-black/25 p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-white">Convite</h2>
          <p aria-live="polite" className="mt-3 text-sm text-[#AEB2B9]">{status || "Aguardando dados da anamnese."}</p>
          {invite ? (
            <div className="mt-6">
              <div className="break-all rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-[#D5D7DB]">{invite}</div>
              <button type="button" onClick={copy} className="mt-4 w-full rounded-full border border-[#C9A34E]/35 px-5 py-3 font-semibold text-[#E5CF88]">Copiar link</button>
            </div>
          ) : null}
          <div className="mt-8 border-t border-white/10 pt-6 text-sm leading-6 text-[#8F949C]">
            Envio por e-mail será habilitado quando o provedor transacional estiver configurado. O preenchimento não depende de WhatsApp.
          </div>
        </aside>
      </div>
    </section>
  );
}
