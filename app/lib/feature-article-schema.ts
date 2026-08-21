// Structured data for the /feature-article service page.
//
// Kept in its own Prisma-free module so it can be unit tested: a malformed
// FAQPage or a price that drifts out of sync with the page loses rich
// results silently, with nothing failing and no error to notice.

export const FEATURE_ARTICLE_PRICE = "125";

/**
 * Structured data, generated from the same arrays the page renders.
 *
 * Built from those constants rather than hand-written alongside them
 * specifically so the two cannot drift: schema that claims a price or an
 * answer the page no longer shows is worse than none, because it is what
 * search and answer engines quote back at people.
 *
 * FAQPage is the highest-value piece here. It is the structure Google uses
 * for FAQ rich results and the one answer engines lift directly when
 * somebody asks a question this page already answers in plain language.
 */
export function buildFeatureArticleSchema(
  siteUrl: string,
  turnaround: string,
  faqList: { q: string; a: string }[],
) {
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${siteUrl}/feature-article#service`,
    name: "Feature Article Writing",
    serviceType: "Professional article writing and publication",
    description: `A full-length, professionally written feature article about your business, brand, event or organisation, optimised for search and published permanently on Stucci Media. Typically published within ${turnaround}.`,
    provider: { "@id": `${siteUrl}/#organization` },
    areaServed: { "@type": "Country", name: "United States" },
    url: `${siteUrl}/feature-article`,
    offers: {
      "@type": "Offer",
      price: FEATURE_ARTICLE_PRICE,
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: `${siteUrl}/feature-article`,
      category: "Content marketing",
    },
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${siteUrl}/feature-article#faq`,
    mainEntity: faqList.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      {
        "@type": "ListItem",
        position: 2,
        name: "Get Featured",
        item: `${siteUrl}/feature-article`,
      },
    ],
  };

  return [serviceSchema, faqSchema, breadcrumbSchema];
}
