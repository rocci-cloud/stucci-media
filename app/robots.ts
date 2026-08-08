import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://stuccimedia.com";

// /admin and /api are genuinely private/functional — everything else
// (including /search, /login, /register) stays crawlable, but those
// three set their own per-page `noindex` in generateMetadata/metadata
// so link equity still flows through without junk pages in search
// results — the more correct approach than blanket-blocking them here.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/api/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
