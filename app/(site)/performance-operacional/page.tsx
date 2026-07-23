import {
  metadataForPremiumPage,
  PremiumReferencePage
} from "@/components/premium-reference-page";

export const metadata = metadataForPremiumPage("performance-operacional");

export default function Page() {
  return <PremiumReferencePage slug="performance-operacional" />;
}
