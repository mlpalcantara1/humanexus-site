"use client";

import { useEffect, useRef, useState } from "react";

export function PwaRuntime() {
  const [updateReady, setUpdateReady] = useState(false);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") {
      return;
    }
    let registration: ServiceWorkerRegistration | null = null;
    const register = async () => {
      registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/"
      });
      registrationRef.current = registration;
      if (registration.waiting) setUpdateReady(true);
      registration.addEventListener("updatefound", () => {
        const installing = registration?.installing;
        installing?.addEventListener("statechange", () => {
          if (installing.state === "installed" && navigator.serviceWorker.controller) {
            setUpdateReady(true);
          }
        });
      });
    };
    void register();
    const refresh = () => window.location.reload();
    navigator.serviceWorker.addEventListener("controllerchange", refresh);
    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", refresh);
      registrationRef.current = null;
      registration = null;
    };
  }, []);

  if (!updateReady) return null;
  return (
    <aside className="hx-pwa-update" role="status" aria-live="polite">
      <span>Uma nova versão segura da HUMANEXUS está pronta.</span>
      <button
        type="button"
        onClick={() => {
          registrationRef.current?.waiting?.postMessage({
            tipo: "HXP_ATIVAR_ATUALIZACAO"
          });
        }}
      >
        Atualizar
      </button>
    </aside>
  );
}
