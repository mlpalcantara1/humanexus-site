"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { OperacaoHomologacao } from "@/components/operacao-homologacao";
import { ParametrizacaoProspectiva, type DadosPHP } from "@/components/parametrizacao-prospectiva";
import { PainelProfissional } from "@/components/painel-profissional";
import { GovernancaAnamnese, type DadosAnamneseLab } from "@/components/governanca-anamnese";
import { GestaoOperacional } from "@/components/gestao-operacional";
import { GovernancaOperacional } from "@/components/governanca-operacional";

export type ModuloDaPlataforma =
  | "painel" | "organizacoes" | "clientes" | "sessoes" | "treinamentos" | "pre-treino-pos"
  | "formulacao" | "longitudinal" | "indicador-coletivo" | "relatorios" | "cockpit-vivo"
  | "humanexus-lab" | "anamnese-regulatoria" | "conectores" | "telemetria" | "movel" | "replay" | "configuracoes";

type EstadoFuncional = "FUNCIONAL" | "PARCIAL" | "NÃO IMPLEMENTADO";
type Definicao = { titulo: string; codigo: string; descricao: string; fontes: string[]; observacao?: string; modo?: "painel" | "cockpit" | "replay" | "lab"; estado?: EstadoFuncional };

const DEFINICOES: Record<ModuloDaPlataforma, Definicao> = {
  painel: { titulo: "Painel de Comando", codigo: "HX / OPERAÇÃO", descricao: "Visão geral administrativa e operacional do contexto autenticado.", fontes: ["painel", "organizacoes", "clientes", "conectores", "telemetria", "versao_cientifica"], modo: "painel" },
  organizacoes: { titulo: "Organizações", codigo: "HX / ORGANIZAÇÕES", descricao: "Cadastro, edição versionada, ativação, escopo e histórico institucional auditável.", fontes: ["organizacoes"] },
  clientes: { titulo: "Clientes", codigo: "HX / CLIENTES", descricao: "Participantes, vínculos, contextos, histórico e permissões no escopo autorizado.", fontes: ["clientes"] },
  sessoes: { titulo: "Sessões", codigo: "HX / SESSÕES", descricao: "Criação, programação e ciclo operacional auditável vinculado ao participante correto.", fontes: ["painel"] },
  treinamentos: { titulo: "Treinamentos", codigo: "HX / TREINAMENTOS", descricao: "Catálogo e programação operacional com CTR e THX sob decisão profissional.", fontes: ["ctr", "thx"] },
  "pre-treino-pos": { titulo: "PRÉ / TREINO / PÓS", codigo: "HX / CICLO", descricao: "Ciclo governado por snapshots independentes e dados efetivamente capturados.", fontes: ["thx", "painel"], observacao: "A comparação exige uma execução THX e fases compatíveis; nenhum estado é preenchido artificialmente." },
  formulacao: { titulo: "Formulação Regulatória", codigo: "HX / FORMULAÇÃO", descricao: "Formulações profissionais rastreáveis no contexto longitudinal do participante.", fontes: ["postulados", "versao_cientifica"], observacao: "Selecione um participante no fluxo profissional para criar ou consultar formulações." },
  longitudinal: { titulo: "Longitudinal", codigo: "HX / LONGITUDINAL", descricao: "Consolidação temporal preservando ausência de dados e limites inferenciais.", fontes: ["postulados", "versao_cientifica"], observacao: "A leitura longitudinal requer identidade e histórico autorizados." },
  "indicador-coletivo": { titulo: "Indicador Coletivo", codigo: "HX / COLETIVO", descricao: "Indicadores de equipe sob governança, sem extrapolação individual.", fontes: ["postulados", "painel"], observacao: "Disponível quando houver equipe e permissão para a finalidade coletiva." },
  relatorios: { titulo: "Relatórios", codigo: "HX / RELATÓRIOS", descricao: "Geração rastreável e exportação sob autorização profissional.", fontes: ["versao_cientifica", "painel"], observacao: "A emissão requer participante ou coletivo previamente selecionado." },
  "cockpit-vivo": { titulo: "Cockpit Vivo", codigo: "HX / TIRH OPERACIONAL", descricao: "Ambiente integrado da TIRH para a pessoa, sessão, ciclo ou coletivo selecionado.", fontes: ["painel", "telemetria", "conectores"], modo: "cockpit" },
  "humanexus-lab": { titulo: "HUMANEXUS LAB", codigo: "HX / LAB", descricao: "Ambiente oficial de homologação científica, alimentado exclusivamente pelo núcleo real.", fontes: [], modo: "lab" },
  "anamnese-regulatoria": { titulo: "Anamnese Regulatória", codigo: "HX / ANAMNESE", descricao: "Convites seguros, acompanhamento, revisão profissional e evidências narrativas contextualizadas.", fontes: [] },
  conectores: { titulo: "Conectores", codigo: "HX / CONECTORES", descricao: "Catálogo e estado dos conectores permitidos no contexto autenticado.", fontes: ["conectores"] },
  telemetria: { titulo: "Telemetria Bridge", codigo: "HX / TELEMETRIA", descricao: "Fontes de telemetria e qualidade de integração, sem ocultar indisponibilidades.", fontes: ["telemetria", "conectores"] },
  movel: { titulo: "Acesso Móvel", codigo: "HX / MÓVEL", descricao: "O mesmo perfil, permissões e sincronização em iPhone, Android e tablet.", fontes: ["movel"], observacao: "A sincronização só registra dados recebidos pelo núcleo; não há armazenamento paralelo de produção." },
  replay: { titulo: "Replay Inteligente", codigo: "HX / REPLAY", descricao: "Linha temporal auditável da sessão, condicionada ao contexto autorizado.", fontes: ["painel"], observacao: "Selecione uma sessão para criar, comparar ou exportar o replay correspondente.", modo: "replay" },
  configuracoes: { titulo: "Configurações", codigo: "HX / CONFIGURAÇÕES", descricao: "Contratos, vínculos, versão científica, postulados e permissões efetivas da sessão.", fontes: ["versao_cientifica", "postulados"] }
};

type Recurso = { nome: string; disponivel: boolean; dados: unknown };
type Resposta = { recursos: Recurso[]; usuario: { perfil: string; permissoes: string[] } };

function humanizar(valor: string) { return valor.replaceAll("_", " "); }
function texto(valor: unknown, padrao: string) { return valor == null || valor === "" ? padrao : String(valor).replaceAll("_", " "); }

function descricaoDosDados(dados: unknown) {
  if (Array.isArray(dados)) return dados.length === 0 ? "Nenhum registro no contexto atual." : `${dados.length} registro(s) disponíveis no contexto atual.`;
  if (dados && typeof dados === "object") {
    const quantitativos = Object.entries(dados as Record<string, unknown>).filter(([, valor]) => typeof valor === "number").slice(0, 2);
    if (quantitativos.length) return quantitativos.map(([chave, valor]) => `${humanizar(chave)}: ${valor}`).join(" · ");
    return "Dados reais disponíveis no núcleo para este contexto.";
  }
  return "Nenhum registro no contexto atual.";
}

function Estado({ ativo, children }: { ativo: boolean; children: React.ReactNode }) {
  return <span className={ativo ? "hx-state hx-state--live" : "hx-state"}><i />{children}</span>;
}

function FonteCard({ recurso }: { recurso: Recurso }) {
  return (
    <article className="hx-source-card">
      <div className="hx-source-card__top"><p>{humanizar(recurso.nome)}</p><Estado ativo={recurso.disponivel}>{recurso.disponivel ? "núcleo conectado" : "contexto necessário"}</Estado></div>
      <p className="hx-source-card__value">{recurso.disponivel ? descricaoDosDados(recurso.dados) : "A fonte não está disponível para este perfil ou contexto."}</p>
      <div className="hx-source-card__line" />
      <small>LEITURA DIRETA DO NÚCLEO · SEM PREENCHIMENTO ARTIFICIAL</small>
    </article>
  );
}

function CommandHeader({ definicao, modulo }: { definicao: Definicao; modulo: ModuloDaPlataforma }) {
  return (
    <header className={["painel", "cockpit-vivo"].includes(modulo) ? "hx-module-head hx-module-head--compact" : "hx-module-head"}>
      <div>
        <p className="hx-kicker"><span />{definicao.codigo}</p>
        <h1>{definicao.titulo}</h1>
        <p>{definicao.descricao}</p>
      </div>
      <div className="hx-module-head__status">
        <span>ESTADO FUNCIONAL</span>
        <strong>{definicao.estado ?? "FUNCIONAL"}</strong>
        <span>CONTEXTO ATUAL</span>
        <strong>{modulo === "humanexus-lab" ? "VALIDAÇÃO CIENTÍFICA" : "SESSÃO PROTEGIDA"}</strong>
        <Estado ativo>navegação autenticada</Estado>
      </div>
    </header>
  );
}

function Painel({ recursos }: { recursos: Recurso[] }) {
  const porNome = new Map(recursos.map((recurso) => [recurso.nome, recurso]));
  const resumo = porNome.get("painel")?.dados as Record<string, unknown> | undefined;
  const numero = (chave: string) => typeof resumo?.[chave] === "number" ? String(resumo[chave]) : "—";
  const clientes = porNome.get("clientes")?.dados;
  const fontesDisponiveis = ["conectores", "telemetria"].filter((nome) => porNome.get(nome)?.disponivel).length;
  const metricas = [
    ["Organização ativa", numero("organizacoes"), "Escopo autorizado"],
    ["Clientes ativos", Array.isArray(clientes) ? String(clientes.length) : numero("participantes"), "Participantes no escopo"],
    ["Anamneses", numero("anamneses"), "Registros no núcleo"],
    ["Treinamentos ativos", "—", "Não disponibilizado no resumo"],
    ["Sessões programadas", "—", "Não disponibilizado no resumo"],
    ["Sessões em andamento", "—", "Não disponibilizado no resumo"],
    ["Fontes disponíveis", String(fontesDisponiveis), "Conectores e Telemetria"],
    ["Atividades auditadas", numero("eventos_de_auditoria"), "Eventos preservados"]
  ];
  return <div className="hx-command-dashboard">
    <section className="hx-command-dashboard__actions">
      <div><p>OPERAÇÃO ATUAL</p><strong>{texto(resumo?.estado, "CONTEXTO DISPONÍVEL")}</strong><span>Versão científica {texto(resumo?.versao_cientifica, "não informada")}</span></div>
      <nav aria-label="Atalhos operacionais">
        <Link href="/plataforma/organizacoes">Consultar organizações</Link>
        <Link href="/plataforma/clientes">Consultar participantes</Link>
        <Link href="/plataforma/anamnese-regulatoria">Gerar convite de Anamnese</Link>
        <Link href="/plataforma/cockpit-vivo">Abrir sessão técnica</Link>
        <Link className="is-primary" href="/plataforma/cockpit-vivo">Abrir Cockpit Vivo</Link>
      </nav>
    </section>
    <section className="hx-command-dashboard__metrics" aria-label="Indicadores operacionais">
      {metricas.map(([rotulo, valor, detalhe]) => <article key={rotulo}><small>{rotulo}</small><strong>{valor}</strong><span>{detalhe}</span></article>)}
    </section>
    <section className="hx-command-dashboard__lower">
      <article><p>PENDÊNCIAS PROFISSIONAIS</p><strong>Nenhuma lista consolidada retornada</strong><span>Ausência preservada; o painel não fabrica pendências.</span></article>
      <article><p>QUALIDADE RECENTE DAS COLETAS</p><strong>Não disponibilizada no resumo operacional</strong><span>A leitura científica permanece no Cockpit Vivo.</span></article>
      <article><p>ALERTAS OPERACIONAIS</p><strong>{fontesDisponiveis === 2 ? "Fontes técnicas disponíveis" : "Verificar fontes disponíveis"}</strong><span>Falhas que afetem uma sessão serão destacadas no Cockpit.</span></article>
      <article><p>ATIVIDADES E RELATÓRIOS RECENTES</p><strong>{numero("eventos_de_auditoria")} eventos auditados</strong><span>Relatórios recentes exigem contexto de participante.</span></article>
    </section>
  </div>;
}

function Cockpit({ recursos }: { recursos: Recurso[] }) {
  const telemetria = recursos.find((item) => item.nome === "telemetria");
  const conectores = recursos.find((item) => item.nome === "conectores");
  return <div className="hx-cockpit">
    <div className="hx-cockpit__bar"><span>COCKPIT VIVO / LEITURA OPERACIONAL</span><Estado ativo={Boolean(telemetria?.disponivel || conectores?.disponivel)}>fonte em observação</Estado></div>
    <div className="hx-cockpit__grid">
      <section className="hx-hud hx-hud--session"><p>SESSÃO ATIVA</p><strong>Contexto necessário</strong><span>Uma sessão autorizada é necessária para exibir fase, participante e marcadores reais.</span><div className="hx-phase"><b>PRÉ</b><b>TREINO</b><b>PÓS</b></div></section>
      <section className="hx-hud hx-hud--signal"><p>QUALIDADE DE CAPTURA</p><div className="hx-signal-orbit"><i /><i /><b>HX</b></div><span>{telemetria?.disponivel ? descricaoDosDados(telemetria.dados) : "Nenhuma telemetria disponível no contexto atual."}</span></section>
      <section className="hx-hud hx-hud--alerts"><p>ALERTAS E DECISÃO</p><strong>Sem alerta automático</strong><span>O cockpit não substitui o julgamento profissional nem produz estado sem evidência suficiente.</span><button disabled type="button">SELECIONAR SESSÃO</button></section>
      <section className="hx-hud hx-hud--sources"><p>FONTES E CONECTORES</p><div className="hx-hud__list"><span><i className={conectores?.disponivel ? "on" : ""} />Conectores</span><span><i className={telemetria?.disponivel ? "on" : ""} />Telemetria</span><span><i />Marcadores da sessão</span></div></section>
    </div>
  </div>;
}

function Replay({ recurso }: { recurso?: Recurso }) {
  return <div className="hx-replay">
    <div className="hx-replay__toolbar"><div><p>REPLAY / SESSÃO</p><strong>Nenhuma sessão selecionada</strong></div><button type="button" disabled>EXPORTAR REPLAY</button></div>
    <section className="hx-replay__canvas">
      <div className="hx-replay__phases"><span>PRÉ</span><span>TREINO</span><span>PÓS</span></div>
      {["Evidências", "Vetores", "Sensores", "Intervenções", "Decisões profissionais"].map((trilha) => <div className="hx-replay__track" key={trilha}><p>{trilha}</p><div><i /><i /><i /></div></div>)}
      <p className="hx-replay__empty">{recurso?.disponivel ? "Selecione uma sessão para revelar sua linha temporal auditável." : "Não há dados de replay no contexto autorizado."}</p>
    </section>
    <section className="hx-replay__legend"><span><i />Evento registrado</span><span><i />Evidência preservada</span><span><i />Decisão profissional</span><b>SEM DADOS SIMULADOS</b></section>
  </div>;
}

function Lab({ dados, php, anamnese }: { dados: unknown; php: DadosPHP | null; anamnese: DadosAnamneseLab | null }) {
  const entradas = dados && typeof dados === "object" && !Array.isArray(dados) ? Object.entries(dados as Record<string, unknown>) : [];
  return <div className="hx-lab">
    <section className="hx-lab__intro"><div><p>AMBIENTE OFICIAL DE HOMOLOGAÇÃO</p><h2>Constituição científica e rastreabilidade em consulta viva.</h2></div><Estado ativo>acesso de proprietário validado pelo núcleo</Estado></section>
    <section className="hx-lab__cockpit">
      <div><p>INSPEÇÃO DA OPERACIONALIZAÇÃO</p><strong>Cockpit Vivo · TIRH operacional</strong><span>Postulados, campos, Matriz Vetorial, Resultante, Trajetória, fases, rotas e produtos integrados em um único contexto.</span></div>
      <Link href="/plataforma/cockpit-vivo?visao=constituicao">Abrir inspeção no Cockpit Vivo</Link>
    </section>
    <section className="hx-lab__grid">
      {entradas.length ? entradas.map(([chave, valor], indice) => <article className="hx-lab-card" key={chave}><span>{String(indice + 1).padStart(2, "0")}</span><p>{humanizar(chave)}</p><strong>{descricaoDosDados(valor)}</strong><small>FONTE OFICIAL · INSPEÇÃO AUTORIZADA</small></article>) : <article className="hx-lab-card hx-lab-card--empty"><p>Validação em consulta</p><strong>O núcleo não retornou módulos homologáveis para este contexto.</strong><small>NENHUM DADO FOI SUBSTITUÍDO</small></article>}
    </section>
    <ParametrizacaoProspectiva dados={php} />
    <GovernancaAnamnese dados={anamnese} />
    <GovernancaOperacional />
    <details className="hx-lab__trace"><summary>Inspecionar rastreabilidade técnica autorizada</summary><pre>{JSON.stringify(dados, null, 2)}</pre></details>
  </div>;
}

export function ModuloIntegrado({ modulo }: { modulo: ModuloDaPlataforma }) {
  const definicao = DEFINICOES[modulo];
  const exigeConsultaGlobal = [
    "painel",
    "formulacao",
    "humanexus-lab"
  ].includes(modulo);
  const [resposta, setResposta] = useState<Resposta | null>(null);
  const [php, setPhp] = useState<DadosPHP | null>(null);
  const [anamneseLab, setAnamneseLab] = useState<DadosAnamneseLab | null>(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!exigeConsultaGlobal) {
      setResposta(null);
      setErro("");
      return;
    }
    let ativo = true;
    const destino = modulo === "humanexus-lab"
      ? "/api/plataforma/lab"
      : `/api/plataforma/resumo?modulo=${encodeURIComponent(modulo)}`;
    fetch(destino, { cache: "no-store" }).then(async (resultado) => {
      const dados = await resultado.json();
      if (!resultado.ok) throw new Error(dados?.erro?.mensagem ?? "Consulta indisponível.");
      if (ativo) setResposta(modulo === "humanexus-lab" ? { recursos: [{ nome: "humanexus-lab", disponivel: true, dados: dados.dados }], usuario: { perfil: "ADMINISTRADOR_PROPRIETARIO", permissoes: [] } } : dados as Resposta);
    }).catch((causa) => ativo && setErro(causa instanceof Error ? causa.message : "Consulta indisponível."));
    return () => { ativo = false; };
  }, [exigeConsultaGlobal, modulo]);

  useEffect(() => {
    if (modulo !== "humanexus-lab") return;
    let ativo = true;
    fetch("/api/plataforma/governanca-anamnese", { cache: "no-store" })
      .then(async (resultado) => {
        const corpo = await resultado.json();
        if (!resultado.ok) throw new Error(corpo?.erro?.mensagem ?? "Governança autoral indisponível.");
        if (ativo) setAnamneseLab(corpo.dados as DadosAnamneseLab);
      })
      .catch(() => undefined);
    return () => { ativo = false; };
  }, [modulo]);

  useEffect(() => {
    if (modulo !== "humanexus-lab") return;
    let ativo = true;
    fetch("/api/plataforma/governanca-restrita", { cache: "no-store" })
      .then(async (resultado) => {
        const corpo = await resultado.json();
        if (!resultado.ok) {
          throw new Error(corpo?.erro?.mensagem ?? "Recurso restrito indisponível.");
        }
        if (ativo) setPhp(corpo.dados as DadosPHP);
      })
      .catch((causa) => {
        if (ativo) setErro(causa instanceof Error ? causa.message : "Recurso restrito indisponível.");
      });
    return () => { ativo = false; };
  }, [modulo]);

  const recursos = useMemo(() => {
    const porNome = new Map(resposta?.recursos.map((recurso) => [recurso.nome, recurso]));
    return definicao.fontes.map((fonte) => porNome.get(fonte) ?? { nome: fonte, disponivel: false, dados: null });
  }, [definicao.fontes, resposta]);
  const dadosDoLab = resposta?.recursos[0]?.dados;
  const moduloOperacional = [
    "cockpit-vivo", "conectores", "telemetria", "pre-treino-pos",
    "longitudinal", "indicador-coletivo", "relatorios", "movel", "replay"
  ].includes(modulo);
  const moduloDeGestao = [
    "organizacoes", "clientes", "sessoes", "treinamentos", "configuracoes"
  ].includes(modulo);

  return <section className={`hx-module hx-module--${definicao.modo ?? "standard"}`}>
    <div className="hx-module__grid" aria-hidden="true" />
    <div className="hx-module__inner">
      <CommandHeader definicao={definicao} modulo={modulo} />
      {definicao.observacao ? <p className="hx-module__notice">{definicao.observacao}</p> : null}
      {moduloOperacional ? <p className="hx-module__notice"><strong>CONTEXTO OPERACIONAL PROTEGIDO.</strong> Organização, participante e sessão são selecionados entre registros autorizados do núcleo e permanecem sincronizados entre as visões. Dados técnicos simulados continuam separados de evidência humana.</p> : null}
      {erro ? <p className="hx-module__error" role="status">{erro}</p> : null}
      {exigeConsultaGlobal && !resposta && !erro ? <p className="hx-module__loading">Consultando o núcleo oficial…</p> : null}
      {moduloOperacional ? <OperacaoHomologacao modulo={modulo} /> : null}
      {moduloDeGestao ? <GestaoOperacional modulo={modulo} /> : null}
      {modulo === "anamnese-regulatoria" ? <PainelProfissional /> : null}
      {resposta && definicao.modo === "painel" ? <Painel recursos={recursos} /> : null}
      {resposta && definicao.modo === "cockpit" && !moduloOperacional ? <Cockpit recursos={recursos} /> : null}
      {resposta && definicao.modo === "replay" && !moduloOperacional ? <Replay recurso={recursos[0]} /> : null}
      {resposta && definicao.modo === "lab" ? <Lab dados={dadosDoLab} php={php} anamnese={anamneseLab} /> : null}
      {resposta && modulo !== "anamnese-regulatoria" && !definicao.modo && !moduloOperacional && !moduloDeGestao ? <div className="hx-source-grid hx-source-grid--standard">{recursos.map((recurso) => <FonteCard recurso={recurso} key={recurso.nome} />)}</div> : null}
    </div>
  </section>;
}
