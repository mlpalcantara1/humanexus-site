import "server-only";

import { requisitarNucleoAutenticado } from "@/lib/humanexus-core";

export type SecaoDoRelatorio = {
  codigo: string;
  titulo: string;
  itens: string[];
};

export type VersaoDoRelatorio = {
  codigo: string;
  numero: number;
  estado: string;
  criado_em: string | null;
  liberado_em: string | null;
};

export type RelatorioLiberado = {
  identificador: string;
  codigo_publico: string;
  numero_da_versao: number;
  tipo: string;
  destinatario: string;
  titulo: string;
  objetivo: string;
  secoes: SecaoDoRelatorio[];
  profissional: string;
  estado_documental: string;
  criado_em: string | null;
  concluido_em: string | null;
  liberado_em: string | null;
  apresentacao_externa: true;
  linhagem: {
    origem: {
      organizacao: string | null;
      participante: string | null;
      sessoes: Array<{ nome: string | null; estado: string | null }>;
      ciclo_de_treinamento: string | null;
      evidencias: Record<string, number>;
    };
    metodologia: { referencia: string; observacao: string };
    responsabilidade_profissional: {
      criador: string | null;
      validador: string | null;
      criado_em: string | null;
      validado_em: string | null;
      concluido_em: string | null;
    };
    versoes: VersaoDoRelatorio[];
    liberacoes: Array<{
      numero_da_versao: number;
      destinatario: string;
      estado: string;
      liberado_em: string;
      revogado_em: string | null;
    }>;
    eventos: Array<{
      acao: string;
      estado_anterior: string | null;
      estado_atual: string;
      criado_em: string;
    }>;
  };
};

export function listarRelatoriosLiberados(token: string) {
  return requisitarNucleoAutenticado<RelatorioLiberado[]>(
    "/api/v1/meus-relatorios",
    token
  );
}

export function obterRelatorioLiberado(token: string, identificador: string) {
  return requisitarNucleoAutenticado<RelatorioLiberado>(
    `/api/v1/meus-relatorios/${encodeURIComponent(identificador)}`,
    token
  );
}
