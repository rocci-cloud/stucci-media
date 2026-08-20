import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import BreakingBar from "../components/BreakingBar";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import Reveal from "../components/Reveal";
import { Rss } from "lucide-react";
import { getActivePodcasts } from "../lib/podcasts";

export const revalidate = 300;

const description =
  "Every show from Stucci Media — full episodes, straight from the source. Listen here or subscribe in your podcast app.";

export const metadata: Metadata = {
  title: "Podcasts",
  description,
  alternates: { canonical: "/podcasts" },
  openGraph: {
    title: "Podcasts | Stucci Media",
    description,
    type: "website",
    images: ["/og-default.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Podcasts | Stucci Media",
    description,
    images: ["/og-default.png"],
  },
};

export default async function PodcastsPage() {
  const podcasts = await getActivePodcasts();

  return (
    <>
      <BreakingBar />
      <SiteHeader />
      <main id="main-content">
        <div className="border-b-4 border-[var(--color-navy)] bg-[var(--color-bg-off)]">
          <div className="mx-auto max-w-[1280px] px-5 pt-8 pb-6 sm:pt-10 sm:pb-7">
            <div className="flex items-center gap-2 mb-2">
              <span className="h-[9px] w-[9px] rounded-full bg-[var(--color-red)] shrink-0" />
              <span className="font-headline uppercase font-bold text-[13px] sm:text-[14px] tracking-[0.06em] text-[var(--color-gray)]">
                Listen
              </span>
            </div>
            <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
              <h1 className="font-headline text-[36px] sm:text-[50px] font-bold uppercase leading-[0.96] tracking-[-0.02em]">
                Podcasts
              </h1>
              {podcasts.length > 0 && (
                <span className="font-sans text-[12.5px] font-bold uppercase tracking-[0.04em] text-[var(--color-gray-light)] mb-1.5">
                  {podcasts.length} {podcasts.length === 1 ? "Show" : "Shows"}
                </span>
              )}
            </div>
            <p className="font-sans text-[var(--color-gray)] text-[15px] sm:text-[16px] leading-[1.5] mt-2.5 max-w-[70ch]">
              {description}
            </p>
          </div>
        </div>

        {podcasts.length === 0 ? (
          <div className="mx-auto max-w-[1280px] px-5 py-16 text-center font-sans text-[var(--color-gray)]">
            No shows here yet — check back soon.
          </div>
        ) : (
          <Reveal>
            <div className="mx-auto max-w-[1280px] px-5 py-8 sm:py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {podcasts.map((podcast) => (
                <Link
                  key={podcast.id}
                  href={`/podcasts/${podcast.slug}`}
                  className="group flex min-h-11 gap-4 rounded-card border border-[var(--color-hairline)] bg-white p-4 shadow-card transition hover:-translate-y-[3px] hover:shadow-card-hover active:translate-y-0 active:scale-[0.99]"
                >
                  <div className="relative h-[92px] w-[92px] shrink-0 overflow-hidden rounded-[6px] ring-1 ring-black/5">
                    {podcast.coverImageUrl ? (
                      <Image
                        src={podcast.coverImageUrl}
                        alt={podcast.title}
                        fill
                        sizes="92px"
                        className="img-cinematic object-cover"
                        // Cover art is hosted by whichever podcast host the
                        // publisher uses, so it can't be covered by a fixed
                        // remotePatterns allowlist.
                        unoptimized
                      />
                    ) : (
                      <div className="img-placeholder absolute inset-0 flex items-center justify-center">
                        <Rss className="h-6 w-6 text-[var(--color-gray-light)]" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="font-headline text-[17px] sm:text-[18px] font-bold leading-[1.15] tracking-[-0.01em] line-clamp-2 group-hover:text-[var(--color-red)] transition-colors">
                      {podcast.title}
                    </div>
                    {podcast.author && (
                      <p className="mt-1 font-sans text-[11px] uppercase tracking-[0.04em] text-[var(--color-gray-light)]">
                        {podcast.author}
                      </p>
                    )}
                    <p className="mt-1.5 font-sans text-[13px] leading-[1.5] text-[var(--color-gray)] line-clamp-2">
                      {podcast.description.replace(/<[^>]*>/g, " ").trim()}
                    </p>
                    <p className="mt-2 font-sans text-[11px] uppercase tracking-[0.04em] text-[var(--color-gray-light)]">
                      {podcast.episodeCount} {podcast.episodeCount === 1 ? "episode" : "episodes"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </Reveal>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
