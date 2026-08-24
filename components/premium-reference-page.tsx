import type { Metadata } from "next";
import { premiumPages } from "@/lib/premium-pages.generated";
import { portuguesNoHtmlVisivel, portuguesVisivel } from "@/lib/portugues-visivel";

export type PremiumPageSlug = keyof typeof premiumPages;

export function metadataForPremiumPage(slug: PremiumPageSlug): Metadata {
  const page = premiumPages[slug];

  return {
    title: portuguesVisivel(page.title),
    description: portuguesVisivel(page.description),
    alternates: {
      canonical: slug === "home" ? "/" : `/${slug}`
    }
  };
}

export function PremiumReferencePage({ slug }: { slug: PremiumPageSlug }) {
  const page = premiumPages[slug];

  return (
    <main
      className={page.className}
      dangerouslySetInnerHTML={{ __html: portuguesNoHtmlVisivel(page.html) }}
    />
  );
}
