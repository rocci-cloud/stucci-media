import type { MetadataRoute } from "next";

// www, not the apex domain — see the PRODUCTION_URL comment in
// app/lib/auth.ts.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.stuccimedia.com";

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
