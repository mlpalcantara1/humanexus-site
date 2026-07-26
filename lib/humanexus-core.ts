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

export async function requisitarNucleoBinario(
  caminho: string,
  token: string
) {
  const resposta = await fetch(`${CORE_API}${caminho}`, {
    headers: { authorization: `Bearer ${token}` },
    cache: "no-store"
  });
  if (!resposta.ok) {
    const dados = await resposta.json().catch(() => ({}));
    throw new ErroDoNucleo(
      dados?.erro?.mensagem ?? "Não foi possível obter o arquivo.",
      resposta.status
    );
  }
  return {
    bytes: await resposta.arrayBuffer(),
    tipo: resposta.headers.get("content-type") ?? "application/octet-stream",
    disposicao: resposta.headers.get("content-disposition")
  };
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
): Promise<SessaoDoNucleo | {
  segundoFatorNecessario: true;
  desafio: string;
  canal: string;
  destinoMascarado: string;
}> {
  const dados = await requisitar<{
    token?: string;
    expira_em_segundos: number;
    segundo_fator_necessario?: boolean;
    desafio?: string;
    canal?: string;
    destino_mascarado?: string;
  }>("/api/v1/autenticacao/entrar", {
    method: "POST",
    body: JSON.stringify({ email, senha })
  });
  if (dados.segundo_fator_necessario) {
    return {
      segundoFatorNecessario: true,
      desafio: String(dados.desafio),
      canal: String(dados.canal),
      destinoMascarado: String(dados.destino_mascarado)
    };
  }
  return {
    token: String(dados.token),
    expiraEmSegundos: dados.expira_em_segundos
  };
}

export async function confirmarSegundoFatorNoNucleo(
  desafio: string,
  codigo: string
): Promise<SessaoDoNucleo> {
  const dados = await requisitar<{
    token: string;
    expira_em_segundos: number;
  }>("/api/v1/autenticacao/segundo-fator", {
    method: "POST",
    body: JSON.stringify({ desafio, codigo })
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

export async function recuperarProprietarioLocalmenteNoNucleo(
  novaSenha: string
) {
  const segredo = process.env.HUMANEXUS_LOCAL_RECOVERY_SECRET;
  if (!segredo) {
    throw new ErroDoNucleo(
      "Recuperação local segura não configurada.",
      503
    );
  }
  const resposta = await fetch(
    `${CORE_API}/api/v1/autenticacao/recuperacao/local-proprietario`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-humanexus-local-recovery-secret": segredo
      },
      body: JSON.stringify({
        email: "institutohumanexus@gmail.com",
        nova_senha: novaSenha
      }),
      cache: "no-store"
    }
  );
  if (!resposta.ok) {
    throw new ErroDoNucleo(
      "Não foi possível concluir a recuperação local segura.",
      resposta.status
    );
  }
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
