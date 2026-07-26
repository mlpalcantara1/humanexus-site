"use client";

import { useMemo, useState } from "react";

type Module = { codigo: string; nivel: number; nicho?: string | null; estado: string };
type FunctionBranch = {
  nicho: string;
  pergunta_de_funcao: string | null;
  funcoes_observadas_historicamente: string[];
  catalogo_completo: string;
};
type Rule = {
  codigo: string;
  resposta_ativadora: string;
  secao_de_destino: string;
  perguntas_exibidas: string[];
  perguntas_inaplicaveis: string[];
};
type MatrixQuestion = {
  codigo: string;
  texto_original: string;
  texto_atual: string;
  aplicacao: string;
  nicho: string;
  modulo: string;
  tipo_de_resposta: string;
  alternativas_oficiais: string[];
  alternativas_observadas_historicas: string[];
  obrigatoria: boolean;
  condicao_de_exibicao?: Record<string, unknown> | null;
  ordem: number;
  correspondencia_com_biblioteca: string;
  respostas_historicas_associadas: number;
  situacao_de_homologacao: string;
  divergencias: string[];
};

export type DadosAnamneseLab = {
  configuracao: {
    codigo: string;
    versao: string;
    estado: string;
    fonte_de_verdade: {
      arquivo: string;
      sha256: string;
      abas_analisadas: string[];
      linhas_totais: number;
      linhas_de_respostas: number;
      colunas: number;
    };
    estatisticas: Record<string, number | Record<string, number>>;
    nichos_confirmados: string[];
    nichos_da_biblioteca_nao_confirmados_nesta_planilha: string[];
    modulos: Module[];
    funcoes_e_subnichos: FunctionBranch[];
    regras_de_ramo: Rule[];
    decisoes_autorais: {
      codigo: string;
      conteudo: string;
      efeito_operacional: string;
      estado: string;
    }[];
    matriz_de_compatibilizacao: MatrixQuestion[];
    lacunas_autorais: { codigo: string; situacao: string; detalhe: string }[];
    respostas_historicas: {
      politica: string;
      importadas: number;
      anonimizadas_para_validacao_estrutural: number;
      dados_pessoais_persistidos: boolean;
    };
  };
  biblioteca: {
    codigo: string;
    versao: string;
    estado: string;
    total_de_perguntas: number;
  };
  auditoria: Record<string, boolean>;
};

export function GovernancaAnamnese({ dados }: { dados: DadosAnamneseLab | null }) {
  const [nicho, setNicho] = useState("TODOS");
  const config = dados?.configuracao;
  const questions = useMemo(
    () => config?.matriz_de_compatibilizacao.filter(
      (item) => item.nicho === "TODOS" || item.nicho === nicho
    ) ?? [],
    [config, nicho]
  );
  if (!dados || !config) return null;
  const stats = config.estatisticas;
  const functions = config.funcoes_e_subnichos.find((item) => item.nicho === nicho);
  const rule = config.regras_de_ramo.find((item) => item.resposta_ativadora === nicho);
  return <section className="hx-anamnese-lab">
    <header><div><small>GOVERNANÇA AUTORAL / ANAMNESE</small><h3>{config.codigo}</h3><p>{config.estado.replaceAll("_", " ")}</p></div><span>EXCLUSIVO DO ADMINISTRADOR PROPRIETÁRIO</span></header>
    <div className="hx-anamnese-lab__source">
      <strong>{config.fonte_de_verdade.arquivo}</strong>
      <code>{config.fonte_de_verdade.sha256}</code>
      <span>{config.fonte_de_verdade.abas_analisadas.join(", ")} · {config.fonte_de_verdade.linhas_totais} linhas · {config.fonte_de_verdade.colunas} colunas</span>
    </div>
    <div className="hx-anamnese-lab__stats">
      <article><strong>{String(stats.perguntas_totais_da_biblioteca)}</strong><span>perguntas preservadas</span></article>
      <article><strong>{String(stats.perguntas_operacionais_unicas)}</strong><span>perguntas da planilha</span></article>
      <article><strong>{config.modulos.length}</strong><span>módulos versionados</span></article>
      <article><strong>{config.regras_de_ramo.length}</strong><span>ramos confirmados</span></article>
      <article><strong>{String(stats.respostas_historicas_analisadas)}</strong><span>células históricas analisadas</span></article>
      <article><strong>{config.respostas_historicas.importadas}</strong><span>respostas individuais importadas</span></article>
    </div>
    <div className="hx-anamnese-lab__decisions">{config.decisoes_autorais.map((decision) => <article key={decision.codigo}><small>{decision.codigo} · {decision.estado}</small><strong>{decision.conteudo}</strong><p>{decision.efeito_operacional}</p></article>)}</div>
    <nav className="hx-anamnese-tree__tabs" aria-label="Árvore por nicho">
      <button data-active={nicho === "TODOS"} onClick={() => setNicho("TODOS")}>Gerais</button>
      {config.nichos_confirmados.map((item) => <button key={item} data-active={nicho === item} onClick={() => setNicho(item)}>{item.replaceAll("_", " ")}</button>)}
    </nav>
    <div className="hx-anamnese-tree">
      <article><small>PERGUNTAS GERAIS</small><strong>{config.matriz_de_compatibilizacao.filter((item) => item.nicho === "TODOS").length}</strong><span>aparecem uma única vez</span></article>
      {nicho !== "TODOS" ? <>
        <i aria-hidden="true">→</i>
        <article><small>NICHO</small><strong>{nicho.replaceAll("_", " ")}</strong><span>{rule?.perguntas_exibidas.length ?? 0} perguntas específicas</span></article>
        <i aria-hidden="true">→</i>
        <article><small>FUNÇÃO / SUBNICHO</small><strong>{functions?.pergunta_de_funcao ?? "PENDENTE"}</strong><span>{functions?.funcoes_observadas_historicamente.length ?? 0} valores observados · {functions?.catalogo_completo}</span></article>
        <i aria-hidden="true">→</i>
        <article><small>CONDIÇÃO</small><strong>{rule?.codigo ?? "SEM REGRA"}</strong><span>destino {rule?.secao_de_destino ?? "—"}</span></article>
      </> : null}
    </div>
    {functions?.funcoes_observadas_historicamente.length ? <div className="hx-anamnese-lab__functions"><small>FUNÇÕES OBSERVADAS NA PLANILHA — LISTA PARCIAL, NÃO INVENTADA</small>{functions.funcoes_observadas_historicamente.map((item) => <span key={item}>{item}</span>)}</div> : null}
    <div className="hx-anamnese-lab__modules">{config.modulos.map((modulo) => <article key={modulo.codigo}><small>NÍVEL {modulo.nivel} · {modulo.estado.replaceAll("_", " ")}</small><strong>{modulo.codigo.replaceAll("_", " ")}</strong><span>{modulo.nicho?.replaceAll("_", " ") ?? "transversal"}</span></article>)}</div>
    <div className="hx-anamnese-lab__gaps">{config.lacunas_autorais.map((gap) => <article key={gap.codigo}><small>{gap.situacao.replaceAll("_", " ")}</small><strong>{gap.codigo.replaceAll("_", " ")}</strong><p>{gap.detalhe}</p></article>)}</div>
    <details open><summary>Matriz de compatibilização — {questions.length} pergunta(s) no ramo visível</summary><div className="hx-anamnese-lab__questions">{questions.map((question) => <article key={question.codigo}><small>{question.codigo} · ordem {question.ordem} · {question.situacao_de_homologacao.replaceAll("_", " ")}</small><strong>{question.texto_original}</strong><p>{question.modulo.replaceAll("_", " ")} · {question.tipo_de_resposta.replaceAll("_", " ")} · {question.respostas_historicas_associadas} resposta(s) histórica(s) associada(s)</p><pre>{JSON.stringify({ nicho: question.nicho, geral_ou_especifica: question.aplicacao, obrigatoria: question.obrigatoria, condicao: question.condicao_de_exibicao, alternativas_oficiais: question.alternativas_oficiais, alternativas_observadas: question.alternativas_observadas_historicas, correspondencia: question.correspondencia_com_biblioteca, divergencias: question.divergencias }, null, 2)}</pre></article>)}</div></details>
    <footer>Respostas históricas individuais não são exibidas nem importadas. {config.respostas_historicas.anonimizadas_para_validacao_estrutural} linhas foram usadas apenas para compatibilização estrutural anonimizada.</footer>
  </section>;
}
