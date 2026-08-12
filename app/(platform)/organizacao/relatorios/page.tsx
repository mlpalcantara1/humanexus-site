import { redirect } from "next/navigation";
import { ListaDeRelatoriosLiberados } from "@/components/relatorios-liberados";
import { listarRelatoriosLiberados } from "@/lib/relatorios-liberados";
import { sessaoAtual } from "@/lib/portal-session";

export const dynamic = "force-dynamic";

export default async function RelatoriosDaOrganizacaoPage() {
  const sessao = await sessaoAtual();
  if (!sessao) redirect("/sessao-expirada");
  if (sessao.usuario.perfil !== "ADMINISTRADOR_DA_ORGANIZACAO") redirect("/acesso-negado");
  return <ListaDeRelatoriosLiberados relatorios={await listarRelatoriosLiberados(sessao.token)} organizacional />;
}
