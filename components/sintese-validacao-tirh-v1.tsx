"use client";

import { useState } from "react";

import {
  claimElegivelParaValidacaoTirhV1,
  decisoesProfissionaisPreservadasTirhV1
} from "@/lib/validacao-profissional-tirh-v1";

export { claimElegivelParaValidacaoTirhV1 } from "@/lib/validacao-profissional-tirh-v1";

type Registro = Record<string, unknown>;

type Props = {
  estado: Registro;
  validarClaimTirhV1: (payload: Registro) => Promise<void> | void;
};

const ROTULOS_DAS_ZONAS: Record<string, string> = {
  ZO: "Zona Ótima",
  ZA: "Zona Adaptativa",
  ZI: "Zona de Instabilidade",
  ZCF: "Zona de Comprometimento Funcional"
};

function objeto(valor: unknown): Registro {
  return valor && typeof valor === "object" && !Array.isArray(valor)
    ? valor as Registro
    : {};
}

function lista(valor: unknown): Registro[] {
  return Array.isArray(valor)
    ? valor.filter((item) => item && typeof item === "object") as Registro[]
    : [];
}

function texto(valor: unknown, padrao = "—") {
  return valor == null || valor === ""
    ? padrao
    : String(valor).replaceAll("_", " ");
}

function numero(valor: unknown, casas = 0) {
  if (valor == null || valor === "") return "—";
  const convertido = Number(valor);
  return Number.isFinite(convertido) ? convertido.toFixed(casas) : "—";
}

function rotuloDaZona(valor: unknown) {
  const codigo = String(valor ?? "").toUpperCase();
  return ROTULOS_DAS_ZONAS[codigo] ?? texto(valor, "NÃO CLASSIFICÁVEL");
}

function fontesDoIndicador(valor: unknown) {
  return Array.isArray(valor) && valor.length
    ? valor.map((item) => texto(item)).join(" · ")
    : "Nenhuma";
}

export function resolverAutoridadeSinteseTirhV1(estado: Registro) {
  const cockpit = objeto(estado.cockpit_operacional);
  const leituraCientifica = objeto(cockpit.leitura_cientifica);
  const tirhV1AoVivo = objeto(leituraCientifica.tirh_operacional_v1);
  const tirhV1Persistida = objeto(estado.tirh_v1);
  const sinteseTirhV1Persistida = objeto(tirhV1Persistida.sintese);
  const tirhV1 = Object.keys(tirhV1AoVivo).length
    ? tirhV1AoVivo
    : sinteseTirhV1Persistida;
  return {
    tirhV1,
    tirhV1AoVivo,
    tirhV1Persistida,
    sinteseTirhV1Persistida
  };
}

export function SinteseValidacaoTirhV1({
  estado,
  validarClaimTirhV1
}: Props) {
  const [claimSelecionado, setClaimSelecionado] = useState("");
  const [decisaoDoClaim, setDecisaoDoClaim] = useState("VALIDAR");
  const [justificativaDoClaim, setJustificativaDoClaim] = useState("");
  const [ajusteDoClaim, setAjusteDoClaim] = useState("");
  const [validacaoEmEnvio, setValidacaoEmEnvio] = useState(false);
  const [estadoDaValidacaoTirh, setEstadoDaValidacaoTirh] = useState("");
  const {
    tirhV1,
    tirhV1Persistida
  } = resolverAutoridadeSinteseTirhV1(estado);
  const macrocamposTirhV1 = objeto(tirhV1.macrocampos);
  const vetoresTirhV1 = objeto(tirhV1.vetores);
  const resultanteTirhV1 = objeto(tirhV1.resultante);
  const iirhTirhV1 = objeto(tirhV1.iirh);
  const zonaTirhV1 = objeto(tirhV1.zona);
  const claimsTirhV1 = lista(
    Array.isArray(tirhV1Persistida.claims)
      ? tirhV1Persistida.claims
      : tirhV1.claims
  );
  const validacaoTirhV1 = objeto(tirhV1Persistida.validacao_profissional);
  const claimsPendentesTirhV1 = claimsTirhV1.filter(
    claimElegivelParaValidacaoTirhV1
  );
  const decisoesProfissionaisPreservadas =
    decisoesProfissionaisPreservadasTirhV1(claimsTirhV1);

  const enviarValidacaoTirhV1 = async () => {
    if (!claimSelecionado || justificativaDoClaim.trim().length < 5 || validacaoEmEnvio) return;
    const claim = claimsTirhV1.find((item) => String(item.claim_id ?? "") === claimSelecionado);
    if (!claim) return;
    let valorFinal: unknown;
    if (decisaoDoClaim === "AJUSTAR") {
      try {
        valorFinal = JSON.parse(ajusteDoClaim);
      } catch {
        setEstadoDaValidacaoTirh("O ajuste deve ser informado em estrutura JSON válida.");
        return;
      }
    }
    setValidacaoEmEnvio(true);
    setEstadoDaValidacaoTirh("");
    try {
      await validarClaimTirhV1({
        claim_id: claimSelecionado,
        decisao: decisaoDoClaim,
        justificativa: justificativaDoClaim.trim(),
        chave_de_idempotencia: crypto.randomUUID(),
        versao_esperada: Number(
          objeto(claim.validacao_profissional).versao_da_validacao ?? 0
        ),
        ...(decisaoDoClaim === "AJUSTAR" ? { valor_final: valorFinal } : {})
      });
      setEstadoDaValidacaoTirh("Decisão profissional preservada com versão e auditoria.");
      setJustificativaDoClaim("");
      setAjusteDoClaim("");
    } finally {
      setValidacaoEmEnvio(false);
    }
  };

  if (!Object.keys(tirhV1).length) return null;

  return (
    <section
      className="hx-tirh-v1-summary"
      aria-label="Síntese TIRH operacional autoral V1"
      data-tirh-post-session-flow="synthesis-validation"
    >
      <header>
        <div>
          <small>TIRH OPERACIONAL AUTORAL V1</small>
          <strong>Estado regulatório sustentado pelas evidências admissíveis</strong>
        </div>
        <span>{texto(
          tirhV1.versao_cientifica ?? tirhV1Persistida.versao_cientifica,
          "TIRH-OPERACIONAL-AUTORAL-1.0.0"
        )}</span>
      </header>
      <div className="hx-tirh-v1-summary__primary">
        <article>
          <small>Resultante Regulatória</small>
          <strong>{texto(resultanteTirhV1.estado, "NÃO CALCULÁVEL")}</strong>
          <span>{texto(
            resultanteTirhV1.motivo,
            "A Resultante é um estado vetorial estruturado; não é reduzida a um escalar."
          )}</span>
        </article>
        <article>
          <small>IIRH operacional</small>
          <strong>{typeof iirhTirhV1.valor === "number"
            ? `${numero(iirhTirhV1.valor, 1)} / 100`
            : "NÃO CALCULÁVEL"}</strong>
          <span>{texto(
            iirhTirhV1.estado,
            "Aguardando adequação funcional explícita dos macrocampos."
          )}</span>
        </article>
        <article>
          <small>Zona Operacional</small>
          <strong>{rotuloDaZona(zonaTirhV1.codigo)}</strong>
          <span>{texto(
            zonaTirhV1.estado,
            "NÃO CLASSIFICÁVEL sem síntese semântica sustentada."
          )}</span>
        </article>
        <article>
          <small>Claims profissionais</small>
          <strong>{claimsPendentesTirhV1.length} ELEGÍVEL(IS)</strong>
          <span>Fatos objetivos e aritmética não são submetidos a revalidação profissional.</span>
        </article>
      </div>
      <div className="hx-tirh-v1-summary__macrofields">
        {Object.entries(macrocamposTirhV1).map(([codigo, campo]) => {
          const registroDoCampo = objeto(campo);
          return (
            <article key={codigo}>
              <small>{texto(codigo)}</small>
              <strong>{typeof registroDoCampo.valor === "number"
                ? `${numero(registroDoCampo.valor, 1)} / 100`
                : texto(registroDoCampo.estado, "NÃO CALCULÁVEL")}</strong>
              <span>{fontesDoIndicador(registroDoCampo.fontes)}</span>
            </article>
          );
        })}
      </div>
      <details
        className="hx-tirh-v1-validation"
        open={claimsPendentesTirhV1.length > 0 || decisoesProfissionaisPreservadas.length > 0}
      >
        <summary>Validação Profissional · quadro único pós-sessão</summary>
        <p>Este quadro valida interpretações ou ajustes autorais sem reabrir a sessão, a máquina de estados, o lease da estação ou qualquer sensor.</p>
        {decisoesProfissionaisPreservadas.length ? (
          <section aria-label="Decisão profissional preservada">
            <h3>Decisão profissional preservada</h3>
            <div
              className="hx-tirh-v1-claims"
              data-preserved-professional-decisions-count={decisoesProfissionaisPreservadas.length}
            >
              {decisoesProfissionaisPreservadas.map((validacao, indice) => (
                <article key={texto(validacao.identificador, `decisao-${indice + 1}`)}>
                  <small>DECISÃO APPEND-ONLY · VERSÃO {numero(validacao.versao_da_validacao)}</small>
                  <strong>{texto(validacao.decisao)}</strong>
                  <span>Estado efetivo: {texto(validacao.estado)}</span>
                  <span>Registrada em: {texto(validacao.criado_em, "Data não exposta")}</span>
                  <em>Segunda adjudicação indisponível para o estado efetivo atual.</em>
                </article>
              ))}
            </div>
          </section>
        ) : null}
        {claimsPendentesTirhV1.length ? (
          <div
            className="hx-tirh-v1-claims"
            data-eligible-claims-count={claimsPendentesTirhV1.length}
          >
            {claimsPendentesTirhV1.map((claim) => (
              <article key={texto(claim.claim_id)}>
                <small>{texto(claim.tipo)} · {texto(claim.estado_epistemico)}</small>
                <strong>{texto(claim.claim_id)}</strong>
                <span>{texto(claim.explicacao_humana, texto(claim.valor_bruto))}</span>
                <em>{texto(claim.estado_da_validacao_profissional, "PENDENTE")}</em>
              </article>
            ))}
          </div>
        ) : <p>Nenhuma nova adjudicação está disponível neste recorte.</p>}
        {claimsPendentesTirhV1.length ? (
          <div className="hx-tirh-v1-validation-form">
            <label>
              Item para decisão
              <select value={claimSelecionado} onChange={(evento) => setClaimSelecionado(evento.target.value)}>
                <option value="">Selecione um claim pendente</option>
                {claimsPendentesTirhV1.map((claim) => (
                  <option value={texto(claim.claim_id, "")} key={texto(claim.claim_id)}>
                    {texto(claim.claim_id)} · {texto(claim.tipo)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Decisão profissional
              <select value={decisaoDoClaim} onChange={(evento) => setDecisaoDoClaim(evento.target.value)}>
                <option value="VALIDAR">Validar</option>
                <option value="AJUSTAR">Ajustar</option>
                <option value="MANTER_PENDENTE">Manter pendente</option>
              </select>
            </label>
            {decisaoDoClaim === "AJUSTAR" ? (
              <label className="is-wide">
                Valor final estruturado (JSON)
                <textarea value={ajusteDoClaim} onChange={(evento) => setAjusteDoClaim(evento.target.value)} rows={4} />
              </label>
            ) : null}
            <label className="is-wide">
              Fundamentação profissional
              <textarea value={justificativaDoClaim} onChange={(evento) => setJustificativaDoClaim(evento.target.value)} rows={4} />
            </label>
            <button
              type="button"
              disabled={validacaoEmEnvio || !claimSelecionado || justificativaDoClaim.trim().length < 5}
              onClick={() => void enviarValidacaoTirhV1()}
            >
              {validacaoEmEnvio ? "PRESERVANDO…" : "PRESERVAR DECISÃO PROFISSIONAL"}
            </button>
            {estadoDaValidacaoTirh ? <p role="status">{estadoDaValidacaoTirh}</p> : null}
          </div>
        ) : null}
        <details>
          <summary>Proveniência e contrato de claims</summary>
          <pre>{JSON.stringify({
            snapshot: tirhV1Persistida.snapshot,
            validacao: validacaoTirhV1,
            contrato: tirhV1Persistida.versao_cientifica,
            vetores: vetoresTirhV1
          }, null, 2)}</pre>
        </details>
      </details>
    </section>
  );
}
