import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { requisitarNucleoAutenticado } from "@/lib/humanexus-core";
import { COOKIE_SESSAO } from "@/lib/portal-session";

type Fonte = { nome: string; caminho: string };

const FONTES_GERAIS: Fonte[] = [
  { nome: "painel", caminho: "/api/v1/painel/resumo" },
  { nome: "organizacoes", caminho: "/api/v1/organizacoes" },
  { nome: "ctr", caminho: "/api/v1/ctr/catalogo" },
  { nome: "thx", caminho: "/api/v1/thx/catalogo" },
  { nome: "conectores", caminho: "/api/v1/conectores" },
  { nome: "telemetria", caminho: "/api/v1/fontes-telemetria" },
  { nome: "movel", caminho: "/api/v1/movel/perfil" },
  { nome: "versao_cientifica", caminho: "/api/v1/cientifico/versoes/ativa" },
  { nome: "postulados", caminho: "/api/v1/cientifico/postulados" }
];

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

export async function GET() {
  const token = (await cookies()).get(COOKIE_SESSAO)?.value;
  if (!token) {
    return NextResponse.json({ erro: { mensagem: "Sessão ausente." } }, { status: 401 });
  }

  try {
    const usuario = await requisitarNucleoAutenticado<{
      identificador_da_organizacao: string | null;
      perfil: string;
      permissoes: string[];
    }>("/api/v1/autenticacao/usuario-atual", token);
    const fontes = [...FONTES_GERAIS];
    if (usuario.identificador_da_organizacao) {
      fontes.push({
        nome: "clientes",
        caminho: `/api/v1/organizacoes/${encodeURIComponent(usuario.identificador_da_organizacao)}/participantes`
      });
    }
    const recursos = await Promise.all(
      fontes.map((fonte) => consultar(fonte.nome, fonte.caminho, token))
    );
    return NextResponse.json({ usuario, recursos });
  } catch {
    return NextResponse.json(
      { erro: { mensagem: "Não foi possível validar o contexto da plataforma." } },
      { status: 403 }
    );
  }
}
