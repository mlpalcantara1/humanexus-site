import catalog from "@/data/biblioteca-perguntas-1.0.json";
import { redirect } from "next/navigation";
import { sessaoAtual } from "@/lib/portal-session";

export default async function CatalogoPage() {
  const sessao = await sessaoAtual();
  if (!sessao) redirect("/sessao-expirada");
  if (sessao.usuario.perfil !== "PROFISSIONAL_HUMANEXUS") {
    redirect("/acesso-negado");
  }
  const byNiche = catalog.nichos.map((niche) => ({
    niche,
    count: catalog.perguntas.filter((question) => question.nichos_json.includes(niche)).length
  }));
  return (
    <section className="mx-auto max-w-6xl px-5 py-14">
      <p className="text-xs uppercase tracking-[0.28em] text-[#C9A34E]">Revisão autoral</p>
      <h1 className="mt-3 text-4xl font-semibold text-white">Catálogo Oficial v{catalog.versao}</h1>
      <p className="mt-5 max-w-3xl leading-7 text-[#AEB2B9]">{catalog.perguntas.length} perguntas canônicas. O texto original permanece separado de qualquer sugestão futura de adaptação.</p>
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {byNiche.map((item) => (
          <div key={item.niche} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs text-[#8F949C]">{item.niche.replaceAll("_", " ")}</p>
            <p className="mt-2 text-2xl font-semibold text-white">{item.count}</p>
          </div>
        ))}
      </div>
      <div className="mt-10 space-y-3">
        {catalog.perguntas.map((question) => (
          <details key={question.identificador} className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
            <summary className="cursor-pointer text-[#F2F2F2]"><span className="mr-3 text-xs text-[#C9A34E]">{question.codigo}</span>{question.texto}</summary>
            <div className="mt-4 grid gap-2 text-sm text-[#AEB2B9] sm:grid-cols-2">
              <p>Nicho: {question.nichos_json.join(", ")}</p>
              <p>Bloco: {question.blocos_json.join(", ")}</p>
              <p>Tipo: {question.tipo_de_resposta}</p>
              <p>Estado: {question.estado}</p>
              <p className="sm:col-span-2">Sugestão: {question.sugestao_melhoria ?? "Nenhuma adaptação aplicada."}</p>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
