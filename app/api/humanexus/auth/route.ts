import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      erro: {
        codigo: "AUTENTICACAO_OBSOLETA",
        mensagem: "Utilize a autenticação única em /api/sessao/entrar."
      }
    },
    { status: 410 }
  );
}
