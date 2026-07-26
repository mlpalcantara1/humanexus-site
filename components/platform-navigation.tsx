"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type Item = { label: string; href: string; mark: string; restricted?: "lab" | "admin" };
type Group = { label: string; items: Item[] };

const GROUPS: Group[] = [
  {
    label: "Operação",
    items: [
      { label: "Painel de Comando", href: "/plataforma/painel", mark: "01" },
      { label: "Organizações", href: "/plataforma/organizacoes", mark: "02" },
      { label: "Clientes / Participantes", href: "/plataforma/clientes", mark: "03" },
      { label: "Anamnese Regulatória", href: "/plataforma/anamnese-regulatoria", mark: "ANM" },
      { label: "Sessões", href: "/plataforma/sessoes", mark: "04" },
      { label: "Treinamentos", href: "/plataforma/treinamentos", mark: "05" },
      { label: "Cockpit Vivo", href: "/plataforma/cockpit-vivo", mark: "06" }
    ]
  },
  {
    label: "Governança",
    items: [
      { label: "HUMANEXUS LAB", href: "/plataforma/humanexus-lab", mark: "LAB", restricted: "lab" },
      { label: "Administração", href: "/admin", mark: "ADM", restricted: "admin" },
      { label: "Configurações", href: "/plataforma/configuracoes", mark: "CFG" }
    ]
  }
];

function NavigationItems({ podeVerLab, podeAdministrar, close }: { podeVerLab: boolean; podeAdministrar: boolean; close?: () => void }) {
  const pathname = usePathname();
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
              const active = pathname === item.href;
              return (
                <Link className={active ? "hx-nav__link hx-nav__link--active" : "hx-nav__link"} href={item.href} key={item.href} onClick={close}>
                  <span className="hx-nav__mark">{item.mark}</span>
                  <span>{item.label}</span>
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

export function PlatformNavigation({ podeVerLab, podeAdministrar }: { podeVerLab: boolean; podeAdministrar: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <aside className="hx-nav" aria-label="Navegação principal da plataforma">
        <div className="hx-nav__rail">
          <p className="hx-nav__caption">Navegação operacional</p>
          <NavigationItems podeVerLab={podeVerLab} podeAdministrar={podeAdministrar} />
        </div>
        <div className="hx-nav__foot"><span />Núcleo protegido</div>
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
