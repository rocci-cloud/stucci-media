import Link from "next/link";
import FeedImage from "../../podcasts/FeedImage";
import type { Podcast } from "../../lib/podcasts";
import { timeAgo } from "../../lib/time-ago";

const NEW_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

// A show as a poster, not a pill.
//
// The old module listed eleven shows as outline chips, which gave the
// network's whole catalogue less visual weight than a single episode. Cover
// art is the thing a listener actually recognises, so the art is the card.
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
    <Link href={`/podcasts/${show.slug}`} className="group block min-h-11">
      <div className="relative aspect-square w-full overflow-hidden rounded-[8px] bg-white/5">
        {show.coverImageUrl ? (
          <FeedImage
            src={show.coverImageUrl}
            alt={show.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 300px"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
        )}

        {/* No LIVE badge: nothing in the feed data says a show is live, and
            a label that is always wrong is worse than no label. NEW is
            derived from a real publish date. */}
        {isNew && (
          <span className="absolute left-0 top-0 bg-[var(--color-red)] px-2 py-1 font-sans text-[11px] font-bold uppercase tracking-[0.08em] text-white">
            New
          </span>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/85 to-transparent" />
      </div>

      <h3 className="mt-2.5 font-headline text-[15px] font-bold uppercase leading-[1.12] tracking-[-0.01em] text-white transition-colors group-hover:text-[var(--color-red-ink)] line-clamp-2">
        {show.title}
      </h3>
      {show.author && (
        <div className="mt-0.5 font-sans text-[12px] text-white/55 line-clamp-1">{show.author}</div>
      )}
      <div className="mt-1 font-sans text-[12px] text-white/45">
        {latest ? `Latest: ${latest}` : `${show.episodeCount} episodes`}
      </div>
    </Link>
  );
}
