import { redirect } from "next/navigation";
import { GovernancaDeRelatorios } from "@/components/governanca-relatorios";
import { listarRelatoriosEmGovernanca } from "@/lib/governanca-relatorios";
import { sessaoAtual } from "@/lib/portal-session";

const PERFIS = new Set([
  "ADMINISTRADOR_PROPRIETARIO",
  "ADMINISTRADOR_DO_SISTEMA",
  "GOVERNANCA_CIENTIFICA",
  "PROFISSIONAL_HUMANEXUS",
  "AUDITOR",
]);

export default async function GovernancaDeRelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<{ organizacao?: string }>;
}) {
  const sessao = await sessaoAtual();
  if (!sessao) redirect("/sessao-expirada");
  if (!PERFIS.has(sessao.usuario.perfil)) redirect("/acesso-negado");
  const parametros = await searchParams;
  const organizacao = sessao.usuario.identificador_da_organizacao
    ?? parametros.organizacao
    ?? "";
  const permissoes = new Set(sessao.usuario.permissoes);
  return (
    <GovernancaDeRelatorios
      relatorios={await listarRelatoriosEmGovernanca(sessao.token, organizacao)}
      csrf={sessao.csrf}
      identificadorDaOrganizacao={organizacao}
      podeConduzir={permissoes.has("conduzir_sessao")}
      podeAdministrar={permissoes.has("administrar_organizacao")}
    />
  );
}
