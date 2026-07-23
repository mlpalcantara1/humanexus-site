import {
  metadataForPremiumPage,
  PremiumReferencePage
} from "@/components/premium-reference-page";
import { ContactFormBehavior } from "@/components/contact-form-behavior";

export const metadata = metadataForPremiumPage("contato");

export default function Page() {
  return <><PremiumReferencePage slug="contato" /><ContactFormBehavior /></>;
}
