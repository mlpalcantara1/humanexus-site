import {
  metadataForPremiumPage,
  PremiumReferencePage
} from "@/components/premium-reference-page";

export const metadata = metadataForPremiumPage("solucoes");

export default function Page() {
  return <PremiumReferencePage slug="solucoes" />;
}
