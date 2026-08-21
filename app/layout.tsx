import type { Metadata } from "next";
// Variable faces, not four fixed weights each. Oswald was previously
// imported at 400/500/600/700 while essentially every headline on the site
// asks for 700, so three of those files were dead payload — and dropping
// them risked browser-synthesised weights wherever prose set its own. One
// variable file per family covers the whole range instead, and Archivo now
// gives the UI chrome a real typeface rather than the visitor's OS default.
import "@fontsource-variable/oswald";
import "@fontsource-variable/archivo";
import "./globals.css";
// Traffic, referrers and Core Web Vitals. Neither sets a cookie. Both are
// mounted in production only: in development they fetch a debug script from
// Vercel's CDN, which just adds two failed requests and console errors to
// every local page load.
import { Analytics } from "@vercel/analytics/next";
import AnalyticsTracker from "./components/AnalyticsTracker";
import NewsletterModal from "./components/NewsletterModal";
import { SpeedInsights } from "@vercel/speed-insights/next";

// www, not the apex domain — see the PRODUCTION_URL comment in
// app/lib/auth.ts for why: Vercel's own domain config redirects the
// apex domain to www at the platform edge, so www is the real
// canonical host.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.stuccimedia.com";
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
    // Feed autodiscovery — this is what a reader, aggregator or browser
    // extension looks for to offer "subscribe" on any page of the site.
    types: {
      "application/rss+xml": [{ url: "/feed.xml", title: "Stucci Media" }],
    },
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
  // suppressHydrationWarning below is scoped to <html>'s own attributes and
  // is the documented next-themes fix: the admin's ThemeProvider writes
  // class="dark" onto <html> from an inline script before React hydrates, so
  // the server markup legitimately differs from the client on this one
  // element. Without it, every admin page logs a hydration mismatch. It does
  // not suppress warnings for any child content.
  return (
    <html lang="en" suppressHydrationWarning>
      <body style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
        {/* First focusable element on every page. Without it a keyboard or
            screen-reader user tabs through the breaking ticker, the wordmark,
            every nav item, the More dropdown, search, sign-in, register and
            subscribe before reaching the first headline — on every page. */}
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        {children}
        {process.env.NODE_ENV === "production" && (
          <>
            <AnalyticsTracker />
            <NewsletterModal />
            <Analytics />
            <SpeedInsights />
          </>
        )}
      </body>
    </html>
  );
}
