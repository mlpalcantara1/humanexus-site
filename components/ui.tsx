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
    <div className={`max-w-3xl space-y-5 ${className}`}>
      {eyebrow ? (
        <p className="text-[10px] uppercase tracking-[0.42em] text-[#D4AF37] md:text-[11px]">{eyebrow}</p>
      ) : null}
      <h2 className="text-3xl font-semibold leading-[0.95] text-[#F5F5F5] md:text-5xl xl:text-[3.7rem]">{title}</h2>
      {description ? <p className="max-w-2xl text-base leading-8 text-[#98A1AE] md:text-[1.04rem]">{description}</p> : null}
    </div>
  );
}

export function GlassCard({
  title,
  description,
  accent = "soft",
  className = "",
  children
}: PropsWithChildren<{
  title?: string;
  description?: string;
  accent?: "soft" | "gold";
  className?: string;
}>) {
  return (
    <div
      className={`group relative overflow-hidden rounded-[28px] border p-6 backdrop-blur-xl transition duration-500 ${
        accent === "gold"
          ? "border-[#D4AF37]/20 bg-[linear-gradient(180deg,rgba(212,175,55,0.08),rgba(255,255,255,0.015))] shadow-[0_26px_90px_rgba(212,175,55,0.08)]"
          : "border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] shadow-[0_22px_70px_rgba(0,0,0,0.32)]"
      } ${className}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.05),transparent_28%)] opacity-0 transition duration-500 group-hover:opacity-100" />
      <div className="relative">
        {title ? <h3 className="text-lg font-semibold leading-tight text-[#F5F5F5] md:text-xl">{title}</h3> : null}
        {description ? <p className="mt-3 text-sm leading-7 text-[#99A2AE]">{description}</p> : null}
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
      className="inline-flex items-center justify-center rounded-full border border-[#D4AF37]/24 bg-[linear-gradient(135deg,rgba(212,175,55,0.28),rgba(212,175,55,0.1))] px-6 py-3.5 text-sm font-semibold tracking-[0.12em] text-[#F5F5F5] shadow-[0_18px_44px_rgba(212,175,55,0.14)] transition duration-300 hover:-translate-y-0.5 hover:border-[#D4AF37]/40 hover:shadow-[0_26px_58px_rgba(212,175,55,0.18)]"
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
      className="inline-flex items-center justify-center rounded-full border border-white/12 bg-white/[0.025] px-6 py-3.5 text-sm font-medium tracking-[0.08em] text-[#F5F5F5] transition duration-300 hover:-translate-y-0.5 hover:border-[#C9A34E]/36 hover:bg-white/[0.05]"
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
      <div className="relative mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-32">
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
    ["Escopo", "Institucional"],
    ["Modelo", "Contínuo"],
    ["Aplicação", "Alta criticidade"],
    ["Entrega", "Executiva"]
  ];

  const signals = [
    "Segurança operacional",
    "Riscos psicossociais",
    "Liderança sob pressão",
    "Acompanhamento longitudinal"
  ];

  return (
    <div className="relative min-w-0 overflow-hidden rounded-[34px] border border-[#C9A34E]/18 bg-[linear-gradient(180deg,rgba(9,10,14,0.98),rgba(5,6,8,0.98))] p-5 shadow-[0_40px_140px_rgba(0,0,0,0.46)] backdrop-blur-2xl sm:p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(201,163,78,0.14),transparent_20%),radial-gradient(circle_at_bottom_left,rgba(34,84,148,0.1),transparent_24%)]" />
      <div className="absolute inset-0 opacity-18 [background-image:linear-gradient(rgba(255,255,255,0.028)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] [background-size:128px_128px]" />
      <div className="relative grid min-w-0 gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="relative min-h-[460px] overflow-hidden rounded-[28px] border border-white/10 bg-[#050505]">
          <Image src={brandAssets.media.hangarOperations} alt="Ambiente operacional do Instituto HUMANEXUS" fill className="object-cover object-center" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.04),rgba(5,5,5,0.76))]" />
          <div className="absolute inset-x-6 top-6 flex items-center gap-3">
            <div className="rounded-full border border-[#D4AF37]/26 bg-[#050505]/72 px-3 py-2 text-[10px] uppercase tracking-[0.38em] text-[#D4AF37]">
              HX
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.34em] text-[#D4AF37]">HUMANEXUS</p>
              <p className="text-sm text-[#DCE0E6]">Painel institucional reservado</p>
            </div>
          </div>
          <div className="absolute inset-x-6 bottom-6 rounded-[24px] border border-white/10 bg-[#050505]/70 p-5 backdrop-blur-xl">
            <p className="text-[10px] uppercase tracking-[0.34em] text-[#D4AF37]">Visão de comando</p>
            <p className="mt-3 max-w-lg text-sm leading-7 text-[#E3E7ED]">
              Presença visual compatível com acompanhamento executivo, continuidade institucional e ambientes em que a resposta humana influencia a operação.
            </p>
          </div>
        </div>

        <div className="min-w-0 space-y-4">
          <div className="rounded-[28px] border border-[#D4AF37]/14 bg-white/[0.02] p-6">
            <p className="text-[10px] uppercase tracking-[0.38em] text-[#B1B5BE]">Sistema HUMANEXUS</p>
            <h3 className="mt-6 max-w-3xl text-3xl font-semibold leading-[0.95] text-[#F5F5F5] sm:text-4xl">
              Acompanhamento institucional em linguagem compatível com comando, risco e continuidade.
            </h3>
            <div className="mt-6 h-px w-full bg-[linear-gradient(90deg,rgba(212,175,55,0.58),transparent)]" />
            <p className="mt-6 max-w-2xl text-base leading-8 text-[#8F95A0]">
              O Instituto sustenta programas contínuos para organizações que precisam fortalecer estabilidade humana, leitura executiva e segurança operacional.
            </p>
          </div>

          <div className="grid min-w-0 gap-4 sm:grid-cols-2">
            {metrics.map(([label, value]) => (
              <div key={label} className="min-w-0 rounded-[22px] border border-white/10 bg-white/[0.02] p-5">
                <p className="text-[10px] uppercase tracking-[0.34em] text-[#AAB0BB]">{label}</p>
                <p className="mt-4 text-base font-medium leading-7 text-[#F5F5F5]">{value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.02] p-5">
            <p className="text-[10px] uppercase tracking-[0.34em] text-[#AAB0BB]">Frentes priorizadas</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {signals.map((signal) => (
                <div key={signal} className="rounded-full border border-white/10 bg-[#090b0f] px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-[#E0E4EA]">
                  {signal}
                </div>
              ))}
            </div>
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
          <h3 className="text-3xl font-semibold text-[#F5F5F5]">Entrar no ambiente reservado</h3>
          <p className="max-w-md text-sm leading-7 text-[#9EA3AE]">
            Interface visual demonstrativa para a futura camada reservada do Instituto HUMANEXUS.
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
