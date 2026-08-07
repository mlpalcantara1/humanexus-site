"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

const DURACAO_PADRAO_SEGUNDOS = 8 * 60 * 60;
const INTERVALO_DE_RENOVACAO_MS = 20 * 60 * 1_000;
const ATIVIDADE_RECENTE_MS = 30 * 60 * 1_000;
const AVISO_ANTES_DE_EXPIRAR_MS = 15 * 60 * 1_000;

type Estado = "ATIVA" | "AVISO" | "RENOVANDO" | "EXPIRADA";

export function SessionContinuity({ csrf }: { csrf: string }) {
  const [estado, setEstado] = useState<Estado>("ATIVA");
  const [mensagem, setMensagem] = useState("");
  const expiraEm = useRef(Date.now() + DURACAO_PADRAO_SEGUNDOS * 1_000);
  const ultimaAtividade = useRef(Date.now());
  const ultimaRenovacao = useRef(Date.now());
  const renovacaoEmAndamento = useRef(false);

  const renovar = useCallback(async () => {
    if (renovacaoEmAndamento.current) return;
    renovacaoEmAndamento.current = true;
    setEstado("RENOVANDO");
    try {
      const resposta = await fetch("/api/sessao/renovar", {
        method: "POST",
        headers: { "x-humanexus-csrf": csrf },
        cache: "no-store"
      });
      const dados = await resposta.json().catch(() => ({}));
      if (!resposta.ok) {
        if (resposta.status === 401) {
          setEstado("EXPIRADA");
          setMensagem("A sessão expirou. Autentique-se para continuar no mesmo contexto.");
          return;
        }
        throw new Error("Renovação temporariamente indisponível");
      }
      const duracao = Number(
        dados.expira_em_segundos ?? DURACAO_PADRAO_SEGUNDOS
      );
      expiraEm.current = Date.now() + duracao * 1_000;
      ultimaRenovacao.current = Date.now();
      setEstado("ATIVA");
      setMensagem("Conexão segura renovada.");
      window.setTimeout(() => setMensagem(""), 4_000);
    } catch {
      setEstado("AVISO");
      setMensagem(
        "Não foi possível renovar agora. O portal tentará novamente sem perder o contexto."
      );
    } finally {
      renovacaoEmAndamento.current = false;
    }
  }, [csrf]);

  useEffect(() => {
    const registrarAtividade = () => {
      ultimaAtividade.current = Date.now();
      if (
        expiraEm.current - Date.now() <= AVISO_ANTES_DE_EXPIRAR_MS
        && Date.now() - ultimaRenovacao.current >= 60_000
      ) {
        void renovar();
      }
    };
    const eventos = ["pointerdown", "keydown", "focus"] as const;
    eventos.forEach((evento) => window.addEventListener(evento, registrarAtividade));
    const aoMudarVisibilidade = () => {
      if (document.visibilityState === "visible") registrarAtividade();
    };
    document.addEventListener("visibilitychange", aoMudarVisibilidade);
    const temporizador = window.setInterval(() => {
      const agora = Date.now();
      const restante = expiraEm.current - agora;
      if (restante <= 0) {
        setEstado("EXPIRADA");
        setMensagem("A sessão expirou. Autentique-se para continuar no mesmo contexto.");
        return;
      }
      if (restante <= AVISO_ANTES_DE_EXPIRAR_MS) setEstado("AVISO");
      if (
        agora - ultimaAtividade.current <= ATIVIDADE_RECENTE_MS
        && agora - ultimaRenovacao.current >= INTERVALO_DE_RENOVACAO_MS
      ) {
        void renovar();
      }
    }, 60_000);
    return () => {
      eventos.forEach((evento) => window.removeEventListener(evento, registrarAtividade));
      document.removeEventListener("visibilitychange", aoMudarVisibilidade);
      window.clearInterval(temporizador);
    };
  }, [renovar]);

  if (estado === "ATIVA" && !mensagem) return null;
  const retorno = typeof window === "undefined"
    ? "/admin"
    : `${window.location.pathname}${window.location.search}`;
  return (
    <aside className="hx-session-continuity" data-state={estado} aria-live="polite">
      <span>{mensagem || "Sua sessão segura está próxima da expiração."}</span>
      {estado === "EXPIRADA" ? (
        <Link href={`/entrar?retorno=${encodeURIComponent(retorno)}`}>
          Autenticar e continuar
        </Link>
      ) : (
        <button type="button" disabled={estado === "RENOVANDO"} onClick={() => void renovar()}>
          {estado === "RENOVANDO" ? "Renovando…" : "Continuar conectado"}
        </button>
      )}
    </aside>
  );
}
