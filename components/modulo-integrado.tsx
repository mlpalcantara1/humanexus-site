"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { OperacaoHomologacao } from "@/components/operacao-homologacao";
import { ParametrizacaoProspectiva, type DadosPHP } from "@/components/parametrizacao-prospectiva";
import { PainelProfissional } from "@/components/painel-profissional";
import { GovernancaAnamnese, type DadosAnamneseLab } from "@/components/governanca-anamnese";
import { GestaoOperacional } from "@/components/gestao-operacional";
import { GovernancaOperacional } from "@/components/governanca-operacional";
import { HxPageHeader, HxSurface } from "@/components/hx-design-system";
import { consultarJson, ErroDeConsulta } from "@/lib/client-request";
import { estruturaVisivelEmPortugues, portuguesVisivel } from "@/lib/portugues-visivel";

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
  "pre-treino-pos": { titulo: "PRÉ / TREINO / PÓS", codigo: "HX / CICLO", descricao: "Ciclo governado por registros congelados independentes e dados efetivamente capturados.", fontes: ["thx", "painel"], observacao: "A comparação exige uma execução THX e fases compatíveis; nenhum estado é preenchido artificialmente." },
  formulacao: { titulo: "Formulação Regulatória", codigo: "HX / FORMULAÇÃO", descricao: "Formulações profissionais rastreáveis no contexto longitudinal do participante.", fontes: ["postulados", "versao_cientifica"], observacao: "Selecione um participante no fluxo profissional para criar ou consultar formulações." },
  longitudinal: { titulo: "Longitudinal", codigo: "HX / LONGITUDINAL", descricao: "Consolidação temporal preservando ausência de dados e limites inferenciais.", fontes: ["postulados", "versao_cientifica"], observacao: "A leitura longitudinal requer identidade e histórico autorizados." },
  "indicador-coletivo": { titulo: "Indicador Coletivo", codigo: "HX / COLETIVO", descricao: "Indicadores de equipe sob governança, sem extrapolação individual.", fontes: ["postulados", "painel"], observacao: "Disponível quando houver equipe e permissão para a finalidade coletiva." },
  relatorios: { titulo: "Relatórios", codigo: "HX / RELATÓRIOS", descricao: "Geração rastreável e exportação sob autorização profissional.", fontes: ["versao_cientifica", "painel"], observacao: "A emissão requer participante ou coletivo previamente selecionado." },
  "cockpit-vivo": { titulo: "Painel Operacional ao Vivo", codigo: "HX / TIRH OPERACIONAL", descricao: "Ambiente integrado da TIRH para a pessoa, sessão, ciclo ou coletivo selecionado.", fontes: ["painel", "telemetria", "conectores"], modo: "cockpit" },
  "humanexus-lab": { titulo: "LABORATÓRIO HUMANEXUS", codigo: "HX / LABORATÓRIO", descricao: "Ambiente oficial de homologação científica, alimentado exclusivamente pelo núcleo real.", fontes: [], modo: "lab" },
  "anamnese-regulatoria": { titulo: "Anamnese Regulatória", codigo: "HX / ANAMNESE", descricao: "Convites seguros, acompanhamento, revisão profissional e evidências narrativas contextualizadas.", fontes: [] },
  conectores: { titulo: "Conectores", codigo: "HX / CONECTORES", descricao: "Catálogo e estado dos conectores permitidos no contexto autenticado.", fontes: ["conectores"] },
  telemetria: { titulo: "Ponte de Telemetria", codigo: "HX / TELEMETRIA", descricao: "Fontes de telemetria e qualidade de integração, sem ocultar indisponibilidades.", fontes: ["telemetria", "conectores"] },
  movel: { titulo: "Acesso Móvel", codigo: "HX / MÓVEL", descricao: "O mesmo perfil, permissões e sincronização em iPhone, Android e dispositivos portáteis.", fontes: ["movel"], observacao: "A sincronização só registra dados recebidos pelo núcleo; não há armazenamento paralelo de produção." },
  replay: { titulo: "Reprodução Histórica Inteligente", codigo: "HX / REPRODUÇÃO HISTÓRICA", descricao: "Linha temporal auditável da sessão, condicionada ao contexto autorizado.", fontes: ["painel"], observacao: "Selecione uma sessão para criar, comparar ou exportar a reprodução histórica correspondente.", modo: "replay" },
  configuracoes: { titulo: "Configurações", codigo: "HX / CONFIGURAÇÕES", descricao: "Contratos e vínculos do contexto autorizado, com histórico de cada alteração.", fontes: [] }
};

type Recurso = { nome: string; disponivel: boolean; dados: unknown };
type Resposta = { recursos: Recurso[]; usuario: { perfil: string; permissoes: string[] } };

function humanizar(valor: string) { return portuguesVisivel(valor.replaceAll("_", " ")); }
function texto(valor: unknown, padrao: string) {
  return portuguesVisivel(
    valor == null || valor === "" ? padrao : String(valor).replaceAll("_", " "),
    padrao
  );
}

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
    <HxSurface as="article" className="hx-source-card">
      <div className="hx-source-card__top"><p>{humanizar(recurso.nome)}</p><Estado ativo={recurso.disponivel}>{recurso.disponivel ? "núcleo conectado" : "contexto necessário"}</Estado></div>
      <p className="hx-source-card__value">{recurso.disponivel ? descricaoDosDados(recurso.dados) : "A fonte não está disponível para este perfil ou contexto."}</p>
      <div className="hx-source-card__line" />
      <small>LEITURA DIRETA DO NÚCLEO · SEM PREENCHIMENTO ARTIFICIAL</small>
    </HxSurface>
  );
}

function CommandHeader({ definicao, modulo }: { definicao: Definicao; modulo: ModuloDaPlataforma }) {
  return (
    <HxPageHeader
      className={["painel", "cockpit-vivo"].includes(modulo) ? "hx-module-head hx-module-head--compact" : "hx-module-head"}
      eyebrow={<><span />{definicao.codigo}</>}
      eyebrowClassName="hx-kicker"
      title={definicao.titulo}
      description={definicao.descricao}
      aside={<div className="hx-module-head__status">
        <span>ESTADO FUNCIONAL</span>
        <strong>{definicao.estado ?? "FUNCIONAL"}</strong>
        <span>CONTEXTO ATUAL</span>
        <strong>{modulo === "humanexus-lab" ? "VALIDAÇÃO CIENTÍFICA" : "SESSÃO PROTEGIDA"}</strong>
        <Estado ativo>navegação autenticada</Estado>
      </div>}
    />
  );
}

function useHrefComContexto() {
  const searchParams = useSearchParams();
  return useCallback((destino: string) => {
    const [caminho, consulta = ""] = destino.split("?");
    const parametros = new URLSearchParams(consulta);
    for (const chave of ["organizacao", "participante", "sessao", "thx"]) {
      const valor = searchParams.get(chave);
      if (valor && !parametros.has(chave)) parametros.set(chave, valor);
    }
    return parametros.size ? `${caminho}?${parametros}` : caminho;
  }, [searchParams]);
}

function Painel({ recursos }: { recursos: Recurso[] }) {
  const hrefComContexto = useHrefComContexto();
  const porNome = new Map(recursos.map((recurso) => [recurso.nome, recurso]));
  const resumo = porNome.get("painel")?.dados as Record<string, unknown> | undefined;
  const numero = (chave: string) => typeof resumo?.[chave] === "number" ? String(resumo[chave]) : "—";
  const fontesDisponiveis = ["conectores", "telemetria"].filter((nome) => porNome.get(nome)?.disponivel).length;
  const metricas = [
    ["Organização ativa", numero("organizacoes"), "Escopo autorizado"],
    ["Participantes ativos", numero("participantes_ativos"), "Cadastros ativos no escopo"],
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
        <Link href={hrefComContexto("/plataforma/organizacoes")}>Consultar organizações</Link>
        <Link href={hrefComContexto("/plataforma/clientes")}>Consultar participantes</Link>
        <Link href={hrefComContexto("/plataforma/anamnese-regulatoria")}>Gerar convite de Anamnese</Link>
        <Link href={hrefComContexto("/plataforma/cockpit-vivo")}>Abrir sessão técnica</Link>
        <Link className="is-primary" href={hrefComContexto("/plataforma/cockpit-vivo")}>Abrir painel operacional ao vivo</Link>
      </nav>
    </section>
    <section className="hx-command-dashboard__metrics" aria-label="Indicadores operacionais">
      {metricas.map(([rotulo, valor, detalhe]) => <article key={rotulo}><small>{rotulo}</small><strong>{valor}</strong><span>{detalhe}</span></article>)}
    </section>
    <section className="hx-command-dashboard__lower">
      <article><p>PENDÊNCIAS PROFISSIONAIS</p><strong>Nenhuma lista consolidada retornada</strong><span>Ausência preservada; o painel não fabrica pendências.</span></article>
      <article><p>QUALIDADE RECENTE DAS COLETAS</p><strong>Não disponibilizada no resumo operacional</strong><span>A leitura científica permanece no painel operacional ao vivo.</span></article>
      <article><p>ALERTAS OPERACIONAIS</p><strong>{fontesDisponiveis === 2 ? "Fontes técnicas disponíveis" : "Verificar fontes disponíveis"}</strong><span>Falhas que afetem uma sessão serão destacadas no painel operacional.</span></article>
      <article><p>ATIVIDADES E RELATÓRIOS RECENTES</p><strong>{numero("eventos_de_auditoria")} eventos auditados</strong><span>Relatórios recentes exigem contexto de participante.</span></article>
    </section>
  </div>;
}

function Cockpit({ recursos }: { recursos: Recurso[] }) {
  const telemetria = recursos.find((item) => item.nome === "telemetria");
  const conectores = recursos.find((item) => item.nome === "conectores");
  return <div className="hx-cockpit">
    <div className="hx-cockpit__bar"><span>PAINEL OPERACIONAL AO VIVO / LEITURA OPERACIONAL</span><Estado ativo={Boolean(telemetria?.disponivel || conectores?.disponivel)}>fonte em observação</Estado></div>
    <div className="hx-cockpit__grid">
      <section className="hx-hud hx-hud--session"><p>SESSÃO ATIVA</p><strong>Contexto necessário</strong><span>Uma sessão autorizada é necessária para exibir fase, participante e marcadores reais.</span><div className="hx-phase"><b>PRÉ</b><b>TREINO</b><b>PÓS</b></div></section>
      <section className="hx-hud hx-hud--signal"><p>QUALIDADE DE CAPTURA</p><div className="hx-signal-orbit"><i /><i /><b>HX</b></div><span>{telemetria?.disponivel ? descricaoDosDados(telemetria.dados) : "Nenhuma telemetria disponível no contexto atual."}</span></section>
      <section className="hx-hud hx-hud--alerts"><p>ALERTAS E DECISÃO</p><strong>Sem alerta automático</strong><span>O painel operacional não substitui o julgamento profissional nem produz estado sem evidência suficiente.</span><button disabled type="button">SELECIONAR SESSÃO</button></section>
      <section className="hx-hud hx-hud--sources"><p>FONTES E CONECTORES</p><div className="hx-hud__list"><span><i className={conectores?.disponivel ? "on" : ""} />Conectores</span><span><i className={telemetria?.disponivel ? "on" : ""} />Telemetria</span><span><i />Marcadores da sessão</span></div></section>
    </div>
  </div>;
}

function Replay({ recurso }: { recurso?: Recurso }) {
  return <div className="hx-replay">
    <div className="hx-replay__toolbar"><div><p>REPRODUÇÃO HISTÓRICA / SESSÃO</p><strong>Nenhuma sessão selecionada</strong></div><button type="button" disabled>EXPORTAR REPRODUÇÃO HISTÓRICA</button></div>
    <section className="hx-replay__canvas">
      <div className="hx-replay__phases"><span>PRÉ</span><span>TREINO</span><span>PÓS</span></div>
      {["Evidências", "Vetores", "Sensores", "Intervenções", "Decisões profissionais"].map((trilha) => <div className="hx-replay__track" key={trilha}><p>{trilha}</p><div><i /><i /><i /></div></div>)}
      <p className="hx-replay__empty">{recurso?.disponivel ? "Selecione uma sessão para revelar sua linha temporal auditável." : "Não há dados de reprodução histórica no contexto autorizado."}</p>
    </section>
    <section className="hx-replay__legend"><span><i />Evento registrado</span><span><i />Evidência preservada</span><span><i />Decisão profissional</span><b>SEM DADOS SIMULADOS</b></section>
  </div>;
}

function Lab({ dados, php, anamnese, avisos }: { dados: unknown; php: DadosPHP | null; anamnese: DadosAnamneseLab | null; avisos: string[] }) {
  const hrefComContexto = useHrefComContexto();
  const objeto = dados && typeof dados === "object" && !Array.isArray(dados)
    ? dados as Record<string, unknown>
    : null;
  const historico = Array.isArray(objeto?.historico)
    ? objeto.historico.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object" && !Array.isArray(item))
    : [];
  const entradas = historico.length
    ? historico.map((item, indice) => [String(item.codigo ?? `modulo-${indice + 1}`), item] as const)
    : objeto ? Object.entries(objeto) : [];
  return <div className="hx-lab">
    <section className="hx-lab__intro"><div><p>AMBIENTE OFICIAL DE HOMOLOGAÇÃO</p><h2>Constituição científica e rastreabilidade em consulta viva.</h2></div><Estado ativo>acesso de proprietário validado pelo núcleo</Estado></section>
    <section className="hx-lab__cockpit">
      <div><p>INSPEÇÃO DA OPERACIONALIZAÇÃO</p><strong>Painel operacional ao vivo · TIRH operacional</strong><span>Postulados, campos, Matriz Vetorial, Resultante, Trajetória, fases, rotas e produtos integrados em um único contexto.</span></div>
      <Link href={hrefComContexto("/plataforma/cockpit-vivo?visao=constituicao")}>Abrir inspeção no painel operacional ao vivo</Link>
    </section>
    {avisos.length ? <aside className="hx-lab__partial" role="status"><strong>Dados parciais preservados</strong>{avisos.map((aviso) => <span key={aviso}>{aviso}</span>)}</aside> : null}
    <section className="hx-lab__grid">
      {entradas.length ? entradas.map(([chave, valor], indice) => {
        const moduloDoIndice = valor && typeof valor === "object" && !Array.isArray(valor)
          ? valor as Record<string, unknown>
          : null;
        const registroRroLegado = String(moduloDoIndice?.codigo ?? chave) === "ARR_RRO_NRA";
        const nomeVisivel = registroRroLegado
          ? "ARR / RRO / NRA · registro histórico legado"
          : moduloDoIndice?.nome
            ? texto(moduloDoIndice.nome, humanizar(chave))
            : descricaoDosDados(valor);
        const estadoVisivel = registroRroLegado
          ? "RRO NÃO ATIVO NA TIRH V1 · FONTE HISTÓRICA PRESERVADA"
          : `${moduloDoIndice?.estado ? `${texto(moduloDoIndice.estado, "ESTADO PRESERVADO")} · ` : ""}FONTE OFICIAL · INSPEÇÃO AUTORIZADA`;
        return <article className="hx-lab-card" key={chave}><span>{String(indice + 1).padStart(2, "0")}</span><p>{humanizar(chave)}</p><strong>{nomeVisivel}</strong><small>{estadoVisivel}</small></article>;
      }) : <article className="hx-lab-card hx-lab-card--empty"><p>Validação em consulta</p><strong>O núcleo não retornou módulos homologáveis para este contexto.</strong><small>NENHUM DADO FOI SUBSTITUÍDO</small></article>}
    </section>
    {php
      ? <ParametrizacaoProspectiva dados={php} />
      : <section className="hx-lab__restricted"><small>CAMADA PROSPECTIVA AUTORAL</small><strong>Conteúdo restrito ao Administrador Proprietário.</strong><span>O laboratório principal permanece disponível sem simular ou preencher esta camada.</span></section>}
    {anamnese
      ? <GovernancaAnamnese dados={anamnese} />
      : <section className="hx-lab__restricted"><small>GOVERNANÇA AUTORAL / ANAMNESE</small><strong>Conteúdo restrito ao Administrador Proprietário.</strong><span>A ausência de permissão é preservada e não impede a navegação pelo laboratório.</span></section>}
    <GovernancaOperacional />
    <details className="hx-lab__trace"><summary>Inspecionar rastreabilidade técnica autorizada</summary><pre>{JSON.stringify(estruturaVisivelEmPortugues(dados), null, 2)}</pre></details>
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
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [avisosLab, setAvisosLab] = useState<string[]>([]);
  const falhouAntes = useRef(false);

  const carregar = useCallback(async (signal?: AbortSignal) => {
    if (!exigeConsultaGlobal) {
      setResposta(null);
      setErro("");
      return;
    }
    setCarregando(true);
    setMensagem("");
    const destino = modulo === "humanexus-lab"
      ? "/api/plataforma/lab"
      : `/api/plataforma/resumo?modulo=${encodeURIComponent(modulo)}`;
    try {
      const dados = await consultarJson<{ dados?: unknown } | Resposta>(destino, { signal });
      setResposta(modulo === "humanexus-lab"
        ? { recursos: [{ nome: "humanexus-lab", disponivel: true, dados: (dados as { dados?: unknown }).dados }], usuario: { perfil: "ADMINISTRADOR_PROPRIETARIO", permissoes: [] } }
        : dados as Resposta);
      setErro("");
      if (falhouAntes.current) setMensagem("Conexão restabelecida.");
      falhouAntes.current = false;
      const avisos: string[] = [];
      let proximaAnamnese: DadosAnamneseLab | null = null;
      let proximoPhp: DadosPHP | null = null;
      if (modulo === "humanexus-lab") {
        await Promise.all([
          { caminho: "/api/plataforma/governanca-anamnese", aplicar: (valor: unknown) => { proximaAnamnese = valor as DadosAnamneseLab; } },
          { caminho: "/api/plataforma/governanca-restrita", aplicar: (valor: unknown) => { proximoPhp = valor as DadosPHP; } }
        ].map(async (adicional) => {
          try {
            const respostaAdicional = await consultarJson<{ dados: unknown }>(adicional.caminho, { tentativas: 1, signal });
            adicional.aplicar(respostaAdicional.dados);
          } catch (causa) {
            if (!(causa instanceof ErroDeConsulta && causa.status === 403)) {
              avisos.push(causa instanceof Error ? causa.message : "Consulta complementar indisponível.");
            }
          }
        }));
      }
      if (signal?.aborted) return;
      setAnamneseLab(proximaAnamnese);
      setPhp(proximoPhp);
      setAvisosLab(avisos);
    } catch (causa) {
      if (signal?.aborted) return;
      falhouAntes.current = true;
      setErro(causa instanceof Error ? causa.message : "Consulta indisponível.");
    } finally {
      if (!signal?.aborted) setCarregando(false);
    }
  }, [exigeConsultaGlobal, modulo]);

  useEffect(() => {
    const controlador = new AbortController();
    void carregar(controlador.signal);
    const aoReconectar = () => void carregar(controlador.signal);
    window.addEventListener("online", aoReconectar);
    return () => {
      controlador.abort();
      window.removeEventListener("online", aoReconectar);
    };
  }, [carregar]);

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
      {modulo !== "cockpit-vivo"
        ? <CommandHeader definicao={definicao} modulo={modulo} />
        : null}
      {definicao.observacao ? <p className="hx-module__notice">{definicao.observacao}</p> : null}
      {moduloOperacional && modulo !== "cockpit-vivo" ? <p className="hx-module__notice"><strong>CONTEXTO OPERACIONAL PROTEGIDO.</strong> Organização, participante e sessão são selecionados entre registros autorizados do núcleo e permanecem sincronizados entre as visões. Dados técnicos simulados continuam separados de evidência humana.</p> : null}
      {erro ? <aside className="hx-module__error" role="status"><strong>{portuguesVisivel(erro)}</strong><button type="button" onClick={() => void carregar()}>Tentar novamente</button></aside> : null}
      {mensagem ? <p className="hx-module__success" role="status">{portuguesVisivel(mensagem)}</p> : null}
      {exigeConsultaGlobal && !resposta && carregando && !erro ? <p className="hx-module__loading">Consultando o núcleo oficial…</p> : null}
      {moduloOperacional ? <OperacaoHomologacao modulo={modulo} /> : null}
      {moduloDeGestao ? <GestaoOperacional modulo={modulo} /> : null}
      {modulo === "anamnese-regulatoria" ? <PainelProfissional /> : null}
      {resposta && definicao.modo === "painel" ? <Painel recursos={recursos} /> : null}
      {resposta && definicao.modo === "cockpit" && !moduloOperacional ? <Cockpit recursos={recursos} /> : null}
      {resposta && definicao.modo === "replay" && !moduloOperacional ? <Replay recurso={recursos[0]} /> : null}
      {resposta && definicao.modo === "lab" ? <Lab dados={dadosDoLab} php={php} anamnese={anamneseLab} avisos={avisosLab} /> : null}
      {resposta && modulo !== "anamnese-regulatoria" && !definicao.modo && !moduloOperacional && !moduloDeGestao ? <div className="hx-source-grid hx-source-grid--standard">{recursos.map((recurso) => <FonteCard recurso={recurso} key={recurso.nome} />)}</div> : null}
    </div>
  </section>;
}
