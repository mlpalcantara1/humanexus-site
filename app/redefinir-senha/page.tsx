import { Suspense } from "react";
import { FormularioRedefinicao } from "@/components/formulario-redefinicao";

export default function RedefinirSenhaPage() {
  return (
    <main className="mx-auto min-h-[75vh] max-w-xl px-5 py-16 sm:py-24">
      <Suspense>
        <FormularioRedefinicao />
      </Suspense>
    </main>
  );
}
