import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import {
  confirmarSegundoFatorNoNucleo,
  entrarNoNucleo,
  obterUsuarioDoNucleo
} from "@/lib/humanexus-core";
import {
  COOKIE_CSRF,
  COOKIE_SESSAO,
  destinoDoPerfil
} from "@/lib/portal-session";
import { exigirMesmaOrigem } from "@/lib/request-security";

export async function POST(request: Request) {
  try {
    exigirMesmaOrigem(request);
    const { email, senha, desafio, codigo } = await request.json();
    const etapa = desafio && codigo
      ? await confirmarSegundoFatorNoNucleo(String(desafio), String(codigo))
      : await entrarNoNucleo(
          String(email ?? ""),
          String(senha ?? ""),
          {
            identificador: request.headers.get("x-humanexus-device-id") ?? "",
            nome: request.headers.get("x-humanexus-device-name") ?? "Navegador",
            sistema_operacional:
              request.headers.get("x-humanexus-device-os") ?? "",
            navegador: request.headers.get("x-humanexus-browser") ?? "",
            versao_da_aplicacao: "PORTAL-1.0"
          }
        );
    if ("segundoFatorNecessario" in etapa) {
      return NextResponse.json({
        segundo_fator_necessario: true,
        desafio: etapa.desafio,
        canal: etapa.canal,
        destino_mascarado: etapa.destinoMascarado
      });
    }
    const sessao = etapa;
    const usuario = await obterUsuarioDoNucleo(sessao.token);
    const csrf = randomUUID();
    const resposta = NextResponse.json({
      destino: usuario.troca_de_senha_obrigatoria
        ? "/alterar-senha"
        : destinoDoPerfil(usuario.perfil)
    });
    const base = {
      path: "/",
      sameSite: "strict" as const,
      secure: new URL(request.url).protocol === "https:",
      maxAge: sessao.expiraEmSegundos
    };
    resposta.cookies.set(COOKIE_SESSAO, sessao.token, {
      ...base,
      httpOnly: true
    });
    resposta.cookies.set(COOKIE_CSRF, csrf, {
      ...base,
      httpOnly: false
    });
    return resposta;
  } catch {
    return NextResponse.json(
      { erro: { mensagem: "E-mail ou senha inválidos." } },
      { status: 401 }
    );
  }
}
