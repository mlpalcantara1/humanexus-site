import { GlassCard, PageHero, PrimaryButton, SectionIntro } from "@/components/ui";
import { contactInterests, contactSegments } from "@/lib/site-data";

export default function ContatoPage() {
  return (
    <>
      <PageHero
        eyebrow="Contato"
        title="Converse com o Instituto HUMANEXUS."
        description="Entrada institucional para organizações que desejam discutir programa, plataforma, operação e desenvolvimento humano em ambientes críticos."
      />

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-6">
            <SectionIntro
              eyebrow="Contato público"
              title="Contato objetivo, reservado e compatível com decisão executiva."
              description="A comunicação pública do Instituto é concentrada em um canal único para relacionamento institucional."
            />

            <GlassCard accent="gold">
              <div className="space-y-4">
                <p className="text-[10px] uppercase tracking-[0.32em] text-[#C9A34E]">Contato</p>
                <h3 className="text-2xl font-semibold text-[#F5F5F5]">contato@institutohumanexus.com</h3>
                <p className="text-sm leading-7 text-[#9EA3AE]">WhatsApp institucional: +55 92 98118-7777</p>
              </div>
            </GlassCard>

            <PrimaryButton href="https://wa.me/5592981187777">Fale Conosco</PrimaryButton>
          </div>

          <form className="rounded-[30px] border border-[#C9A34E]/18 bg-[#0A0C11]/94 p-7 shadow-[0_26px_90px_rgba(201,163,78,0.08)] backdrop-blur-xl sm:p-8">
            <div className="mb-6 space-y-2">
              <p className="text-[10px] uppercase tracking-[0.32em] text-[#C9A34E]">Formulário institucional</p>
              <h3 className="text-2xl font-semibold text-[#F5F5F5]">Agende uma conversa institucional.</h3>
              <p className="text-sm leading-7 text-[#9EA3AE]">
                Estrutura preparada para relacionamento institucional e organização futura de leads.
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
