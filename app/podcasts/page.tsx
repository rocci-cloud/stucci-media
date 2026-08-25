import type { Metadata } from "next";
import FeedImage from "./FeedImage";
import Link from "next/link";
import { Rss, Mic } from "lucide-react";
import BreakingBar from "../components/BreakingBar";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import Reveal from "../components/Reveal";
import ArticleCard from "../components/ui/ArticleCard";
import SectionHeader from "../components/ui/SectionHeader";
import { formatDuration } from "../lib/podcast-duration";
import { episodeTeaser } from "../lib/podcast-text";
import { getActivePodcasts, getLatestEpisodes, getShowsByCategory } from "../lib/podcasts";
import { getArticlesByCategory } from "../lib/articles";
import ShowCard from "./ShowCard";
import EpisodeRow from "./EpisodeRow";
import PlayButton from "./PlayButton";
import type { PlayableEpisode } from "./PlayerProvider";

export const revalidate = 300;

const description =
  "Every show on the Stucci Media network — full episodes, straight from the source. Listen here or subscribe in your podcast app.";

export const metadata: Metadata = {
  title: "Podcasts",
  description,
  alternates: { canonical: "/podcasts" },
  openGraph: { title: "Podcasts | Stucci Media", description, type: "website", images: ["/og-default.png"] },
  twitter: { card: "summary_large_image", title: "Podcasts | Stucci Media", description, images: ["/og-default.png"] },
};

export default async function PodcastsPage() {
  const [shows, latest, byCategory, podcastArticles] = await Promise.all([
    getActivePodcasts(),
    getLatestEpisodes(13),
    getShowsByCategory(),
    getArticlesByCategory("podcasts"),
  ]);

  const [lead, ...rest] = latest;
  const totalEpisodes = shows.reduce((sum, show) => sum + show.episodeCount, 0);

  const leadPlayable: PlayableEpisode | null =
    lead?.audioUrl
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

  const leadTeaser = lead ? episodeTeaser(lead.description, 260) : "";

  return (
    <>
      <BreakingBar />
      <SiteHeader />
      <main id="main-content">
        {/* --- Hero: the newest episode anywhere on the network --- */}
        {lead ? (
          <section className="relative isolate overflow-hidden bg-[var(--color-navy)] text-white">
            {/* The show's own art, blurred, is the backdrop. It gives every
                show a distinct hero without needing a bespoke hero image
                per show — the same trick Spotify and Apple both use. */}
            {lead.show.coverImageUrl && (
              <FeedImage
                src={lead.show.coverImageUrl}
                alt=""
                fill
                priority
                sizes="100vw"
                aria-hidden
                className="scale-110 object-cover opacity-30 blur-2xl"
              />
            )}
            <span
              aria-hidden
              className="absolute inset-0 bg-gradient-to-b from-[var(--color-navy)]/70 via-[var(--color-navy)]/85 to-[var(--color-navy)]"
            />
            <span
              aria-hidden
              className="absolute inset-0 [background:radial-gradient(circle_at_30%_20%,transparent_20%,rgba(0,0,0,0.45)_100%)]"
            />

            <div className="relative mx-auto max-w-[1280px] px-5 py-10 sm:py-14">
              <div className="flex items-center gap-2">
                <span className="h-[9px] w-[9px] shrink-0 rounded-full bg-[var(--color-red)]" />
                <span className="font-headline text-[12px] font-bold uppercase tracking-[0.09em] text-white/65 sm:text-[13px]">
                  Latest Episode
                </span>
              </div>

              <div className="mt-5 grid grid-cols-1 items-start gap-6 sm:grid-cols-[200px_1fr] sm:gap-8 lg:grid-cols-[248px_1fr] lg:gap-10">
                <Link
                  href={`/podcasts/${lead.show.slug}`}
                  className="group relative mx-auto aspect-square w-[168px] shrink-0 overflow-hidden rounded-card shadow-pop ring-1 ring-white/15 sm:mx-0 sm:w-full"
                >
                  {lead.show.coverImageUrl ? (
                    <FeedImage
                      src={lead.show.coverImageUrl}
                      alt={lead.show.title}
                      fill
                      priority
                      sizes="(min-width: 1024px) 248px, (min-width: 640px) 200px, 168px"
                      className="img-cinematic object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <span className="img-placeholder flex h-full w-full items-center justify-center px-4 text-center font-headline text-[17px] font-bold uppercase leading-tight text-[var(--color-navy)]/50">
                      {lead.show.title}
                    </span>
                  )}
                </Link>

                <div className="min-w-0">
                  <Link
                    href={`/podcasts/${lead.show.slug}`}
                    className="font-sans text-[12px] font-bold uppercase tracking-[0.07em] text-[var(--color-red)] hover:underline"
                  >
                    {lead.show.title}
                  </Link>

                  <h1 className="mt-2 font-headline text-[30px] font-bold uppercase leading-[0.98] tracking-[-0.02em] sm:text-[42px] lg:text-[52px]">
                    {lead.title}
                  </h1>

                  {leadTeaser && (
                    <p className="mt-3.5 max-w-[64ch] font-sans text-[15px] leading-[1.6] text-white/75 sm:text-[16px]">
                      {leadTeaser}
                    </p>
                  )}

                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <PlayButton episode={leadPlayable} variant="hero" label="Play latest" />
                    <Link
                      href={`/podcasts/${lead.show.slug}/${lead.slug}`}
                      className="inline-flex min-h-11 items-center rounded-control border border-white/25 px-5 font-sans text-[13px] font-bold uppercase tracking-[0.05em] text-white transition hover:border-white/60 hover:bg-white/10 active:scale-[0.97]"
                    >
                      Episode notes
                    </Link>
                  </div>

                  <p className="mt-4 flex flex-wrap items-center gap-x-2.5 gap-y-1 font-sans text-[11.5px] uppercase tracking-[0.05em] text-white/50">
                    {lead.date && <span>{lead.date}</span>}
                    {lead.durationSeconds !== null && (
                      <>
                        <span aria-hidden>•</span>
                        <span>{formatDuration(lead.durationSeconds)}</span>
                      </>
                    )}
                    {lead.episodeNumber !== null && (
                      <>
                        <span aria-hidden>•</span>
                        <span>Episode {lead.episodeNumber}</span>
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <div className="border-b-4 border-[var(--color-navy)] bg-[var(--color-bg-off)]">
            <div className="mx-auto max-w-[1280px] px-5 py-12 text-center">
              <Mic className="mx-auto h-8 w-8 text-[var(--color-gray-light)]" />
              <h1 className="mt-3 font-headline text-[30px] font-bold uppercase tracking-[-0.02em] sm:text-[42px]">
                Podcasts
              </h1>
              <p className="mx-auto mt-3 max-w-[52ch] font-sans text-[15px] text-[var(--color-gray)]">
                No episodes yet. Shows added in the newsroom appear here as soon as their feed is
                imported.
              </p>
            </div>
          </div>
        )}

        {/* --- The shows --- */}
        {shows.length > 0 && (
          <Reveal>
            <section className="mx-auto max-w-[1280px] px-5 pt-9 sm:pt-11">
              <SectionHeader
                variant="underline"
                title={`The Shows — ${shows.length} ${shows.length === 1 ? "show" : "shows"}, ${totalEpisodes} episodes`}
              />
              <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-5">
                {shows.map((show) => (
                  <ShowCard key={show.id} show={show} />
                ))}
              </div>
            </section>
          </Reveal>
        )}

        {/* --- Latest across the network --- */}
        {rest.length > 0 && (
          <Reveal>
            <section className="mx-auto max-w-[1280px] px-5 pt-10 sm:pt-12">
              <SectionHeader variant="underline" title="Latest Episodes" />
              <div className="overflow-hidden rounded-card bg-[var(--color-hairline)] shadow-card">
                <div className="grid grid-cols-1 gap-px">
                  {rest.map((episode) => (
                    <EpisodeRow
                      key={episode.id}
                      episode={{ ...episode, coverImageUrl: episode.show.coverImageUrl }}
                      showSlug={episode.show.slug}
                      showTitle={episode.show.title}
                      withShowName
                      withArt
                    />
                  ))}
                </div>
              </div>
            </section>
          </Reveal>
        )}

        {/* --- Browse by topic --- */}
        {byCategory.length > 0 && (
          <Reveal>
            <section className="mx-auto max-w-[1280px] px-5 pt-10 sm:pt-12">
              <SectionHeader variant="underline" title="Browse By Topic" />
              <div className="flex flex-col gap-8">
                {byCategory.map(({ category, shows: group }) => (
                  <div key={category}>
                    <h3 className="mb-3 font-headline text-[15px] font-bold uppercase tracking-[0.05em] text-[var(--color-gray)]">
                      {category}
                      <span className="ml-2 font-sans text-[12px] font-normal normal-case tracking-normal text-[var(--color-gray-light)]">
                        {group.length} shows
                      </span>
                    </h3>
                    <div className="scrollbar-none -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 sm:mx-0 sm:px-0">
                      {group.map((show) => (
                        <ShowCard key={`${category}-${show.id}`} show={show} size="shelf" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </Reveal>
        )}

        {/* --- Newsroom coverage filed under Podcasts --- */}
        {podcastArticles.length > 0 && (
          <Reveal>
            <section className="mx-auto max-w-[1280px] px-5 pt-10 sm:pt-12">
              <SectionHeader
                variant="underline"
                title="From The Newsroom"
                href="/category/podcasts"
              />
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {podcastArticles.slice(0, 3).map((article) => (
                  <ArticleCard key={article.id} article={article} variant="grid" />
                ))}
              </div>
            </section>
          </Reveal>
        )}

        {/* --- Curated, not open: submissions --- */}
        <section className="mt-11 border-t-4 border-[var(--color-navy)] bg-[var(--color-bg-off)] sm:mt-14">
          <div className="mx-auto max-w-[1280px] px-5 py-9 sm:py-11">
            <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-[1.4fr_1fr] lg:gap-10">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="h-[9px] w-[9px] shrink-0 rounded-full bg-[var(--color-red)]" />
                  <span className="font-headline text-[13px] font-bold uppercase tracking-[0.06em] text-[var(--color-gray)]">
                    By Invitation
                  </span>
                </div>
                <h2 className="font-headline text-[26px] font-bold uppercase leading-[1.02] tracking-[-0.018em] sm:text-[34px]">
                  Got a show that belongs here?
                </h2>
                <p className="mt-3 max-w-[62ch] font-sans text-[15px] leading-[1.6] text-[var(--color-gray)] sm:text-[16px]">
                  <strong className="text-[var(--color-text)]">
                    Stucci Media is a curated network, not an open platform.
                  </strong>{" "}
                  Every show here was hand-picked. If you think yours fits, send us your details and
                  your RSS feed and we&rsquo;ll take a look — we read every submission and come back
                  to you either way.
                </p>
              </div>
              <div className="lg:justify-self-end">
                <Link
                  href="/podcasts/submit"
                  className="inline-flex min-h-11 items-center rounded-control bg-[var(--color-red)] px-6 font-sans text-[13px] font-bold uppercase tracking-[0.05em] text-white transition hover:bg-[var(--color-red-dark)] active:scale-[0.97]"
                >
                  Submit your podcast
                </Link>
                <p className="mt-2.5 font-sans text-[12.5px] text-[var(--color-gray-light)]">
                  Takes two minutes. No account needed.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
