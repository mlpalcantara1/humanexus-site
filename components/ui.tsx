import Image from "next/image";
import Link from "next/link";
import { PropsWithChildren } from "react";
import { brandAssets } from "@/lib/brand-assets";

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
    <div className={`max-w-3xl space-y-4 ${className}`}>
      {eyebrow ? (
        <p className="text-[10px] uppercase tracking-[0.42em] text-[#C9A34E] md:text-[11px]">{eyebrow}</p>
      ) : null}
      <h2 className="text-3xl font-semibold leading-[0.96] text-[#F5F5F5] md:text-5xl xl:text-[3.6rem]">{title}</h2>
      {description ? <p className="max-w-2xl text-base leading-7 text-[#9EA3AE] md:text-[1.05rem]">{description}</p> : null}
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
      className={`group relative overflow-hidden rounded-[26px] border p-6 backdrop-blur-xl transition duration-500 ${
        accent === "gold"
          ? "border-[#C9A34E]/22 bg-[linear-gradient(180deg,rgba(201,163,78,0.08),rgba(255,255,255,0.02))] shadow-[0_24px_90px_rgba(201,163,78,0.08)]"
          : "border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.012))] shadow-[0_22px_70px_rgba(0,0,0,0.3)]"
      }`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.05),transparent_28%)] opacity-0 transition duration-500 group-hover:opacity-100" />
      <div className="relative">
        {title ? <h3 className="text-lg font-semibold leading-tight text-[#F5F5F5] md:text-xl">{title}</h3> : null}
        {description ? <p className="mt-3 text-sm leading-7 text-[#9EA3AE]">{description}</p> : null}
        {children ? <div className={title || description ? "mt-5" : ""}>{children}</div> : null}
      </div>
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
      className="inline-flex items-center justify-center rounded-full border border-[#D6B45D]/18 bg-[linear-gradient(135deg,#d8b860,#b88627)] px-6 py-3.5 text-sm font-semibold tracking-[0.08em] text-[#050505] shadow-[0_18px_40px_rgba(201,163,78,0.2)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_52px_rgba(201,163,78,0.26)] hover:brightness-105"
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
      className="inline-flex items-center justify-center rounded-full border border-white/12 bg-white/[0.025] px-6 py-3.5 text-sm font-medium tracking-[0.04em] text-[#F5F5F5] transition duration-300 hover:-translate-y-0.5 hover:border-[#C9A34E]/36 hover:bg-white/[0.05]"
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
    <section className="relative overflow-hidden border-b border-white/8 bg-[#040507]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_12%,rgba(201,163,78,0.12),transparent_22%),radial-gradient(circle_at_16%_14%,rgba(34,84,148,0.12),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_60%)]" />
      <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.022)_1px,transparent_1px)] [background-size:152px_152px] [mask-image:radial-gradient(circle_at_center,black,transparent_82%)]" />
      <div className="relative mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-28">
        <div className={media ? "grid gap-12 lg:grid-cols-[0.86fr_1.14fr] lg:items-center" : ""}>
          <div className="max-w-4xl space-y-8">
            <div className="flex items-center gap-3">
              <div className="h-px w-12 bg-[linear-gradient(90deg,#C9A34E,transparent)]" />
              <p className="text-[10px] uppercase tracking-[0.38em] text-[#C9A34E] md:text-[11px]">{eyebrow}</p>
            </div>
            <h1 className="max-w-4xl text-4xl font-semibold leading-[0.96] text-[#F5F5F5] md:text-6xl lg:text-[4.6rem]">
              {title}
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-[#9EA3AE]">{description}</p>
            {(primary || secondary) && (
              <div className="flex flex-col gap-4 sm:flex-row">
                {primary ? <PrimaryButton href={primary.href}>{primary.label}</PrimaryButton> : null}
                {secondary ? <SecondaryButton href={secondary.href}>{secondary.label}</SecondaryButton> : null}
              </div>
            )}
          </div>
          {media ? (
            <div className="relative min-h-[460px] overflow-hidden rounded-[32px] border border-[#C9A34E]/16 bg-[#090909] shadow-[0_36px_120px_rgba(0,0,0,0.42)]">
              <Image src={media.src} alt={media.alt} fill className="object-cover" priority />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.1),rgba(5,5,5,0.78))]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(201,163,78,0.14),transparent_22%)]" />
              {media.badge ? (
                <div className="absolute left-6 top-6 rounded-full border border-white/10 bg-[#050505]/68 px-4 py-2 text-[10px] uppercase tracking-[0.34em] text-[#C9A34E]">
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
      {items.map((item, index) => (
        <GlassCard key={item.title} title={item.title} description={item.description} accent={index === 0 ? "gold" : "soft"} />
      ))}
    </div>
  );
}

export function DashboardMock() {
  const metrics = [
    ["Camada", "Operação crítica"],
    ["Leitura", "Institucional"],
    ["Status", "Contínuo"],
    ["Escopo", "Longitudinal"]
  ];

  return (
    <div className="relative min-w-0 overflow-hidden rounded-[34px] border border-[#C9A34E]/18 bg-[linear-gradient(180deg,rgba(9,10,14,0.98),rgba(5,6,8,0.98))] p-5 shadow-[0_40px_140px_rgba(0,0,0,0.46)] backdrop-blur-2xl sm:p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(201,163,78,0.14),transparent_20%),radial-gradient(circle_at_bottom_left,rgba(34,84,148,0.1),transparent_24%)]" />
      <div className="absolute inset-0 opacity-18 [background-image:linear-gradient(rgba(255,255,255,0.028)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] [background-size:128px_128px]" />
      <div className="relative grid min-w-0 gap-4 xl:grid-cols-[200px_1fr]">
        <div className="min-w-0 space-y-4">
          <div className="rounded-[24px] border border-white/10 bg-white/[0.02] p-6">
            <div className="relative h-14 w-14">
              <Image src={brandAssets.monogramLight} alt="Monograma HUMANEXUS" fill className="object-contain invert" />
            </div>
            <p className="mt-5 text-[10px] uppercase tracking-[0.34em] text-[#A8AFB9]">Leitura reservada</p>
            <h3 className="mt-3 text-2xl font-semibold text-[#F5F5F5]">HUMANEXUS</h3>
            <p className="mt-4 text-sm leading-7 text-[#8F95A0]">
              Estrutura de leitura humana, síntese executiva e acompanhamento em contextos de missão.
            </p>
          </div>

          <div className="grid gap-3">
            {["Missão", "Ambientes críticos", "Estrutura aplicada"].map((item, index) => (
              <div
                key={item}
                className={`rounded-[22px] border px-5 py-4 text-sm ${
                  index === 0
                    ? "border-[#C9A34E]/24 bg-[#C9A34E]/8 text-[#F5F5F5]"
                    : "border-white/10 bg-white/[0.02] text-[#AAB0BB]"
                }`}
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="min-w-0 space-y-4">
          <div className="rounded-[28px] border border-[#C9A34E]/14 bg-white/[0.02] p-6">
            <p className="text-[10px] uppercase tracking-[0.38em] text-[#B1B5BE]">Painel institucional</p>
            <h3 className="mt-6 max-w-3xl text-3xl font-semibold leading-[0.95] text-[#F5F5F5] sm:text-4xl md:text-5xl">
              Inteligência operacional para decisão institucional
            </h3>
            <p className="mt-5 text-sm uppercase tracking-[0.28em] text-[#C9A34E]">integrar · regular · intervir · transformar</p>
            <div className="mt-6 h-px w-full bg-[linear-gradient(90deg,rgba(201,163,78,0.58),transparent)]" />
            <p className="mt-6 max-w-2xl text-base leading-8 text-[#8F95A0]">
              Síntese de estabilidade, risco humano e leitura institucional para organizações que operam sob pressão contínua.
            </p>
          </div>

          <div className="grid min-w-0 gap-4 sm:grid-cols-2">
            {metrics.map(([label, value]) => (
              <div key={label} className="min-w-0 rounded-[22px] border border-white/10 bg-white/[0.02] p-5">
                <p className="text-[10px] uppercase tracking-[0.34em] text-[#AAB0BB]">{label}</p>
                <p className="mt-4 text-lg font-medium text-[#F5F5F5]">{value}</p>
              </div>
            ))}
          </div>

          <div className="grid min-w-0 gap-4 md:grid-cols-3">
            {[
              ["Estabilidade", "Capacidade humana sob pressão", "72%"],
              ["Confiabilidade", "Ambientes de alta responsabilidade", "64%"],
              ["Maturidade", "Leitura longitudinal", "81%"]
            ].map(([label, value, width]) => (
              <div key={label} className="min-w-0 rounded-[22px] border border-white/10 bg-[#0C0E11] p-5">
                <p className="text-[10px] uppercase tracking-[0.34em] text-[#AAB0BB]">{label}</p>
                <p className="mt-6 text-base text-[#F5F5F5]">{value}</p>
                <div className="mt-6 h-2 rounded-full bg-white/8">
                  <div className="h-2 rounded-full bg-[linear-gradient(90deg,#C9A34E,#e1c77f)]" style={{ width }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function LoginMock() {
  return (
    <div className="relative overflow-hidden rounded-[30px] border border-[#C9A34E]/18 bg-[linear-gradient(180deg,rgba(9,10,14,0.98),rgba(5,6,8,0.98))] p-7 shadow-[0_28px_90px_rgba(0,0,0,0.38)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(201,163,78,0.12),transparent_24%)]" />
      <div className="relative space-y-6">
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-[0.34em] text-[#C9A34E]">Acesso reservado</p>
          <h3 className="text-3xl font-semibold text-[#F5F5F5]">Entrar no cockpit operacional</h3>
          <p className="max-w-md text-sm leading-7 text-[#9EA3AE]">
            Interface visual demonstrativa para a futura camada privada do ecossistema HUMANEXUS.
          </p>
        </div>

        <div className="grid gap-4">
          {["Usuário autorizado", "Senha de acesso"].map((label) => (
            <label key={label} className="space-y-2 text-sm text-[#F5F5F5]">
              <span>{label}</span>
              <div className="rounded-[22px] border border-white/10 bg-[#0B0C10] px-4 py-4 text-[#6E7680]">{label}</div>
            </label>
          ))}
        </div>

        <div className="rounded-full border border-[#C9A34E]/26 bg-[linear-gradient(135deg,#d6b45d,#b98b2d)] px-5 py-4 text-center text-sm font-semibold tracking-[0.08em] text-[#050505]">
          Entrar com autenticação
        </div>
      </div>
    </div>
  );
}
