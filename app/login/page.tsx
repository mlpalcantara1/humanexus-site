import { permanentRedirect } from "next/navigation";

export default function LoginRedirectPage() {
  permanentRedirect("/contato");
}
