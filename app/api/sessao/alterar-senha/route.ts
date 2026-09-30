import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { alterarSenhaNoNucleo, ErroDoNucleo } from "@/lib/humanexus-core";
import { COOKIE_CSRF, COOKIE_SESSAO } from "@/lib/portal-session";
import { exigirCsrf } from "@/lib/request-security";
import { ErroDaRota, responderErroDaApi } from "@/lib/api-route-error";

export async function POST(request: Request) {
  try {
    const armazenamento = await cookies();
    const token = armazenamento.get(COOKIE_SESSAO)?.value;
    if (!token) throw new ErroDaRota("Sua sessão expirou. Entre novamente antes de alterar a senha.", 401, "SESSAO_AUSENTE");
    try {
      exigirCsrf(request, armazenamento.get(COOKIE_CSRF)?.value);
    } catch {
      throw new ErroDaRota("A validação de segurança desta tela falhou. Reabra a página antes de tentar novamente.", 403, "VALIDACAO_CSRF_FALHOU");
    }
    let corpo: { senhaAtual?: unknown; novaSenha?: unknown };
    try { corpo = await request.json(); }
    catch { throw new ErroDaRota("Não foi possível ler o formulário enviado.", 400, "FORMULARIO_INVALIDO"); }
    await alterarSenhaNoNucleo(token, String(corpo?.senhaAtual ?? ""), String(corpo?.novaSenha ?? ""));
    const resposta = NextResponse.json({ destino: "/entrar" });
    resposta.cookies.delete(COOKIE_SESSAO);
    resposta.cookies.delete(COOKIE_CSRF);
    return resposta;
  } catch (erro) {
    // Apenas mensagens canônicas conhecidas; nunca retornar dados do formulário.
    if (erro instanceof ErroDoNucleo && erro.status === 401 && erro.message === "Senha atual inválida.") {
      erro = new ErroDaRota("A senha atual informada não corresponde à desta conta. Confira a credencial atual sem compartilhá-la no chat.", 401, "SENHA_ATUAL_INVALIDA", erro.correlacao);
    } else if (erro instanceof ErroDoNucleo && erro.status === 400 && erro.message === "A senha local deve possuir ao menos dez caracteres.") {
      erro = new ErroDaRota("A nova senha deve possuir ao menos dez caracteres.", 400, "NOVA_SENHA_FORA_DA_POLITICA", erro.correlacao);
    }
    return responderErroDaApi(erro, { modulo: "AUTENTICACAO", rota: "ALTERAR_SENHA" });
  }
}
