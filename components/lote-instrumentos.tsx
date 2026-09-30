"use client";

import { useEffect, useRef, useState } from "react";
import {
  dadosDaApresentacaoGeral,
  dadosDoParticipanteDoLote,
  emailValidoDoLote,
  lerLoteCsv,
  nichoDaOrganizacao,
  referenciaDoLote,
  type LinhaDoLote
} from "@/lib/iicca-lote";

type Registro = Record<string, unknown>;
type Resultado = {
  numero: number;
  nome: string;
  email: string;
  estado: "CADASTRADO" | "EXISTENTE" | "ENVIADO" | "LINKS_GERADOS" | "CONTATO_PENDENTE" | "FALHOU_ENVIO" | "REVISAR";
  mensagem: string;
  link?: string;
  linkAnamnese?: string;
};

function objeto(valor: unknown): Registro {
  if (typeof valor === "string") {
    try { return objeto(JSON.parse(valor)); } catch { return {}; }
  }
  return valor && typeof valor === "object" && !Array.isArray(valor)
    ? valor as Registro : {};
}

function emailDoParticipante(item: Registro) {
  return String(objeto(objeto(item.perfil_operacional).dados_cadastrais).email ?? "")
    .trim().toLowerCase();
}

function nomeDoParticipante(item: Registro) {
  return String(objeto(objeto(item.perfil_operacional).dados_cadastrais)
    .nome_completo ?? "").trim();
}

function csrf() {
  return document.cookie.split("; ")
    .find((item) => item.startsWith("humanexus_csrf="))?.split("=")[1] ?? "";
}

async function executar(acao: string, organizacao: string, dados: Registro) {
  const resposta = await fetch("/api/gestao-operacional", {
    method: "POST",
    headers: { "content-type": "application/json", "x-humanexus-csrf": csrf() },
    body: JSON.stringify({ acao, identificador_da_organizacao: organizacao, dados }),
    signal: AbortSignal.timeout(30000)
  });
  const corpo = await resposta.json().catch(() => ({})) as Registro;
  if (!resposta.ok) {
    const erro = objeto(corpo.erro);
    throw new Error(String(erro.mensagem ?? "Operação recusada pelo Núcleo."));
  }
  return corpo;
}

async function criarConviteDaAnamnese(
  organizacao: string, participante: string, funcao: string, nicho: string
) {
  const resposta = await fetch("/api/humanexus/anamneses", {
    method: "POST",
    headers: { "content-type": "application/json", "x-humanexus-csrf": csrf() },
    body: JSON.stringify({
      identificador_da_organizacao: organizacao,
      identificador_do_participante: participante,
      tipo_atendimento: "ORGANIZACIONAL",
      identificador_da_organizacao_de_vinculo: organizacao,
      nicho, funcao, validade_horas: 72, usos_permitidos: 50,
      identificador_da_sessao: null
    }),
    signal: AbortSignal.timeout(30000)
  });
  const corpo = await resposta.json().catch(() => ({})) as Registro;
  if (!resposta.ok) {
    const erro = objeto(corpo.erro);
    throw new Error(String(erro.mensagem ?? "Convite da anamnese recusado."));
  }
  const convite = objeto(corpo.convite);
  const identificador = String(convite.identificador ?? "");
  const token = String(corpo.token_de_entrega_unica ?? "");
  if (!identificador || !token) {
    throw new Error("Convite da anamnese sem identificador ou token.");
  }
  return { identificador, token };
}

function escaparCsv(valor: string) {
  const seguro = /^[=+@\-\t\r]/.test(valor) ? `'${valor}` : valor;
  return `"${seguro.replaceAll('"', '""')}"`;
}

export function LoteInstrumentos({
  organizacao, nomeDaOrganizacao, setorDaOrganizacao, participantes,
  autorizado, aoConcluir
}: {
  organizacao: string;
  nomeDaOrganizacao: string;
  setorDaOrganizacao: string;
  participantes: Registro[];
  autorizado: boolean;
  aoConcluir: () => Promise<void>;
}) {
  const [linhas, setLinhas] = useState<LinhaDoLote[]>([]);
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [erro, setErro] = useState("");
  const [executando, setExecutando] = useState(false);
  const [confirmado, setConfirmado] = useState(false);
  const [enviarConvites, setEnviarConvites] = useState(false);
  const [gerarLinks, setGerarLinks] = useState(false);
  const nicho = nichoDaOrganizacao(setorDaOrganizacao);
  const parar = useRef(false);
  const geracao = useRef(0);
  const emCurso = useRef(false);
  useEffect(() => {
    geracao.current += 1;
    parar.current = false;
    setLinhas([]);
    setResultados([]);
    setErro("");
    setConfirmado(false);
    setEnviarConvites(false);
    setGerarLinks(false);
    setExecutando(false);
    emCurso.current = false;
    return () => { parar.current = true; geracao.current += 1; };
  }, [organizacao]);

  async function carregarArquivo(arquivo?: File) {
    setLinhas([]);
    setResultados([]);
    setConfirmado(false);
    setErro("");
    if (!arquivo) return;
    const contexto = geracao.current;
    if (arquivo.size > 5 * 1024 * 1024) {
      setErro("Arquivo acima de 5 MB. Divida em lotes; não há limite para o total de lotes.");
      return;
    }
    try {
      const recebidas = lerLoteCsv(await arquivo.text());
      if (contexto !== geracao.current) return;
      if (!recebidas.length) throw new Error("O arquivo não contém participantes.");
      setLinhas(recebidas);
    } catch (causa) {
      if (contexto !== geracao.current) return;
      setErro(causa instanceof Error ? causa.message : "CSV inválido.");
    }
  }

  async function iniciar() {
    if (!organizaçãoValida() || !autorizado || !confirmado || !linhas.length
      || ((enviarConvites || gerarLinks) && !nicho)
      || emCurso.current || executando || resultados.length) return;
    emCurso.current = true;
    const contexto = geracao.current;
    const vigente = () => contexto === geracao.current;
    setExecutando(true);
    setErro("");
    parar.current = false;
    const conhecidos = [...participantes];
    try {
      for (const linha of linhas) {
        if (parar.current || !vigente()) break;
        const referencia = await referenciaDoLote(linha);
        if (!vigente() || parar.current) break;
        const candidatosPorEmail = conhecidos.filter(
          (item) => Boolean(linha.email) && emailDoParticipante(item) === linha.email
        );
        const candidatosPorReferencia = conhecidos.filter(
          (item) => String(item.referencia_externa ?? "").toLowerCase()
            === referencia.toLowerCase()
        );
        const porEmail = candidatosPorEmail[0];
        const porReferencia = candidatosPorReferencia[0];
        const homonimos = conhecidos.filter((item) => nomeDoParticipante(item)
          .toLowerCase() === linha.nome.toLowerCase());
        if (candidatosPorEmail.length > 1 || candidatosPorReferencia.length > 1
          || homonimos.some((item) => item.identificador
            !== (porEmail ?? porReferencia)?.identificador)
          || (porEmail && porReferencia && porEmail.identificador !== porReferencia.identificador)
          || (porReferencia && emailDoParticipante(porReferencia) !== linha.email)
          || (porReferencia && nomeDoParticipante(porReferencia).toLowerCase()
            !== linha.nome.toLowerCase())
          || (porEmail && nomeDoParticipante(porEmail).toLowerCase()
            !== linha.nome.toLowerCase())
          || ((porEmail ?? porReferencia)?.ativo === false)
          || ((porEmail ?? porReferencia) && String(
            (porEmail ?? porReferencia)?.tipo_atendimento ?? ""
          ) !== "ORGANIZACIONAL")
          || ((porEmail ?? porReferencia) && String(
            (porEmail ?? porReferencia)?.identificador_da_organizacao ?? ""
          ) !== organizacao)) {
          setResultados((atual) => [...atual, {
            numero: linha.numero, nome: linha.nome, email: linha.email,
            estado: "REVISAR", mensagem: "Cadastro existente divergente ou inativo; revise a ficha."
          }]);
          continue;
        }
        let participante = String((porEmail ?? porReferencia)?.identificador ?? "");
        if (participante && (enviarConvites || gerarLinks)) {
          setResultados((atual) => [...atual, {
            numero: linha.numero, nome: linha.nome, email: linha.email,
            estado: "REVISAR",
            mensagem: "Cadastro já existente; confira convites anteriores antes de emitir outros."
          }]);
          continue;
        }
        try {
          if (!participante) {
            const criado = await executar("criar-participante", organizacao,
              dadosDoParticipanteDoLote(
                linha, organizacao, nomeDaOrganizacao, referencia
              ) as Registro);
            if (!vigente()) break;
            participante = String(criado.identificador ?? "");
            if (!participante) throw new Error("Cadastro sem identificador retornado.");
            conhecidos.push(criado);
          }
          if (!enviarConvites && !gerarLinks) {
            setResultados((atual) => [...atual, {
              numero: linha.numero, nome: linha.nome, email: linha.email,
              estado: porEmail || porReferencia ? "EXISTENTE" : "CADASTRADO",
              mensagem: "Sem convite e sem manifestação registrada."
            }]);
            continue;
          }
          if (enviarConvites && !emailValidoDoLote(linha.email)) {
            setResultados((atual) => [...atual, {
              numero: linha.numero, nome: linha.nome, email: linha.email,
              estado: "CONTATO_PENDENTE",
              mensagem: "Cadastrado sem e-mail. Nenhum convite ou mensagem foi gerado."
            }]);
            continue;
          }
          const conviteAnamnese = await criarConviteDaAnamnese(
            organizacao, participante, linha.funcao || linha.cargo, nicho!
          );
          if (!vigente()) break;
          const apresentacao = await executar(
            "apresentar-instrumento-integrado", organizacao,
            {
              ...dadosDaApresentacaoGeral(organizacao, participante, enviarConvites),
              convite_da_anamnese: conviteAnamnese
            } as Registro
          );
          if (!vigente()) break;
          const identificador = String(apresentacao.identificador ?? "");
          const token = String(apresentacao.token_de_entrega_unica ?? "");
          if (!identificador || !token) {
            throw new Error("Resposta sem ligação; confira o histórico antes de repetir.");
          }
          const link = `${window.location.origin}/instrumento-integrado/`
            + `${encodeURIComponent(identificador)}?token=${encodeURIComponent(token)}`;
          const linkAnamnese = `${window.location.origin}/acesso-participante`
            + `?token=${encodeURIComponent(conviteAnamnese.token)}`;
          const entrega = objeto(apresentacao.entrega_por_email);
          const enviado = entrega.estado === "ENVIADO";
          setResultados((atual) => [...atual, {
            numero: linha.numero, nome: linha.nome, email: linha.email,
            link, linkAnamnese,
            estado: !enviarConvites ? "LINKS_GERADOS" : enviado ? "ENVIADO" : "FALHOU_ENVIO",
            mensagem: !enviarConvites
              ? "Links individuais gerados sem envio de e-mail e sem resposta pelo participante."
              : enviado
              ? "Um e-mail com instrumento e anamnese foi aceito pelo provedor; respostas pendentes."
              : String(entrega.motivo ?? "Envio não confirmado; confira ambos os links.")
          }]);
          await new Promise((resolver) => window.setTimeout(resolver, 400));
        } catch (causa) {
          if (!vigente()) break;
          setResultados((atual) => [...atual, {
            numero: linha.numero, nome: linha.nome, email: linha.email,
            estado: "REVISAR",
            mensagem: `${causa instanceof Error ? causa.message : "Falha de rede."} `
              + "Confira a ficha e o histórico antes de repetir; não há reenvio automático."
          }]);
          // Uma resposta perdida pode ter criado a apresentação. Interromper
          // impede gerar outro convite para a mesma pessoa sem reconciliação.
          parar.current = true;
        }
      }
      if (vigente()) await aoConcluir();
    } catch (causa) {
      if (vigente()) setErro(causa instanceof Error ? causa.message : "Falha ao atualizar a lista.");
    } finally {
      if (vigente()) { setExecutando(false); emCurso.current = false; }
    }
  }

  function organizaçãoValida() { return Boolean(organizacao && nomeDaOrganizacao); }

  function baixarResultados() {
    const linhasCsv = ["linha,nome,email,estado,mensagem,ligacao_instrumento,ligacao_anamnese",
      ...resultados.map((item) => [String(item.numero), item.nome, item.email,
        item.estado, item.mensagem, item.link ?? "", item.linkAnamnese ?? ""
      ].map(escaparCsv).join(","))];
    const url = URL.createObjectURL(new Blob(["\uFEFF", linhasCsv.join("\r\n")], {
      type: "text/csv;charset=utf-8"
    }));
    const ancora = document.createElement("a");
    ancora.href = url;
    ancora.download = "humanexus-iicca-lote-resultado.csv";
    ancora.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <section className="hx-record-form" aria-label="Cadastro e convites em lote">
      <small>IICCA-HXP-1.4 · ORGANIZAÇÕES B2B</small>
      <h2>Cadastro e convites em lote</h2>
      <p>Importe uma lista da organização com nome e e-mail ou referência estável;
        cargo e função são opcionais. Pessoas sem e-mail podem ser cadastradas.
        O cadastro não envia convite nem registra aceite. Você pode gerar links
        individuais ou enviar um contato com o instrumento e a anamnese.
        Não há limite de participantes no
        cadastro; arquivos grandes podem ser divididos em quantos lotes forem necessários.</p>
      <p>O link expira em 72 horas. O envio usa o serviço de e-mail configurado;
        limites e entrega efetiva dependem do provedor.</p>
      {!nicho ? <p role="status">O setor cadastrado da organização não permite
        identificar com segurança o ramo da anamnese. O cadastro em lote permanece
        disponível; o envio conjunto fica suspenso até corrigir o setor na ficha
        da organização.</p> : null}
      <button type="button" disabled={executando} onClick={() => {
        const url = URL.createObjectURL(new Blob([
          "nome,email,referencia,cargo,funcao,matricula,unidade,setor\r\n"
        ], { type: "text/csv;charset=utf-8" }));
        const ancora = document.createElement("a");
        ancora.href = url;
        ancora.download = "humanexus-modelo-participantes.csv";
        ancora.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      }}>Baixar modelo CSV</button>
      <label>Lista CSV da organização
        <input type="file" accept=".csv,text/csv" disabled={executando || !autorizado}
          onChange={(evento) => void carregarArquivo(evento.target.files?.[0])} />
      </label>
      {linhas.length ? (
        <>
          <p>{linhas.length} pessoa(s) prontas para conferir em {nomeDaOrganizacao}.
            Prévia: {linhas.slice(0, 5).map((linha) =>
              `${linha.nome} (${linha.email || "sem e-mail"})`).join("; ")}
            {linhas.length > 5 ? "…" : ""}</p>
          <p>{linhas.filter((linha) => !linha.email).length} pessoa(s) sem e-mail:
            cadastro permitido, envio pendente. Cadastros existentes não recebem
            novos convites automaticamente; confira o histórico para evitar duplicidade.</p>
          <label><input type="checkbox" checked={confirmado} disabled={executando}
            onChange={(evento) => setConfirmado(evento.target.checked)} />
            Confirmei que a lista pertence a esta organização e contém os
            destinatários corretos. Isto não confirma escolhas por eles.</label>
          <label><input type="checkbox" checked={enviarConvites}
            disabled={executando || !nicho}
            onChange={(evento) => { setEnviarConvites(evento.target.checked); setGerarLinks(false); }} />
            Enviar um e-mail por pessoa com acesso ao instrumento e à anamnese.
            Deixe desmarcado
            para somente cadastrar as pessoas, sem enviar mensagens.</label>
          <label><input type="checkbox" checked={gerarLinks}
            disabled={executando || !nicho}
            onChange={(evento) => { setGerarLinks(evento.target.checked); setEnviarConvites(false); }} />
            Gerar links individuais para instrumento e anamnese, sem enviar e-mail.
            O arquivo de resultados contém acessos pessoais: não compartilhe a lista
            inteira com os participantes; entregue somente os links de cada pessoa.</label>
          <button type="button" disabled={!confirmado || !autorizado
            || executando || Boolean(resultados.length) || !organizaçãoValida()}
            onClick={() => void iniciar()}>
            {enviarConvites ? "Cadastrar e enviar convites individuais" : gerarLinks
              ? "Cadastrar e gerar links individuais" : "Cadastrar sem enviar convites"}
          </button>
        </>
      ) : null}
      {executando ? <button type="button" onClick={() => { parar.current = true; }}>
        Parar após a pessoa atual</button> : null}
      {erro ? <p role="alert">{erro}</p> : null}
      {resultados.length ? (
        <>
          <p role="status">Processados {resultados.length} de {linhas.length}.
            {executando ? " Em andamento…" : " Confira as falhas antes de novo lote."}</p>
          <button type="button" onClick={baixarResultados}>
            Baixar resultado{resultados.some((item) => item.link) ? " e links individuais" : ""}
          </button>
          <p>O arquivo contém acessos pessoais: guarde-o em local seguro e
            elimine cópias temporárias conforme sua política vigente.</p>
          <div className="hx-table-scroll"><table><thead><tr>
            <th>Pessoa</th><th>Estado</th><th>Detalhe</th>
          </tr></thead><tbody>{resultados.map((item) => (
            <tr key={`${item.numero}:${item.email}`}>
              <td>{item.nome}</td><td>{item.estado}</td><td>{item.mensagem}</td>
            </tr>
          ))}</tbody></table></div>
        </>
      ) : null}
    </section>
  );
}
