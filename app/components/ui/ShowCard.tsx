import Link from "next/link";
import FeedImage from "../../podcasts/FeedImage";
import type { Podcast } from "../../lib/podcasts";
import { timeAgo } from "../../lib/time-ago";

const NEW_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

// A show as a small poster in a horizontal shelf.
//
// Sized for a carousel rather than a grid: at four across a 1440 container
// these were ~340px squares, which gave eleven shows more vertical space
// than the entire episode grid below them. A fixed ~160px tile scrolls
// instead, so the whole catalogue fits one row and the section stops being
// dominated by artwork.
export default function ShowCard({
  show,
  latestEpisodeAt,
}: {
  show: Podcast;
  /** Newest publish date for this show, when it has one. */
  latestEpisodeAt?: string;
}) {
  const latest = latestEpisodeAt ? timeAgo(latestEpisodeAt) : null;
  const isNew = latestEpisodeAt
    ? Date.now() - new Date(latestEpisodeAt).getTime() < NEW_WINDOW_MS
    : false;

  return (
    <Link
      href={`/podcasts/${show.slug}`}
      className="group block w-[142px] shrink-0 snap-start sm:w-[164px]"
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-[8px] bg-white/5">
        {show.coverImageUrl ? (
          <FeedImage
            src={show.coverImageUrl}
            alt={show.title}
            fill
            sizes="164px"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
        )}

        {/* No LIVE badge: nothing in the feed data says a show is live, and
            a label that is always wrong is worse than no label. NEW is
            derived from a real publish date. */}
        {isNew && (
          <span className="absolute left-0 top-0 bg-[var(--color-red)] px-1.5 py-0.5 font-sans text-[10px] font-bold uppercase tracking-[0.07em] text-white">
            New
          </span>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent" />
      </div>

      <h3 className="mt-2 font-headline text-[13px] font-bold uppercase leading-[1.15] tracking-[-0.01em] text-white transition-colors group-hover:text-[var(--color-red-ink)] line-clamp-2">
        {show.title}
      </h3>
      <div className="mt-0.5 font-sans text-[11px] text-white/45 line-clamp-1">
        {latest ? `Latest: ${latest}` : `${show.episodeCount} episodes`}
      </div>
    </Link>
  );
}
