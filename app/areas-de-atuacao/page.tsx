import {
  metadataForPremiumPage,
  PremiumReferencePage
} from "@/components/premium-reference-page";

export const metadata = metadataForPremiumPage("areas-de-atuacao");

export default function Page() {
  return <PremiumReferencePage slug="areas-de-atuacao" />;
}
