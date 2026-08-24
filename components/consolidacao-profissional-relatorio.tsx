"use client";

import { useMemo, useState } from "react";

import {
  assinaturaDaConsolidacao,
  CAMPOS_PROFISSIONAIS_DO_RELATORIO,
  consolidacaoProfissionalDosCampos,
  type CampoProfissional,
  projetarEstadoFuncionalDoRelatorio,
  type RegistroDeRelatorio
} from "@/lib/humanexus-report-authority";

type Props = {
  estado: RegistroDeRelatorio;
  relatorio?: RegistroDeRelatorio;
  ocupado: boolean;
  consolidar: (consolidacao: RegistroDeRelatorio) => Promise<boolean>;
};

function objeto(valor: unknown): RegistroDeRelatorio {
  return valor && typeof valor === "object" && !Array.isArray(valor)
    ? valor as RegistroDeRelatorio
    : {};
}

function lista(valor: unknown): unknown[] {
  return Array.isArray(valor) ? valor : [];
}

function textoEditavel(valor: unknown) {
  if (typeof valor === "string") return valor;
  if (Array.isArray(valor)) return valor.map(String).join("\n");
  if (valor && typeof valor === "object") {
    return Object.entries(valor as RegistroDeRelatorio)
      .map(([chave, item]) => `${chave}: ${String(item)}`)
      .join("\n");
  }
  return "";
}

export function ConsolidacaoProfissionalDoRelatorio({
  estado,
  relatorio,
  ocupado,
  consolidar
}: Props) {
  const ciclo = projetarEstadoFuncionalDoRelatorio(relatorio);
  const [campos, setCampos] = useState<Record<CampoProfissional, string>>(() =>
    Object.fromEntries(
      CAMPOS_PROFISSIONAIS_DO_RELATORIO.map(([campo]) => [
        campo,
        textoEditavel(ciclo.consolidacao[campo])
      ])
    ) as Record<CampoProfissional, string>
  );
  const [mensagem, setMensagem] = useState("");
  const consolidacaoAtual = consolidacaoProfissionalDosCampos(campos);
  const conteudoJaPreservado = ciclo.completa
    && assinaturaDaConsolidacao(consolidacaoAtual)
      === assinaturaDaConsolidacao(ciclo.consolidacao);
  const cockpit = objeto(estado.cockpit_operacional);
  const leitura = objeto(cockpit.leitura_cientifica);
  const tirh = objeto(leitura.tirh_operacional_v1);
  const sessao = objeto(estado.sessao);
  const fases = lista(estado.fases);
  const evidenciasProfissionais = objeto(estado.evidencias_profissionais);
  const sugestoes = useMemo(() => [
    {
      campo: "Contexto e objetivo",
      sugestao: `Revisar o contexto da sessão “${String(sessao.nome_operacional ?? "sessão registrada")}” e sua finalidade preservada.`,
      evidencia: "Metadados da sessão e do vínculo profissional."
    },
    {
      campo: "Evidências utilizadas",
      sugestao: `Há ${fases.length} fase(s) registrada(s) e ${lista(evidenciasProfissionais.qualificadas).length} evidência(s) profissional(is) qualificada(s) disponíveis para seleção.`,
      evidencia: "Fases e HX-OBS preservados; a seleção final é profissional."
    },
    {
      campo: "Limitações",
      sugestao: `Explicitar os estados não calculáveis e a cobertura da projeção ${String(tirh.versao_cientifica ?? "TIRH V1")} sem converter ausência em zero.`,
      evidencia: "Projeção canônica TIRH V1 e estados epistemológicos."
    }
  ], [evidenciasProfissionais.qualificadas, fases.length, sessao.nome_operacional, tirh.versao_cientifica]);

  const enviar = async () => {
    const ausentes = CAMPOS_PROFISSIONAIS_DO_RELATORIO
      .filter(([campo]) => !campos[campo].trim())
      .map(([, rotulo]) => rotulo);
    if (ausentes.length) {
      setMensagem(`Complete antes de criar a nova versão: ${ausentes.join(", ")}.`);
      return;
    }
    if (conteudoJaPreservado) {
      setMensagem(
        "Esta consolidação já está preservada. Edite um campo somente se precisar criar uma nova versão."
      );
      return;
    }
    setMensagem("");
    const sucesso = await consolidar(consolidacaoAtual);
    setMensagem(sucesso
      ? "Versão consolidada preservada com sucesso. Para avançar, use exclusivamente o botão “Enviar para validação”."
      : "A versão não foi criada. Consulte a mensagem de erro apresentada pela plataforma e tente novamente com segurança.");
  };

  return (
    <section
      className="hx-professional-consolidation"
      aria-label="Consolidação profissional e devolutiva"
      data-report-functional-state={ciclo.estado}
    >
      <header>
        <div>
          <small>CONSOLIDAÇÃO PROFISSIONAL · AUTORIA HUMANA</small>
          <h3>Da evidência preservada ao relatório final</h3>
          <p>A decisão sobre uma afirmação calculada não substitui interpretação, conclusão, recomendação nem devolutiva. Este formulário cria uma nova versão somente por acréscimo; não altera a sessão nem o documento anterior.</p>
        </div>
        <strong>{ciclo.estado.replaceAll("_", " ")}</strong>
      </header>

      {!ciclo.completa ? (
        <div className="hx-professional-consolidation__missing" role="status">
          <strong>{ciclo.rotulosAusentes.length} campo(s) profissional(is) ainda ausente(s)</strong>
          <span>{ciclo.rotulosAusentes.join(" · ")}</span>
        </div>
      ) : null}

      <section className="hx-professional-suggestions" aria-label="Sugestões editáveis não persistidas">
        <header>
          <small>SUGESTÕES NÃO PERSISTIDAS</small>
          <strong>Apoios de revisão; nunca conclusões automáticas</strong>
        </header>
        {sugestoes.map((item) => (
          <article key={item.campo}>
            <small>{item.campo}</small>
            <p>{item.sugestao}</p>
            <span>Evidência de apoio: {item.evidencia}</span>
          </article>
        ))}
      </section>

      <div className="hx-professional-consolidation__fields">
        {CAMPOS_PROFISSIONAIS_DO_RELATORIO.map(([campo, rotulo]) => (
          <label key={campo}>
            <span>{rotulo}</span>
            <textarea
              value={campos[campo]}
              onChange={(evento) => setCampos((atual) => ({
                ...atual,
                [campo]: evento.target.value
              }))}
              rows={campo === "observacoes_por_fase" ? 5 : 3}
              placeholder={campo === "observacoes_por_fase"
                ? "PRÉ: …\nTREINO: …\nPÓS: …"
                : "Registro autoral do profissional…"}
            />
          </label>
        ))}
      </div>
      <footer>
        <p>Nada é salvo automaticamente. A ação abaixo cria uma versão documental nova, com autoria, data e rastreabilidade.</p>
        <button
          type="button"
          disabled={ocupado || conteudoJaPreservado}
          onClick={() => void enviar()}
        >
          {ocupado
            ? "CRIANDO NOVA VERSÃO…"
            : conteudoJaPreservado
              ? "VERSÃO CONSOLIDADA JÁ PRESERVADA"
              : "CRIAR VERSÃO CONSOLIDADA"}
        </button>
        {mensagem ? <p role="status" aria-live="polite">{mensagem}</p> : null}
      </footer>
    </section>
  );
}
