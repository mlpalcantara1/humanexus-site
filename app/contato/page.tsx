import { GlassCard, PageHero, PrimaryButton, SectionIntro } from "@/components/ui";
import { contactInterests, contactSegments } from "@/lib/site-data";

export default function ContatoPage() {
  return (
    <>
      <PageHero
        eyebrow="Contato"
        title="Converse com o Instituto HUMANEXUS."
        description="Para organizações que desejam discutir programas institucionais, formação, fatores humanos, riscos psicossociais e desenvolvimento contínuo em ambientes críticos."
      />

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.84fr_1.16fr]">
          <div className="space-y-6">
            <SectionIntro
              eyebrow="Contato público"
              title="Uma entrada única, simples e executiva."
              description="O contato público do Instituto é concentrado, direto e compatível com relações institucionais de alto valor."
            />

            <GlassCard accent="gold">
              <div className="space-y-4">
                <p className="text-[10px] uppercase tracking-[0.32em] text-[#C9A34E]">Contato público</p>
                <h3 className="text-2xl font-semibold text-[#F5F5F5]">contato@institutohumanexus.com</h3>
                <p className="text-sm leading-7 text-[#9EA3AE]">
                  WhatsApp institucional: +55 92 98118-7777
                </p>
              </div>
            </GlassCard>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <PrimaryButton href="https://wa.me/5592981187777">Falar com o Instituto</PrimaryButton>
            </div>
          </div>

          <form className="rounded-[34px] border border-[#C9A34E]/18 bg-[#0A0C11]/94 p-7 shadow-[0_26px_90px_rgba(201,163,78,0.08)] backdrop-blur-xl sm:p-8">
            <div className="mb-6 space-y-2">
              <p className="text-[10px] uppercase tracking-[0.32em] text-[#C9A34E]">Formulário institucional</p>
              <h3 className="text-2xl font-semibold text-[#F5F5F5]">Solicite uma conversa institucional.</h3>
              <p className="text-sm leading-7 text-[#9EA3AE]">
                Estrutura preparada para captação de leads e integração futura com CRM.
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
              <PrimaryButton href="mailto:contato@institutohumanexus.com">Enviar e-mail institucional</PrimaryButton>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}
