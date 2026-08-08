import type { Metadata } from "next";
import "@fontsource/oswald/400.css";
import "@fontsource/oswald/500.css";
import "@fontsource/oswald/600.css";
import "@fontsource/oswald/700.css";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://stuccimedia.com";
const title = "Stucci Media — Independent News That Matters";
const description =
  "Independent news, analysis, and podcasts from Florida — the stories mainstream media won't run.";

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

// Sitewide NewsMediaOrganization schema — present on every page (JSON-LD
// in <body> is fully valid; App Router's metadata API doesn't expose a
// slot for raw <script> tags in <head>, and Google explicitly supports
// structured data anywhere in the document). Per-article NewsArticle and
// BreadcrumbList schema live on the article/category pages themselves.
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "NewsMediaOrganization",
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
