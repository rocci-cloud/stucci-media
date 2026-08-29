import FeedImage from "../podcasts/FeedImage";
import Link from "next/link";
import { Headphones, ChevronRight } from "lucide-react";
import { formatDuration } from "../lib/podcast-duration";
import { episodeTeaser } from "../lib/podcast-text";
import type { EpisodeWithShow } from "../lib/podcasts";
import type { Podcast } from "../lib/podcasts";
import PlayButton from "../podcasts/PlayButton";
import type { PlayableEpisode } from "../podcasts/PlayerProvider";

/**
 * The homepage's listen desk.
 *
 * Deliberately the only dark module in the stack. Everything above and
 * below it is text on white; audio is a different kind of thing to
 * consume, and giving it its own surface is what stops it reading as
 * "another row of headlines" — the same reasoning behind every other
 * module on this page having its own arrangement rather than one shared
 * template.
 */
export default function PodcastModule({
  lead,
  shows,
  recent,
}: {
  lead: EpisodeWithShow;
  shows: Podcast[];
  recent: EpisodeWithShow[];
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

  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-b from-[var(--color-navy)] to-[var(--color-navy-dark)] text-white">
      <span
        aria-hidden
        className="absolute inset-0 [background:radial-gradient(circle_at_15%_0%,rgba(200,16,46,0.18)_0%,transparent_55%)]"
      />

      {/* `shell`, not its own max-width: this module kept a 1280 cap while the
          homepage moved to a 1440 grid, which left 64px of dead space down each
          side of the listen desk and nothing else on the page. */}
      <div className="relative shell py-5 sm:py-7">
        <div className="mb-3.5 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
          <div className="flex items-center gap-2.5">
            <Headphones className="h-[18px] w-[18px] text-[var(--color-red-ink)]" />
            <h2 className="font-headline text-[19px] font-bold uppercase tracking-[0.03em] sm:text-[22px]">
              Listen
            </h2>
          </div>
          <Link
            href="/podcasts"
            className="inline-flex min-h-11 items-center gap-1 font-sans text-[12px] font-bold uppercase tracking-[0.06em] text-[var(--color-red-ink)] transition-colors hover:text-white"
          >
            All shows
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.35fr_1fr] lg:items-center lg:gap-7">
          {/* --- The newest episode anywhere on the network --- */}
          <div className="flex flex-col gap-4 sm:flex-row sm:gap-5">
            <Link
              href={`/podcasts/${lead.show.slug}`}
              // self-start, or the flex row's default stretch alignment
              // overrides aspect-square and the artwork renders as a tall
              // portrait block the height of the whole column.
              className="group relative aspect-square w-[132px] shrink-0 self-start overflow-hidden rounded-card shadow-pop ring-1 ring-white/15 sm:w-[168px]"
            >
              {lead.show.coverImageUrl ? (
                <FeedImage
                  src={lead.show.coverImageUrl}
                  alt={lead.show.title}
                  fill
                  sizes="168px"
                  className="img-cinematic object-cover transition duration-500 group-hover:scale-[1.04]"
                />
              ) : (
                <span className="img-placeholder flex h-full w-full items-center justify-center px-2.5 text-center font-headline text-[13px] font-bold uppercase leading-tight text-[var(--color-navy)]/50">
                  {lead.show.title}
                </span>
              )}
            </Link>

            <div className="min-w-0 flex-1">
              <Link
                href={`/podcasts/${lead.show.slug}`}
                className="font-sans text-[11px] font-bold uppercase tracking-[0.07em] text-[var(--color-red-ink)] hover:underline"
              >
                {lead.show.title}
              </Link>

              <h3 className="mt-1.5">
                <Link
                  href={`/podcasts/${lead.show.slug}/${lead.slug}`}
                  className="font-headline text-[21px] font-bold uppercase leading-[1.05] tracking-[-0.015em] transition-colors hover:text-[var(--color-red-ink)] sm:text-[26px]"
                >
                  {lead.title}
                </Link>
              </h3>

              <p className="mt-2.5 line-clamp-3 font-sans text-[14px] leading-[1.55] text-white/70">
                {episodeTeaser(lead.description, 200)}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <PlayButton episode={playable} variant="hero" label="Play episode" />
                <span className="font-sans text-[11px] uppercase tracking-[0.05em] text-white/45">
                  {lead.date}
                  {lead.durationSeconds !== null && (
                    <>
                      <span aria-hidden className="mx-1.5">•</span>
                      {formatDuration(lead.durationSeconds)}
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* --- What else is new, and who else is on the network --- */}
          <div className="lg:border-l lg:border-white/10 lg:pl-9">
            {recent.length > 0 && (
              <ul className="flex flex-col divide-y divide-white/10">
                {recent.map((episode) => (
                  <li key={episode.id} className="py-2.5 first:pt-0">
                    <Link
                      href={`/podcasts/${episode.show.slug}/${episode.slug}`}
                      className="group flex min-h-11 items-start gap-3"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block font-sans text-[10.5px] font-bold uppercase tracking-[0.06em] text-white/45">
                          {episode.show.title}
                        </span>
                        <span className="mt-0.5 block font-headline text-[14.5px] font-bold leading-[1.2] tracking-[-0.01em] transition-colors group-hover:text-[var(--color-red-ink)]">
                          {episode.title}
                        </span>
                      </span>
                      {episode.durationSeconds !== null && (
                        <span className="shrink-0 pt-3 font-sans text-[10.5px] uppercase tracking-[0.04em] text-white/35">
                          {formatDuration(episode.durationSeconds)}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            {shows.length > 1 && (
              <div className="mt-5 border-t border-white/10 pt-4">
                <p className="mb-2.5 font-sans text-[10.5px] font-bold uppercase tracking-[0.07em] text-white/40">
                  The shows
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {shows.map((show) => (
                    <Link
                      key={show.id}
                      href={`/podcasts/${show.slug}`}
                      className="inline-flex min-h-11 items-center rounded-full border border-white/20 px-3 font-sans text-[11.5px] uppercase tracking-[0.04em] text-white/70 transition hover:border-white/50 hover:bg-white/10 hover:text-white"
                    >
                      {show.title}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
