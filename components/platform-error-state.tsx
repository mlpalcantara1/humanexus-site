"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export function PlatformErrorState({
  tentarNovamente,
  titulo = "Núcleo temporariamente indisponível",
  mensagem = "Estamos tentando restabelecer a conexão. Seu contexto permanece preservado nesta tela.",
  automatico = true
}: {
  tentarNovamente: () => void;
  titulo?: string;
  mensagem?: string;
  automatico?: boolean;
}) {
  const [tentativa, setTentativa] = useState(0);
  const tentarRef = useRef(tentarNovamente);
  tentarRef.current = tentarNovamente;

  useEffect(() => {
    if (!automatico || tentativa >= 3) return;
    const atrasos = [1200, 3000, 7000];
    const temporizador = window.setTimeout(() => {
      setTentativa((valor) => valor + 1);
      tentarRef.current();
    }, atrasos[tentativa]);
    return () => window.clearTimeout(temporizador);
  }, [automatico, tentativa]);

  return (
    <section className="hx-recovery" role="alert" aria-live="polite">
      <div className="hx-recovery__signal" aria-hidden="true"><i /><i /><i /></div>
      <p>CONTINUIDADE OPERACIONAL</p>
      <h1>{titulo}</h1>
      <span>{mensagem}</span>
      {automatico && tentativa < 3 ? <small>Reconexão automática {tentativa + 1} de 3.</small> : null}
      <div>
        <button type="button" onClick={tentarNovamente}>Tentar novamente</button>
        <Link href="/plataforma/painel">Retornar ao Painel de Comando</Link>
      </div>
    </section>
  );
}
