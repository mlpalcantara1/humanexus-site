"use client";

import { PlatformErrorState } from "@/components/platform-error-state";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="pt-BR">
      <body>
        <main className="hx-app hx-app--executive">
          <PlatformErrorState tentarNovamente={reset} mensagem="A interface foi preservada. Tente restabelecer o módulo sem recarregar dados operacionais." />
        </main>
      </body>
    </html>
  );
}
