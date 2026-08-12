import { redirect } from "next/navigation";
import { ListaDeRelatoriosLiberados } from "@/components/relatorios-liberados";
import { listarRelatoriosLiberados } from "@/lib/relatorios-liberados";
import { sessaoAtual } from "@/lib/portal-session";

export const dynamic = "force-dynamic";

export default async function MeusRelatoriosPage() {
  const sessao = await sessaoAtual();
  if (!sessao) redirect("/sessao-expirada");
  if (sessao.usuario.perfil !== "VISUALIZADOR_OPERACIONAL") redirect("/acesso-negado");
  return <ListaDeRelatoriosLiberados relatorios={await listarRelatoriosLiberados(sessao.token)} organizacional={false} />;
}
