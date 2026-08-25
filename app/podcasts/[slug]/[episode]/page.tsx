import { notFound } from "next/navigation";
import type { Metadata } from "next";
import FeedImage from "../../FeedImage";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Rss } from "lucide-react";
import BreakingBar from "../../../components/BreakingBar";
import SiteHeader from "../../../components/SiteHeader";
import SiteFooter from "../../../components/SiteFooter";
import Reveal from "../../../components/Reveal";
import { formatDuration } from "../../../lib/podcast-duration";
import { episodeTeaser } from "../../../lib/podcast-text";
import { showNotesToHtml } from "../../../lib/podcast-text";
import { getAdjacentEpisodes, getEpisodeBySlug, getPodcastBySlug } from "../../../lib/podcasts";
import { headers } from "next/headers";
import { auth } from "../../../lib/auth";
import { getEpisodeLikeCount, hasUserLikedEpisode } from "../../../lib/likes";
import { getApprovedCommentsForEpisode } from "../../../lib/comments";
import CommentSection from "../../../articles/[slug]/CommentSection";
import EpisodeLikeButton from "./EpisodeLikeButton";
import ShareRow from "../../ShareRow";
import { createEpisodeCommentAction } from "./actions";
import PlayButton from "../../PlayButton";
import type { PlayableEpisode } from "../../PlayerProvider";

type Props = { params: Promise<{ slug: string; episode: string }> };

export const revalidate = 300;

// www, not the apex domain — see the PRODUCTION_URL comment in
// app/lib/auth.ts.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.stuccimedia.com";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, episode: episodeSlug } = await params;
  const episode = await getEpisodeBySlug(slug, episodeSlug);
  if (!episode) return {};

  const description = episodeTeaser(episode.description, 200) || `An episode of ${episode.show.title}.`;
  const image = episode.imageUrl || episode.show.coverImageUrl || "/og-default.png";

  return {
    title: `${episode.title} — ${episode.show.title}`,
    description,
    alternates: { canonical: `/podcasts/${slug}/${episodeSlug}` },
    openGraph: {
      title: episode.title,
      description,
      // og:type "article" rather than "website": an episode is a dated,
      // authored item, and that is what unlocks published-time in the card.
      type: "article",
      ...(episode.publishedAt ? { publishedTime: episode.publishedAt } : {}),
      images: [image],
    },
    twitter: { card: "summary_large_image", title: episode.title, description, images: [image] },
  };
}

export default async function EpisodePage({ params }: Props) {
  const { slug, episode: episodeSlug } = await params;
  const [episode, show] = await Promise.all([
    getEpisodeBySlug(slug, episodeSlug),
    getPodcastBySlug(slug),
  ]);
  if (!episode || !show || !show.isActive) notFound();

  const { newer, older } = await getAdjacentEpisodes(show.id, episode.publishedAt);

  const session = await auth.api.getSession({ headers: await headers() });
  const [likeCount, liked, comments] = await Promise.all([
    getEpisodeLikeCount(episode.id),
    session ? hasUserLikedEpisode(episode.id, session.user.id) : Promise.resolve(false),
    getApprovedCommentsForEpisode(episode.id),
  ]);
  const episodePath = `/podcasts/${show.slug}/${episode.slug}`;

  const playable: PlayableEpisode | null = episode.audioUrl
    ? {
        id: episode.id,
        title: episode.title,
        audioUrl: episode.audioUrl,
        durationSeconds: episode.durationSeconds,
        showTitle: show.title,
        showSlug: show.slug,
        episodeSlug: episode.slug,
        coverImageUrl: show.coverImageUrl,
      }
    : null;

  // Show notes are third-party content from the feed. showNotesToHtml
  // sanitises real HTML and, for the many publishers who send plain text,
  // turns newlines into paragraphs and breaks — without it a timestamp
  // list arrives as one unbroken run-on line.
  const notes = showNotesToHtml(episode.description);
  const artwork = episode.imageUrl || show.coverImageUrl;

  const episodeSchema = {
    "@context": "https://schema.org",
    "@type": "PodcastEpisode",
    name: episode.title,
    url: `${siteUrl}/podcasts/${show.slug}/${episode.slug}`,
    ...(episode.publishedAt ? { datePublished: episode.publishedAt } : {}),
    ...(episode.durationSeconds ? { timeRequired: `PT${episode.durationSeconds}S` } : {}),
    ...(artwork ? { image: artwork } : {}),
    ...(episode.episodeNumber !== null ? { episodeNumber: episode.episodeNumber } : {}),
    description: episodeTeaser(episode.description, 500),
    partOfSeries: {
      "@type": "PodcastSeries",
      name: show.title,
      url: `${siteUrl}/podcasts/${show.slug}`,
    },
    ...(episode.audioUrl
      ? {
          associatedMedia: {
            "@type": "MediaObject",
            contentUrl: episode.audioUrl,
            ...(episode.audioType ? { encodingFormat: episode.audioType } : {}),
          },
        }
      : {}),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Podcasts", item: `${siteUrl}/podcasts` },
      { "@type": "ListItem", position: 3, name: show.title, item: `${siteUrl}/podcasts/${show.slug}` },
      {
        "@type": "ListItem",
        position: 4,
        name: episode.title,
        item: `${siteUrl}/podcasts/${show.slug}/${episode.slug}`,
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(episodeSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <BreakingBar />
      <SiteHeader />
      <main id="main-content">
        <section className="relative isolate overflow-hidden border-b-4 border-[var(--color-navy)] bg-[var(--color-navy)] text-white">
          {artwork && (
            <FeedImage
              src={artwork}
              alt=""
              fill
              priority
              sizes="100vw"
              aria-hidden
              className="scale-110 object-cover opacity-30 blur-2xl"
            />
          )}
          <span aria-hidden className="absolute inset-0 bg-gradient-to-b from-[var(--color-navy)]/70 via-[var(--color-navy)]/85 to-[var(--color-navy)]" />
          <span aria-hidden className="absolute inset-0 [background:radial-gradient(circle_at_25%_15%,transparent_18%,rgba(0,0,0,0.45)_100%)]" />

          <div className="relative mx-auto max-w-[860px] px-5 py-7 sm:py-10">
            <Link
              href={`/podcasts/${show.slug}`}
              className="inline-flex min-h-11 items-center font-sans text-[12px] font-bold uppercase tracking-[0.06em] text-white/60 transition-colors hover:text-white"
            >
              ← {show.title}
            </Link>

            <div className="mt-1 flex flex-col gap-5 sm:flex-row sm:gap-7">
              <div className="relative mx-auto h-[144px] w-[144px] shrink-0 overflow-hidden rounded-card shadow-pop ring-1 ring-white/15 sm:mx-0 sm:h-[168px] sm:w-[168px]">
                {artwork ? (
                  <FeedImage src={artwork} alt={show.title} fill priority sizes="168px" className="img-cinematic object-cover" />
                ) : (
                  <span className="img-placeholder flex h-full w-full items-center justify-center px-3 text-center font-headline text-[15px] font-bold uppercase leading-tight text-[var(--color-navy)]/50">
                    {show.title}
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h1 className="font-headline text-[26px] font-bold uppercase leading-[1.0] tracking-[-0.02em] sm:text-[36px]">
                  {episode.title}
                </h1>

                <p className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 font-sans text-[11.5px] uppercase tracking-[0.05em] text-white/50">
                  {episode.episodeNumber !== null && (
                    <>
                      <span>
                        {episode.seasonNumber !== null ? `S${episode.seasonNumber} · ` : ""}
                        Episode {episode.episodeNumber}
                      </span>
                      <span aria-hidden>•</span>
                    </>
                  )}
                  {episode.date && <span>{episode.date}</span>}
                  {episode.durationSeconds !== null && (
                    <>
                      <span aria-hidden>•</span>
                      <span>{formatDuration(episode.durationSeconds)}</span>
                    </>
                  )}
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-2.5">
                  {playable ? (
                    <PlayButton episode={playable} variant="hero" label="Play episode" />
                  ) : (
                    <p className="font-sans text-[13px] text-white/55">
                      This episode has no audio in the feed.
                    </p>
                  )}
                  <a
                    href={show.feedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center gap-2 rounded-control border border-white/25 px-5 font-sans text-[13px] font-bold uppercase tracking-[0.05em] text-white transition hover:border-white/60 hover:bg-white/10 active:scale-[0.97]"
                  >
                    <Rss className="h-4 w-4" />
                    Subscribe
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-[860px] px-5 py-8 sm:py-10">
          {notes ? (
            <Reveal>
              <h2 className="mb-4 font-headline text-[19px] font-bold uppercase tracking-[-0.015em] sm:text-[22px]">
                Show notes
              </h2>
              <div
                className="prose prose-stucci max-w-none"
                dangerouslySetInnerHTML={{ __html: notes }}
              />
            </Reveal>
          ) : (
            <p className="font-sans text-[15px] text-[var(--color-gray)]">
              No show notes were published with this episode.
            </p>
          )}

          {/* --- Move through the archive without going back to the list --- */}
          {(newer || older) && (
            <nav
              aria-label="More episodes"
              // Two columns only when there is something on both sides.
              // With one neighbour a fixed 2-up grid leaves a conspicuous
              // empty cell and pushes the lone card to an edge.
              className={`mt-10 grid grid-cols-1 gap-3 border-t-2 border-[var(--color-navy)] pt-6 ${
                newer && older ? "sm:grid-cols-2" : ""
              }`}
            >
              {newer ? (
                <Link
                  href={`/podcasts/${show.slug}/${newer.slug}`}
                  className="group flex min-h-11 items-start gap-2 rounded-card border border-[var(--color-hairline)] px-4 py-3 transition hover:border-[var(--color-navy)] hover:shadow-card"
                >
                  <ChevronLeft className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-gray-light)]" />
                  <span className="min-w-0">
                    <span className="block font-sans text-[10.5px] font-bold uppercase tracking-[0.06em] text-[var(--color-gray-light)]">
                      Newer episode
                    </span>
                    <span className="mt-0.5 block font-headline text-[15px] font-bold leading-[1.2] tracking-[-0.01em] transition-colors group-hover:text-[var(--color-red)]">
                      {newer.title}
                    </span>
                  </span>
                </Link>
              ) : null}

              {older && (
                <Link
                  href={`/podcasts/${show.slug}/${older.slug}`}
                  className={`group flex min-h-11 items-start gap-2 rounded-card border border-[var(--color-hairline)] px-4 py-3 transition hover:border-[var(--color-navy)] hover:shadow-card ${
                    newer ? "justify-end text-right" : ""
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block font-sans text-[10.5px] font-bold uppercase tracking-[0.06em] text-[var(--color-gray-light)]">
                      Older episode
                    </span>
                    <span className="mt-0.5 block font-headline text-[15px] font-bold leading-[1.2] tracking-[-0.01em] transition-colors group-hover:text-[var(--color-red)]">
                      {older.title}
                    </span>
                  </span>
                  <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-gray-light)]" />
                </Link>
              )}
            </nav>
          )}
          {/* --- Engagement --- */}
          <div className="mt-10 rounded-card bg-[var(--color-bg-off)] px-5 py-5">
            <p className="mb-3 font-headline text-[15px] font-bold uppercase tracking-[0.04em] text-[var(--color-gray)]">
              Enjoyed this episode?
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <EpisodeLikeButton
                episodeId={episode.id}
                initialCount={likeCount}
                initialLiked={liked}
                isSignedIn={Boolean(session)}
                signInRedirect={episodePath}
              />
              <ShareRow url={`${siteUrl}${episodePath}`} title={episode.title} />
            </div>
          </div>

          <Reveal>
            <CommentSection
              postComment={createEpisodeCommentAction.bind(null, episode.id)}
              initialComments={comments}
              currentUser={
                session
                  ? {
                      id: session.user.id,
                      name: session.user.name,
                      image: session.user.image ?? null,
                    }
                  : null
              }
              signInRedirect={episodePath}
            />
          </Reveal>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
