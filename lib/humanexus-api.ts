const API = process.env.NEXT_PUBLIC_HUMANEXUS_API_URL?.replace(/\/$/, "") ?? "";

export class HumanexusApiError extends Error {}

export async function humanexusApi<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const professionalToken =
    typeof window !== "undefined" ? sessionStorage.getItem("humanexus_professional_token") : null;
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(professionalToken ? { authorization: `Portador ${professionalToken}` } : {}),
      ...init.headers
    },
    cache: "no-store"
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new HumanexusApiError(data?.erro?.mensagem ?? "Não foi possível concluir a operação.");
  }
  return data as T;
}
