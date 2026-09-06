import type { Metadata } from "next";
import { site } from "@/content/site";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || site.url;

export function canonical(path: string) {
  return new URL(path, SITE_URL).toString();
}

export function pageMetadata({
  title,
  description,
  path,
  image = "/images/brand/ddg-social-share.png",
  noindex = false,
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
  noindex?: boolean;
}): Metadata {
  const url = canonical(path);
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: noindex ? { index: false, follow: true } : undefined,
    openGraph: {
      type: "website",
      siteName: site.name,
      title,
      description,
      url,
      images: [{ url: new URL(image, SITE_URL).toString(), width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [new URL(image, SITE_URL).toString()],
    },
  };
}

/**
 * LocalBusiness schema. No competitor in this market publishes any structured
 * data at all, so this is a cheap, durable advantage.
 *
 * Deliberately omitted until the client confirms them: aggregateRating,
 * foundingDate, and priceRange. Inventing any of those on a trust-based trade
 * site is worse than leaving the field out.
 */
export function localBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "HomeAndConstructionBusiness"],
    "@id": `${SITE_URL}/#business`,
    name: site.name,
    description:
      "Drainage-first gravel driveway grading, drainage correction, rut and washout repair, and private road maintenance for rural and mountain properties in La Plata County, Colorado.",
    url: SITE_URL,
    telephone: `+1-970-360-3346`,
    email: site.email,
    image: canonical("/images/brand/ddg-social-share.png"),
    founder: { "@type": "Person", name: site.owner },
    sameAs: [site.facebook],
    address: {
      "@type": "PostalAddress",
      addressLocality: site.baseCity,
      addressRegion: site.baseRegion,
      addressCountry: "US",
    },
    areaServed: [
      "Durango, CO", "Bayfield, CO", "Hesperus, CO", "Ignacio, CO",
      "Durango Hills, CO", "Forest Lakes, CO", "Vallecito, CO", "La Plata County, CO",
    ].map((name) => ({ "@type": "Place", name })),
    knowsAbout: [
      "gravel driveway grading",
      "driveway drainage correction",
      "crown restoration",
      "culvert flow restoration",
      "private road maintenance",
    ],
  };
}

export function serviceSchema(s: {
  name: string;
  slug: string;
  seoDescription: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: s.name,
    description: s.seoDescription,
    url: canonical(`/services/${s.slug}`),
    provider: { "@id": `${SITE_URL}/#business` },
    areaServed: { "@type": "AdministrativeArea", name: "La Plata County, Colorado" },
    serviceType: s.name,
  };
}

export function faqSchema(faqs: readonly { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: canonical(item.path),
    })),
  };
}

export function JsonLd({ data }: { data: object | object[] }) {
  const payload = Array.isArray(data) ? data : [data];
  return (
    <>
      {payload.map((d, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(d) }}
        />
      ))}
    </>
  );
}
