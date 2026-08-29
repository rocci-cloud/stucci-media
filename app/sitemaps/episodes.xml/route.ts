import { getEpisodeSitemapEntries } from "../../lib/podcasts";
import { buildUrlset, xmlResponse, type SitemapEntry } from "../../lib/sitemap-xml";

// Every episode page, ~840 of them and growing with each feed refresh.
//
// Isolated here on purpose. The descriptions come from the shows' own RSS
// feeds, so this is syndicated text competing for the crawl budget of a
// domain that has very little to spend — left mixed in with the articles it
// buried them nine to one. Keeping it in its own child means Search Console
// reports it separately, and if it turns out to be soaking crawl without
// earning indexation, this one route can be dropped from the index in
// app/sitemap.xml without touching anything else. The pages stay crawlable
// via the show hubs either way; a sitemap is a request, not the only door.
//
// lastModified is the publish date: feed episodes are not edited in place
// here, they are replaced wholesale on refresh.
export const revalidate = 3600;

export async function GET() {
  const episodes = await getEpisodeSitemapEntries();

  const entries: SitemapEntry[] = episodes.map((e) => ({
    path: `/podcasts/${e.showSlug}/${e.episodeSlug}`,
    lastModified: e.publishedAt,
    changeFrequency: "monthly",
    priority: 0.4,
  }));

  return xmlResponse(buildUrlset(entries), 3600);
}
