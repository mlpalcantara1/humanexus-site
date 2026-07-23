export default function OfflinePage() {
  return (
    <section className="mx-auto flex min-h-[70vh] max-w-2xl items-center px-6 py-20">
      <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-8">
        <p className="text-xs uppercase tracking-[0.28em] text-[#C9A34E]">Sem conexão</p>
        <h1 className="mt-4 text-3xl font-semibold text-white">Seu preenchimento está protegido.</h1>
        <p className="mt-4 leading-7 text-[#AEB2B9]">
          Reconecte-se para sincronizar as respostas pendentes. Não conclua a anamnese até visualizar o estado “Salvo”.
        </p>
      </div>
    </section>
  );
}
