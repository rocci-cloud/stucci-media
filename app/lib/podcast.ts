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

/** "1:04:32" / "48:10" — seconds are how it's stored, this is for display. */
export function formatDuration(seconds: number | null): string {
  if (!seconds || seconds <= 0) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/** Accepts "48:10", "1:04:32", or a plain seconds count. Returns null if unparseable. */
export function parseDuration(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const parts = trimmed.split(":").map((p) => Number(p.trim()));
  if (parts.some((n) => !Number.isFinite(n) || n < 0)) return null;
  if (parts.length === 1) return Math.round(parts[0]);
  if (parts.length === 2) return Math.round(parts[0] * 60 + parts[1]);
  if (parts.length === 3) return Math.round(parts[0] * 3600 + parts[1] * 60 + parts[2]);
  return null;
}

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
