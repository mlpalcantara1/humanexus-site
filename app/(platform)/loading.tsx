export default function PlatformLoading() {
  return (
    <section className="hx-recovery hx-recovery--loading" role="status" aria-live="polite">
      <div className="hx-recovery__signal" aria-hidden="true"><i /><i /><i /></div>
      <p>HUMANEXUS / CONTEXTO PROTEGIDO</p>
      <h1>Preparando o módulo</h1>
      <span>A estrutura e o contexto permanecem disponíveis enquanto os dados são consultados.</span>
    </section>
  );
}
