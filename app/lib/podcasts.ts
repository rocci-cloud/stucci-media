import { prisma } from "./prisma";
import { slugify } from "./slugify";
import { cleanEpisodeTitle } from "./podcast-text";
import { fetchPodcastFeed, MAX_EPISODES_PER_FEED, type ParsedFeed } from "./podcast-feed";

export type Podcast = {
  id: string;
  slug: string;
  feedUrl: string;
  title: string;
  description: string;
  coverImageUrl: string | null;
  author: string | null;
  websiteUrl: string | null;
  language: string | null;
  isExplicit: boolean;
  categories: string[];
  isActive: boolean;
  sortOrder: number;
  lastFetchedAt: string | null;
  lastFetchError: string | null;
  episodeCount: number;
  createdAt: string;
  updatedAt: string;
};

export type PodcastEpisodeItem = {
  id: string;
  guid: string;
  slug: string;
  title: string;
  description: string;
  audioUrl: string | null;
  audioType: string | null;
  durationSeconds: number | null;
  imageUrl: string | null;
  episodeUrl: string | null;
  episodeNumber: number | null;
  seasonNumber: number | null;
  isExplicit: boolean;
  publishedAt: string | null;
  date: string;
};

type PodcastRow = {
  id: string;
  slug: string;
  feedUrl: string;
  title: string;
  description: string;
  coverImageUrl: string | null;
  author: string | null;
  websiteUrl: string | null;
  language: string | null;
  isExplicit: boolean;
  categories: string[];
  isActive: boolean;
  sortOrder: number;
  lastFetchedAt: Date | null;
  lastFetchError: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count?: { episodes: number };
};

function mapPodcast(row: PodcastRow): Podcast {
  return {
    ...row,
    lastFetchedAt: row.lastFetchedAt ? row.lastFetchedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    episodeCount: row._count?.episodes ?? 0,
  };
}

type EpisodeRow = {
  id: string;
  guid: string;
  slug: string;
  title: string;
  description: string;
  audioUrl: string | null;
  audioType: string | null;
  durationSeconds: number | null;
  imageUrl: string | null;
  episodeUrl: string | null;
  episodeNumber: number | null;
  seasonNumber: number | null;
  isExplicit: boolean;
  publishedAt: Date | null;
};

function mapEpisode(row: EpisodeRow): PodcastEpisodeItem {
  return {
    ...row,
    // Also cleaned here, not only on import. Episodes imported before the
    // parser learned to strip production suffixes still hold "…_mixdown"
    // in the database, and re-importing every feed to tidy display text
    // would be a worse trade than normalising on the way out. Idempotent,
    // so a title already cleaned on import passes through untouched.
    title: cleanEpisodeTitle(row.title),
    publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
    date: row.publishedAt
      ? row.publishedAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
      : "",
  };
}

const WITH_COUNT = { include: { _count: { select: { episodes: true } } } };

// --- Reads ---

export async function getAllPodcastsAdmin(): Promise<Podcast[]> {
  const rows = await prisma.podcast.findMany({
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    ...WITH_COUNT,
  });
  return rows.map(mapPodcast);
}

/** Public: only shows an editor has left active. */
export async function getActivePodcasts(): Promise<Podcast[]> {
  const rows = await prisma.podcast.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    ...WITH_COUNT,
  });
  return rows.map(mapPodcast);
}

export async function getPodcastBySlug(slug: string): Promise<Podcast | undefined> {
  const row = await prisma.podcast.findUnique({ where: { slug }, ...WITH_COUNT });
  return row ? mapPodcast(row) : undefined;
}

export async function getPodcastById(id: string): Promise<Podcast | undefined> {
  const row = await prisma.podcast.findUnique({ where: { id }, ...WITH_COUNT });
  return row ? mapPodcast(row) : undefined;
}

export async function getPodcastEpisodes(podcastId: string, limit = MAX_EPISODES_PER_FEED): Promise<PodcastEpisodeItem[]> {
  const rows = await prisma.podcastFeedEpisode.findMany({
    where: { podcastId },
    // Newest first. createdAt is the tiebreaker for feeds that omit
    // pubDate entirely, so ordering stays stable rather than arbitrary.
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: limit,
  });
  return rows.map(mapEpisode);
}

/** An episode plus the show it belongs to — the network-wide feed's unit. */
export type EpisodeWithShow = PodcastEpisodeItem & {
  show: { slug: string; title: string; author: string | null; coverImageUrl: string | null };
};

const SHOW_FIELDS = { select: { slug: true, title: true, author: true, coverImageUrl: true } };

/**
 * Newest episodes across every active show — the hub's cross-network feed.
 *
 * Ordered by publish date, so a show that posts daily naturally dominates
 * over one that posts monthly. That is the correct behaviour for a "latest"
 * rail; per-show balance is what the Shows grid is for.
 */
export async function getLatestEpisodes(limit = 12): Promise<EpisodeWithShow[]> {
  const rows = await prisma.podcastFeedEpisode.findMany({
    where: { podcast: { isActive: true } },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: limit,
    include: { podcast: SHOW_FIELDS },
  });
  return rows.map((row) => ({ ...mapEpisode(row), show: row.podcast }));
}

export async function getEpisodeBySlug(
  podcastSlug: string,
  episodeSlug: string
): Promise<EpisodeWithShow | undefined> {
  const row = await prisma.podcastFeedEpisode.findFirst({
    where: { slug: episodeSlug, podcast: { slug: podcastSlug, isActive: true } },
    include: { podcast: SHOW_FIELDS },
  });
  return row ? { ...mapEpisode(row), show: row.podcast } : undefined;
}

/**
 * The episodes either side of this one, for in-page navigation.
 *
 * "Newer" and "older" are by publish date, matching the order every episode
 * list on the site uses, so next/previous move the way the list reads.
 * Episodes with no pubDate at all sort last and simply get no neighbours.
 */
export async function getAdjacentEpisodes(
  podcastId: string,
  publishedAt: string | null
): Promise<{ newer?: PodcastEpisodeItem; older?: PodcastEpisodeItem }> {
  if (!publishedAt) return {};
  const at = new Date(publishedAt);
  const [newer, older] = await Promise.all([
    prisma.podcastFeedEpisode.findFirst({
      where: { podcastId, publishedAt: { gt: at } },
      orderBy: { publishedAt: "asc" },
    }),
    prisma.podcastFeedEpisode.findFirst({
      where: { podcastId, publishedAt: { lt: at } },
      orderBy: { publishedAt: "desc" },
    }),
  ]);
  return {
    ...(newer ? { newer: mapEpisode(newer) } : {}),
    ...(older ? { older: mapEpisode(older) } : {}),
  };
}

/**
 * Active shows bucketed by the categories their feeds declare.
 *
 * A show appears under every category it lists, not just its first — that
 * is how Apple and Spotify both treat iTunes categories, and a politics
 * show that is also true crime genuinely belongs in both. Buckets are
 * ordered by size so the network's real centre of gravity leads, and a
 * category holding only one show is dropped: a "browse by topic" row of
 * one-item groups is noise, not navigation.
 */
export async function getShowsByCategory(): Promise<{ category: string; shows: Podcast[] }[]> {
  const shows = await getActivePodcasts();
  const buckets = new Map<string, Podcast[]>();
  for (const show of shows) {
    // Guard against a show landing in the same bucket twice. The parser
    // dedupes on import, but rows imported before that fix still hold
    // repeated categories, and re-importing every feed to clean data is a
    // worse answer than not trusting the array here.
    const placed = new Set<string>();
    for (const category of show.categories) {
      const key = category.trim();
      if (!key || placed.has(key.toLowerCase())) continue;
      placed.add(key.toLowerCase());
      const bucket = buckets.get(key);
      if (bucket) bucket.push(show);
      else buckets.set(key, [show]);
    }
  }
  return [...buckets.entries()]
    .filter(([, group]) => group.length > 1)
    .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))
    .map(([category, group]) => ({ category, shows: group }));
}

/**
 * Every episode's URL and last-changed date, for the sitemap.
 *
 * Deliberately a narrow select rather than reusing getPodcastEpisodes:
 * a sitemap needs two columns per row across the whole network, and
 * pulling full descriptions for hundreds of episodes to throw them away
 * would be the expensive way to build one.
 */
export async function getEpisodeSitemapEntries(): Promise<
  { showSlug: string; episodeSlug: string; publishedAt: Date | null }[]
> {
  const rows = await prisma.podcastFeedEpisode.findMany({
    where: { podcast: { isActive: true } },
    orderBy: { publishedAt: "desc" },
    select: { slug: true, publishedAt: true, podcast: { select: { slug: true } } },
  });
  return rows.map((row) => ({
    showSlug: row.podcast.slug,
    episodeSlug: row.slug,
    publishedAt: row.publishedAt,
  }));
}

// --- Writes ---

/**
 * Finds a slug not already taken, starting from the feed's title. Called
 * only on first import — a later refresh never re-slugs, since the slug is
 * the show's public URL and an upstream title tweak shouldn't break links.
 */
async function uniqueSlug(title: string): Promise<string> {
  const base = slugify(title).slice(0, 80) || "podcast";
  let slug = base;
  for (let n = 2; await prisma.podcast.findUnique({ where: { slug }, select: { id: true } }); n += 1) {
    slug = `${base}-${n}`;
  }
  return slug;
}

/**
 * Syncs a parsed feed's episodes into the database.
 *
 * Upsert keyed on the feed's own guid, then delete whatever is no longer
 * in the feed. This used to delete every episode and re-insert them, which
 * was simpler and fine while nothing referenced these rows — but comments
 * and likes now hang off an episode's id, and a wholesale replace would
 * cascade-delete every one of them on the next refresh. Episode rows have
 * to survive a refresh, so identity comes from the guid rather than from
 * whatever cuid happened to be minted last time.
 *
 * Still wrapped in a transaction: a failure part-way through must not
 * leave a show holding half a feed.
 */
async function replaceEpisodes(podcastId: string, feed: ParsedFeed): Promise<number> {
  const episodes = withEpisodeSlugs(feed.episodes);
  const guids = episodes.map((episode) => episode.guid);

  await prisma.$transaction([
    // Episodes the publisher pulled. Without this they would sit on the
    // site forever, which is what an upsert-only sync gets wrong.
    prisma.podcastFeedEpisode.deleteMany({
      where: { podcastId, guid: { notIn: guids.length > 0 ? guids : [""] } },
    }),
    ...episodes.map((episode) =>
      prisma.podcastFeedEpisode.upsert({
        where: { podcastId_guid: { podcastId, guid: episode.guid } },
        create: { podcastId, ...episode },
        // Everything except the guid is the publisher's to change: they
        // retitle, fix descriptions, and re-cut audio after publishing.
        update: { ...episode },
      })
    ),
  ]);

  return episodes.length;
}

/**
 * Assigns each episode the URL segment its page is served from.
 *
 * Derived from the title rather than the feed's guid, which is unique but
 * routinely a full URL or a UUID and so can't sit in a path. Because
 * `replaceEpisodes` deletes and re-inserts on every refresh, this has to be
 * deterministic: the same feed must produce the same slugs each time, or
 * every refresh would silently break every episode link. Collisions within
 * a show (publishers reuse titles more than you would think) get a -2, -3
 * suffix in feed order, and a title that slugifies to nothing falls back to
 * its episode number so the row is still addressable.
 */
function withEpisodeSlugs<T extends { title: string; episodeNumber: number | null }>(
  episodes: T[]
): (T & { slug: string })[] {
  const seen = new Map<string, number>();
  return episodes.map((episode, index) => {
    const base =
      slugify(episode.title).slice(0, 80) ||
      (episode.episodeNumber !== null ? `episode-${episode.episodeNumber}` : `episode-${index + 1}`);
    const priorUses = seen.get(base) ?? 0;
    seen.set(base, priorUses + 1);
    return { ...episode, slug: priorUses === 0 ? base : `${base}-${priorUses + 1}` };
  });
}

export type ImportResult = { podcast: Podcast; episodeCount: number };

/** First-time import of a feed URL. */
export async function importPodcastFromFeed(feedUrl: string): Promise<ImportResult> {
  const feed = await fetchPodcastFeed(feedUrl);
  const slug = await uniqueSlug(feed.title);

  const created = await prisma.podcast.create({
    data: {
      slug,
      feedUrl,
      title: feed.title,
      description: feed.description,
      coverImageUrl: feed.coverImageUrl,
      author: feed.author,
      websiteUrl: feed.websiteUrl,
      language: feed.language,
      isExplicit: feed.isExplicit,
      categories: feed.categories,
      lastFetchedAt: new Date(),
    },
  });

  const episodeCount = await replaceEpisodes(created.id, feed);
  const podcast = await getPodcastById(created.id);
  return { podcast: podcast!, episodeCount };
}

/**
 * Re-fetches a show's feed and replaces its content.
 *
 * A failure is recorded on the row and re-thrown rather than swallowed:
 * the admin needs to see *why* a show went stale, and the previously
 * imported episodes are deliberately left in place so a temporarily
 * unreachable feed doesn't blank out a live page.
 */
export async function refreshPodcast(id: string): Promise<ImportResult> {
  const existing = await prisma.podcast.findUniqueOrThrow({ where: { id } });

  let feed: ParsedFeed;
  try {
    feed = await fetchPodcastFeed(existing.feedUrl);
  } catch (error) {
    await prisma.podcast.update({
      where: { id },
      data: {
        lastFetchedAt: new Date(),
        lastFetchError: error instanceof Error ? error.message.slice(0, 500) : "Unknown error",
      },
    });
    throw error;
  }

  await prisma.podcast.update({
    where: { id },
    data: {
      // Slug and the editor-owned fields (isActive, sortOrder) are
      // intentionally absent — the feed owns content, not presentation.
      title: feed.title,
      description: feed.description,
      coverImageUrl: feed.coverImageUrl,
      author: feed.author,
      websiteUrl: feed.websiteUrl,
      language: feed.language,
      isExplicit: feed.isExplicit,
      categories: feed.categories,
      lastFetchedAt: new Date(),
      lastFetchError: null,
    },
  });

  const episodeCount = await replaceEpisodes(id, feed);
  const podcast = await getPodcastById(id);
  return { podcast: podcast!, episodeCount };
}

export async function setPodcastActive(id: string, isActive: boolean): Promise<void> {
  await prisma.podcast.update({ where: { id }, data: { isActive } });
}

export async function updatePodcastPresentation(
  id: string,
  input: { slug?: string; sortOrder?: number }
): Promise<void> {
  await prisma.podcast.update({ where: { id }, data: input });
}

/** Cascades its episodes via the FK. */
export async function deletePodcast(id: string): Promise<void> {
  await prisma.podcast.delete({ where: { id } });
}
