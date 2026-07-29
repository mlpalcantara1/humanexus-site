import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { requisitarNucleoAutenticado } from "@/lib/humanexus-core";
import { gerarPdfVisualHumanexus } from "@/lib/humanexus-report-pdf";
import { COOKIE_SESSAO } from "@/lib/portal-session";

type Registro = Record<string, unknown>;

export async function GET(request: Request) {
  try {
    const armazenamento = await cookies();
    const token = armazenamento.get(COOKIE_SESSAO)?.value;
    if (!token) throw new Error("Sessão ausente.");
    const usuario = await requisitarNucleoAutenticado<Registro>("/api/v1/autenticacao/usuario-atual", token);
    const url = new URL(request.url);
    const organizacaoId = String(
      usuario.identificador_da_organizacao
      ?? url.searchParams.get("organizacao")
      ?? ""
    );
    if (!organizacaoId) throw new Error("Organização não selecionada.");
    const participantes = await requisitarNucleoAutenticado<Registro[]>(`/api/v1/organizacoes/${encodeURIComponent(organizacaoId)}/participantes`, token);
    const participanteSolicitado = url.searchParams.get("participante");
    const participante = participanteSolicitado
      ? participantes.find(
          (item) => item.identificador === participanteSolicitado
        )
      : participantes[0];
    if (!participante) throw new Error("Participante não localizado.");
    const participanteId = String(participante.identificador);
    const [relatorios, sessoes, execucoes] = await Promise.all([
      requisitarNucleoAutenticado<Registro[]>(`/api/v1/participantes/${encodeURIComponent(participanteId)}/relatorios`, token),
      requisitarNucleoAutenticado<Registro[]>(`/api/v1/participantes/${encodeURIComponent(participanteId)}/sessoes`, token),
      requisitarNucleoAutenticado<Registro[]>(`/api/v1/participantes/${encodeURIComponent(participanteId)}/execucoes-thx`, token)
    ]);
    const sessao = sessoes.find(
      (item) => item.identificador === url.searchParams.get("sessao")
    ) ?? sessoes[0];
    if (!sessao) throw new Error("Sessão não localizada.");
    const relatorio = [...relatorios].reverse().find(
      (item) => {
        const contexto = item.contexto_json;
        if (contexto && typeof contexto === "object") {
          return (contexto as Registro).sessao === sessao.identificador;
        }
        if (typeof contexto === "string") {
          try {
            return (JSON.parse(contexto) as Registro).sessao === sessao.identificador;
          } catch {
            return false;
          }
        }
        return false;
      }
    ) ?? relatorios.at(-1);
    if (!relatorio) throw new Error("Relatório da sessão não localizado.");
    const execucao = execucoes.find((item) => item.identificador_da_sessao === sessao.identificador) ?? null;
    const sessaoId = String(sessao.identificador);
    const [telemetria, ciclo, eventos, gravacao, contratoCientifico] = await Promise.all([
      requisitarNucleoAutenticado<Registro[]>(`/api/v1/telemetria/sessoes/${encodeURIComponent(sessaoId)}`, token),
      execucao
        ? requisitarNucleoAutenticado<Registro>(`/api/v1/execucoes-thx/${encodeURIComponent(String(execucao.identificador))}/ciclo`, token)
        : Promise.resolve(null),
      execucao
        ? requisitarNucleoAutenticado<Registro[]>(`/api/v1/execucoes-thx/${encodeURIComponent(String(execucao.identificador))}/ciclo/eventos`, token)
        : Promise.resolve([]),
      requisitarNucleoAutenticado<Registro>(
        `/api/v1/sessoes/${encodeURIComponent(sessaoId)}/gravacao`,
        token
      ).catch(() => ({
        baseline: {
          referencia: {
            estado: "SESSÃO SEM REFERÊNCIA DE BASELINE"
          }
        }
      })),
      requisitarNucleoAutenticado<Registro>(
        `/api/v1/sessoes/${encodeURIComponent(sessaoId)}/contrato-cientifico`,
        token
      )
    ]);
    const pdf = await gerarPdfVisualHumanexus({
      usuario,
      participante,
      sessao,
      execucao,
      ciclo,
      telemetria,
      eventos,
      relatorio,
      gravacao,
      contratoCientifico
    });
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="humanexus-homologacao-visual-${String(relatorio.identificador).slice(0, 8)}.pdf"`,
        "cache-control": "private, no-store"
      }
    });
  } catch (erro) {
    return NextResponse.json(
      { erro: { mensagem: erro instanceof Error ? erro.message : "PDF indisponível." } },
      { status: 404 }
    );
  }
}
