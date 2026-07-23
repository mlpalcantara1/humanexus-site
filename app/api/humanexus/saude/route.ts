import { NextResponse } from "next/server";
import { requisitarNucleoPublico } from "@/lib/humanexus-core";

export async function GET() {
  try {
    return NextResponse.json(
      await requisitarNucleoPublico("/api/v1/saude")
    );
  } catch {
    return NextResponse.json(
      { erro: { mensagem: "Núcleo indisponível." } },
      { status: 503 }
    );
  }
}
