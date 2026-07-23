import { AnamneseParticipante } from "@/components/anamnese-participante";

export default async function ConvitePage({
  params
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <AnamneseParticipante token={token} />;
}
