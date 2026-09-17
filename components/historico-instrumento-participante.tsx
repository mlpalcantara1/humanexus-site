"use client";

import { useEffect, useState } from "react";

type Registro = Record<string, unknown>;
type Historico = {
  identificador_da_organizacao: string;
  identificador_do_participante: string;
  estado_registrado_atual: Registro;
  registros: Registro[];
};

function objeto(valor: unknown): Registro {
  return valor && typeof valor === "object" && !Array.isArray(valor)
    ? valor as Registro : {};
}

function itens(valor: unknown): Registro[] {
  return Array.isArray(valor) ? valor.map(objeto) : [];
}

function data(valor: unknown) {
  const data = new Date(String(valor ?? ""));
  return Number.isNaN(data.getTime())
    ? "Não registrada"
    : new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short", timeStyle: "medium", timeZone: "America/Manaus"
    }).format(data);
}

function rotulo(valor: unknown) {
  return String(valor ?? "Não registrado").replaceAll("_", " ");
}

export function HistoricoInstrumentoParticipante({
  organizacao, participante, nome
}: { organizacao: string; participante: string; nome: string }) {
  const [historico, setHistorico] = useState<Historico | null>(null);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [revisao, setRevisao] = useState(0);

  useEffect(() => {
    const controle = new AbortController();
    setHistorico(null);
    setErro("");
    setCarregando(true);
    const caminho = `/api/plataforma/participantes/${encodeURIComponent(participante)}/instrumentos-integrados?organizacao=${encodeURIComponent(organizacao)}`;
    void fetch(caminho, {
      credentials: "same-origin", cache: "no-store", signal: controle.signal
    }).then(async (resposta) => {
      if (!resposta.ok) throw new Error("A consulta não está disponível para este perfil ou participante.");
      const dados = await resposta.json() as Historico;
      if (dados.identificador_da_organizacao !== organizacao
        || dados.identificador_do_participante !== participante
        || !Array.isArray(dados.registros)) {
        throw new Error("A resposta não corresponde à ficha selecionada.");
      }
      if (!controle.signal.aborted) setHistorico(dados);
    }).catch((falha: unknown) => {
      if (!controle.signal.aborted) setErro(String((falha as Error).message));
    }).finally(() => {
      if (!controle.signal.aborted) setCarregando(false);
    });
    return () => controle.abort();
  }, [organizacao, participante, revisao]);

  return <section className="hx-record-section" aria-label="Histórico do instrumento integrado">
    <h2>Autorizações e cópias do instrumento integrado</h2>
    <p>Ficha de {nome} · identificador do participante: <code>{participante}</code>. Datas e horas exibidas no fuso de Manaus. A emissão do convite não comprova entrega nem resposta; uma resposta registrada pode conter recusas ou autorizações posteriormente revogadas.</p>
    <button type="button" onClick={() => setRevisao((valor) => valor + 1)} disabled={carregando}>
      Atualizar estado das autorizações
    </button>
    {carregando ? <p>Consultando registros…</p> : null}
    {erro ? <p role="alert">{erro}</p> : null}
    {historico ? <p>
      Estado registrado mais recente no Núcleo: {rotulo(historico.estado_registrado_atual?.fonte)}.
      {Array.isArray(historico.estado_registrado_atual?.modalidades_recusadas)
        ? ` Recusas ou revogações: ${historico.estado_registrado_atual.modalidades_recusadas.map(rotulo).join(", ") || "nenhuma"}.`
        : ""}
      Este resumo não prova, sozinho, fundamento jurídico aprovado ou permissão de cada operação.
    </p> : null}
    {historico && historico.registros.length === 0
      ? <p>Nenhum instrumento integrado apresentado a este participante.</p>
      : null}
    {historico?.registros.map((registro) => {
      const apresentacao = objeto(registro.apresentacao);
      const instrumento = objeto(registro.instrumento);
      const copia = objeto(registro.copia);
      const manifestacao = objeto(copia.manifestacao);
      const revogacoes = itens(registro.revogacoes);
      const decisoes = itens(copia.decisoes);
      const identificador = String(apresentacao.identificador ?? "");
      const resposta = registro.resposta_registrada === true;
      const vigente = Array.isArray(registro.autorizacoes_vigentes)
        ? registro.autorizacoes_vigentes.map(rotulo) : [];
      return <article key={identificador} className="hx-record-section">
        <h3>{rotulo(instrumento.codigo)} · versão {rotulo(instrumento.versao)}</h3>
        <p>Convite gerado em {data(apresentacao.apresentado_em)} · Estado do convite: {rotulo(apresentacao.estado)} (entrega não atestada por este registro).</p>
        <p>Resposta registrada: {resposta ? `sim, em ${data(manifestacao.confirmado_em)}` : "não"}.</p>
        <p>Decisões de autorização ainda marcadas vigentes nesta manifestação: {vigente.length ? vigente.join(", ") : "nenhuma"}. Para o estado registrado mais recente, consulte o resumo acima; uma versão antiga não substitui uma manifestação posterior.</p>
        <p>Identificação: convite individual com token opaco de posse; o participante vinculado é o destinatário cadastrado. O token, horário e integridade do registro não verificam independentemente quem acionou a confirmação.</p>
        <details>
          <summary>Ver texto integral e versão apresentada</summary>
          <p>Hash documental: <code>{rotulo(instrumento.hash_do_documento)}</code></p>
          {itens(instrumento.secoes).map((secao) => <section key={String(secao.codigo)}>
            <h4>{rotulo(secao.titulo)}</h4>
            <p style={{ whiteSpace: "pre-wrap" }}>{rotulo(secao.texto)}</p>
          </section>)}
        </details>
        {resposta ? <>
          <details>
            <summary>Ver respostas específicas e integridade</summary>
            <p>Manifestação: <code>{rotulo(manifestacao.identificador)}</code></p>
            <p>Integridade SHA-256: <code>{rotulo(manifestacao.integridade_sha256)}</code></p>
            {decisoes.length ? <ul>{decisoes.map((decisao) => <li key={String(decisao.identificador)}>
              {rotulo(decisao.codigo_da_decisao)}: {rotulo(decisao.decisao)} · estado atual {rotulo(decisao.estado)}
            </li>)}</ul> : <p>Esta versão registra uma resposta operacional única, sem decisões por seção: {rotulo(copia.resposta_operacional_unica)}.</p>}
          </details>
          <a href={`/api/plataforma/participantes/${encodeURIComponent(participante)}/instrumentos-integrados/${encodeURIComponent(identificador)}/pdf?organizacao=${encodeURIComponent(organizacao)}`}>
            Baixar cópia integral em PDF
          </a>
          <p>A cópia reproduz o texto e a resposta registrados. Consulte nesta ficha as revogações e o estado mais recente; não presuma que uma cópia antiga comprove autorização atual.</p>
        </> : <p>A cópia da manifestação só estará disponível após uma resposta efetivamente confirmada.</p>}
        {revogacoes.length ? <details>
          <summary>Revogações ({revogacoes.length})</summary>
          <ul>{revogacoes.map((revogacao) => <li key={String(revogacao.identificador)}>
            {rotulo(revogacao.codigo_da_decisao)} · {data(revogacao.revogado_em)} · {rotulo(revogacao.alcance)}
          </li>)}</ul>
        </details> : <p>Revogações: nenhuma registrada neste instrumento.</p>}
      </article>;
    })}
  </section>;
}
