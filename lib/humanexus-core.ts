import "server-only";

const CORE_API =
  process.env.HUMANEXUS_CORE_API_URL?.replace(/\/$/, "") ??
  "http://127.0.0.1:8080";

export type PerfilHumanexus =
  | "ADMINISTRADOR_DO_SISTEMA"
  | "GOVERNANCA_CIENTIFICA"
  | "ADMINISTRADOR_DA_ORGANIZACAO"
  | "PROFISSIONAL_HUMANEXUS"
  | "VISUALIZADOR_OPERACIONAL"
  | "AUDITOR";

export type UsuarioHumanexus = {
  identificador: string;
  nome: string;
  email: string;
  identificador_da_organizacao: string | null;
  perfil: PerfilHumanexus;
  permissoes: string[];
  troca_de_senha_obrigatoria: boolean;
};

export type SessaoDoNucleo = {
  token: string;
  expiraEmSegundos: number;
};

export class ErroDoNucleo extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

async function requisitar<T>(
  caminho: string,
  init: RequestInit = {},
  token?: string
): Promise<T> {
  const resposta = await fetch(`${CORE_API}${caminho}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...init.headers
    },
    cache: "no-store"
  });
  const dados = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    throw new ErroDoNucleo(
      dados?.erro?.mensagem ?? "Não foi possível concluir a operação.",
      resposta.status
    );
  }
  return dados as T;
}

export function requisitarNucleoAutenticado<T>(
  caminho: string,
  token: string,
  init: RequestInit = {}
) {
  return requisitar<T>(caminho, init, token);
}

export function requisitarNucleoPublico<T>(
  caminho: string,
  init: RequestInit = {}
) {
  return requisitar<T>(caminho, init);
}

export async function entrarNoNucleo(
  email: string,
  senha: string
): Promise<SessaoDoNucleo> {
  const dados = await requisitar<{
    token: string;
    expira_em_segundos: number;
  }>("/api/v1/autenticacao/entrar", {
    method: "POST",
    body: JSON.stringify({ email, senha })
  });
  return { token: dados.token, expiraEmSegundos: dados.expira_em_segundos };
}

export function obterUsuarioDoNucleo(token: string) {
  return requisitar<UsuarioHumanexus>(
    "/api/v1/autenticacao/usuario-atual",
    {},
    token
  );
}

export async function renovarNoNucleo(token: string): Promise<SessaoDoNucleo> {
  const dados = await requisitar<{
    token: string;
    expira_em_segundos: number;
  }>("/api/v1/autenticacao/renovar", { method: "POST" }, token);
  return { token: dados.token, expiraEmSegundos: dados.expira_em_segundos };
}

export async function sairDoNucleo(token: string) {
  await requisitar("/api/v1/autenticacao/sair", { method: "POST" }, token);
}

export function solicitarRecuperacaoNoNucleo(email: string) {
  return requisitar<{ mensagem: string }>(
    "/api/v1/autenticacao/recuperacao/solicitar",
    { method: "POST", body: JSON.stringify({ email }) }
  );
}

export function redefinirSenhaNoNucleo(token: string, novaSenha: string) {
  return requisitar(
    "/api/v1/autenticacao/recuperacao/redefinir",
    {
      method: "POST",
      body: JSON.stringify({ token, nova_senha: novaSenha })
    }
  );
}

export function alterarSenhaNoNucleo(
  token: string,
  senhaAtual: string,
  novaSenha: string
) {
  return requisitar(
    "/api/v1/autenticacao/alterar-senha",
    {
      method: "POST",
      body: JSON.stringify({
        senha_atual: senhaAtual,
        nova_senha: novaSenha
      })
    },
    token
  );
}
