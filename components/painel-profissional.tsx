"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { humanexusApi } from "@/lib/humanexus-api";

const niches = ["AVIACAO", "SEGURANCA_PUBLICA", "SAUDE", "HOSPITALAR", "EMPRESARIAL", "EDUCACAO", "TRANSPORTE", "MARITIMO", "ESPORTIVO", "PARTICULAR", "OUTROS"];
type History = { id: string; state: string; progress: number; name: string; email: string; niche: string; created_at: string };

export function PainelProfissional() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [bondType, setBondType] = useState("PARTICULAR");
  const [organization, setOrganization] = useState("");
  const [role, setRole] = useState("");
  const [niche, setNiche] = useState("PARTICULAR");
  const [invite, setInvite] = useState("");
  const [status, setStatus] = useState("");
  const [history, setHistory] = useState<History[]>([]);

  async function loadHistory() {
    try {
      setHistory(await humanexusApi<History[]>("/api/humanexus/anamneses"));
    } catch {
      setStatus("Entre novamente para consultar o painel.");
    }
  }
  useEffect(() => { loadHistory(); }, []);

  async function create(event: FormEvent) {
    event.preventDefault();
    setStatus("Cadastrando participante e gerando convite…");
    try {
      const participant = await humanexusApi<{ id: string }>("/api/humanexus/participantes", {
        method: "POST",
        body: JSON.stringify({
          nome: name,
          email,
          telefone: phone,
          tipo_vinculo: bondType,
          organizacao: bondType === "PARTICULAR" ? null : organization,
          funcao: role,
          nicho: niche
        })
      });
      const generated = await humanexusApi<{ token_de_entrega_unica: string }>("/api/humanexus/anamneses", {
        method: "POST",
        body: JSON.stringify({ participante_id: participant.id })
      });
      setInvite(`${window.location.origin}/anamnese/${generated.token_de_entrega_unica}`);
      setStatus("Convite criado. O token completo é exibido somente agora.");
      await loadHistory();
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
          <h1 className="mt-3 text-4xl font-semibold text-white">Participantes e anamneses</h1>
        </div>
        <Link href="/profissional/catalogo" className="text-sm font-semibold text-[#D8BC65]">Revisar catálogo autoral →</Link>
      </div>
      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_.8fr]">
        <form onSubmit={create} className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 sm:p-8">
          <p className="mb-6 leading-7 text-[#AEB2B9]">Cadastre o participante e gere um convite sem incluir dados pessoais no endereço.</p>
          {[
            ["Nome", name, setName, "text"],
            ["E-mail", email, setEmail, "email"],
            ["Telefone", phone, setPhone, "tel"],
            ["Função", role, setRole, "text"]
          ].map(([label, value, setter, type]) => (
            <label className="mb-5 block" key={label as string}>
              <span className="text-sm text-[#D5D7DB]">{label as string}</span>
              <input type={type as string} required={label === "Nome" || label === "E-mail"} value={value as string} onChange={(e) => (setter as (value: string) => void)(e.target.value)} className="mt-2 w-full rounded-2xl border border-white/12 bg-black/25 px-4 py-3 text-white outline-none focus:border-[#C9A34E]" />
            </label>
          ))}
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block"><span className="text-sm text-[#D5D7DB]">Tipo de vínculo</span>
              <select value={bondType} onChange={(e) => setBondType(e.target.value)} className="mt-2 w-full rounded-2xl border border-white/12 bg-[#111] px-4 py-3 text-white">
                {["PARTICULAR", "ORGANIZACIONAL", "MISTO"].map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label className="block"><span className="text-sm text-[#D5D7DB]">Nicho principal</span>
              <select value={niche} onChange={(e) => setNiche(e.target.value)} className="mt-2 w-full rounded-2xl border border-white/12 bg-[#111] px-4 py-3 text-white">
                {niches.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
          </div>
          {bondType !== "PARTICULAR" ? (
            <label className="mt-5 block"><span className="text-sm text-[#D5D7DB]">Organização</span>
              <input required value={organization} onChange={(e) => setOrganization(e.target.value)} className="mt-2 w-full rounded-2xl border border-white/12 bg-black/25 px-4 py-3 text-white" />
            </label>
          ) : null}
          <button className="mt-7 w-full rounded-full bg-[#C9A34E] px-6 py-4 font-semibold text-black">Cadastrar e gerar convite</button>
        </form>
        <aside className="rounded-[2rem] border border-white/10 bg-black/25 p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-white">Convite</h2>
          <p aria-live="polite" className="mt-3 text-sm text-[#AEB2B9]">{status || "Aguardando novo cadastro."}</p>
          {invite ? (
            <div className="mt-6">
              <div className="break-all rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-[#D5D7DB]">{invite}</div>
              <button type="button" onClick={copy} className="mt-4 w-full rounded-full border border-[#C9A34E]/35 px-5 py-3 font-semibold text-[#E5CF88]">Copiar link</button>
            </div>
          ) : null}
        </aside>
      </div>
      <div className="mt-10 rounded-[2rem] border border-white/10 bg-white/[0.025] p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-white">Acompanhamento</h2>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="text-[#8F949C]"><tr><th className="pb-3">Participante</th><th>Vínculo</th><th>Nicho</th><th>Estado</th><th>Completude</th></tr></thead>
            <tbody className="text-[#D5D7DB]">
              {history.map((item) => (
                <tr key={item.id} className="border-t border-white/8">
                  <td className="py-4"><div>{item.name}</div><div className="text-xs text-[#8F949C]">{item.email}</div></td>
                  <td>{(item as History & { bond_type?: string }).bond_type}</td><td>{item.niche}</td><td>{item.state}</td><td>{Number(item.progress)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
