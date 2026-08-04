"use client";

import { useEffect, useState } from "react";

type ExperienceMode = "executivo" | "cientifico";

const STORAGE_KEY = "humanexus-experience-mode";

export function ExperienceModeControl() {
  const [mode, setMode] = useState<ExperienceMode>("executivo");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const initial: ExperienceMode = stored === "cientifico" ? "cientifico" : "executivo";
    setMode(initial);
    document.documentElement.dataset.hxExperienceMode = initial;
  }, []);

  function select(next: ExperienceMode) {
    setMode(next);
    document.documentElement.dataset.hxExperienceMode = next;
    window.localStorage.setItem(STORAGE_KEY, next);
  }

  return (
    <div className="hx-experience-mode" aria-label="Profundidade da experiência HUMANEXUS">
      <button
        type="button"
        aria-label="Ativar modo executivo"
        className={mode === "executivo" ? "is-active" : ""}
        aria-pressed={mode === "executivo"}
        onClick={() => select("executivo")}
      >
        <span aria-hidden="true" />
        <small>MODO</small>
        <strong>Executivo</strong>
      </button>
      <button
        type="button"
        aria-label="Ativar modo científico"
        className={mode === "cientifico" ? "is-active" : ""}
        aria-pressed={mode === "cientifico"}
        onClick={() => select("cientifico")}
      >
        <span aria-hidden="true" />
        <small>MODO</small>
        <strong>Científico</strong>
      </button>
    </div>
  );
}
