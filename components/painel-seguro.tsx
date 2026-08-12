import Link from "next/link";
import { redirect } from "next/navigation";
import { PerfilHumanexus } from "@/lib/humanexus-core";
import { destinoDoPerfil, sessaoAtual } from "@/lib/portal-session";
import { HxPageHeader, HxSurface } from "@/components/hx-design-system";

const TITULOS: Record<PerfilHumanexus, string> = {
  ADMINISTRADOR_PROPRIETARIO: "Administrador Proprietário",
  ADMINISTRADOR_DO_SISTEMA: "Administração do Sistema",
  GOVERNANCA_CIENTIFICA: "Governança Científica",
  ADMINISTRADOR_DA_ORGANIZACAO: "Administração Organizacional",
  PROFISSIONAL_HUMANEXUS: "Área Profissional",
  VISUALIZADOR_OPERACIONAL: "Visão Operacional",
  AUDITOR: "Auditoria"
};

const ROTULOS_DAS_PERMISSOES: Record<string, string> = {
  acessar_humanexus_lab: "Acessar o HUMANEXUS LAB",
  administrar_organizacao: "Administrar organizações autorizadas",
  administrar_sistema: "Administrar a plataforma",
  conduzir_sessao: "Conduzir sessões",
  consultar_auditoria: "Consultar auditoria",
  consultar_ciencia: "Consultar a ciência TIRH",
  consultar_operacao: "Consultar a operação",
  criar_organizacao: "Criar organizações",
  gerenciar_participantes: "Gerenciar participantes",
  validar_desenvolvimento: "Validar recursos em desenvolvimento"
};

function rotuloDaPermissao(permissao: string) {
  return ROTULOS_DAS_PERMISSOES[permissao]
    ?? permissao.replaceAll("_", " ").toLocaleLowerCase("pt-BR");
}

export async function PainelSeguro({
  perfilExigido
}: {
  perfilExigido: PerfilHumanexus;
}) {
  const sessao = await sessaoAtual();
  if (!sessao) redirect("/sessao-expirada");
  if (
    sessao.usuario.perfil !== "ADMINISTRADOR_PROPRIETARIO"
    && sessao.usuario.perfil !== perfilExigido
  ) redirect("/acesso-negado");

  return (
    <section className="hx-secure-panel">
      <HxPageHeader
        className="hx-secure-panel__head"
        eyebrow="ÁREA HUMANEXUS / GOVERNANÇA"
        title={TITULOS[perfilExigido]}
        description="Sessão autenticada pelo núcleo oficial HUMANEXUS."
        descriptionAs="span"
        aside={<div className="hx-secure-panel__status">
          <i aria-hidden="true" />
          <span>GOVERNANÇA AUTENTICADA</span>
          <small>CONTEXTO PROTEGIDO PELO NÚCLEO</small>
        </div>}
      />

      <div className="hx-secure-panel__grid">
        <HxSurface as="article">
          <h2>Identidade</h2>
          <dl>
            <div>
              <dt>Nome</dt><dd>{sessao.usuario.nome}</dd>
            </div>
            <div>
              <dt>Perfil</dt><dd>{TITULOS[sessao.usuario.perfil]}</dd>
            </div>
            <div>
              <dt>Organização</dt><dd>{sessao.usuario.identificador_da_organizacao ? "Organização vinculada" : "Todas as organizações autorizadas"}</dd>
            </div>
          </dl>
        </HxSurface>

        <HxSurface as="article">
          <h2>Permissões efetivas</h2>
          <ul>
            {sessao.usuario.permissoes.map((permissao) => (
              <li key={permissao}>{rotuloDaPermissao(permissao)}</li>
            ))}
          </ul>
          <div className="hx-secure-panel__actions">
            <Link href={destinoDoPerfil(sessao.usuario.perfil)}>Início do painel <span>→</span></Link>
            {perfilExigido === "PROFISSIONAL_HUMANEXUS" ? (
              <>
                <Link href="/profissional/catalogo">Catálogo autoral</Link>
                <Link href="/profissional/relatorios">Governança de relatórios</Link>
              </>
            ) : null}
            {sessao.usuario.perfil === "ADMINISTRADOR_PROPRIETARIO" ? (
              <Link href="/profissional/relatorios">Governança de relatórios</Link>
            ) : null}
            {perfilExigido === "VISUALIZADOR_OPERACIONAL" ? (
              <Link href="/meus-relatorios">Meus Relatórios</Link>
            ) : null}
            {perfilExigido === "ADMINISTRADOR_DA_ORGANIZACAO" ? (
              <><Link href="/organizacao/relatorios">Relatórios da organização</Link><Link href="/organizacao/relatorios/acessos">Acessos aos relatórios</Link></>
            ) : null}
          </div>
        </HxSurface>
      </div>
    </section>
  );
}
