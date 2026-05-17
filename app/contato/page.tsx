import { GlassCard, PageHero, PrimaryButton, SecondaryButton, SectionIntro } from "@/components/ui";
import { contactInterests, contactSegments } from "@/lib/site-data";

export default function ContatoPage() {
  return (
    <>
      <PageHero
        eyebrow="Contato"
        title="Agende uma conversa estratégica com o HUMANEXUS."
        description="Se a sua organização precisa tratar segurança operacional, risco humano, fadiga, pressão e performance com mais rigor, esta é a página para avançar a conversa."
        primary={{ href: "https://wa.me/5592981187777", label: "Falar com especialista agora" }}
        secondary={{ href: "mailto:institutohumanexus@gmail.com", label: "Enviar e-mail institucional" }}
      />
      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-6">
            <SectionIntro
              eyebrow="Contato direto"
              title="Fale com o Instituto Humanexus sem fricção."
              description="O WhatsApp é o canal mais rápido para iniciar uma conversa comercial, alinhar cenário e avançar para reunião."
            />
            <GlassCard accent="gold">
              <div className="space-y-4">
                <p className="text-xs uppercase tracking-[0.32em] text-[#C9A34E]">Canal prioritário</p>
                <h3 className="text-2xl font-semibold text-[#F5F5F5]">WhatsApp institucional</h3>
                <p className="text-3xl font-semibold text-[#F5F5F5]">(92) 98118-7777</p>
                <p className="text-sm leading-7 text-[#B8B8B8]">
                  Para empresários, operadores aéreos, DSO, gestores de segurança e organizações que desejam acelerar a conversa.
                </p>
                <div className="flex flex-col gap-3">
                  <PrimaryButton href="https://wa.me/5592981187777">
                    Falar com especialista agora
                  </PrimaryButton>
                  <SecondaryButton href="mailto:institutohumanexus@gmail.com">
                    institutohumanexus@gmail.com
                  </SecondaryButton>
                </div>
              </div>
            </GlassCard>
            <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 shadow-panel">
              <div className="space-y-3 text-sm text-[#B8B8B8]">
                <p>Contato institucional: institutohumanexus@gmail.com</p>
                <p>Cidade-base: Manaus - AM</p>
                <p>Atendimento: apresentação institucional, reunião estratégica inicial e propostas comerciais.</p>
              </div>
            </div>
          </div>

          <form className="rounded-[32px] border border-[#C9A34E]/18 bg-[#0B0B0B]/94 p-7 shadow-gold backdrop-blur-xl">
            <div className="mb-6 space-y-2">
              <p className="text-xs uppercase tracking-[0.3em] text-[#C9A34E]">Formulário comercial</p>
              <h3 className="text-2xl font-semibold text-[#F5F5F5]">Solicite uma apresentação institucional.</h3>
              <p className="text-sm text-[#B8B8B8]">
                Preencha em menos de dois minutos para avançar para uma conversa comercial.
              </p>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              {[
                "Nome",
                "Empresa",
                "Cargo",
                "WhatsApp",
                "E-mail"
              ].map((label) => (
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
                  placeholder="Conte rapidamente o contexto da sua organização e o objetivo da conversa."
                  className="w-full rounded-3xl border border-white/10 bg-[#111111] px-4 py-4 text-sm text-[#F5F5F5] outline-none transition focus:border-[#C9A34E]/50"
                />
              </label>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <PrimaryButton href="mailto:institutohumanexus@gmail.com">
                Solicitar apresentação institucional
              </PrimaryButton>
              <SecondaryButton href="https://wa.me/5592981187777">
                Preferir WhatsApp
              </SecondaryButton>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}
