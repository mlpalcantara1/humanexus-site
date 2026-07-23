import { notFound, redirect } from "next/navigation";
import { ModuloIntegrado } from "@/components/modulo-integrado";
import { sessaoAtual } from "@/lib/portal-session";

const MODULOS = [
  "painel", "organizacoes", "clientes", "sessoes", "treinamentos",
  "pre-treino-pos", "formulacao", "longitudinal", "indicador-coletivo",
  "relatorios", "cockpit-vivo", "humanexus-lab", "conectores",
  "telemetria", "movel", "replay", "configuracoes"
] as const;

type Modulo = (typeof MODULOS)[number];

function moduloExiste(valor: string): valor is Modulo {
  return (MODULOS as readonly string[]).includes(valor);
}

export default async function ModuloPage({
  params
}: {
  params: Promise<{ modulo: string }>;
}) {
  const { modulo } = await params;
  if (!moduloExiste(modulo)) notFound();
  const sessao = await sessaoAtual();
  if (!sessao) redirect("/sessao-expirada");
  return <ModuloIntegrado modulo={modulo} />;
}
