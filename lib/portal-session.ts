import "server-only";

import { cookies } from "next/headers";
import {
  ErroDoNucleo,
  obterUsuarioDoNucleo,
  PerfilHumanexus,
  UsuarioHumanexus
} from "@/lib/humanexus-core";

export const COOKIE_SESSAO = "humanexus_sessao";
export const COOKIE_CSRF = "humanexus_csrf";

export const DESTINO_POR_PERFIL: Record<PerfilHumanexus, string> = {
  ADMINISTRADOR_PROPRIETARIO: "/admin",
  ADMINISTRADOR_DO_SISTEMA: "/admin",
  GOVERNANCA_CIENTIFICA: "/governanca",
  ADMINISTRADOR_DA_ORGANIZACAO: "/organizacao",
  PROFISSIONAL_HUMANEXUS: "/profissional",
  VISUALIZADOR_OPERACIONAL: "/operacional",
  AUDITOR: "/auditoria"
};

export async function sessaoAtual(): Promise<{
  token: string;
  usuario: UsuarioHumanexus;
  csrf: string;
} | null> {
  const armazenamento = await cookies();
  const token = armazenamento.get(COOKIE_SESSAO)?.value;
  const csrf = armazenamento.get(COOKIE_CSRF)?.value;
  if (!token || !csrf) return null;
  try {
    return { token, csrf, usuario: await obterUsuarioDoNucleo(token) };
  } catch (erro) {
    if (erro instanceof ErroDoNucleo && erro.status === 401) return null;
    throw erro;
  }
}

export function destinoDoPerfil(perfil: PerfilHumanexus) {
  return DESTINO_POR_PERFIL[perfil];
}
