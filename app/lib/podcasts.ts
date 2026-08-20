import { prisma } from "./prisma";
import { slugify } from "./slugify";
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
 * Writes a parsed feed's episodes, replacing whatever was there before.
 *
 * Delete-then-insert rather than a per-episode upsert: the feed is the
 * only source of truth here, nothing else references these rows, and a
 * wholesale replace is the one approach that also handles episodes the
 * publisher *removed* — an upsert-only sync would leave those orphaned
 * on the site forever. Wrapped in a transaction so a failure mid-way
 * can't leave a show with no episodes at all.
 */
async function replaceEpisodes(podcastId: string, feed: ParsedFeed): Promise<number> {
  await prisma.$transaction([
    prisma.podcastFeedEpisode.deleteMany({ where: { podcastId } }),
    prisma.podcastFeedEpisode.createMany({
      data: feed.episodes.map((episode) => ({ podcastId, ...episode })),
    }),
  ]);
  return feed.episodes.length;
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
