import type { Metadata } from "next";
import { GlassCard, PageHero, PrimaryButton, SectionIntro } from "@/components/ui";
import { contactInterests, contactSegments } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Contato",
  description:
    "Canal institucional para organizações interessadas nos programas HUMANEXUS e em uma conversa executiva reservada.",
  alternates: {
    canonical: "/contato"
  },
  openGraph: {
    url: "/contato"
  }
};

export default function ContatoPage() {
  return (
    <>
      <PageHero
        eyebrow="Contato"
        title="Canal institucional para relacionamento executivo e reservado."
        description="Entrada pública para organizações que desejam discutir programa, desenvolvimento humano operacional e escopo institucional."
      />

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.78fr_1.22fr]">
          <div className="space-y-6">
            <SectionIntro
              eyebrow="Relação institucional"
              title="Um canal único para conversas de alto valor."
              description="A comunicação pública do Instituto é concentrada em uma entrada simples, reservada e compatível com decisão executiva."
            />

            <GlassCard accent="gold">
              <div className="space-y-4">
                <p className="text-[10px] uppercase tracking-[0.32em] text-[#C9A34E]">Canal institucional</p>
                <p className="text-sm leading-7 text-[#9EA3AE]">
                  Atendimento inicial para organizações interessadas em programas, formação aplicada e desenvolvimento contínuo do fator humano.
                </p>
                <p className="text-sm leading-7 text-[#F5F5F5]">WhatsApp institucional: +55 92 98118-7777</p>
              </div>
            </GlassCard>

            <div className="flex flex-col gap-4 sm:flex-row">
              <PrimaryButton href="https://wa.me/5592981187777">Fale Conosco</PrimaryButton>
              <PrimaryButton href="mailto:contato@institutohumanexus.com">Enviar e-mail</PrimaryButton>
            </div>
          </div>

          <form className="rounded-[30px] border border-[#C9A34E]/18 bg-[#0A0C11]/94 p-7 shadow-[0_26px_90px_rgba(201,163,78,0.08)] backdrop-blur-xl sm:p-8">
            <div className="mb-6 space-y-2">
              <p className="text-[10px] uppercase tracking-[0.32em] text-[#C9A34E]">Formulário institucional</p>
              <h3 className="text-2xl font-semibold text-[#F5F5F5]">Agende uma conversa institucional.</h3>
              <p className="text-sm leading-7 text-[#9EA3AE]">
                Estrutura preparada para organização futura de leads e relacionamento institucional.
              </p>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              {["Nome", "Organização", "Cargo / função", "WhatsApp", "E-mail"].map((label) => (
                <label key={label} className="space-y-2 text-sm text-[#F5F5F5]">
                  <span>{label}</span>
                  <input
                    type="text"
                    placeholder={label}
                    className="w-full rounded-2xl border border-white/10 bg-[#111111] px-4 py-3 text-sm text-[#F5F5F5] outline-none transition focus:border-[#C9A34E]/50"
                  />
                </label>
              ))}
              <label className="space-y-2 text-sm text-[#F5F5F5]">
                <span>Segmento</span>
                <select className="w-full rounded-2xl border border-white/10 bg-[#111111] px-4 py-3 text-sm text-[#F5F5F5] outline-none transition focus:border-[#C9A34E]/50">
                  {contactSegments.map((segment) => (
                    <option key={segment}>{segment}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm text-[#F5F5F5]">
                <span>Interesse</span>
                <select className="w-full rounded-2xl border border-white/10 bg-[#111111] px-4 py-3 text-sm text-[#F5F5F5] outline-none transition focus:border-[#C9A34E]/50">
                  {contactInterests.map((interest) => (
                    <option key={interest}>{interest}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm text-[#F5F5F5] md:col-span-2">
                <span>Mensagem</span>
                <textarea
                  rows={6}
                  placeholder="Contexto, objetivo institucional e escopo desejado."
                  className="w-full rounded-3xl border border-white/10 bg-[#111111] px-4 py-4 text-sm text-[#F5F5F5] outline-none transition focus:border-[#C9A34E]/50"
                />
              </label>
            </div>
            <div className="mt-6">
              <PrimaryButton href="mailto:contato@institutohumanexus.com">Enviar mensagem institucional</PrimaryButton>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}
