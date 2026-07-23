"use client";

import { useEffect, useMemo, useState } from "react";

export type ModuloDaPlataforma =
  | "painel"
  | "organizacoes"
  | "clientes"
  | "sessoes"
  | "treinamentos"
  | "pre-treino-pos"
  | "formulacao"
  | "longitudinal"
  | "indicador-coletivo"
  | "relatorios"
  | "cockpit-vivo"
  | "humanexus-lab"
  | "conectores"
  | "telemetria"
  | "movel"
  | "replay"
  | "configuracoes";

type Definicao = {
  titulo: string;
  codigo: string;
  descricao: string;
  fontes: string[];
  observacao?: string;
};

const DEFINICOES: Record<ModuloDaPlataforma, Definicao> = {
  painel: { titulo: "Painel principal", codigo: "HX / PAINEL", descricao: "Visão operacional do contexto autenticado.", fontes: ["painel", "versao_cientifica"] },
  organizacoes: { titulo: "Organizações", codigo: "HX / ORGANIZAÇÕES", descricao: "Escopo institucional autorizado no núcleo oficial.", fontes: ["organizacoes"] },
  clientes: { titulo: "Clientes", codigo: "HX / CLIENTES", descricao: "Participantes vinculados à organização do perfil autenticado.", fontes: ["clientes"], observacao: "A listagem depende de uma organização no contexto da sessão." },
  sessoes: { titulo: "Sessões", codigo: "HX / SESSÕES", descricao: "Operação por participante, preservando fase, evidências e decisões profissionais.", fontes: ["painel"], observacao: "Selecione um cliente no fluxo profissional para consultar ou iniciar uma sessão." },
  treinamentos: { titulo: "Treinamentos", codigo: "HX / TREINAMENTOS", descricao: "Catálogos CTR e THX oficiais, sem substituir decisão profissional.", fontes: ["ctr", "thx"] },
  "pre-treino-pos": { titulo: "PRÉ / TREINO / PÓS", codigo: "HX / CICLO", descricao: "Ciclo governado por snapshots independentes e dados efetivamente capturados.", fontes: ["thx", "painel"], observacao: "A comparação exige uma execução THX e fases compatíveis; nenhum estado é preenchido artificialmente." },
  formulacao: { titulo: "Formulação Regulatória", codigo: "HX / FORMULAÇÃO", descricao: "Formulações profissionais rastreáveis no contexto longitudinal do participante.", fontes: ["postulados", "versao_cientifica"], observacao: "Selecione um participante no fluxo profissional para criar ou consultar formulações." },
  longitudinal: { titulo: "Longitudinal", codigo: "HX / LONGITUDINAL", descricao: "Consolidação temporal preservando ausência de dados e limites inferenciais.", fontes: ["postulados", "versao_cientifica"], observacao: "A leitura longitudinal requer identidade e histórico autorizados." },
  "indicador-coletivo": { titulo: "Indicador Coletivo", codigo: "HX / COLETIVO", descricao: "Indicadores de equipe sob governança, sem extrapolação individual.", fontes: ["postulados", "painel"], observacao: "Disponível quando houver equipe e permissão para a finalidade coletiva." },
  relatorios: { titulo: "Relatórios", codigo: "HX / RELATÓRIOS", descricao: "Geração rastreável e exportação sob autorização profissional.", fontes: ["versao_cientifica", "painel"], observacao: "A emissão requer participante ou coletivo previamente selecionado." },
  "cockpit-vivo": { titulo: "Cockpit Vivo", codigo: "HX / COCKPIT", descricao: "Centro de comando que separa HUD, telemetria, qualidade, alertas e decisão profissional.", fontes: ["painel", "telemetria", "conectores"], observacao: "Sem sessão ativa, o painel informa a ausência de contexto em vez de simular indicadores." },
  "humanexus-lab": { titulo: "HUMANEXUS LAB", codigo: "HX / LAB", descricao: "Validação científica com dados do núcleo real e acesso exclusivo do Administrador Proprietário.", fontes: [] },
  conectores: { titulo: "Conectores", codigo: "HX / CONECTORES", descricao: "Catálogo e estado dos conectores permitidos no contexto autenticado.", fontes: ["conectores"] },
  telemetria: { titulo: "Telemetria Bridge", codigo: "HX / TELEMETRIA", descricao: "Fontes de telemetria e qualidade de integração, sem ocultar indisponibilidades.", fontes: ["telemetria", "conectores"] },
  movel: { titulo: "Acesso Móvel", codigo: "HX / MÓVEL", descricao: "O mesmo perfil, permissões e sincronização em iPhone, Android e tablet.", fontes: ["movel"], observacao: "A sincronização só registra dados recebidos pelo núcleo; não há armazenamento paralelo de produção." },
  replay: { titulo: "Replay Inteligente", codigo: "HX / REPLAY", descricao: "Linha temporal auditável da sessão, condicionada ao contexto autorizado.", fontes: ["painel"], observacao: "Selecione uma sessão para criar, comparar ou exportar o replay correspondente." },
  configuracoes: { titulo: "Configurações", codigo: "HX / CONFIGURAÇÕES", descricao: "Versão científica ativa, postulados e permissões efetivas da sessão.", fontes: ["versao_cientifica", "postulados"] }
};

type Recurso = { nome: string; disponivel: boolean; dados: unknown };
type Resposta = { recursos: Recurso[]; usuario: { perfil: string; permissoes: string[] } };

function descricaoDosDados(dados: unknown) {
  if (Array.isArray(dados)) return dados.length === 0 ? "Nenhum registro no contexto atual." : `${dados.length} registro(s) no contexto atual.`;
  if (dados && typeof dados === "object") {
    const entradas = Object.entries(dados as Record<string, unknown>);
    const quantitativos = entradas.filter(([, valor]) => typeof valor === "number").slice(0, 3);
    if (quantitativos.length) return quantitativos.map(([chave, valor]) => `${chave.replaceAll("_", " ")}: ${valor}`).join(" · ");
    return "Dados reais disponíveis no núcleo para este contexto.";
  }
  return "Nenhum registro no contexto atual.";
}

export function ModuloIntegrado({ modulo }: { modulo: ModuloDaPlataforma }) {
  const definicao = DEFINICOES[modulo];
  const [resposta, setResposta] = useState<Resposta | null>(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const destino = modulo === "humanexus-lab" ? "/api/plataforma/lab" : "/api/plataforma/resumo";
    fetch(destino, { cache: "no-store" })
      .then(async (resultado) => {
        const dados = await resultado.json();
        if (!resultado.ok) throw new Error(dados?.erro?.mensagem ?? "Consulta indisponível.");
        if (modulo === "humanexus-lab") {
          setResposta({ recursos: [{ nome: "humanexus-lab", disponivel: true, dados: dados.dados }], usuario: { perfil: "ADMINISTRADOR_PROPRIETARIO", permissoes: [] } });
          return;
        }
        setResposta(dados as Resposta);
      })
      .catch((causa) => setErro(causa instanceof Error ? causa.message : "Consulta indisponível."));
  }, [modulo]);

  const recursos = useMemo(() => {
    const porNome = new Map(resposta?.recursos.map((recurso) => [recurso.nome, recurso]));
    return definicao.fontes.map((fonte) => porNome.get(fonte) ?? { nome: fonte, disponivel: false, dados: null });
  }, [definicao.fontes, resposta]);
  const dadosDoLab = resposta?.recursos[0]?.dados;

  return (
    <section className="platform-module">
      <div className="platform-module__media" aria-hidden="true" />
      <div className="platform-module__grid" aria-hidden="true" />
      <div className="platform-module__content">
        <p className="platform-eyebrow"><span />{definicao.codigo}</p>
        <h1>{definicao.titulo}</h1>
        <p className="platform-lead">{definicao.descricao}</p>
        {definicao.observacao ? <p className="platform-notice">{definicao.observacao}</p> : null}

        {erro ? <p className="platform-error" role="status">{erro}</p> : null}
        {!resposta && !erro ? <p className="platform-loading">Consultando o núcleo oficial…</p> : null}

        {modulo === "humanexus-lab" && resposta ? (
          <article className="platform-data-card platform-data-card--lab">
            <p className="platform-data-card__label">VALIDAÇÃO CIENTÍFICA</p>
            <p className="platform-data-card__value">Dados do HUMANEXUS LAB autorizados pelo núcleo.</p>
            <details>
              <summary>Inspecionar estrutura homologável</summary>
              <pre>{JSON.stringify(dadosDoLab, null, 2)}</pre>
            </details>
          </article>
        ) : null}

        {modulo !== "humanexus-lab" && resposta ? (
          <div className="platform-data-grid">
            {recursos.map((recurso) => (
              <article key={recurso.nome} className="platform-data-card">
                <p className="platform-data-card__label">{recurso.nome.replaceAll("_", " ")}</p>
                <p className="platform-data-card__value">
                  {recurso.disponivel ? descricaoDosDados(recurso.dados) : "Indisponível para este perfil ou contexto."}
                </p>
                <span className={recurso.disponivel ? "platform-status platform-status--ok" : "platform-status"}>
                  {recurso.disponivel ? "NÚCLEO CONECTADO" : "CONTEXTO NECESSÁRIO"}
                </span>
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
