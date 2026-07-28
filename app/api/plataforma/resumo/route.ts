import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { requisitarNucleoAutenticado } from "@/lib/humanexus-core";
import { COOKIE_SESSAO } from "@/lib/portal-session";

type Fonte = { nome: string; caminho: string };

const FONTES_POR_MODULO: Record<string, Fonte[]> = {
  formulacao: [
    {
      nome: "versao_cientifica",
      caminho: "/api/v1/cientifico/versoes/ativa"
    },
    { nome: "postulados", caminho: "/api/v1/cientifico/postulados" }
  ]
};

async function consultar(nome: string, caminho: string, token: string) {
  try {
    return {
      nome,
      disponivel: true,
      dados: await requisitarNucleoAutenticado<unknown>(caminho, token)
    };
  } catch {
    // A ausência de permissão ou de contexto é preservada como estado real;
    // jamais é substituída por dados de demonstração no portal.
    return { nome, disponivel: false, dados: null };
  }
}

export async function GET(request: Request) {
  const token = (await cookies()).get(COOKIE_SESSAO)?.value;
  if (!token) {
    return NextResponse.json({ erro: { mensagem: "Sessão ausente." } }, { status: 401 });
  }

  try {
    const modulo = new URL(request.url).searchParams.get("modulo") ?? "painel";
    if (modulo === "painel") {
      const painel = await requisitarNucleoAutenticado<{
        usuario: {
          identificador_da_organizacao: string | null;
          perfil: string;
          permissoes: string[];
        };
        recursos: Array<{
          nome: string;
          disponivel: boolean;
          dados: unknown;
        }>;
      }>("/api/v1/painel/inicial", token);
      return NextResponse.json(painel);
    }
    const fontes = FONTES_POR_MODULO[modulo] ?? [];
    const [usuario, recursos] = await Promise.all([
      requisitarNucleoAutenticado<{
      identificador_da_organizacao: string | null;
      perfil: string;
      permissoes: string[];
      }>("/api/v1/autenticacao/usuario-atual", token),
      Promise.all(
        fontes.map((fonte) =>
          consultar(fonte.nome, fonte.caminho, token)
        )
      )
    ]);
    return NextResponse.json({ usuario, recursos });
  } catch {
    return NextResponse.json(
      { erro: { mensagem: "Não foi possível validar o contexto da plataforma." } },
      { status: 403 }
    );
  }
}
