import { createHash, randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { requisitarNucleoAutenticado } from "@/lib/humanexus-core";
import { COOKIE_SESSAO } from "@/lib/portal-session";
import { exigirMesmaOrigem } from "@/lib/request-security";

export async function POST(request: Request) {
  try {
    exigirMesmaOrigem(request);
    const token = (await cookies()).get(COOKIE_SESSAO)?.value;
    if (!token) throw new Error("Sessão ausente");
    const corpo = await request.json();
    const usuario = await requisitarNucleoAutenticado<{
      identificador_da_organizacao: string | null;
    }>("/api/v1/autenticacao/usuario-atual", token);
    if (!usuario.identificador_da_organizacao) {
      throw new Error("Organização obrigatória");
    }
    const chave = createHash("sha256")
      .update(`${String(corpo.email).trim().toLowerCase()}|${usuario.identificador_da_organizacao}`)
      .digest("hex");
    const identidade = await requisitarNucleoAutenticado<{ identificador: string }>(
      "/api/v1/identidades-longitudinais",
      token,
      {
        method: "POST",
        body: JSON.stringify({
          chave_de_correspondencia: chave,
          dados_cadastrais: { nome: corpo.nome, funcao: corpo.funcao },
          contatos: { email: corpo.email, telefone: corpo.telefone }
        })
      }
    );
    const participante = await requisitarNucleoAutenticado<{ identificador: string }>(
      "/api/v1/participantes",
      token,
      { method: "POST", body: JSON.stringify({ referencia_externa: randomUUID() }) }
    );
    const vinculo = await requisitarNucleoAutenticado<{ identificador: string }>(
      `/api/v1/identidades-longitudinais/${identidade.identificador}/vinculos`,
      token,
      {
        method: "POST",
        body: JSON.stringify({
          identificador_do_participante: participante.identificador,
          tipo: corpo.tipo_vinculo,
          nicho: corpo.nicho,
          finalidade: "ANAMNESE_REGULATORIA",
          identificador_da_organizacao: usuario.identificador_da_organizacao,
          funcao: corpo.funcao,
          autorizacoes: ["ANAMNESE_REGULATORIA"]
        })
      }
    );
    return NextResponse.json(
      {
        id: participante.identificador,
        identidade_id: identidade.identificador,
        vinculo_id: vinculo.identificador,
        nicho: corpo.nicho
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { erro: { mensagem: "Não foi possível cadastrar o participante." } },
      { status: 422 }
    );
  }
}
