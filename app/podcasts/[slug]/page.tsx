import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Rss, ExternalLink } from "lucide-react";
import BreakingBar from "../../components/BreakingBar";
import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import Reveal from "../../components/Reveal";
import Badge from "../../components/ui/Badge";
import { getActivePodcasts, getPodcastBySlug, getPodcastEpisodes } from "../../lib/podcasts";
import { formatDuration } from "../../lib/podcast-duration";
import { sanitizeArticleHtml } from "../../lib/sanitize";

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(seriesSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <BreakingBar />
      <SiteHeader />
      <main id="main-content">
        <div className="border-b-4 border-[var(--color-navy)] bg-gradient-to-b from-[var(--color-navy)] to-[var(--color-navy-dark)] text-white">
          <div className="mx-auto max-w-[1280px] px-5 py-8 sm:py-11">
            <Link
              href="/podcasts"
              className="inline-flex min-h-11 items-center font-sans text-[12px] font-bold uppercase tracking-[0.06em] text-white/60 hover:text-white transition-colors"
            >
              ← All podcasts
            </Link>

            <div className="mt-2 flex flex-col sm:flex-row gap-5 sm:gap-7">
              <div className="relative h-[150px] w-[150px] sm:h-[190px] sm:w-[190px] shrink-0 overflow-hidden rounded-card shadow-pop ring-1 ring-white/10">
                {podcast.coverImageUrl ? (
                  <Image
                    src={podcast.coverImageUrl}
                    alt={podcast.title}
                    fill
                    sizes="(max-width: 640px) 150px, 190px"
                    className="img-cinematic object-cover"
                    priority
                    // Cover art lives on the publisher's podcast host, which
                    // no fixed remotePatterns allowlist can anticipate.
                    unoptimized
                  />
                ) : (
                  <div className="img-placeholder absolute inset-0 flex items-center justify-center">
                    <Rss className="h-10 w-10 text-[var(--color-gray-light)]" />
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <h1 className="font-headline text-[32px] sm:text-[46px] font-bold uppercase leading-[0.98] tracking-[-0.02em]">
                  {podcast.title}
                </h1>
                {podcast.author && (
                  <p className="mt-2 font-sans text-[13px] font-bold uppercase tracking-[0.05em] text-[var(--color-red)]">
                    {podcast.author}
                  </p>
                )}
                {showDescription && (
                  <p className="mt-3 max-w-[70ch] font-sans text-[14.5px] sm:text-[15.5px] leading-[1.55] text-white/80">
                    {showDescription}
                  </p>
                )}

                {podcast.categories.length > 0 && (
                  <div className="mt-3.5 flex flex-wrap gap-2">
                    {podcast.categories.map((category) => (
                      <span
                        key={category}
                        className="rounded-full bg-white/10 px-2.5 py-1 font-sans text-[11px] font-bold uppercase tracking-[0.05em] text-white/75"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
                  <a
                    href={podcast.feedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center gap-2 rounded-control bg-[var(--color-red)] px-4 font-sans text-[13px] font-bold uppercase tracking-[0.05em] text-white transition hover:bg-[var(--color-red-dark)] active:scale-[0.97]"
                  >
                    <Rss className="h-4 w-4" />
                    Subscribe
                  </a>
                  {podcast.websiteUrl && (
                    <a
                      href={podcast.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center gap-1.5 font-sans text-[13px] font-bold uppercase tracking-[0.05em] text-white/70 hover:text-white transition-colors"
                    >
                      Show site
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                  <span className="font-sans text-[12px] uppercase tracking-[0.04em] text-white/50">
                    {episodes.length} {episodes.length === 1 ? "episode" : "episodes"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Reveal>
          <div className="mx-auto max-w-[900px] px-5 py-8 sm:py-10">
            {episodes.length === 0 ? (
              <p className="py-10 text-center font-sans text-[15px] text-[var(--color-gray)]">
                No episodes in this feed yet.
              </p>
            ) : (
              <ol className="flex flex-col divide-y divide-[var(--color-hairline)]">
                {episodes.map((episode) => (
                  <li key={episode.id} className="py-6 first:pt-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-sans text-[11px] uppercase tracking-[0.04em] text-[var(--color-gray-light)]">
                      {episode.episodeNumber !== null && (
                        <>
                          <span className="font-bold text-[var(--color-red)]">
                            {episode.seasonNumber !== null ? `S${episode.seasonNumber} · ` : ""}
                            Ep {episode.episodeNumber}
                          </span>
                          <span className="text-[var(--color-hairline-strong)]/30">·</span>
                        </>
                      )}
                      {episode.date && <span>{episode.date}</span>}
                      {episode.durationSeconds !== null && (
                        <>
                          <span className="text-[var(--color-hairline-strong)]/30">·</span>
                          <span>{formatDuration(episode.durationSeconds)}</span>
                        </>
                      )}
                      {episode.isExplicit && <Badge variant="navy">Explicit</Badge>}
                    </div>

                    <h2 className="mt-1.5 font-headline text-[19px] sm:text-[22px] font-bold leading-[1.2] tracking-[-0.01em]">
                      {episode.episodeUrl ? (
                        <a
                          href={episode.episodeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-[var(--color-red)] transition-colors"
                        >
                          {episode.title}
                        </a>
                      ) : (
                        episode.title
                      )}
                    </h2>

                    {episode.description && (
                      <div
                        className="prose prose-sm mt-2 max-w-none text-[var(--color-gray)] prose-a:text-[var(--color-red)] prose-p:leading-[1.6]"
                        // Show notes are HTML written by whoever publishes the
                        // feed, so they go through the same allowlist as
                        // article bodies before they reach the page.
                        dangerouslySetInnerHTML={{
                          __html: sanitizeArticleHtml(episode.description),
                        }}
                      />
                    )}

                    {episode.audioUrl && (
                      <audio
                        controls
                        preload="none"
                        className="mt-3.5 w-full"
                        aria-label={`Play ${episode.title}`}
                      >
                        <source src={episode.audioUrl} type={episode.audioType ?? undefined} />
                        Your browser can&rsquo;t play audio here —{" "}
                        <a href={episode.audioUrl}>download the episode</a> instead.
                      </audio>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </div>
        </Reveal>
      </main>
      <SiteFooter />
    </>
  );
}
