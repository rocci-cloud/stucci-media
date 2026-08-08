import Link from "next/link";
import type { Article } from "../lib/articles";
import SubscribeForm from "./SubscribeForm";
import SectionHeader from "./ui/SectionHeader";
import ArticleCard from "./ui/ArticleCard";

export default function Sidebar({
  articles,
  excludeSlug,
}: {
  articles: Article[];
  excludeSlug?: string;
}) {
  const trending = articles.filter((a) => a.slug !== excludeSlug).slice(0, 6);

  return (
    <aside className="flex flex-col gap-5">
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

      <div className="rounded-card border border-[var(--color-hairline)] shadow-card px-5 py-5 bg-white">
        <h3 className="font-headline uppercase font-bold text-[17px] mb-1.5">Get The Real Story</h3>
        <p className="font-sans text-[13px] text-[var(--color-gray)] mb-4">
          Independent reporting, straight to your inbox.
        </p>
        <SubscribeForm compact />
      </div>

      <div className="rounded-card border border-[var(--color-hairline)] shadow-card px-5 py-5 bg-[var(--color-navy)] text-white">
        <h3 className="font-headline uppercase font-bold text-[17px] mb-1.5">The Rocci Stucci Show</h3>
        <p className="font-sans text-[13px] text-white/70 mb-4">
          New episodes weekly — the stories mainstream media won&apos;t run.
        </p>
        <Link
          href="/category/podcasts"
          className="inline-flex items-center min-h-11 bg-[var(--color-red)] hover:bg-[var(--color-red-dark)] text-white text-[11.5px] font-bold uppercase tracking-wide px-4 rounded-control transition-colors"
        >
          Listen Now
        </Link>
      </div>
    </aside>
  );
}
