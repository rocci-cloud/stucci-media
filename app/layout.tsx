import type { Metadata } from "next";
import "@fontsource/oswald/400.css";
import "@fontsource/oswald/500.css";
import "@fontsource/oswald/600.css";
import "@fontsource/oswald/700.css";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://stuccimedia.com";
const title = "Stucci Media | Independent News That Matters";
const description =
  "Stucci Media: independent news and investigations from Florida — politics, world events, crime, veterans, social issues, and free speech, without the spin.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: "%s | Stucci Media",
  },
  description,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title,
    description,
    type: "website",
    images: ["/og-default.png"],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og-default.png"],
  },
};

// Sitewide Organization schema — present on every page (JSON-LD in <body>
// is fully valid; App Router's metadata API doesn't expose a slot for raw
// <script> tags in <head>, and Google explicitly supports structured data
// anywhere in the document). `@type` lists both "Organization" (the
// general type every NewsArticle's `publisher` should resolve to) and
// "NewsMediaOrganization" (schema.org's news-specific subtype, which
// Google's news-related rich results prefer) — a JSON-LD array of types is
// valid and lets this one object satisfy both. Per-article NewsArticle and
// BreadcrumbList schema live on the article/category pages themselves.
// `sameAs` only lists profiles that are real, verifiable links already
// used elsewhere on the site (SiteFooter's social icon) — never fabricate
// a social URL just to fill out the schema.
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": ["Organization", "NewsMediaOrganization"],
  name: "Stucci Media",
  url: siteUrl,
  logo: `${siteUrl}/og-default.png`,
  description,
  sameAs: ["https://www.facebook.com/RocciStucciMedia"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        {children}
      </body>
    </html>
  );
}
