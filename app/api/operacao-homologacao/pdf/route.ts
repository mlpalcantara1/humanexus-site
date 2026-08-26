import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { requisitarNucleoAutenticado } from "@/lib/humanexus-core";
import { gerarPdfVisualHumanexus } from "@/lib/humanexus-report-pdf";
import { COOKIE_SESSAO } from "@/lib/portal-session";
import { projetarEstadoFuncionalDoRelatorio } from "@/lib/humanexus-report-authority";

type Registro = Record<string, unknown>;

export async function GET(request: Request) {
  try {
    const armazenamento = await cookies();
    const token = armazenamento.get(COOKIE_SESSAO)?.value;
    if (!token) throw new Error("Sessão ausente.");
    const usuario = await requisitarNucleoAutenticado<Registro>("/api/v1/autenticacao/usuario-atual", token);
    const url = new URL(request.url);
    const modoImpressao = url.searchParams.get("modo") === "impressao";
    const organizacaoId = String(
      usuario.identificador_da_organizacao
      ?? url.searchParams.get("organizacao")
      ?? ""
    );
    if (!organizacaoId) throw new Error("Organização não selecionada.");
    const [organizacao, participantes] = await Promise.all([
      requisitarNucleoAutenticado<Registro>(
        `/api/v1/organizacoes/${encodeURIComponent(organizacaoId)}`,
        token
      ),
      requisitarNucleoAutenticado<Registro[]>(
        `/api/v1/organizacoes/${encodeURIComponent(organizacaoId)}/participantes`,
        token
      )
    ]);
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
    const relatorioResumido = [...relatorios].reverse().find(
      (item) => {
        const contexto = item.contexto_json;
        if (contexto && typeof contexto === "object") {
          const registro = contexto as Registro;
          return String(
            registro.identificador_interno_da_sessao
            ?? registro.identificador_da_sessao
            ?? registro.sessao
            ?? ""
          ) === String(sessao.identificador);
        }
        if (typeof contexto === "string") {
          try {
            const registro = JSON.parse(contexto) as Registro;
            return String(
              registro.identificador_interno_da_sessao
              ?? registro.identificador_da_sessao
              ?? registro.sessao
              ?? ""
            ) === String(sessao.identificador);
          } catch {
            return false;
          }
        }
        return false;
      }
    );
    if (!relatorioResumido) {
      throw new Error("Relatório desta sessão não localizado.");
    }
    const relatorio = await requisitarNucleoAutenticado<Registro>(
      `/api/v1/relatorios/${encodeURIComponent(String(relatorioResumido.identificador))}`,
      token
    );
    const cicloDocumental = projetarEstadoFuncionalDoRelatorio(relatorio);
    if (!cicloDocumental.finalDisponivel) {
      return NextResponse.json(
        {
          erro: {
            codigo: "RELATORIO_FINAL_INDISPONIVEL",
            mensagem: (
              "PDF e impressão finais exigem consolidação profissional completa "
              + "e relatório final validado."
            ),
            campos_ausentes: cicloDocumental.rotulosAusentes
          }
        },
        {
          status: 409,
          headers: { "cache-control": "private, no-store" }
        }
      );
    }
    const execucao = execucoes.find((item) => item.identificador_da_sessao === sessao.identificador) ?? null;
    const sessaoId = String(sessao.identificador);
    const [
      telemetria,
      ciclo,
      eventos,
      gravacao,
      contratoCientifico,
      tirhV1,
      cockpitOperacional,
      protocoloThx
    ] = await Promise.all([
      requisitarNucleoAutenticado<Registro[]>(`/api/v1/telemetria/sessoes/${encodeURIComponent(sessaoId)}`, token)
        .catch(() => []),
      execucao
        ? requisitarNucleoAutenticado<Registro>(`/api/v1/execucoes-thx/${encodeURIComponent(String(execucao.identificador))}/ciclo`, token)
            .catch(() => null)
        : Promise.resolve(null),
      execucao
        ? requisitarNucleoAutenticado<Registro[]>(`/api/v1/execucoes-thx/${encodeURIComponent(String(execucao.identificador))}/ciclo/eventos`, token)
            .catch(() => [])
        : Promise.resolve([]),
      requisitarNucleoAutenticado<Registro>(
        `/api/v1/sessoes/${encodeURIComponent(sessaoId)}/gravacao`,
        token
      ).catch(() => ({
        baseline: {
          referencia: {
            estado: "SESSÃO SEM REFERÊNCIA INICIAL"
          }
        }
      })),
      requisitarNucleoAutenticado<Registro>(
        `/api/v1/sessoes/${encodeURIComponent(sessaoId)}/contrato-cientifico`,
        token
      ).catch(() => ({
        estado: "SEM EVIDÊNCIA CIENTÍFICA DISPONÍVEL PARA ESTA SESSÃO",
        ausencia_convertida_em_zero: false
      })),
      requisitarNucleoAutenticado<Registro>(
        `/api/v1/sessoes/${encodeURIComponent(sessaoId)}/tirh-v1`,
        token
      ),
      requisitarNucleoAutenticado<Registro>(
        `/api/v1/sessoes/${encodeURIComponent(sessaoId)}/cockpit-operacional`,
        token
      ),
      execucao?.identificador_do_protocolo
        ? requisitarNucleoAutenticado<Registro>(
            `/api/v1/thx/protocolos/${encodeURIComponent(String(execucao.identificador_do_protocolo))}`,
            token
          ).catch(() => null)
        : Promise.resolve(null)
    ]);
    const pdf = await gerarPdfVisualHumanexus({
      usuario,
      organizacao,
      participante,
      sessao,
      execucao,
      protocoloThx,
      ciclo,
      telemetria,
      eventos,
      relatorio,
      gravacao,
      contratoCientifico,
      tirhV1,
      cockpitOperacional,
      contratoDocumental: "TIRH_V1"
    });
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `${modoImpressao ? "inline" : "attachment"}; filename="humanexus-relatorio-tirh-${String(relatorio.identificador).slice(0, 8)}.pdf"`,
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
