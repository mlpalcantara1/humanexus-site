export class HumanexusApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly codigo: string = "FALHA_DA_OPERACAO"
  ) {
    super(message);
  }
}

export async function humanexusApi<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...init.headers
    },
    cache: "no-store"
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new HumanexusApiError(
      data?.erro?.mensagem ?? "Não foi possível concluir a operação.",
      response.status,
      String(data?.erro?.codigo ?? "FALHA_DA_OPERACAO")
    );
  }
  return data as T;
}
