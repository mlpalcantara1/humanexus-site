"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { HxPageHeader, HxSurface } from "@/components/hx-design-system";
import type { RelatorioEmGovernanca } from "@/lib/governanca-relatorios";

const ROTULOS: Record<string, string> = {
  RASCUNHO: "Rascunho",
  EM_ELABORACAO: "Em elaboração",
  AGUARDANDO_VALIDACAO: "Aguardando validação",
  CONCLUIDO: "Concluído",
  LIBERADO: "Liberado",
  SUBSTITUIDO: "Versão anterior preservada",
  RETIFICADO: "Retificado",
  CANCELADO: "Cancelado",
};

function proximoEstado(estado: string) {
  if (["RASCUNHO", "EM_ELABORACAO"].includes(estado)) {
    return { estado: "AGUARDANDO_VALIDACAO", rotulo: "Enviar para validação" };
  }
  if (estado === "AGUARDANDO_VALIDACAO") {
    return { estado: "CONCLUIDO", rotulo: "Concluir validação" };
  }
  return null;
}

export function GovernancaDeRelatorios({
  relatorios,
  csrf,
  identificadorDaOrganizacao,
  podeConduzir,
  podeAdministrar,
}: {
  relatorios: RelatorioEmGovernanca[];
  csrf: string;
  identificadorDaOrganizacao: string;
  podeConduzir: boolean;
  podeAdministrar: boolean;
}) {
  const router = useRouter();
  const [emCurso, setEmCurso] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [emailPorRelatorio, setEmailPorRelatorio] = useState<Record<string, string>>({});
  const [justificativaPorRelatorio, setJustificativaPorRelatorio] = useState<Record<string, string>>({});

  async function executar(relatorio: RelatorioEmGovernanca, dados: Record<string, unknown>) {
    setEmCurso(relatorio.identificador);
    setMensagem("");
    try {
      const resposta = await fetch("/api/governanca-relatorios", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-humanexus-csrf": csrf,
        },
        body: JSON.stringify({
          ...dados,
          identificador_do_relatorio: relatorio.identificador,
          identificador_da_organizacao: identificadorDaOrganizacao,
          identificador_do_participante: relatorio.linhagem.participante,
        }),
      });
      const corpo = await resposta.json().catch(() => ({}));
      if (!resposta.ok) throw new Error(
        corpo?.erro?.mensagem ?? "Não foi possível concluir esta etapa documental.",
      );
      setMensagem("Etapa concluída e registrada.");
      router.refresh();
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Não foi possível concluir esta etapa.");
    } finally {
      setEmCurso("");
    }
  }

  return (
    <section className="hx-report-governance">
      <HxPageHeader
        eyebrow="GOVERNANÇA DOCUMENTAL"
        title="Validação e liberação de relatórios"
        description="Conclua a validação profissional, autorize nominalmente o destinatário e libere somente a versão aprovada."
      />
      {mensagem ? <p className="hx-report-governance__notice" role="status">{mensagem}</p> : null}
      <div className="hx-report-governance__list">
        {relatorios.map((relatorio) => {
          const proximo = proximoEstado(relatorio.estado_documental);
          const email = emailPorRelatorio[relatorio.identificador] ?? "";
          const justificativa = justificativaPorRelatorio[relatorio.identificador]
            ?? "Validação e liberação conforme decisão profissional registrada.";
          const particular = relatorio.destinatario === "PARTICIPANTE";
          return (
            <HxSurface as="article" key={relatorio.identificador}>
              <header>
                <div><small>{relatorio.codigo_publico}</small><h2>{relatorio.titulo}</h2></div>
                <span>{ROTULOS[relatorio.estado_documental] ?? relatorio.estado_documental}</span>
              </header>
              <p>{relatorio.objetivo}</p>
              <dl>
                <div><dt>Versão</dt><dd>{relatorio.numero_da_versao}</dd></div>
                <div><dt>Organização</dt><dd>{relatorio.linhagem.origem.organizacao ?? "Não informada"}</dd></div>
                <div><dt>Participante</dt><dd>{relatorio.linhagem.origem.participante ?? "Documento coletivo"}</dd></div>
              </dl>
              <label>
                Justificativa da etapa
                <textarea
                  value={justificativa}
                  onChange={(evento) => setJustificativaPorRelatorio((anterior) => ({
                    ...anterior, [relatorio.identificador]: evento.target.value,
                  }))}
                />
              </label>
              <label>
                  {particular ? "E-mail do cliente autorizado" : "E-mail do gestor autorizado"}
                  <input
                    type="email"
                    value={email}
                    onChange={(evento) => setEmailPorRelatorio((anterior) => ({
                      ...anterior, [relatorio.identificador]: evento.target.value,
                    }))}
                    placeholder="cliente@exemplo.com"
                  />
              </label>
              <div className="hx-report-governance__actions">
                {podeConduzir && proximo ? (
                  <button disabled={emCurso !== ""} onClick={() => executar(relatorio, {
                    acao: "TRANSICIONAR", estado: proximo.estado, justificativa,
                  })}>{proximo.rotulo}</button>
                ) : null}
                {podeAdministrar && ["CONCLUIDO", "LIBERADO"].includes(relatorio.estado_documental) ? (
                  <button disabled={emCurso !== "" || !email} onClick={() => executar(relatorio, {
                    acao: "AUTORIZAR_DESTINATARIO",
                    email_do_usuario: email,
                    papel: particular ? "PARTICIPANTE" : "GESTOR_AUTORIZADO",
                    justificativa,
                  })}>Autorizar destinatário</button>
                ) : null}
                {podeAdministrar && ["CONCLUIDO", "LIBERADO"].includes(relatorio.estado_documental) ? (
                  <button disabled={emCurso !== "" || !email} onClick={() => executar(relatorio, {
                    acao: "REVOGAR_ACESSO",
                    email_do_usuario: email,
                    papel: particular ? "PARTICIPANTE" : "GESTOR_AUTORIZADO",
                    justificativa,
                  })}>Revogar acesso do destinatário</button>
                ) : null}
                {podeConduzir && relatorio.estado_documental === "CONCLUIDO" ? (
                  <button className="hx-report-governance__primary" disabled={emCurso !== "" || (particular && !email)} onClick={() => executar(relatorio, {
                    acao: "LIBERAR",
                    email_do_usuario: email,
                    tipo_do_destinatario: particular ? "PARTICIPANTE" : "ORGANIZACAO_AUTORIZADA",
                    justificativa,
                  })}>Liberar versão concluída</button>
                ) : null}
                {podeConduzir && relatorio.estado_documental === "LIBERADO" ? (
                  <button disabled={emCurso !== "" || (particular && !email)} onClick={() => executar(relatorio, {
                    acao: "REVOGAR_LIBERACAO",
                    email_do_usuario: email,
                    tipo_do_destinatario: particular ? "PARTICIPANTE" : "ORGANIZACAO_AUTORIZADA",
                    justificativa,
                  })}>Revogar liberação</button>
                ) : null}
              </div>
            </HxSurface>
          );
        })}
        {!relatorios.length ? (
          <HxSurface as="article"><h2>Nenhum relatório neste escopo.</h2><p>Selecione uma organização com documentos em elaboração.</p></HxSurface>
        ) : null}
      </div>
    </section>
  );
}
