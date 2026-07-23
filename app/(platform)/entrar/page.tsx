import { redirect } from "next/navigation";
import { FormularioEntrada } from "@/components/formulario-entrada";
import { destinoDoPerfil, sessaoAtual } from "@/lib/portal-session";

export default async function EntrarPage() {
  const sessao = await sessaoAtual();
  if (sessao) redirect(destinoDoPerfil(sessao.usuario.perfil));
  return (
    <section className="platform-login min-h-[72vh] px-5 py-20">
      <div className="platform-login__media" aria-hidden="true" />
      <div className="relative mx-auto max-w-lg"><FormularioEntrada /></div>
    </section>
  );
}
