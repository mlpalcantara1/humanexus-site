import { PainelSeguro } from "@/components/painel-seguro";
import { PainelAdministrador } from "@/components/painel-administrador";
import { sessaoAtual } from "@/lib/portal-session";

export default async function AdminPage() {
  const sessao = await sessaoAtual();
  return (
    <>
      <PainelSeguro perfilExigido="ADMINISTRADOR_DO_SISTEMA" />
      {sessao ? (
        <section className="hx-admin-stage">
          <PainelAdministrador
            csrf={sessao.csrf}
            usuarioAtual={sessao.usuario}
          />
        </section>
      ) : null}
    </>
  );
}
