import { prisma } from "./prisma";
import type { ArticleStatus } from "@prisma/client";
import type { ArticleStatusValue } from "./articles";

export type PodcastEpisode = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  episodeNumber: number | null;
  seasonNumber: number | null;
  audioUrl: string | null;
  durationSeconds: number | null;
  coverImageUrl: string | null;
  showNotes: string;
  transcript: string;
  guestName: string | null;
  guestBio: string | null;
  status: ArticleStatusValue;
  publishedAt: string | null;
  date: string;
  createdAt: string;
  updatedAt: string;
};

export type PodcastEpisodeInput = {
  slug: string;
  title: string;
  subtitle: string | null;
  episodeNumber: number | null;
  seasonNumber: number | null;
  audioUrl: string | null;
  durationSeconds: number | null;
  coverImageUrl: string | null;
  showNotes: string;
  transcript: string;
  guestName: string | null;
  guestBio: string | null;
  status: ArticleStatusValue;
  publishedAt: string | null;
};

// Episodes reuse the article_status enum rather than introducing a
// near-identical podcast_status: the pipeline is genuinely the same
// (draft → review → published → archived) and one shared vocabulary keeps
// the admin's status filters and badges consistent across both.
function toStatus(status: ArticleStatus): ArticleStatusValue {
  switch (status) {
    case "PUBLISHED":
      return "published";
    case "IN_REVIEW":
      return "in_review";
    case "ARCHIVED":
      return "archived";
    default:
      return "draft";
  }
}

function toPrismaStatus(status: ArticleStatusValue): ArticleStatus {
  switch (status) {
    case "published":
      return "PUBLISHED";
    case "in_review":
      return "IN_REVIEW";
    case "archived":
      return "ARCHIVED";
    default:
      return "DRAFT";
  }
}

// Re-exported for existing server-side importers — the functions
// themselves live in a Prisma-free module so client components can use
// them without dragging this file's `prisma` import into the browser
// bundle. See lib/podcast-duration.ts.
export { formatDuration, parseDuration } from "./podcast-duration";

type EpisodeRow = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  episodeNumber: number | null;
  seasonNumber: number | null;
  audioUrl: string | null;
  durationSeconds: number | null;
  coverImageUrl: string | null;
  showNotes: string;
  transcript: string;
  guestName: string | null;
  guestBio: string | null;
  status: ArticleStatus;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

function mapRow(row: EpisodeRow): PodcastEpisode {
  return {
    ...row,
    status: toStatus(row.status),
    publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
    date: (row.publishedAt ?? row.createdAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getAllEpisodesAdmin(): Promise<PodcastEpisode[]> {
  const rows = await prisma.podcastEpisode.findMany({
    where: { deletedAt: null },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  });
  return rows.map(mapRow);
}

export async function getPublishedEpisodes(): Promise<PodcastEpisode[]> {
  const rows = await prisma.podcastEpisode.findMany({
    where: { status: "PUBLISHED", publishedAt: { lte: new Date() }, deletedAt: null },
    orderBy: { publishedAt: "desc" },
  });
  return rows.map(mapRow);
}

export async function getEpisodeById(id: string): Promise<PodcastEpisode | undefined> {
  const row = await prisma.podcastEpisode.findUnique({ where: { id } });
  return row ? mapRow(row) : undefined;
}

function toData(input: PodcastEpisodeInput, existingPublishedAt?: Date | null) {
  const status = toPrismaStatus(input.status);
  return {
    slug: input.slug,
    title: input.title,
    subtitle: input.subtitle,
    episodeNumber: input.episodeNumber,
    seasonNumber: input.seasonNumber,
    audioUrl: input.audioUrl,
    durationSeconds: input.durationSeconds,
    coverImageUrl: input.coverImageUrl,
    showNotes: input.showNotes,
    transcript: input.transcript,
    guestName: input.guestName,
    guestBio: input.guestBio,
    status,
    // Same rule as articles: an explicit date wins, publishing without one
    // stamps now, and any other status keeps whatever date is already set.
    publishedAt: input.publishedAt
      ? new Date(input.publishedAt)
      : status === "PUBLISHED"
        ? existingPublishedAt ?? new Date()
        : existingPublishedAt ?? null,
  };
}

export async function createEpisode(input: PodcastEpisodeInput): Promise<PodcastEpisode> {
  const row = await prisma.podcastEpisode.create({ data: toData(input) });
  return mapRow(row);
}

export async function updateEpisode(id: string, input: PodcastEpisodeInput): Promise<PodcastEpisode> {
  const existing = await prisma.podcastEpisode.findUnique({ where: { id }, select: { publishedAt: true } });
  const row = await prisma.podcastEpisode.update({
    where: { id },
    data: toData(input, existing?.publishedAt ?? null),
  });
  return mapRow(row);
}

/** Soft delete, same contract as articles. */
export async function deleteEpisode(id: string): Promise<void> {
  await prisma.podcastEpisode.update({ where: { id }, data: { deletedAt: new Date() } });
}
