import {
  metadataForPremiumPage,
  PremiumReferencePage
} from "@/components/premium-reference-page";

export const metadata = metadataForPremiumPage("o-instituto");

export default function Page() {
  return <PremiumReferencePage slug="o-instituto" />;
}
