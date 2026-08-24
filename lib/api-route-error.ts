import { NextResponse } from "next/server";
import { ErroDoNucleo } from "@/lib/humanexus-core";

type OpcoesDeErro = {
  modulo: string;
  rota: string;
  mensagemDeAcessoNegado?: string;
  preservarMensagemSeguraDoNucleo?: boolean;
};

export class ErroDaRota extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly codigo: string,
    readonly correlacao?: string
  ) {
    super(message);
  }
}

function descricaoPublica(status: number, mensagemDeAcessoNegado?: string) {
  if (status === 401) return "Sua sessão expirou. Entre novamente para continuar no mesmo contexto.";
  if (status === 403) return mensagemDeAcessoNegado ?? "Você não possui permissão para este recurso.";
  if (status === 404) return "O recurso solicitado não foi encontrado neste contexto.";
  if (status === 408 || status === 504) return "O núcleo demorou mais que o esperado. Tente novamente.";
  if (status === 502 || status === 503) {
    return "Núcleo temporariamente indisponível. Estamos tentando restabelecer a conexão.";
  }
  return "Não foi possível concluir esta consulta. Tente novamente.";
}

export function responderErroDaApi(erro: unknown, opcoes: OpcoesDeErro) {
  const erroConhecido = erro instanceof ErroDoNucleo || erro instanceof ErroDaRota;
  const statusOriginal = erroConhecido ? erro.status : 500;
  const status = statusOriginal >= 400 && statusOriginal <= 599 ? statusOriginal : 500;
  const correlacao = erroConhecido && erro.correlacao
    ? erro.correlacao
    : crypto.randomUUID();
  const reconectavel = [408, 429, 502, 503, 504].includes(status);

  console.error("[HUMANEXUS_PORTAL]", JSON.stringify({
    correlacao,
    instante: new Date().toISOString(),
    modulo: opcoes.modulo,
    rota: opcoes.rota,
    status,
    tipo: erro instanceof ErroDoNucleo
      ? "ERRO_DO_NUCLEO"
      : erro instanceof ErroDaRota
        ? "ERRO_DA_ROTA"
        : "ERRO_INESPERADO"
  }));

  return NextResponse.json({
    erro: {
      mensagem: erro instanceof ErroDaRota
        ? erro.message
        : erro instanceof ErroDoNucleo
          && opcoes.preservarMensagemSeguraDoNucleo
          && [400, 409, 422].includes(status)
          ? erro.message
        : descricaoPublica(status, opcoes.mensagemDeAcessoNegado),
      codigo: erroConhecido
        ? erro.codigo
        : `HXP-${status}`,
      correlacao,
      reconectavel
    }
  }, {
    status,
    headers: { "x-humanexus-correlation-id": correlacao }
  });
}
