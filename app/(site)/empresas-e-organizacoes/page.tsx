import {
  metadataForPremiumPage,
  PremiumReferencePage
} from "@/components/premium-reference-page";

export const metadata = metadataForPremiumPage("empresas-e-organizacoes");

export default function Page() {
  return <PremiumReferencePage slug="empresas-e-organizacoes" />;
}
