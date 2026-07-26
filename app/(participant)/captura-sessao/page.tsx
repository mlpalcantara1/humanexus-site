import { CapturaMultimodal } from "@/components/captura-multimodal";

export const metadata = {
  title: "Captura da sessão | HUMANEXUS",
  robots: { index: false, follow: false },
  referrer: "no-referrer"
};

export default async function CapturaDaSessao({
  searchParams
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token = "" } = await searchParams;
  if (!token) {
    return (
      <main className="hx-capture">
        <h1>Acesso de captura inválido</h1>
        <p>Solicite ao profissional um novo link ou código limitado.</p>
      </main>
    );
  }
  return <CapturaMultimodal token={token} />;
}
