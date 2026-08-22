/**
 * Entrada pública preparada para o domínio definitivo do app.
 * Em desenvolvimento, ou até o domínio ser configurado, mantém a navegação
 * interna sem expor um endereço local no site institucional.
 */
export function entradaDaPlataforma() {
  if (process.env.VERCEL_ENV === "preview") {
    return "/area-humanexus";
  }

  const endereco = process.env.NEXT_PUBLIC_HUMANEXUS_APP_URL?.replace(/\/$/, "");

  return endereco?.startsWith("https://") ? endereco : "/area-humanexus";
}
