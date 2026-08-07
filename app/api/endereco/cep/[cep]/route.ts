import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  contexto: { params: Promise<{ cep: string }> }
) {
  const { cep: recebido } = await contexto.params;
  const cep = String(recebido ?? "").replace(/\D/g, "");
  if (!/^\d{8}$/.test(cep)) {
    return NextResponse.json(
      { erro: { mensagem: "CEP inválido." } },
      { status: 400 }
    );
  }
  try {
    const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
      cache: "no-store",
      signal: AbortSignal.timeout(4_000)
    });
    if (!resposta.ok) throw new Error("Serviço de CEP indisponível");
    const dados = await resposta.json() as Record<string, unknown>;
    if (dados.erro === true) {
      return NextResponse.json(
        { erro: { mensagem: "CEP não localizado." } },
        { status: 404 }
      );
    }
    return NextResponse.json(
      {
        cep,
        logradouro: String(dados.logradouro ?? ""),
        bairro: String(dados.bairro ?? ""),
        cidade: String(dados.localidade ?? ""),
        uf: String(dados.uf ?? "")
      },
      { headers: { "cache-control": "private, no-store" } }
    );
  } catch {
    return NextResponse.json(
      {
        erro: {
          mensagem:
            "Consulta de CEP indisponível. Preencha o endereço manualmente."
        }
      },
      { status: 503 }
    );
  }
}
