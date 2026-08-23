"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

type IconName = "command" | "building" | "people" | "anamnese" | "sessions" | "training" | "cockpit" | "vectors" | "resultant" | "routes" | "protocol" | "longitudinal" | "replay" | "reports" | "lab" | "admin" | "settings";
type Item = { label: string; href: string; mark: string; icon: IconName; restricted?: "lab" | "admin" };
type Group = { label: string; items: Item[] };

const GROUPS: Group[] = [
  {
    label: "Operação",
    items: [
      { label: "Painel de Comando", href: "/plataforma/painel", mark: "01", icon: "command" },
      { label: "Organizações", href: "/plataforma/organizacoes", mark: "02", icon: "building" },
      { label: "Participantes", href: "/plataforma/clientes", mark: "03", icon: "people" },
      { label: "Anamnese Regulatória", href: "/plataforma/anamnese-regulatoria", mark: "04", icon: "anamnese" },
      { label: "Sessões", href: "/plataforma/sessoes", mark: "05", icon: "sessions" },
      { label: "Treinamentos", href: "/plataforma/treinamentos", mark: "06", icon: "training" }
    ]
  },
  {
    label: "Inteligência",
    items: [
      { label: "Cockpit Vivo", href: "/plataforma/cockpit-vivo", mark: "07", icon: "cockpit" },
      { label: "Arquitetura Vetorial", href: "/plataforma/cockpit-vivo?visao=matriz-vetorial", mark: "08", icon: "vectors" },
      { label: "Resultante", href: "/plataforma/cockpit-vivo?visao=resultante", mark: "09", icon: "resultant" },
      { label: "Rotas Regulatórias", href: "/plataforma/cockpit-vivo?visao=rotas-regulatorias", mark: "10", icon: "routes" },
      { label: "CTR · THX · THX-AER", href: "/plataforma/cockpit-vivo?visao=ctr-thx", mark: "11", icon: "protocol" },
      { label: "Longitudinal", href: "/plataforma/cockpit-vivo?visao=longitudinal", mark: "12", icon: "longitudinal" },
      { label: "Replay", href: "/plataforma/cockpit-vivo?visao=replay", mark: "13", icon: "replay" },
      { label: "Relatórios e exportação", href: "/plataforma/cockpit-vivo?visao=relatorio", mark: "14", icon: "reports" }
    ]
  },
  {
    label: "Governança",
    items: [
      { label: "HUMANEXUS LAB", href: "/plataforma/humanexus-lab", mark: "LAB", icon: "lab", restricted: "lab" },
      { label: "Administração", href: "/admin", mark: "ADM", icon: "admin", restricted: "admin" },
      { label: "Configurações", href: "/plataforma/configuracoes", mark: "CFG", icon: "settings" }
    ]
  }
];

const ICON_PATHS: Record<IconName, ReactNode> = {
  command: <><path d="M4 5.5h16M4 12h10M4 18.5h7" /><path d="m16 15 4 3.5-4 3.5" /></>,
  building: <><path d="M5 21V5l7-3 7 3v16" /><path d="M2 21h20M9 8h2m4 0h1M9 12h2m4 0h1M9 16h2m4 0h1" /></>,
  people: <><circle cx="9" cy="8" r="3" /><path d="M3 21v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 5v2" /></>,
  anamnese: <><path d="M6 3h12v18H6zM9 7h6M9 11h6M9 15h3" /><path d="M4 6H2v13h12v2" /></>,
  sessions: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2M8 2v3m8-3v3" /></>,
  training: <><path d="m3 7 9-4 9 4-9 4zM6 9v6c3 3 9 3 12 0V9M21 7v8" /></>,
  cockpit: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3" /><path d="M12 3v6m0 6v6M3 12h6m6 0h6" /></>,
  vectors: <><path d="M12 3v18M3 12h18M5 5l14 14M19 5 5 19" /><circle cx="12" cy="12" r="8" /></>,
  resultant: <><path d="M4 19 19 4M12 4h7v7" /><path d="M4 5v14h14" /></>,
  routes: <><circle cx="5" cy="18" r="2" /><circle cx="19" cy="6" r="2" /><path d="M7 18c5 0 3-8 8-8h2" /></>,
  protocol: <><path d="M4 4h16v16H4zM8 8h8M8 12h5M8 16h3" /><path d="m15 15 1.5 1.5L20 13" /></>,
  longitudinal: <><path d="M3 19h18M4 16l5-5 4 3 7-9" /><circle cx="9" cy="11" r="1" /><circle cx="13" cy="14" r="1" /></>,
  replay: <><path d="M4 11a8 8 0 1 1 2 6M4 11V5m0 6h6" /><path d="m10 8 6 4-6 4z" /></>,
  reports: <><path d="M6 2h9l4 4v16H6zM15 2v5h5" /><path d="M9 17v-4m3 4V9m3 8v-6" /></>,
  lab: <><path d="M9 2v6l-5 9a3 3 0 0 0 3 5h10a3 3 0 0 0 3-5l-5-9V2" /><path d="M7 15h10M8 2h8" /></>,
  admin: <><circle cx="12" cy="8" r="4" /><path d="M4 22a8 8 0 0 1 16 0" /><path d="m17 13 2 2 3-3" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a2 2 0 0 0 .4 2.2l.1.1-2.6 2.6-.1-.1a2 2 0 0 0-2.2-.4 2 2 0 0 0-1.2 1.8V21h-3.6v-.2A2 2 0 0 0 9 19a2 2 0 0 0-2.2.4l-.1.1-2.6-2.6.1-.1A2 2 0 0 0 4.6 15 2 2 0 0 0 2.8 13H2v-3.6h.8A2 2 0 0 0 4.6 8a2 2 0 0 0-.4-2.2l-.1-.1 2.6-2.6.1.1A2 2 0 0 0 9 3.6 2 2 0 0 0 10.2 2h3.6A2 2 0 0 0 15 3.6a2 2 0 0 0 2.2-.4l.1-.1 2.6 2.6-.1.1A2 2 0 0 0 19.4 8a2 2 0 0 0 1.8 1.4H22V13h-.8a2 2 0 0 0-1.8 2Z" /></>
};

function NavigationIcon({ name }: { name: IconName }) {
  return <svg className="hx-nav__icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round">{ICON_PATHS[name]}</svg>;
}

function NavigationItems({ podeVerLab, podeAdministrar, close }: { podeVerLab: boolean; podeAdministrar: boolean; close?: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const contexto = new URLSearchParams();
  for (const chave of ["organizacao", "participante", "sessao", "thx"]) {
    const valor = searchParams.get(chave);
    if (valor) contexto.set(chave, valor);
  }
  return (
    <>
      {GROUPS.map((group) => {
        const items = group.items.filter((item) =>
          item.restricted === "lab" ? podeVerLab : item.restricted === "admin" ? podeAdministrar : true
        );
        if (!items.length) return null;
        return (
          <section className="hx-nav__group" key={group.label}>
            <p>{group.label}</p>
            {items.map((item) => {
              const [path, query = ""] = item.href.split("?");
              const itemQuery = new URLSearchParams(query);
              const visaoDoItem = itemQuery.get("visao");
              const visaoAtual = searchParams.get("visao");
              const active = pathname === path && (visaoDoItem
                ? visaoAtual === visaoDoItem
                : path === "/plataforma/cockpit-vivo"
                  ? !visaoAtual || visaoAtual === "visao-geral"
                  : true);
              for (const [chave, valor] of contexto) if (!itemQuery.has(chave)) itemQuery.set(chave, valor);
              const href = (item.href.startsWith("/plataforma") || item.href === "/admin") && itemQuery.size
                ? `${path}?${itemQuery}`
                : item.href;
              return (
                <Link className={active ? "hx-nav__link hx-nav__link--active" : "hx-nav__link"} href={href} key={item.href} onClick={close}>
                  <span className="hx-nav__mark"><NavigationIcon name={item.icon} /><small>{item.mark}</small></span>
                  <span className="hx-nav__label">{item.label}</span>
                  {active ? <i aria-hidden="true" /> : null}
                </Link>
              );
            })}
          </section>
        );
      })}
    </>
  );
}

export function PlatformNavigation({
  podeVerLab,
  podeAdministrar,
  escopoDePersistencia
}: {
  podeVerLab: boolean;
  podeAdministrar: boolean;
  escopoDePersistencia: string;
}) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = `${pathname}?${searchParams.toString()}`;
  const chaveDePersistencia = `humanexus:navegacao-recolhida:${escopoDePersistencia}`;
  useEffect(() => {
    setCollapsed(window.localStorage.getItem(chaveDePersistencia) === "true");
  }, [chaveDePersistencia]);
  useEffect(() => {
    setOpen(false);
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [routeKey]);
  return (
    <>
      <aside
        className={collapsed ? "hx-nav hx-nav--collapsed" : "hx-nav"}
        aria-label="Navegação principal da plataforma"
        data-collapsed={collapsed ? "true" : "false"}
      >
        <div className="hx-nav__rail">
          <div className="hx-nav__head">
            <p className="hx-nav__caption">Navegação operacional</p>
            <button
              className="hx-nav__collapse"
              type="button"
              aria-label={collapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
              aria-pressed={collapsed}
              onClick={() => setCollapsed((valor) => {
                const proximo = !valor;
                window.localStorage.setItem(chaveDePersistencia, String(proximo));
                return proximo;
              })}
            >
              <span aria-hidden="true"><i /><i /></span>
              <b>{collapsed ? "Expandir" : "Recolher"}</b>
            </button>
          </div>
          <NavigationItems podeVerLab={podeVerLab} podeAdministrar={podeAdministrar} />
        </div>
        <div className="hx-nav__foot"><span /><b>Núcleo protegido</b></div>
      </aside>
      <button className="hx-nav-toggle" type="button" aria-expanded={open} aria-controls="hx-mobile-nav" onClick={() => setOpen(true)}>
        <span aria-hidden="true">☰</span> Módulos
      </button>
      {open ? (
        <div className="hx-mobile-nav" id="hx-mobile-nav" role="dialog" aria-modal="true" aria-label="Navegação da plataforma">
          <div className="hx-mobile-nav__top">
            <span>HUMANEXUS / MÓDULOS</span>
            <button type="button" onClick={() => setOpen(false)} aria-label="Fechar menu">×</button>
          </div>
          <NavigationItems podeVerLab={podeVerLab} podeAdministrar={podeAdministrar} close={() => setOpen(false)} />
        </div>
      ) : null}
    </>
  );
}
