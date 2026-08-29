import Link from "next/link";
import { Headphones } from "lucide-react";
import FeedImage from "../podcasts/FeedImage";
import { formatDuration } from "../lib/podcast-duration";
import { episodeTeaser } from "../lib/podcast-text";
import type { EpisodeWithShow, Podcast } from "../lib/podcasts";
import PlayButton from "../podcasts/PlayButton";
import type { PlayableEpisode } from "../podcasts/PlayerProvider";
import ShowCard from "./ui/ShowCard";
import EpisodeCard from "./ui/EpisodeCard";

/**
 * The homepage's listen desk.
 *
 * Deliberately the only dark module in the stack: audio is a different kind
 * of thing to consume, and its own surface is what stops it reading as
 * another row of headlines.
 *
 * Rebuilt from a featured episode, a text-only list and a cloud of outline
 * pills. The pills were the worst of it — eleven shows given less visual
 * weight than one episode, when cover art is the thing a listener actually
 * recognises. Three blocks now: a featured episode that uses the full row,
 * a grid of show posters, and an episode grid with the same anatomy as the
 * article cards above it.
 */
export default function PodcastModule({
  lead,
  shows,
  recent,
  latestByShow,
}: {
  lead: EpisodeWithShow;
  shows: Podcast[];
  recent: EpisodeWithShow[];
  /** Show id → newest publish date, for the Shows grid's meta line. */
  latestByShow?: Map<string, string>;
}) {
  const playable: PlayableEpisode | null = lead.audioUrl
    ? {
        id: lead.id,
        title: lead.title,
        audioUrl: lead.audioUrl,
        durationSeconds: lead.durationSeconds,
        showTitle: lead.show.title,
        showSlug: lead.show.slug,
        episodeSlug: lead.slug,
        coverImageUrl: lead.show.coverImageUrl,
      }
    : null;

  const leadArt = lead.imageUrl || lead.show.coverImageUrl;
  const grid = recent.slice(0, 6);
  // A short list under the grid, not the primary episode UI.
  const more = recent.slice(6, 10);

  return (
    <section aria-labelledby="listen-heading" className="bg-[var(--color-navy)] text-white">
      <div className="shell py-6 sm:py-8">
        {/* --- Header row --- */}
        <div className="mb-5 flex items-baseline justify-between gap-4 border-b border-[var(--color-red)] pb-2">
          <h2
            id="listen-heading"
            className="inline-flex items-center gap-2 font-headline text-[14px] sm:text-[16px] font-bold uppercase leading-none tracking-[0.1em] text-white"
          >
            <Headphones className="h-4 w-4 text-[var(--color-red-ink)]" aria-hidden />
            Listen
          </h2>
          <Link
            href="/podcasts"
            className="inline-flex min-h-11 items-center font-sans text-[12px] font-bold uppercase tracking-[0.08em] text-[var(--color-red-ink)] transition-colors hover:text-white"
          >
            All shows →
          </Link>
        </div>

        {/* --- 1. Featured episode --- */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[320px_minmax(0,1fr)] sm:gap-6 lg:grid-cols-[380px_minmax(0,1fr)] sm:items-center">
          <Link
            href={`/podcasts/${lead.show.slug}/${lead.slug}`}
            className="group relative block aspect-square w-full overflow-hidden rounded-[8px] bg-white/5"
          >
            {leadArt ? (
              <FeedImage
                src={leadArt}
                alt={lead.title}
                fill
                priority
                sizes="(max-width: 640px) 100vw, 380px"
                className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
            )}
          </Link>

          <div className="min-w-0">
            <Link
              href={`/podcasts/${lead.show.slug}`}
              className="font-sans text-[12px] font-semibold uppercase tracking-[0.09em] text-[var(--color-red-ink)] transition-colors hover:text-white"
            >
              {lead.show.title}
            </Link>
            <h3 className="mt-1.5 font-headline text-[1.75rem] lg:text-[2.25rem] font-bold uppercase leading-[1.03] tracking-[-0.02em] line-clamp-2">
              <Link
                href={`/podcasts/${lead.show.slug}/${lead.slug}`}
                className="transition-colors hover:text-[var(--color-red-ink)]"
              >
                {lead.title}
              </Link>
            </h3>
            {/* One line, then stop. The old module printed a paragraph of
                feed description, which is where most of the empty-looking
                height came from. */}
            <p className="mt-2 font-sans text-[14.5px] leading-[1.5] text-white/65 line-clamp-1">
              {episodeTeaser(lead.description)}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3 font-sans text-[12.5px] text-white/55">
              <PlayButton episode={playable} variant="hero" label="Play episode" />
              <span>{lead.date}</span>
              <span aria-hidden>·</span>
              <span>{formatDuration(lead.durationSeconds)}</span>
            </div>
          </div>
        </div>

        {/* --- 2. The Shows --- */}
        {shows.length > 0 && (
          <>
            <div className="mt-7 mb-3 flex items-baseline justify-between gap-4 border-b border-white/15 pb-2">
              <h3 className="font-headline text-[13px] font-bold uppercase tracking-[0.1em] text-white/70">
                The Shows
              </h3>
              <Link
                href="/podcasts"
                className="inline-flex min-h-11 items-center font-sans text-[11.5px] font-bold uppercase tracking-[0.08em] text-white/50 transition-colors hover:text-[var(--color-red-ink)]"
              >
                Browse all {shows.length} →
              </Link>
            </div>
            {/* A shelf, not a grid. Every show fits one scrolling row, and
                the negative margin lets the first and last tiles reach the
                container edge while the row still scrolls past it — the
                same snap-scroll pattern the site already uses elsewhere.
                No JS carousel: native scroll-snap keeps keyboard, trackpad
                and touch behaviour correct for free. */}
            <div className="-mx-[var(--gutter)] flex snap-x snap-mandatory gap-3 overflow-x-auto px-[var(--gutter)] pb-1 scrollbar-none sm:gap-4">
              {shows.map((show) => (
                <ShowCard key={show.id} show={show} latestEpisodeAt={latestByShow?.get(show.id)} />
              ))}
            </div>
          </>
        )}

        {/* --- 3. Latest episodes --- */}
        {grid.length > 0 && (
          <>
            <h3 className="mt-8 mb-3 border-b border-white/15 pb-2 font-headline text-[13px] font-bold uppercase tracking-[0.1em] text-white/70">
              Latest Episodes
            </h3>
            <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 min-[1100px]:grid-cols-3">
              {grid.map((episode) => (
                <EpisodeCard key={episode.id} episode={episode} />
              ))}
            </div>
          </>
        )}

        {/* A compact tail, not the primary episode UI. */}
        {more.length > 0 && (
          <ul className="mt-6 border-t border-white/15">
            {more.map((episode) => (
              <li key={episode.id} className="border-b border-white/10">
                <Link
                  href={`/podcasts/${episode.show.slug}/${episode.slug}`}
                  className="group flex min-h-11 items-center justify-between gap-4 py-2.5"
                >
                  <span className="font-sans text-[14px] leading-[1.3] text-white/85 transition-colors group-hover:text-[var(--color-red-ink)] line-clamp-1">
                    {episode.title}
                  </span>
                  <span className="shrink-0 font-sans text-[12px] tabular-nums text-white/45">
                    {formatDuration(episode.durationSeconds)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
