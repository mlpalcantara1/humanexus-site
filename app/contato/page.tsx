import { PremiumVideo } from "@/components/premium-video";
import { GlassCard, PageHero, PrimaryButton, SecondaryButton, SectionIntro } from "@/components/ui";
import { brandAssets } from "@/lib/brand-assets";
import { contactInterests, contactSegments } from "@/lib/site-data";

export default function ContatoPage() {
  return (
    <>
      <PageHero
        eyebrow="Contato"
        title="Agende uma conversa estratégica com o Instituto HUMANEXUS."
        description="Para organizações que precisam tratar fatores humanos, riscos psicossociais, segurança operacional, performance cognitiva e decisão sob pressão com padrão institucional elevado."
        primary={{ href: "https://wa.me/5592981187777", label: "Falar com o Instituto" }}
        secondary={{ href: "mailto:contato@institutohumanexus.com", label: "Enviar e-mail institucional" }}
      />

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.86fr_1.14fr]">
          <div className="space-y-6">
            <SectionIntro
              eyebrow="Canal prioritário"
              title="Contato rápido, elegante e orientado à conversão."
              description="O WhatsApp e o e-mail institucional concentram a entrada para apresentações, implementação de programa e reuniões executivas."
            />

            <GlassCard accent="gold">
              <div className="space-y-4">
                <p className="text-xs uppercase tracking-[0.32em] text-[#C9A34E]">Contato institucional</p>
                <h3 className="text-2xl font-semibold text-[#F5F5F5]">contato@institutohumanexus.com</h3>
              <p className="text-sm leading-7 text-[#B8B8B8]">
                E-mail oficial para apresentação institucional, agenda de formação, implementação do programa e contatos estratégicos.
              </p>
              <div className="flex flex-col gap-3">
                <PrimaryButton href="mailto:contato@institutohumanexus.com">Enviar e-mail institucional</PrimaryButton>
                <SecondaryButton href="https://wa.me/5592981187777">Falar com o Instituto</SecondaryButton>
              </div>
              </div>
            </GlassCard>

            <PremiumVideo
              src={brandAssets.videos.instituteSignature}
              poster={brandAssets.media.founderCenipa}
              eyebrow="Presença institucional"
              title="Autoridade visual, sofisticação e credibilidade para conversas de alto valor."
              description="O Instituto HUMANEXUS foi posicionado para parecer avançado, exclusivo e estrategicamente relevante desde o primeiro contato."
              className="min-h-[320px]"
            />
          </div>

          <form className="rounded-[34px] border border-[#C9A34E]/18 bg-[#0A0C11]/94 p-7 shadow-gold backdrop-blur-xl sm:p-8">
            <div className="mb-6 space-y-2">
              <p className="text-xs uppercase tracking-[0.32em] text-[#C9A34E]">Formulário institucional</p>
              <h3 className="text-2xl font-semibold text-[#F5F5F5]">Solicite uma apresentação do Programa HUMANEXUS.</h3>
              <p className="text-sm leading-7 text-[#B8B8B8]">
                Preencha os dados e avance para uma conversa executiva sobre contexto, escopo e oportunidade institucional.
              </p>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              {["Nome", "Empresa", "Cargo", "WhatsApp", "E-mail"].map((label) => (
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
                  placeholder="Descreva o contexto da sua organização e o objetivo da conversa."
                  className="w-full rounded-3xl border border-white/10 bg-[#111111] px-4 py-4 text-sm text-[#F5F5F5] outline-none transition focus:border-[#C9A34E]/50"
                />
              </label>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <PrimaryButton href="mailto:contato@institutohumanexus.com">Enviar e-mail institucional</PrimaryButton>
              <SecondaryButton href="https://wa.me/5592981187777">Falar com o Instituto</SecondaryButton>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}
