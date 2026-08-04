"use client";

import { useEffect, useState } from "react";

type Estado = "conectado" | "reconectando" | "offline" | "verificando";

export function NucleoConnectionBadge({ estadoInicial = "verificando" }: { estadoInicial?: Estado }) {
  const [estado, setEstado] = useState<Estado>(estadoInicial);

  useEffect(() => {
    const atualizar = (evento: Event) => {
      setEstado((evento as CustomEvent<Estado>).detail);
    };
    const offline = () => setEstado("offline");
    const online = () => setEstado("reconectando");
    window.addEventListener("humanexus:nucleo-status", atualizar);
    window.addEventListener("offline", offline);
    window.addEventListener("online", online);
    if (!navigator.onLine) setEstado("offline");
    return () => {
      window.removeEventListener("humanexus:nucleo-status", atualizar);
      window.removeEventListener("offline", offline);
      window.removeEventListener("online", online);
    };
  }, []);

  const rotulo = estado === "conectado"
    ? "NÚCLEO CONECTADO"
    : estado === "offline"
      ? "SEM REDE"
      : estado === "reconectando"
        ? "NÚCLEO RECONECTANDO"
        : "NÚCLEO EM VERIFICAÇÃO";

  return <span className={`hx-app__connection hx-app__connection--${estado}`}><i />{rotulo}</span>;
}
