import { NextResponse } from "next/server";

export function ok(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "cache-control": "no-store",
      "x-content-type-options": "nosniff"
    }
  });
}

export function fail(error: unknown, status = 400) {
  const message = error instanceof Error ? error.message : "Operação indisponível.";
  return ok({ erro: { codigo: "ERRO_HUMANEXUS", mensagem: message } }, status);
}
