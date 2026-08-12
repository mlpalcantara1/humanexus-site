import { redirect } from "next/navigation";
import { DetalheDoRelatorioLiberado } from "@/components/relatorios-liberados";
import { obterRelatorioLiberado } from "@/lib/relatorios-liberados";
import { sessaoAtual } from "@/lib/portal-session";

export const dynamic = "force-dynamic";

export default async function MeuRelatorioPage({ params }: { params: Promise<{ id: string }> }) {
  const sessao = await sessaoAtual();
  if (!sessao) redirect("/sessao-expirada");
  if (sessao.usuario.perfil !== "VISUALIZADOR_OPERACIONAL") redirect("/acesso-negado");
  const { id } = await params;
  return <DetalheDoRelatorioLiberado relatorio={await obterRelatorioLiberado(sessao.token, id)} organizacional={false} />;
}
