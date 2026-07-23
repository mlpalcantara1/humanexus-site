import { redirect } from "next/navigation";
import { FormularioEntrada } from "@/components/formulario-entrada";
import { destinoDoPerfil, sessaoAtual } from "@/lib/portal-session";

export default async function EntrarPage() {
  const sessao = await sessaoAtual();
  if (sessao) redirect(destinoDoPerfil(sessao.usuario.perfil));
  return (
    <section className="mx-auto min-h-[72vh] max-w-lg px-5 py-20">
      <FormularioEntrada />
    </section>
  );
}
