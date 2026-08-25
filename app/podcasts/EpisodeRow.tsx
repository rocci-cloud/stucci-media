import FeedImage from "./FeedImage";
import Link from "next/link";
import { formatDuration } from "../lib/podcast-duration";
import { episodeTeaser } from "../lib/podcast-text";
import PlayButton from "./PlayButton";
import type { PlayableEpisode } from "./PlayerProvider";

type RowEpisode = {
  id: string;
  slug: string;
  title: string;
  description: string;
  audioUrl: string | null;
  durationSeconds: number | null;
  episodeNumber: number | null;
  date: string;
  coverImageUrl: string | null;
};

/**
 * One episode in a list. Used both inside a show (where the show name is
 * already established by the page) and across the network on the hub,
 * where `showTitle` gives each row its attribution.
 */
export default function EpisodeRow({
  episode,
  showSlug,
  showTitle,
  withShowName = false,
  withArt = false,
}: {
  episode: RowEpisode;
  showSlug: string;
  showTitle: string;
  withShowName?: boolean;
  withArt?: boolean;
}) {
  const href = `/podcasts/${showSlug}/${episode.slug}`;
  const playable: PlayableEpisode | null = episode.audioUrl
    ? {
        id: episode.id,
        title: episode.title,
        audioUrl: episode.audioUrl,
        durationSeconds: episode.durationSeconds,
        showTitle,
        showSlug,
        episodeSlug: episode.slug,
        coverImageUrl: episode.coverImageUrl,
      }
    : null;

  const teaser = episodeTeaser(episode.description, 180);

  return (
    <article className="flex items-start gap-3 bg-white px-4 py-4 transition-colors hover:bg-[var(--color-bg-off)] sm:gap-4 sm:px-5">
      <div className="pt-0.5">
        <PlayButton episode={playable} variant="row" />
      </div>

      {withArt && (
        <Link href={`/podcasts/${showSlug}`} className="relative hidden h-14 w-14 shrink-0 overflow-hidden rounded-[6px] ring-1 ring-black/5 sm:block">
          {episode.coverImageUrl ? (
            <FeedImage src={episode.coverImageUrl} alt={showTitle} fill sizes="56px" className="img-cinematic object-cover" />
          ) : (
            <span className="img-placeholder block h-full w-full" />
          )}
        </Link>
      )}

      <div className="min-w-0 flex-1">
        {withShowName && (
          <Link
            href={`/podcasts/${showSlug}`}
            className="font-sans text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--color-red)] hover:underline"
          >
            {showTitle}
          </Link>
        )}

        <h3 className={withShowName ? "mt-1" : ""}>
          <Link
            href={href}
            className="font-headline text-[16px] font-bold leading-[1.2] tracking-[-0.01em] transition-colors hover:text-[var(--color-red)] sm:text-[18px]"
          >
            {episode.title}
          </Link>
        </h3>

        {teaser && (
          <p className="mt-1.5 line-clamp-2 font-sans text-[13.5px] leading-[1.55] text-[var(--color-gray)]">
            {teaser}
          </p>
        )}

        <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 font-sans text-[11px] uppercase tracking-[0.05em] text-[var(--color-gray-light)]">
          {episode.episodeNumber !== null && (
            <>
              <span>Ep. {episode.episodeNumber}</span>
              <span aria-hidden className="text-[var(--color-hairline-strong)]/30">•</span>
            </>
          )}
          {episode.date && <span>{episode.date}</span>}
          {episode.durationSeconds !== null && (
            <>
              <span aria-hidden className="text-[var(--color-hairline-strong)]/30">•</span>
              <span>{formatDuration(episode.durationSeconds)}</span>
            </>
          )}
        </p>
      </div>
    </article>
  );
}
