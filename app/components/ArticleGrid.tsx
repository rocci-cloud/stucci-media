import Link from "next/link";
import type { Article } from "../lib/articles";

export default function ArticleGrid({
  articles,
  title = "Latest Stories",
}: {
  articles: Article[];
  title?: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-3.5 mb-5">
        <h2 className="font-headline uppercase text-[20px] font-bold border-l-4 border-[var(--color-red)] pl-3 whitespace-nowrap">
          {title}
        </h2>
        <div className="flex-1 border-t border-[var(--color-hairline)]" />
      </div>
      {articles.length === 0 ? (
        <p className="font-sans text-[var(--color-gray)] text-sm py-6">
          No stories in this category yet — check back soon.
        </p>
      ) : (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
          {articles.map((a) => (
            <Link key={a.slug} href={`/articles/${a.slug}`} className="block group">
              {a.coverImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={a.coverImageUrl}
                  alt={a.headline}
                  className="aspect-[4/3] w-full object-cover border border-[var(--color-hairline)] mb-3"
                />
              ) : (
                <div className="aspect-[4/3] bg-[#E5E4E0] border border-[var(--color-hairline)] mb-3" />
              )}
              <span className="font-sans block text-[11px] font-bold uppercase tracking-wide text-[var(--color-red)] mb-1.5">
                {a.category}
              </span>
              <div className="font-headline text-[18px] font-bold leading-[1.25] mb-1.5 group-hover:text-[var(--color-red)]">
                {a.headline}
              </div>
              <p className="text-sm text-[var(--color-gray)] leading-[1.5]">{a.dek}</p>
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}
