import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Rss, ExternalLink } from "lucide-react";
import BreakingBar from "../../components/BreakingBar";
import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import Reveal from "../../components/Reveal";
import SectionHeader from "../../components/ui/SectionHeader";
import EpisodeRow from "../EpisodeRow";
import PlayButton from "../PlayButton";
import type { PlayableEpisode } from "../PlayerProvider";
import { getActivePodcasts, getPodcastBySlug, getPodcastEpisodes } from "../../lib/podcasts";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 300;

// www, not the apex domain — see the PRODUCTION_URL comment in
// app/lib/auth.ts.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.stuccimedia.com";

/** Feed text is third-party HTML — never render it without stripping it. */
function plainText(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const podcast = await getPodcastBySlug(slug);
  if (!podcast || !podcast.isActive) return {};

  const description = plainText(podcast.description).slice(0, 200) || `Episodes of ${podcast.title}.`;
  return {
    title: podcast.title,
    description,
    alternates: {
      canonical: `/podcasts/${podcast.slug}`,
      types: { "application/rss+xml": [{ url: podcast.feedUrl, title: podcast.title }] },
    },
    openGraph: {
      title: `${podcast.title} | Stucci Media`,
      description,
      type: "website",
      images: [podcast.coverImageUrl || "/og-default.png"],
    },
    twitter: {
      card: "summary_large_image",
      title: `${podcast.title} | Stucci Media`,
      description,
      images: [podcast.coverImageUrl || "/og-default.png"],
    },
  };
}

export async function generateStaticParams() {
  const podcasts = await getActivePodcasts();
  return podcasts.map((p) => ({ slug: p.slug }));
}

export default async function PodcastPage({ params }: Props) {
  const { slug } = await params;
  const podcast = await getPodcastBySlug(slug);
  // An inactive show is hidden from the public site entirely, not just from
  // the index — otherwise a shared link would keep working after it's pulled.
  if (!podcast || !podcast.isActive) notFound();

  const episodes = await getPodcastEpisodes(podcast.id);
  const showDescription = plainText(podcast.description);
  const [latest, ...archive] = episodes;

  const latestPlayable: PlayableEpisode | null = latest?.audioUrl
    ? {
        id: latest.id,
        title: latest.title,
        audioUrl: latest.audioUrl,
        durationSeconds: latest.durationSeconds,
        showTitle: podcast.title,
        showSlug: podcast.slug,
        episodeSlug: latest.slug,
        coverImageUrl: podcast.coverImageUrl,
      }
    : null;

  const seriesSchema = {
    "@context": "https://schema.org",
    "@type": "PodcastSeries",
    name: podcast.title,
    url: `${siteUrl}/podcasts/${podcast.slug}`,
    ...(showDescription ? { description: showDescription.slice(0, 500) } : {}),
    ...(podcast.coverImageUrl ? { image: podcast.coverImageUrl } : {}),
    ...(podcast.author ? { author: { "@type": "Person", name: podcast.author } } : {}),
    webFeed: podcast.feedUrl,
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Podcasts", item: `${siteUrl}/podcasts` },
      {
        "@type": "ListItem",
        position: 3,
        name: podcast.title,
        item: `${siteUrl}/podcasts/${podcast.slug}`,
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(seriesSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <BreakingBar />
      <SiteHeader />
      <main id="main-content">
        {/* --- Show hero --- */}
        <section className="relative isolate overflow-hidden border-b-4 border-[var(--color-navy)] bg-[var(--color-navy)] text-white">
          {podcast.coverImageUrl && (
            <Image
              src={podcast.coverImageUrl}
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

          <div className="relative mx-auto max-w-[1280px] px-5 py-7 sm:py-10">
            <Link
              href="/podcasts"
              className="inline-flex min-h-11 items-center font-sans text-[12px] font-bold uppercase tracking-[0.06em] text-white/60 transition-colors hover:text-white"
            >
              ← All shows
            </Link>

            <div className="mt-1 flex flex-col gap-5 sm:flex-row sm:gap-8">
              <div className="relative mx-auto h-[172px] w-[172px] shrink-0 overflow-hidden rounded-card shadow-pop ring-1 ring-white/15 sm:mx-0 sm:h-[210px] sm:w-[210px]">
                {podcast.coverImageUrl ? (
                  <Image
                    src={podcast.coverImageUrl}
                    alt={podcast.title}
                    fill
                    priority
                    sizes="210px"
                    className="img-cinematic object-cover"
                  />
                ) : (
                  <span className="img-placeholder flex h-full w-full items-center justify-center px-4 text-center font-headline text-[17px] font-bold uppercase leading-tight text-[var(--color-navy)]/50">
                    {podcast.title}
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h1 className="font-headline text-[30px] font-bold uppercase leading-[0.98] tracking-[-0.02em] sm:text-[42px] lg:text-[50px]">
                  {podcast.title}
                </h1>

                {podcast.author && (
                  <p className="mt-2 font-sans text-[13px] uppercase tracking-[0.06em] text-white/60">
                    {podcast.author}
                  </p>
                )}

                {showDescription && (
                  <p className="mt-3.5 max-w-[70ch] font-sans text-[15px] leading-[1.6] text-white/75 sm:text-[16px]">
                    {showDescription.length > 400
                      ? `${showDescription.slice(0, 400).trimEnd()}…`
                      : showDescription}
                  </p>
                )}

                {podcast.categories.length > 0 && (
                  <div className="mt-3.5 flex flex-wrap gap-1.5">
                    {podcast.categories.map((category) => (
                      <span
                        key={category}
                        className="rounded-full border border-white/20 px-2.5 py-1 font-sans text-[11px] uppercase tracking-[0.05em] text-white/70"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-5 flex flex-wrap items-center gap-2.5">
                  {latestPlayable && <PlayButton episode={latestPlayable} variant="hero" label="Play latest" />}
                  <a
                    href={podcast.feedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center gap-2 rounded-control border border-white/25 px-5 font-sans text-[13px] font-bold uppercase tracking-[0.05em] text-white transition hover:border-white/60 hover:bg-white/10 active:scale-[0.97]"
                  >
                    <Rss className="h-4 w-4" />
                    RSS feed
                  </a>
                  {podcast.websiteUrl && (
                    <a
                      href={podcast.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center gap-2 rounded-control px-3 font-sans text-[13px] font-bold uppercase tracking-[0.05em] text-white/65 transition hover:text-white"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Show site
                    </a>
                  )}
                </div>

                <p className="mt-4 font-sans text-[11.5px] uppercase tracking-[0.05em] text-white/45">
                  {podcast.episodeCount} {podcast.episodeCount === 1 ? "episode" : "episodes"}
                  {podcast.isExplicit && (
                    <>
                      <span aria-hidden className="mx-2">•</span>
                      <span>Explicit</span>
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* --- Episodes --- */}
        <div className="mx-auto max-w-[1280px] px-5 py-8 sm:py-10">
          {episodes.length === 0 ? (
            <p className="rounded-card border border-[var(--color-hairline)] bg-[var(--color-bg-off)] px-5 py-8 text-center font-sans text-[15px] text-[var(--color-gray)]">
              No episodes have been imported for this show yet.
            </p>
          ) : (
            <Reveal>
              <SectionHeader variant="underline" title="Episodes" />
              <div className="overflow-hidden rounded-card bg-[var(--color-hairline)] shadow-card">
                <div className="grid grid-cols-1 gap-px">
                  {[latest, ...archive].map((episode) => (
                    <EpisodeRow
                      key={episode.id}
                      episode={{ ...episode, coverImageUrl: podcast.coverImageUrl }}
                      showSlug={podcast.slug}
                      showTitle={podcast.title}
                    />
                  ))}
                </div>
              </div>

              {podcast.episodeCount >= 100 && (
                <p className="mt-3 font-sans text-[12.5px] text-[var(--color-gray-light)]">
                  Showing the most recent 100 episodes. The full archive is in the{" "}
                  <a href={podcast.feedUrl} target="_blank" rel="noopener noreferrer" className="underline">
                    RSS feed
                  </a>
                  .
                </p>
              )}
            </Reveal>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
