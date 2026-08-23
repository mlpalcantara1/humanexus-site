import "server-only";

const CORE_API =
  process.env.HUMANEXUS_CORE_API_URL?.replace(/\/$/, "") ??
  "http://127.0.0.1:8080";
const CORE_PROTECTION_BYPASS =
  process.env.HUMANEXUS_CORE_PROTECTION_BYPASS_SECRET?.trim() ?? "";

function cabecalhoDeProtecaoDoCore(): Record<string, string> {
  return CORE_PROTECTION_BYPASS
    ? { "x-vercel-protection-bypass": CORE_PROTECTION_BYPASS }
    : {};
}

export type PerfilHumanexus =
  | "ADMINISTRADOR_PROPRIETARIO"
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
  constructor(
    message: string,
    readonly status: number,
    readonly codigo: string = "ERRO_DO_NUCLEO",
    readonly correlacao?: string
  ) {
    super(message);
  }
}

type OpcoesDaRequisicaoAoNucleo = {
  tentativas?: number;
  tempoLimiteMs?: number;
};

async function requisitar<T>(
  caminho: string,
  init: RequestInit = {},
  token?: string,
  opcoes: OpcoesDaRequisicaoAoNucleo = {}
): Promise<T> {
  const metodo = String(init.method ?? "GET").toUpperCase();
  const consultaSegura = metodo === "GET" || metodo === "HEAD";
  const tentativas = Math.max(
    1,
    Math.min(3, opcoes.tentativas ?? (consultaSegura ? 3 : 1))
  );
  let resposta: Response | null = null;
  let falhaDeRede: unknown = null;
  for (let tentativa = 1; tentativa <= tentativas; tentativa += 1) {
    const controlador = new AbortController();
    const propagarCancelamento = () => controlador.abort(init.signal?.reason);
    if (init.signal?.aborted) propagarCancelamento();
    else init.signal?.addEventListener("abort", propagarCancelamento, { once: true });
    const limite = opcoes.tempoLimiteMs
      ? setTimeout(
          () => controlador.abort(new Error("Tempo limite do núcleo excedido.")),
          opcoes.tempoLimiteMs
        )
      : null;
    try {
      resposta = await fetch(`${CORE_API}${caminho}`, {
        ...init,
        redirect: "manual",
        headers: {
          "content-type": "application/json",
          ...cabecalhoDeProtecaoDoCore(),
          ...(token ? { authorization: `Bearer ${token}` } : {}),
          ...init.headers
        },
        cache: "no-store",
        signal: controlador.signal
      });
      if (
        !consultaSegura
        || ![502, 503, 504].includes(resposta.status)
        || tentativa === tentativas
      ) {
        break;
      }
    } catch (erro) {
      falhaDeRede = erro;
      if (init.signal?.aborted || !consultaSegura || tentativa === tentativas) break;
    } finally {
      if (limite) clearTimeout(limite);
      init.signal?.removeEventListener("abort", propagarCancelamento);
    }
    await new Promise((resolver) => setTimeout(resolver, 150 * tentativa));
  }
  if (!resposta) {
    void falhaDeRede;
    throw new ErroDoNucleo(
      "Núcleo temporariamente indisponível. Aguarde alguns segundos e tente novamente.",
      503
    );
  }
  const dados = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    throw new ErroDoNucleo(
      dados?.erro?.mensagem ?? "Não foi possível concluir a operação.",
      resposta.status,
      String(dados?.erro?.codigo ?? "ERRO_DO_NUCLEO"),
      resposta.headers.get("x-humanexus-correlation-id") ?? undefined
    );
  }
  return dados as T;
}

export function requisitarNucleoAutenticado<T>(
  caminho: string,
  token: string,
  init: RequestInit = {},
  opcoes: OpcoesDaRequisicaoAoNucleo = {}
) {
  return requisitar<T>(caminho, init, token, opcoes);
}

export async function requisitarNucleoBinario(
  caminho: string,
  token: string
) {
  const resposta = await fetch(`${CORE_API}${caminho}`, {
    redirect: "manual",
    headers: {
      ...cabecalhoDeProtecaoDoCore(),
      authorization: `Bearer ${token}`
    },
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
  senha: string,
  dispositivo: Record<string, string> = {}
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
    headers: {
      "x-humanexus-device-id": dispositivo.identificador ?? "",
      "x-humanexus-device-name": dispositivo.nome ?? "Navegador",
      "x-humanexus-device-os": dispositivo.sistema_operacional ?? "",
      "x-humanexus-browser": dispositivo.navegador ?? "",
      "x-humanexus-app-version": dispositivo.versao_da_aplicacao ?? ""
    },
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
