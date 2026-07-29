"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

type Documento = {
  apresentacao: {
    estado: string;
    publico: string;
    apresentado_em: string;
    expira_em: string;
  };
  documento: {
    codigo: string;
    titulo: string;
    versao: string;
    texto: string;
    finalidade: string;
  };
  aceite_pre_marcado: boolean;
};

export function FormularioConsentimento() {
  const params = useParams<{ id: string }>();
  const busca = useSearchParams();
  const token = busca.get("token") ?? "";
  const [dados, setDados] = useState<Documento | null>(null);
  const [decisao, setDecisao] = useState("");
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    void fetch(
      `/api/humanexus/consentimentos/${encodeURIComponent(params.id)}?token=${encodeURIComponent(token)}`,
      { cache: "no-store" }
    )
      .then(async (resposta) => {
        if (!resposta.ok) throw new Error("Documento indisponível.");
        return resposta.json();
      })
      .then(setDados)
      .catch((erro) => setMensagem(erro.message));
  }, [params.id, token]);

  async function manifestar(evento: FormEvent) {
    evento.preventDefault();
    if (!decisao) {
      setMensagem("Escolha aceitar ou recusar este documento.");
      return;
    }
    const resposta = await fetch(
      `/api/humanexus/consentimentos/${encodeURIComponent(params.id)}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          token,
          estado: decisao,
          papel: dados?.apresentacao.publico
        })
      }
    );
    setMensagem(
      resposta.ok
        ? "Sua manifestação foi registrada com integridade e rastreabilidade."
        : "Não foi possível registrar a manifestação."
    );
  }

  if (!dados) {
    return (
      <main className="hx-participant-message">
        <p>{mensagem || "Carregando documento…"}</p>
      </main>
    );
  }

  return (
    <main className="hx-anamnese-shell">
      <section className="hx-anamnese-card">
        <small>{dados.documento.codigo} · versão {dados.documento.versao}</small>
        <h1>{dados.documento.titulo}</h1>
        <p>{dados.documento.finalidade}</p>
        <article className="hx-consent-text">{dados.documento.texto}</article>
        <p className="hx-module__notice">
        </p>
        <form
          key={params.id}
          autoComplete="off"
          onSubmit={manifestar}
        >
          <fieldset>
            <legend>Registre uma decisão específica para este documento</legend>
            <label>
              <input
                type="radio"
                name={`decisao-${params.id}`}
                value="ACEITO"
                autoComplete="off"
                checked={decisao === "ACEITO"}
                onChange={(evento) => setDecisao(evento.target.value)}
              />
              Li este documento e aceito sua finalidade específica.
            </label>
            <label>
              <input
                type="radio"
                name={`decisao-${params.id}`}
                value="RECUSADO"
                autoComplete="off"
                checked={decisao === "RECUSADO"}
                onChange={(evento) => setDecisao(evento.target.value)}
              />
              Recuso esta autorização.
            </label>
            {dados.apresentacao.estado === "ACEITO" ? (
              <label>
                <input
                  type="radio"
                  name={`decisao-${params.id}`}
                  value="REVOGADO"
                  autoComplete="off"
                  checked={decisao === "REVOGADO"}
                  onChange={(evento) => setDecisao(evento.target.value)}
                />
                Revogo esta autorização para novas coletas. Registros anteriores
                poderão ser preservados quando houver obrigação legal ou defesa
                de direitos.
              </label>
            ) : null}
          </fieldset>
          <button type="submit">Registrar manifestação</button>
        </form>
        <p aria-live="polite">{mensagem}</p>
      </section>
    </main>
  );
}
