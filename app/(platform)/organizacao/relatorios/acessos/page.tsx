import { redirect } from "next/navigation";
import { GestaoDeAcessosRelatorios, type ParticipanteParaAcesso } from "@/components/gestao-acessos-relatorios";
import { requisitarNucleoAutenticado } from "@/lib/humanexus-core";
import { sessaoAtual } from "@/lib/portal-session";

export const dynamic = "force-dynamic";

export default async function AcessosAosRelatoriosPage() {
  const sessao = await sessaoAtual();
  if (!sessao) redirect("/sessao-expirada");
  if (sessao.usuario.perfil !== "ADMINISTRADOR_DA_ORGANIZACAO") redirect("/acesso-negado");
  const organizacao = sessao.usuario.identificador_da_organizacao;
  if (!organizacao) redirect("/acesso-negado");
  const participantes = await requisitarNucleoAutenticado<ParticipanteParaAcesso[]>(`/api/v1/organizacoes/${encodeURIComponent(organizacao)}/participantes`, sessao.token);
  return <GestaoDeAcessosRelatorios csrf={sessao.csrf} identificadorDaOrganizacao={organizacao} participantes={participantes} />;
}
