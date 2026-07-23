import { redirect } from "next/navigation";
import { BotaoSair } from "@/components/botao-sair";
import { sessaoAtual } from "@/lib/portal-session";

export default async function SairPage() {
  const sessao = await sessaoAtual();
  if (!sessao) redirect("/entrar");
  return (
    <section className="mx-auto min-h-[65vh] max-w-xl px-5 py-20">
      <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-8">
        <h1 className="text-3xl font-semibold text-white">Encerrar sessão</h1>
        <p className="mt-4 leading-7 text-[#AEB2B9]">
          Confirme para revogar a sessão no núcleo HUMANEXUS e remover o acesso
          deste navegador.
        </p>
        <div className="mt-7">
          <BotaoSair csrf={sessao.csrf} />
        </div>
      </div>
    </section>
  );
}
