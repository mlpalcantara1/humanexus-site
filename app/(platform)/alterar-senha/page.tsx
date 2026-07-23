import { redirect } from "next/navigation";
import { FormularioAlteracaoSenha } from "@/components/formulario-alteracao-senha";
import { sessaoAtual } from "@/lib/portal-session";

export default async function AlterarSenhaPage() {
  const sessao = await sessaoAtual();
  if (!sessao) redirect("/entrar");
  return (
    <main className="mx-auto min-h-[75vh] max-w-xl px-5 py-16 sm:py-24">
      <FormularioAlteracaoSenha csrf={sessao.csrf} />
    </main>
  );
}
