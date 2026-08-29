import { getActivePodcasts } from "../../lib/podcasts";
import { buildUrlset, xmlResponse, type SitemapEntry } from "../../lib/sitemap-xml";

// Show hub pages only — a few dozen at most, each a real landing page for a
// show. Split from the episode archive so Search Console reports the two
// separately: the hubs are worth indexing even in the case where the
// episodes never are.
export const revalidate = 3600;

export async function GET() {
  const podcasts = await getActivePodcasts();

  const entries: SitemapEntry[] = podcasts.map((p) => ({
    path: `/podcasts/${p.slug}`,
    lastModified: p.lastFetchedAt,
    changeFrequency: "daily",
    priority: 0.7,
  }));

  return xmlResponse(buildUrlset(entries), 3600);
}
