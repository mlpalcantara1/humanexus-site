"use client";

import { FormEvent, useEffect, useState } from "react";

type Registro = Record<string, unknown>;
type Dados = {
  governanca: {
    versao: string;
    perfis: Registro[];
    ambientes: Registro[];
    inventario_lgpd: Registro[];
    textos_juridicos: Registro[];
    solicitacoes_de_titular: Registro[];
    juridico: Registro;
  };
  backups: Registro[];
  consentimentos: {
    modelos: Registro[];
    apresentacoes: Registro[];
    manifestacoes: Registro[];
    responsaveis_legais: Registro[];
    bloqueios_de_coleta: Registro[];
    situacao_juridica_padrao: string;
  };
  seguranca: {
    versao: string;
    autoridade_global: string;
    organizacao_limita_proprietario: boolean;
    sessoes: Registro[];
    dispositivos: Registro[];
    alertas: Registro[];
    autorizacoes_de_programador: Registro[];
    obrigacoes_documentais: Registro[];
    segredos: Registro[];
  };
};

function csrf() {
  return document.cookie
    .split("; ")
    .find((item) => item.startsWith("humanexus_csrf="))
    ?.split("=")[1] ?? "";
}

function valor(item: unknown) {
  return String(item ?? "—").replaceAll("_", " ");
}

export function GovernancaOperacional() {
  const [dados, setDados] = useState<Dados | null>(null);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [ocupado, setOcupado] = useState(false);

  async function carregar() {
    const resposta = await fetch("/api/plataforma/governanca-operacional", {
      cache: "no-store"
    });
    const corpo = await resposta.json();
    if (!resposta.ok) throw new Error(corpo?.erro?.mensagem ?? "Governança indisponível.");
    setDados(corpo as Dados);
  }

  useEffect(() => {
    void carregar().catch((causa) => setErro(causa.message));
  }, []);

  async function executar(acao: string, payload: Registro, identificador?: string) {
    setOcupado(true);
    setErro("");
    try {
      const resposta = await fetch("/api/plataforma/governanca-operacional", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-humanexus-csrf": csrf()
        },
        body: JSON.stringify({ acao, dados: payload, identificador })
      });
      const corpo = await resposta.json();
      if (!resposta.ok) throw new Error(corpo?.erro?.mensagem ?? "Operação recusada.");
      setMensagem("Registro preservado com rastreabilidade.");
      await carregar();
    } catch (causa) {
      setErro(causa instanceof Error ? causa.message : "Operação recusada.");
    } finally {
      setOcupado(false);
    }
  }

  if (!dados) return erro ? <p className="hx-module__error">{erro}</p> : <p>Carregando governança operacional…</p>;

  return (
    <section className="hx-governance-ops">
      <header>
        <div><small>GOVERNANÇA OPERACIONAL · {dados.governanca.versao}</small><h3>Segurança, LGPD e continuidade</h3></div>
        <span>{valor(dados.governanca.juridico.estado_padrao)}</span>
      </header>
      <div className="hx-governance-ops__metrics">
        <article><small>Perfis funcionais</small><strong>{dados.governanca.perfis.length}</strong></article>
        <article><small>Ambientes isolados</small><strong>{dados.governanca.ambientes.length}</strong></article>
        <article><small>Itens do inventário LGPD</small><strong>{dados.governanca.inventario_lgpd.length}</strong></article>
        <article><small>Backups registrados</small><strong>{dados.backups.length}</strong></article>
        <article><small>Modelos TCLE e autorizações</small><strong>{dados.consentimentos.modelos.length}</strong></article>
        <article><small>Coletas bloqueadas</small><strong>{dados.consentimentos.bloqueios_de_coleta.length}</strong></article>
        <article><small>Sessões ativas do proprietário</small><strong>{dados.seguranca.sessoes.filter((item) => item.estado === "ATIVA").length}</strong></article>
        <article><small>Alertas de segurança</small><strong>{dados.seguranca.alertas.filter((item) => item.estado === "NOVO").length}</strong></article>
      </div>
      <section className="hx-owner-security">
        <header><div><small>REGRA ÁUREA · {dados.seguranca.versao}</small><h4>Sessões, dispositivos e autoridade técnica</h4></div><strong>{valor(dados.seguranca.autoridade_global)}</strong></header>
        <div className="hx-owner-security__columns">
          <article>
            <small>SESSÕES ATIVAS</small>
            {dados.seguranca.sessoes.length ? dados.seguranca.sessoes.map((sessao) => (
              <div key={String(sessao.identificador)}>
                <span>{valor(sessao.estado)} · {valor(sessao.emitida_em)}</span>
                <button type="button" onClick={() => void executar("revogar-sessao", {}, String(sessao.identificador))}>Encerrar remotamente</button>
              </div>
            )) : <p>Nenhuma sessão registrada nesta camada.</p>}
            <button type="button" onClick={() => void executar("revogar-todas-sessoes", {})}>Encerrar todas as sessões</button>
          </article>
          <article>
            <small>DISPOSITIVOS</small>
            {dados.seguranca.dispositivos.length ? dados.seguranca.dispositivos.map((dispositivo) => (
              <div key={String(dispositivo.identificador)}>
                <span>{valor(dispositivo.nome)} · {valor(dispositivo.navegador)} · {dispositivo.confiavel ? "CONFIÁVEL" : "NÃO CONFIÁVEL"}</span>
                <button type="button" onClick={() => void executar(dispositivo.confiavel ? "revogar-dispositivo" : "confiar-dispositivo", {}, String(dispositivo.identificador))}>{dispositivo.confiavel ? "Revogar" : "Confiar"}</button>
              </div>
            )) : <p>Nenhum dispositivo registrado.</p>}
          </article>
          <article>
            <small>SEGREDO INDUSTRIAL</small>
            {dados.seguranca.segredos.map((item) => <div key={String(item.recurso)}><span>{valor(item.recurso)}</span><b>{valor(item.classificacao)}</b></div>)}
          </article>
        </div>
        <div className="hx-owner-security__columns">
          <form onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            void executar("autorizar-programador", {
              identidade_do_programador: form.get("identidade"),
              tarefa: form.get("tarefa"),
              escopo: String(form.get("escopo") ?? "").split(",").map((item) => item.trim()).filter(Boolean),
              repositorios: String(form.get("repositorios") ?? "").split(",").map((item) => item.trim()).filter(Boolean),
              ambientes: [form.get("ambiente")],
              organizacoes: [],
              inicio_em: form.get("inicio"),
              expira_em: form.get("fim"),
              ips: [],
              dispositivos: [],
              permissoes_minimas: String(form.get("permissoes") ?? "").split(",").map((item) => item.trim()).filter(Boolean),
              acesso_a_producao: form.get("ambiente") === "PRODUCAO",
              janela_de_producao: form.get("janela"),
              acesso_a_dados_reais: false,
              acesso_a_segredos_cientificos: false,
              justificativa: form.get("justificativa")
            });
          }}>
            <small>AUTORIZAÇÃO TÉCNICA TEMPORÁRIA</small>
            <label>Identidade do programador<input name="identidade" required /></label>
            <label>Tarefa<input name="tarefa" required /></label>
            <label>Escopo<input name="escopo" required placeholder="arquivo, módulo, operação" /></label>
            <label>Repositórios<input name="repositorios" required /></label>
            <label>Ambiente<select name="ambiente"><option>DESENVOLVIMENTO</option><option>HOMOLOGACAO</option><option>PRODUCAO</option></select></label>
            <label>Início<input name="inicio" type="datetime-local" required /></label>
            <label>Expiração<input name="fim" type="datetime-local" required /></label>
            <label>Permissões mínimas<input name="permissoes" required /></label>
            <label>Janela excepcional de produção<input name="janela" /></label>
            <label>Justificativa<textarea name="justificativa" required /></label>
            <button disabled={ocupado}>Autorizar com prazo e escopo</button>
          </form>
          <article>
            <small>ALERTAS</small>
            {dados.seguranca.alertas.slice(-12).reverse().map((alerta) => <div key={String(alerta.identificador)}><span>{valor(alerta.titulo)}</span><b>{valor(alerta.severidade)} · {valor(alerta.estado)}</b></div>)}
          </article>
          <article>
            <small>OBRIGAÇÕES DOCUMENTAIS FUTURAS</small>
            {dados.seguranca.obrigacoes_documentais.map((item) => <div key={String(item.codigo)}><span>{valor(item.titulo)}</span><b>{valor(item.estado)} · NÃO GERAR NESTA ETAPA</b></div>)}
          </article>
        </div>
      </section>
      <div className="hx-governance-ops__forms">
        <form onSubmit={(event: FormEvent<HTMLFormElement>) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          void executar("inventario-lgpd", {
            recurso: form.get("recurso"),
            finalidade: form.get("finalidade"),
            base_legal: form.get("base_legal"),
            sensibilidade: form.get("sensibilidade"),
            controlador: form.get("controlador"),
            operador: "HUMANEXUS",
            canal_do_titular: form.get("canal"),
            versao: form.get("versao")
          });
        }}>
          <small>INVENTÁRIO DE DADOS</small>
          <h4>Registrar finalidade e governança</h4>
          <label>Recurso<input name="recurso" required /></label>
          <label>Finalidade<textarea name="finalidade" required /></label>
          <label>Base legal<input name="base_legal" required /></label>
          <label>Sensibilidade<select name="sensibilidade"><option>SENSIVEL</option><option>PESSOAL</option><option>TECNICO</option></select></label>
          <label>Controlador<input name="controlador" required /></label>
          <label>Canal do titular<input name="canal" required /></label>
          <label>Versão<input name="versao" defaultValue="1.0" required /></label>
          <button disabled={ocupado}>Registrar no inventário</button>
        </form>
        <form onSubmit={(event: FormEvent<HTMLFormElement>) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          void executar("modelo-consentimento", {
            codigo: form.get("tipo"),
            tipo: form.get("tipo"),
            titulo: form.get("titulo"),
            versao: form.get("versao"),
            texto: form.get("texto"),
            finalidade: form.get("finalidade"),
            sensores: String(form.get("sensores") ?? "")
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean),
            estado: "PENDENTE_DE_HOMOLOGACAO_JURIDICA",
            situacao_juridica: "PENDENTE_DE_HOMOLOGACAO_JURIDICA"
          });
        }}>
          <small>TCLE E AUTORIZAÇÕES</small>
          <h4>Novo modelo versionado</h4>
          <label>Tipo<select name="tipo">
            <option>TCLE</option>
            <option>AVISO_PRIVACIDADE</option>
            <option>TERMOS_USO</option>
            <option>DADOS_PESSOAIS</option>
            <option>DADOS_SENSIVEIS</option>
            <option>AUTORIZACAO_POLAR_H10</option>
            <option>AUTORIZACAO_EEG</option>
            <option>AUTORIZACAO_REPLAY_TELEMETRIA</option>
            <option>AUTORIZACAO_AUDIO</option>
            <option>AUTORIZACAO_IMAGEM</option>
            <option>AUTORIZACAO_PESQUISA</option>
            <option>ASSENTIMENTO_ADOLESCENTE</option>
            <option>AUTORIZACAO_RESPONSAVEL_LEGAL</option>
          </select></label>
          <label>Título<input name="titulo" required /></label>
          <label>Versão<input name="versao" defaultValue="1.0" required /></label>
          <label>Finalidade<input name="finalidade" required /></label>
          <label>Sensores abrangidos<input name="sensores" placeholder="POLAR_H10, EEG" /></label>
          <label>Texto<textarea name="texto" required /></label>
          <button disabled={ocupado}>Registrar versão pendente</button>
          <p>{valor(dados.consentimentos.situacao_juridica_padrao)}</p>
        </form>
        <form onSubmit={(event: FormEvent<HTMLFormElement>) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          void executar("direito-titular", {
            tipo: form.get("tipo"),
            canal: form.get("canal"),
            pedido: { descricao_minimizada: form.get("pedido") }
          });
        }}>
          <small>DIREITOS DO TITULAR</small>
          <h4>Abrir solicitação rastreável</h4>
          <label>Direito<select name="tipo"><option>ACESSO</option><option>CORRECAO</option><option>INFORMACAO</option><option>REVOGACAO</option><option>OPOSICAO</option><option>ELIMINACAO</option></select></label>
          <label>Canal<input name="canal" required /></label>
          <label>Pedido minimizado<textarea name="pedido" required /></label>
          <button disabled={ocupado}>Gerar protocolo</button>
        </form>
        <form onSubmit={(event: FormEvent<HTMLFormElement>) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          void executar("backup", {
            ambiente: form.get("ambiente"),
            rpo_minutos: Number(form.get("rpo")),
            rto_minutos: Number(form.get("rto"))
          });
        }}>
          <small>CONTINUIDADE</small>
          <h4>Backup e restauração comprovável</h4>
          <label>Ambiente<select name="ambiente"><option>HOMOLOGACAO</option><option>DESENVOLVIMENTO</option></select></label>
          <label>RPO em minutos<input name="rpo" type="number" min="1" defaultValue="60" /></label>
          <label>RTO em minutos<input name="rto" type="number" min="1" defaultValue="120" /></label>
          <button disabled={ocupado}>Criar backup protegido</button>
          {dados.backups.map((backup) => (
            <button
              key={String(backup.identificador)}
              type="button"
              disabled={ocupado}
              onClick={() => void executar("restaurar", {}, String(backup.identificador))}
            >
              Testar restauração · {valor(backup.estado)}
            </button>
          ))}
        </form>
      </div>
      {mensagem ? <p className="hx-module__notice">{mensagem}</p> : null}
      {erro ? <p className="hx-module__error">{erro}</p> : null}
    </section>
  );
}
