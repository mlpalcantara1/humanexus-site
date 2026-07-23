import { NextResponse } from "next/server";

function obsoleto() {
  return NextResponse.json(
    {
      erro: {
        codigo: "API_PROVISORIA_OBSOLETA",
        mensagem: "Operação transferida para o núcleo oficial HUMANEXUS."
      }
    },
    { status: 410 }
  );
}

export const GET = obsoleto;
export const POST = obsoleto;
