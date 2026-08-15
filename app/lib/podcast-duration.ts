// Episode-duration formatting/parsing, kept Prisma-free so client
// components (EpisodeEditor's duration field, PodcastClient's list
// column) can import these pure functions without dragging
// lib/podcast.ts's `prisma` import — and its DATABASE_URL check — into
// the browser bundle. Same fix as lib/article-status.ts.

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
