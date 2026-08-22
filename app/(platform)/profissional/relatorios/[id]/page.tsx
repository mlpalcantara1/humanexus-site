import { redirect } from "next/navigation";
import { DetalheDoRelatorioEmGovernanca } from "@/components/detalhe-relatorio-governanca";
import { obterRelatorioEmGovernanca } from "@/lib/governanca-relatorios";
import { sessaoAtual } from "@/lib/portal-session";

const PERFIS = new Set([
  "ADMINISTRADOR_PROPRIETARIO",
  "ADMINISTRADOR_DO_SISTEMA",
  "GOVERNANCA_CIENTIFICA",
  "PROFISSIONAL_HUMANEXUS",
  "AUDITOR",
]);

export const dynamic = "force-dynamic";

export default async function RelatorioEmGovernancaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ organizacao?: string }>;
}) {
  const sessao = await sessaoAtual();
  if (!sessao) redirect("/sessao-expirada");
  if (!PERFIS.has(sessao.usuario.perfil)) redirect("/acesso-negado");
  const { id } = await params;
  const { organizacao = "" } = await searchParams;
  return (
    <DetalheDoRelatorioEmGovernanca
      relatorio={await obterRelatorioEmGovernanca(sessao.token, id)}
      organizacao={organizacao}
    />
  );
}
