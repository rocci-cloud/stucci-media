import Link from "next/link";
import type { Article } from "../lib/articles";
import { getActivePodcasts } from "../lib/podcasts";
import SubscribeForm from "./SubscribeForm";
import SectionHeader from "./ui/SectionHeader";
import ArticleCard from "./ui/ArticleCard";

export default async function Sidebar({
  articles,
  excludeSlug,
}: {
  articles: Article[];
  excludeSlug?: string;
}) {
  // "Listen Now" goes to the real podcast section once a feed exists; until
  // then it falls back to the articles category so the button never lands on
  // an empty page.
  const shows = await getActivePodcasts();
  const listenHref = shows.length > 0 ? "/podcasts" : "/category/podcasts";
  const trending = articles.filter((a) => a.slug !== excludeSlug).slice(0, 6);

  return (
    <aside className="flex flex-col gap-4 sm:gap-5">
      {trending.length > 0 && (
        <div className="rounded-card overflow-hidden border border-[var(--color-hairline)] shadow-card bg-white">
          <SectionHeader title="Trending Now" variant="panel" />
          <ol className="divide-y divide-[var(--color-hairline)]">
            {trending.map((a, i) => (
              <li key={a.slug}>
                <ArticleCard article={a} variant="ranked" rank={i + 1} />
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="rounded-card border border-[var(--color-hairline)] shadow-card px-5 py-4 sm:py-5 bg-white">
        <h3 className="font-headline uppercase font-bold text-[18px] tracking-[-0.01em] mb-1.5">Get The Real Story</h3>
        <p className="font-sans text-[13px] text-[var(--color-gray)] mb-4">
          Independent reporting, straight to your inbox.
        </p>
        <SubscribeForm compact />
      </div>

      <div className="rounded-card border border-[var(--color-hairline)] shadow-card px-5 py-4 sm:py-5 bg-gradient-to-br from-[var(--color-navy)] to-[var(--color-navy-dark)] text-white">
        <h3 className="font-headline uppercase font-bold text-[18px] tracking-[-0.01em] mb-1.5">The Rocci Stucci Show</h3>
        <p className="font-sans text-[13px] text-white/70 mb-4">
          New episodes weekly — the stories mainstream media won&apos;t run.
        </p>
        <Link
          href={listenHref}
          className="inline-flex items-center min-h-11 bg-[var(--color-red)] hover:bg-[var(--color-red-dark)] text-white text-[11.5px] font-bold uppercase tracking-wide px-4 rounded-control transition active:scale-[0.97]"
        >
          Listen Now
        </Link>
      </div>
    </aside>
  );
}
