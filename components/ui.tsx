import Image from "next/image";
import Link from "next/link";
import { brandAssets } from "@/lib/brand-assets";
import { PropsWithChildren } from "react";

type SectionProps = PropsWithChildren<{
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
}>;

export function SectionIntro({
  eyebrow,
  title,
  description,
  className = ""
}: SectionProps) {
  return (
    <div className={`max-w-3xl space-y-5 ${className}`}>
      {eyebrow ? (
        <p className="text-[11px] uppercase tracking-[0.34em] text-[#C9A34E]">{eyebrow}</p>
      ) : null}
      <h2 className="text-3xl font-semibold leading-[1.08] text-[#F5F5F5] md:text-4xl">
        {title}
      </h2>
      {description ? <p className="text-base leading-8 text-[#B8B8B8] md:text-lg">{description}</p> : null}
    </div>
  );
}

export function GlassCard({
  title,
  description,
  accent = "soft",
  children
}: PropsWithChildren<{
  title?: string;
  description?: string;
  accent?: "soft" | "gold";
}>) {
  return (
    <div
      className={`rounded-[30px] border bg-[linear-gradient(180deg,rgba(255,255,255,0.038),rgba(255,255,255,0.02))] p-6 shadow-panel backdrop-blur-xl ${
        accent === "gold" ? "border-[#C9A34E]/30" : "border-white/10"
      }`}
    >
      {title ? <h3 className="text-xl font-semibold leading-tight text-[#F5F5F5]">{title}</h3> : null}
      {description ? <p className="mt-3 text-sm leading-7 text-[#B8B8B8]">{description}</p> : null}
      {children ? <div className={title || description ? "mt-5" : ""}>{children}</div> : null}
    </div>
  );
}

export function PrimaryButton({
  href,
  children
}: PropsWithChildren<{
  href: string;
}>) {
  const external = /^(https?:|mailto:|tel:)/.test(href);

  return (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className="inline-flex items-center justify-center rounded-full border border-[#E3C46E]/24 bg-[linear-gradient(135deg,#d4af58,#c3972e)] px-6 py-3.5 text-sm font-semibold text-[#050505] shadow-gold transition hover:-translate-y-0.5 hover:brightness-105"
    >
      {children}
    </Link>
  );
}

export function SecondaryButton({
  href,
  children
}: PropsWithChildren<{
  href: string;
}>) {
  const external = /^(https?:|mailto:|tel:)/.test(href);

  return (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className="inline-flex items-center justify-center rounded-full border border-white/12 bg-white/[0.02] px-6 py-3.5 text-sm font-medium text-[#F5F5F5] transition hover:-translate-y-0.5 hover:border-[#C9A34E]/40 hover:bg-white/5"
    >
      {children}
    </Link>
  );
}

export function PageHero({
  eyebrow,
  title,
  description,
  primary,
  secondary,
  media
}: {
  eyebrow: string;
  title: string;
  description: string;
  primary?: { href: string; label: string };
  secondary?: { href: string; label: string };
  media?: { src: string; alt: string; badge?: string };
}) {
  return (
    <section className="relative overflow-hidden border-b border-white/10 bg-hero-grid">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(201,163,78,0.16),transparent_28%),radial-gradient(circle_at_12%_20%,rgba(36,92,164,0.15),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent_60%)]" />
      <div className="relative mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-28">
        <div className={media ? "grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center" : ""}>
          <div className="max-w-4xl space-y-8">
            <div className="flex items-center gap-3">
              <div className="relative h-11 w-11 overflow-hidden rounded-2xl border border-[#C9A34E]/16 bg-white/95 shadow-[0_12px_40px_rgba(255,255,255,0.08)]">
                <Image src={brandAssets.monogramLight} alt="" fill aria-hidden className="object-contain p-1.5" />
              </div>
              <p className="text-[11px] uppercase tracking-[0.34em] text-[#C9A34E]">{eyebrow}</p>
            </div>
            <h1 className="max-w-4xl text-4xl font-semibold leading-tight text-[#F5F5F5] md:text-6xl">
              {title}
            </h1>
            <p className="max-w-3xl text-lg leading-8 text-[#B8B8B8]">{description}</p>
            {(primary || secondary) && (
              <div className="flex flex-col gap-4 sm:flex-row">
                {primary ? <PrimaryButton href={primary.href}>{primary.label}</PrimaryButton> : null}
                {secondary ? <SecondaryButton href={secondary.href}>{secondary.label}</SecondaryButton> : null}
              </div>
            )}
          </div>
          {media ? (
            <div className="relative min-h-[420px] overflow-hidden rounded-[36px] border border-[#C9A34E]/22 bg-[#090909] shadow-gold">
              <Image src={media.src} alt={media.alt} fill className="object-cover" priority />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.06),rgba(5,5,5,0.74))]" />
              {media.badge ? (
                <div className="absolute left-6 top-6 rounded-full border border-[#C9A34E]/24 bg-[#050505]/76 px-4 py-2 text-[11px] uppercase tracking-[0.28em] text-[#C9A34E]">
                  {media.badge}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function CardGrid({
  items,
  columns = "lg:grid-cols-3"
}: {
  items: { title: string; description?: string }[];
  columns?: string;
}) {
  return (
    <div className={`grid gap-5 md:grid-cols-2 ${columns}`}>
      {items.map((item) => (
        <GlassCard key={item.title} title={item.title} description={item.description} />
      ))}
    </div>
  );
}

export function DashboardMock() {
  return (
    <div className="rounded-[36px] border border-[#C9A34E]/18 bg-[linear-gradient(180deg,rgba(11,11,14,0.97),rgba(6,8,12,0.97))] p-6 shadow-gold backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#C9A34E]">HUMANEXUS Command Layer</p>
          <h3 className="mt-2 text-2xl font-semibold text-[#F5F5F5]">Leitura executiva de estabilidade operacional</h3>
        </div>
        <div className="rounded-full border border-[#C9A34E]/30 bg-[#C9A34E]/10 px-4 py-2 text-xs uppercase tracking-[0.24em] text-[#F5F5F5]">
          Instituto Premium
        </div>
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[30px] border border-white/10 bg-white/[0.02] p-5">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ["Leitura humana", "estabilidade e risco"],
              ["Cultura", "liderança e decisão"],
              ["Programa", "acompanhamento contínuo"]
            ].map(([label, text]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-[#111111] p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-[#C9A34E]">{label}</p>
                <p className="mt-4 text-sm text-[#B8B8B8]">{text}</p>
                <div className="mt-4 h-16 rounded-2xl bg-[linear-gradient(90deg,rgba(201,163,78,0.18),transparent_70%),linear-gradient(180deg,rgba(255,255,255,0.06),transparent)]" />
              </div>
            ))}
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-[24px] border border-white/10 bg-[#0C0C0C] p-4">
              <p className="text-xs uppercase tracking-[0.28em] text-[#B8B8B8]">Indicadores executivos</p>
              <div className="mt-4 space-y-3">
                {[
                  ["Estabilidade operacional", "81%"],
                  ["Maturidade de liderança", "74%"],
                  ["Cultura de segurança", "62%"],
                  ["Risco humano residual", "46%"]
                ].map(([name, value]) => (
                  <div key={name}>
                    <div className="flex items-center justify-between text-sm text-[#F5F5F5]">
                      <span>{name}</span>
                      <span>{value}</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-white/10">
                      <div className="h-2 rounded-full bg-[#C9A34E]" style={{ width: value }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-[#0C0C0C] p-4">
              <p className="text-xs uppercase tracking-[0.28em] text-[#B8B8B8]">Matriz institucional</p>
              <div className="mt-4 grid gap-3">
                {[
                  "Leitura inicial: consolidada",
                  "Programa: longitudinal",
                  "Escopo: liderança, fatores humanos e risco psicossocial",
                  "Ação: implementar ciclo executivo"
                ].map((line) => (
                  <div key={line} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-[#F5F5F5]">
                    {line}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <GlassCard accent="gold" title="Cockpit institucional" description="Assinatura visual para leitura executiva, relatórios premium e contexto operacional de alta exigência.">
            <div className="h-44 rounded-[24px] bg-[linear-gradient(135deg,rgba(201,163,78,0.22),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.08),transparent)]" />
          </GlassCard>
          <GlassCard title="Assinatura de programa" description="Programas HUMANEXUS, acompanhamento contínuo, relatórios executivos e presença institucional compatível com organizações de elite." />
        </div>
      </div>
    </div>
  );
}

export function LoginMock() {
  return (
    <GlassCard accent="gold">
      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#050505]">
          <div className="relative h-36 w-full">
            <Image
              src={brandAssets.brandBoard}
              alt="Identidade visual oficial HUMANEXUS"
              fill
              className="object-cover object-center opacity-50"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/75 to-transparent" />
          <div className="absolute inset-x-4 bottom-4 flex items-end justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[#C9A34E]">Área HUMANEXUS</p>
              <h3 className="mt-2 text-2xl font-semibold text-[#F5F5F5]">Acesso à plataforma</h3>
            </div>
            <div className="relative h-14 w-14 overflow-hidden rounded-2xl border border-[#C9A34E]/20 bg-white p-1.5">
              <Image src={brandAssets.monogramLight} alt="Logo HUMANEXUS" fill className="object-contain p-1.5" />
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-[#0C0C0C] px-4 py-3 text-sm text-[#B8B8B8]">E-mail</div>
          <div className="rounded-2xl border border-white/10 bg-[#0C0C0C] px-4 py-3 text-sm text-[#B8B8B8]">Senha</div>
        </div>
        <div className="flex flex-col gap-3">
          <div className="rounded-full bg-[#C9A34E] px-4 py-3 text-center text-sm font-semibold text-[#050505]">
            Acessar
          </div>
          <div className="text-center text-sm text-[#B8B8B8]">Recuperar senha</div>
        </div>
      </div>
    </GlassCard>
  );
}
