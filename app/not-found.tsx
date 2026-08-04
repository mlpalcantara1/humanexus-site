import Link from "next/link";

export default function NotFound() {
  return (
    <main className="hx-app hx-app--executive">
      <section className="hx-recovery">
        <p>HUMANEXUS / NAVEGAÇÃO</p>
        <h1>Módulo não encontrado</h1>
        <span>O endereço não corresponde a um módulo disponível nesta versão.</span>
        <div><Link href="/plataforma/painel">Retornar ao Painel de Comando</Link></div>
      </section>
    </main>
  );
}
