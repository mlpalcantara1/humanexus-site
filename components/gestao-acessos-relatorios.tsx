"use client";

import { useState } from "react";
import { HxPageHeader, HxSurface } from "@/components/hx-design-system";

export type ParticipanteParaAcesso = { identificador: string; nome?: string | null; codigo?: string | null };

export function GestaoDeAcessosRelatorios({ csrf, identificadorDaOrganizacao, participantes }: {
  csrf: string; identificadorDaOrganizacao: string; participantes: ParticipanteParaAcesso[];
}) {
  const [email, setEmail] = useState("");
  const [papel, setPapel] = useState("GESTOR_AUTORIZADO");
  const [participante, setParticipante] = useState("");
  const [justificativa, setJustificativa] = useState("Acesso nominal autorizado conforme a finalidade do relatório.");
  const [emCurso, setEmCurso] = useState(false);
  const [mensagem, setMensagem] = useState("");

  async function executar(acao: "AUTORIZAR_DESTINATARIO" | "REVOGAR_ACESSO") {
    setEmCurso(true); setMensagem("");
    try {
      const resposta = await fetch("/api/governanca-relatorios", {
        method: "POST",
        headers: { "content-type": "application/json", "x-humanexus-csrf": csrf },
        body: JSON.stringify({
          acao, identificador_da_organizacao: identificadorDaOrganizacao,
          email_do_usuario: email, papel,
          identificador_do_participante: papel === "PARTICIPANTE" ? participante : null,
          justificativa,
        }),
      });
      const corpo = await resposta.json().catch(() => ({}));
      if (!resposta.ok) throw new Error(corpo?.erro?.mensagem ?? "Não foi possível concluir esta autorização.");
      setMensagem(acao === "AUTORIZAR_DESTINATARIO" ? "Acesso nominal concedido e registrado." : "Acesso nominal revogado e registrado.");
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Não foi possível concluir esta autorização.");
    } finally { setEmCurso(false); }
  }

  const exigeParticipante = papel === "PARTICIPANTE";
  const invalido = !email || !justificativa.trim() || (exigeParticipante && !participante);
  return <section className="hx-report-access">
    <HxPageHeader eyebrow="GOVERNANÇA DE ACESSO" title="Destinatários autorizados" description="Conceda ou revogue acesso nominal. A gestão organizacional recebe somente documentos coletivos ou executivos liberados; relatórios individuais permanecem isolados." />
    <HxSurface as="section">
      <label>Finalidade do acesso<select value={papel} onChange={(evento) => setPapel(evento.target.value)}>
        <option value="GESTOR_AUTORIZADO">Gestão organizacional autorizada</option>
        <option value="PARTICIPANTE">Cliente particular</option>
      </select></label>
      <label>E-mail do destinatário<input type="email" value={email} onChange={(evento) => setEmail(evento.target.value)} placeholder="destinatario@exemplo.com" /></label>
      {exigeParticipante ? <label>Participante correspondente<select value={participante} onChange={(evento) => setParticipante(evento.target.value)}>
        <option value="">Selecione o participante</option>
        {participantes.map((item) => <option key={item.identificador} value={item.identificador}>{item.nome ?? item.codigo ?? "Participante identificado"}</option>)}
      </select></label> : null}
      <label>Justificativa<textarea value={justificativa} onChange={(evento) => setJustificativa(evento.target.value)} /></label>
      <div className="hx-report-access__actions">
        <button disabled={emCurso || invalido} onClick={() => executar("AUTORIZAR_DESTINATARIO")}>Conceder acesso nominal</button>
        <button disabled={emCurso || invalido} onClick={() => executar("REVOGAR_ACESSO")}>Revogar acesso nominal</button>
      </div>
      {mensagem ? <p role="status">{mensagem}</p> : null}
    </HxSurface>
  </section>;
}
