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
    <div className={`max-w-3xl space-y-4 ${className}`}>
      {eyebrow ? (
        <p className="text-[10px] uppercase tracking-[0.4em] text-[#C9A34E] md:text-[11px]">{eyebrow}</p>
      ) : null}
      <h2 className="text-3xl font-semibold leading-[1] text-[#F5F5F5] md:text-5xl">{title}</h2>
      {description ? <p className="max-w-2xl text-base leading-7 text-[#9EA3AE] md:text-lg">{description}</p> : null}
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
      className={`group relative overflow-hidden rounded-[28px] border bg-[linear-gradient(180deg,rgba(255,255,255,0.028),rgba(255,255,255,0.012))] p-6 backdrop-blur-xl transition duration-300 ${
        accent === "gold"
          ? "border-[#C9A34E]/24 shadow-[0_22px_80px_rgba(201,163,78,0.08)]"
          : "border-white/8 shadow-[0_18px_60px_rgba(0,0,0,0.32)]"
      }`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.06),transparent_28%)] opacity-0 transition duration-300 group-hover:opacity-100" />
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
      className="inline-flex items-center justify-center rounded-full border border-[#D5B15A]/18 bg-[linear-gradient(135deg,#d6b45d,#b98b2d)] px-6 py-3.5 text-sm font-semibold tracking-[0.02em] text-[#050505] shadow-[0_18px_40px_rgba(201,163,78,0.24)] transition hover:-translate-y-0.5 hover:brightness-105"
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
      className="inline-flex items-center justify-center rounded-full border border-white/12 bg-white/[0.02] px-6 py-3.5 text-sm font-medium text-[#F5F5F5] transition hover:-translate-y-0.5 hover:border-[#C9A34E]/36 hover:bg-white/[0.05]"
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
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_84%_16%,rgba(201,163,78,0.14),transparent_22%),radial-gradient(circle_at_12%_20%,rgba(36,92,164,0.12),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent_60%)]" />
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] [background-size:140px_140px] [mask-image:radial-gradient(circle_at_center,black,transparent_82%)]" />
      <div className="relative mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-28">
        <div className={media ? "grid gap-12 lg:grid-cols-[0.84fr_1.16fr] lg:items-center" : ""}>
          <div className="max-w-4xl space-y-8">
            <div className="flex items-center gap-3">
              <div className="h-px w-12 bg-[linear-gradient(90deg,#C9A34E,transparent)]" />
              <p className="text-[10px] uppercase tracking-[0.38em] text-[#C9A34E] md:text-[11px]">{eyebrow}</p>
            </div>
            <h1 className="max-w-4xl text-4xl font-semibold leading-[0.98] text-[#F5F5F5] md:text-6xl lg:text-[4.4rem]">
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
            <div className="relative min-h-[440px] overflow-hidden rounded-[34px] border border-[#C9A34E]/16 bg-[#090909] shadow-[0_36px_120px_rgba(0,0,0,0.42)]">
              <Image src={media.src} alt={media.alt} fill className="object-cover" priority />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.06),rgba(5,5,5,0.72))]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(201,163,78,0.18),transparent_20%)]" />
              {media.badge ? (
                <div className="absolute left-6 top-6 rounded-full border border-[#C9A34E]/20 bg-[#050505]/72 px-4 py-2 text-[10px] uppercase tracking-[0.34em] text-[#C9A34E]">
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
    <div className="relative overflow-hidden rounded-[38px] border border-[#C9A34E]/18 bg-[linear-gradient(180deg,rgba(9,10,14,0.98),rgba(5,6,8,0.98))] p-4 shadow-[0_40px_140px_rgba(0,0,0,0.46)] backdrop-blur-2xl sm:p-5">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(201,163,78,0.14),transparent_22%),radial-gradient(circle_at_bottom_left,rgba(39,84,148,0.12),transparent_24%)]" />
      <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] [background-size:128px_128px]" />
      <div className="relative grid gap-4 xl:grid-cols-[260px_1fr]">
        <div className="space-y-4">
          <div className="rounded-[30px] border border-[#C9A34E]/16 bg-white/[0.02] p-6">
            <div className="grid h-16 w-16 place-items-center rounded-[22px] border border-white/10 bg-black/40 text-lg font-semibold tracking-[0.28em] text-[#C9A34E]">
              HX
            </div>
            <p className="mt-5 text-[10px] uppercase tracking-[0.36em] text-[#B1B5BE]">Plataforma proprietária</p>
            <h3 className="mt-3 text-2xl font-semibold text-[#F5F5F5]">HUMANEXUS</h3>
            <p className="mt-3 text-sm leading-7 text-[#8F95A0]">
              Integrar, regular, intervir e transformar a leitura humana em contexto de missão.
            </p>
          </div>

          <div className="grid gap-3">
            {[
              "Controle de missão",
              "Programas institucionais",
              "Leitura executiva",
              "Relatórios estratégicos"
            ].map((item, index) => (
              <div
                key={item}
                className={`rounded-[24px] border px-5 py-4 text-sm ${
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

        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[1.12fr_0.88fr]">
            <div className="rounded-[32px] border border-[#C9A34E]/14 bg-white/[0.02] p-6">
              <p className="text-[10px] uppercase tracking-[0.38em] text-[#B1B5BE]">Controle de missão</p>
              <h3 className="mt-6 text-4xl font-semibold leading-none text-[#F5F5F5] md:text-5xl">Painel operacional unificado</h3>
              <p className="mt-5 text-sm uppercase tracking-[0.28em] text-[#C9A34E]">
                Integrar · regular · intervir · transformar
              </p>
              <div className="mt-6 h-px w-full bg-[linear-gradient(90deg,rgba(201,163,78,0.55),transparent)]" />
              <p className="mt-6 max-w-2xl text-base leading-8 text-[#8F95A0]">
                Leitura rápida do estado humano, contexto da missão, vetores críticos e evidências executivas para decisão institucional.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ["Usuário", "Instituto HUMANEXUS"],
                ["Camada", "Operação crítica"],
                ["Leitura", "Tempo real"],
                ["Status", "Autenticado"]
              ].map(([label, value]) => (
                <div key={label} className="rounded-[28px] border border-white/10 bg-white/[0.02] p-5">
                  <p className="text-[10px] uppercase tracking-[0.34em] text-[#AAB0BB]">{label}</p>
                  <p className="mt-4 text-lg font-medium text-[#F5F5F5]">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            {[
              ["Aeronaves", "operações aéreas"],
              ["Equipes", "coordenação crítica"],
              ["Risco humano", "monitoramento"],
              ["Relatórios", "camada executiva"]
            ].map(([label, value]) => (
              <div key={label} className="rounded-[28px] border border-white/10 bg-[#0C0E11] p-5">
                <p className="text-[10px] uppercase tracking-[0.34em] text-[#AAB0BB]">{label}</p>
                <p className="mt-6 text-base text-[#F5F5F5]">{value}</p>
                <div className="mt-6 h-2 rounded-full bg-white/8">
                  <div className="h-2 rounded-full bg-[linear-gradient(90deg,#C9A34E,#e1c77f)]" style={{ width: "68%" }} />
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.03),rgba(255,255,255,0.012))] p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.34em] text-[#AAB0BB]">Leitura institucional</p>
                <p className="mt-2 text-base text-[#F5F5F5]">Estrutura premium para programas, formação e acompanhamento longitudinal.</p>
              </div>
              <div className="rounded-full border border-[#C9A34E]/20 bg-[#C9A34E]/10 px-4 py-2 text-[10px] uppercase tracking-[0.32em] text-[#C9A34E]">
                instituto premium
              </div>
            </div>
          </div>
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
            <div className="grid h-14 w-14 place-items-center rounded-2xl border border-[#C9A34E]/20 bg-[#0A0A0A]/82 text-sm font-semibold tracking-[0.22em] text-[#C9A34E]">
              HX
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-[#0C0C0C] px-4 py-3 text-sm text-[#B8B8B8]">E-mail</div>
          <div className="rounded-2xl border border-white/10 bg-[#0C0C0C] px-4 py-3 text-sm text-[#B8B8B8]">Senha</div>
        </div>
        <div className="flex flex-col gap-3">
          <div className="rounded-full bg-[#C9A34E] px-4 py-3 text-center text-sm font-semibold text-[#050505]">Acessar</div>
          <div className="text-center text-sm text-[#B8B8B8]">Recuperar senha</div>
        </div>
      </div>
    </GlassCard>
  );
}
