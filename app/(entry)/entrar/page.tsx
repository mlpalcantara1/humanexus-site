import { FormularioEntrada } from "@/components/formulario-entrada";

export default function EntrarPage() {
  return (
    <section className="platform-login min-h-[72vh] px-5 py-20">
      <div className="platform-login__media" aria-hidden="true" />
      <div className="relative mx-auto max-w-lg">
        <FormularioEntrada />
      </div>
    </section>
  );
}
