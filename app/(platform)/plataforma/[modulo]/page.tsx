import { notFound, redirect } from "next/navigation";
import { ModuloIntegrado } from "@/components/modulo-integrado";
import { sessaoAtual } from "@/lib/portal-session";

const MODULOS = [
  "painel", "organizacoes", "clientes", "sessoes", "treinamentos",
  "pre-treino-pos", "formulacao", "longitudinal", "indicador-coletivo",
  "relatorios", "cockpit-vivo", "humanexus-lab", "conectores",
  "telemetria", "movel", "replay", "configuracoes", "anamnese-regulatoria"
] as const;

type Modulo = (typeof MODULOS)[number];

const VISAO_INTERNA_DO_COCKPIT: Partial<Record<Modulo, string>> = {
  "pre-treino-pos": "pre-treino-pos",
  formulacao: "formulacao",
  longitudinal: "longitudinal",
  "indicador-coletivo": "coletivo",
  relatorios: "relatorio",
  conectores: "tecnico&painel=conectores",
  telemetria: "tecnico&painel=telemetria",
  movel: "tecnico&painel=movel",
  replay: "replay"
};

function moduloExiste(valor: string): valor is Modulo {
  return (MODULOS as readonly string[]).includes(valor);
}

export default async function ModuloPage({
  params,
  searchParams
}: {
  params: Promise<{ modulo: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { modulo } = await params;
  if (!moduloExiste(modulo)) notFound();
  const sessao = await sessaoAtual();
  if (!sessao) redirect("/sessao-expirada");
  const visaoInterna = VISAO_INTERNA_DO_COCKPIT[modulo];
  if (visaoInterna) {
    const origem = await searchParams;
    const consulta = new URLSearchParams();
    const [visao, adicional = ""] = visaoInterna.split("&");
    consulta.set("visao", visao);
    for (const [chave, valor] of new URLSearchParams(adicional)) consulta.set(chave, valor);
    for (const chave of ["organizacao", "participante", "sessao", "thx"]) {
      const valor = origem[chave];
      if (typeof valor === "string" && valor) consulta.set(chave, valor);
    }
    redirect(`/plataforma/cockpit-vivo?${consulta}`);
  }
  return <ModuloIntegrado modulo={modulo} />;
}
