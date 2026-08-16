import "server-only";

import { requisitarNucleoAutenticado } from "@/lib/humanexus-core";

export type RelatorioEmGovernanca = {
  identificador: string;
  codigo_publico: string;
  numero_da_versao: number;
  tipo: string;
  destinatario: string;
  titulo: string;
  objetivo: string;
  estado_documental: string;
  criado_em: string | null;
  submetido_em: string | null;
  validado_em: string | null;
  concluido_em: string | null;
  liberado_em: string | null;
  linhagem: {
    participante: string | null;
    origem: {
      organizacao: string | null;
      participante: string | null;
      sessoes: Array<{ nome?: string | null; estado?: string | null }>;
    };
    responsabilidade_profissional: {
      criador: string | null;
      validador: string | null;
    };
    liberacoes: Array<{
      identificador?: string | null;
      destinatario: string;
      estado: string;
      liberado_em: string | null;
      revogado_em: string | null;
    }>;
  };
};

export type OrganizacaoParaGovernancaDeRelatorios = {
  identificador: string;
  nome: string;
  ativa?: boolean | number;
};

export function listarOrganizacoesParaGovernancaDeRelatorios(token: string) {
  return requisitarNucleoAutenticado<OrganizacaoParaGovernancaDeRelatorios[]>(
    "/api/v1/organizacoes",
    token,
  );
}

export function listarRelatoriosEmGovernanca(
  token: string,
  identificadorDaOrganizacao?: string,
) {
  const consulta = identificadorDaOrganizacao
    ? `?organizacao=${encodeURIComponent(identificadorDaOrganizacao)}`
    : "";
  return requisitarNucleoAutenticado<RelatorioEmGovernanca[]>(
    `/api/v1/relatorios${consulta}`,
    token,
  );
}
