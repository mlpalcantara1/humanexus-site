import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { requisitarNucleoAutenticado } from "@/lib/humanexus-core";
import { COOKIE_SESSAO } from "@/lib/portal-session";
import { exigirMesmaOrigem } from "@/lib/request-security";

type Registro = Record<string, unknown>;

function objeto(valor: unknown): Record<string, unknown> {
  if (valor && typeof valor === "object" && !Array.isArray(valor)) {
    return valor as Record<string, unknown>;
  }
  if (typeof valor === "string") {
    try {
      const convertido = JSON.parse(valor);
      return convertido && typeof convertido === "object" && !Array.isArray(convertido)
        ? convertido as Record<string, unknown>
        : {};
    } catch {
      return {};
    }
  }
  return {};
}

export async function POST(request: Request) {
  try {
    exigirMesmaOrigem(request);
    const token = (await cookies()).get(COOKIE_SESSAO)?.value;
    if (!token) throw new Error("Sessão ausente.");
    const corpo = await request.json();
    const participante = String(corpo.participante_id ?? "");
    const evidencia = String(corpo.evidencia_id ?? "");
    const anamnese = String(corpo.anamnese_id ?? "");
    const pergunta = String(corpo.pergunta_id ?? "");
    const organizacao = String(corpo.identificador_da_organizacao ?? "");
    if (!participante || !evidencia || !anamnese || !pergunta) {
      throw new Error("Referência de origem incompleta.");
    }

    const existentes = await requisitarNucleoAutenticado<Registro[]>(
      `/api/v1/participantes/${encodeURIComponent(participante)}/formulacoes`,
      token,
      {
        headers: organizacao
          ? { "x-humanexus-organization-id": organizacao }
          : undefined
      }
    );
    const jaCitada = existentes.find((item) => {
      const referencias = objeto(item.referencias_de_origem_json);
      return Array.isArray(referencias.evidencias)
        && referencias.evidencias.includes(evidencia);
    });
    if (jaCitada) return NextResponse.json(jaCitada);

    return NextResponse.json(
      await requisitarNucleoAutenticado(
        `/api/v1/participantes/${encodeURIComponent(participante)}/formulacoes`,
        token,
        {
          method: "POST",
          headers: organizacao
            ? { "x-humanexus-organization-id": organizacao }
            : undefined,
          body: JSON.stringify({
            conteudo: {
              dados: {
                demanda_operacional: "Evidência narrativa da Anamnese aguardando formulação profissional.",
                contexto: {
                  origem: "ANAMNESE_REGULATORIA",
                  identificador_da_anamnese: anamnese,
                  identificador_da_pergunta: pergunta
                },
                recursos_observados: [],
                pontos_a_fortalecer: [],
                limites: [
                  "EVIDENCIA_NARRATIVA_ISOLADA_NAO_PRODUZ_INFERENCIA",
                  "EXIGE_INTERPRETACAO_E_DECISAO_PROFISSIONAL"
                ],
                proximo_passo: "FORMULACAO_PROFISSIONAL_ESTRUTURADA"
              },
              interpretacoes: [],
              hipoteses: [],
              decisoes: [],
              referencias_de_origem: {
                evidencias: [evidencia],
                indicadores: [],
                vetores: [],
                zonas: [],
                trajetorias: [],
                arr: [],
                rro: [],
                nra: [],
                ctr: [],
                thx: [],
                pre_treino_pos: []
              },
              limites_de_interpretacao: [
                "CITACAO_DE_ORIGEM_SEM_INTERPRETACAO_AUTOMATICA"
              ]
            }
          })
        }
      ),
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        erro: {
          mensagem: error instanceof Error
            ? error.message
            : "Não foi possível citar a evidência na Formulação."
        }
      },
      { status: 422 }
    );
  }
}
