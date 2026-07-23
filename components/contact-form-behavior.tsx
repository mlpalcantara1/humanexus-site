"use client";

import { useEffect } from "react";

export function ContactFormBehavior() {
  useEffect(() => {
    const form = document.querySelector<HTMLFormElement>(".contact-form");
    if (!form) return;

    const submit = (event: SubmitEvent) => {
      event.preventDefault();
      const data = new FormData(form);
      const message = [
        "Olá, gostaria de apresentar um contexto ao HUMANEXUS.",
        "",
        `Nome: ${data.get("nome") ?? ""}`,
        `Empresa: ${data.get("empresa") ?? ""}`,
        `Cargo: ${data.get("cargo") ?? ""}`,
        `E-mail: ${data.get("email") ?? ""}`,
        `Telefone: ${data.get("telefone") ?? ""}`,
        `Área de interesse: ${data.get("interesse") ?? ""}`,
        `Contexto: ${data.get("mensagem") ?? ""}`
      ].join("\n");

      window.open(
        `https://wa.me/5592981187777?text=${encodeURIComponent(message)}`,
        "_blank",
        "noopener,noreferrer"
      );
    };

    form.addEventListener("submit", submit);
    return () => form.removeEventListener("submit", submit);
  }, []);

  return null;
}
