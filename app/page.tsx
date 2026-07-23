import {
  metadataForPremiumPage,
  PremiumReferencePage
} from "@/components/premium-reference-page";

export const metadata = metadataForPremiumPage("home");

export default function HomePage() {
  return <PremiumReferencePage slug="home" />;
}
