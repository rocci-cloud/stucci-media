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
    <>
      <div className="mx-auto max-w-[1200px] px-5 flex items-center gap-3.5">
        <h2 className="font-headline text-[22px] font-black whitespace-nowrap">{title}</h2>
        <div className="flex-1 border-t-2 border-[var(--color-hairline-strong)]" />
      </div>
      {articles.length === 0 ? (
        <p className="font-sans mx-auto max-w-[1200px] px-5 py-10 text-[var(--color-gray)] text-sm">
          No stories in this category yet — check back soon.
        </p>
      ) : (
        <section className="mx-auto max-w-[1200px] px-5 pt-5 pb-14 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-7">
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
              <div className="font-headline text-[19px] font-bold leading-[1.3] mb-1.5 group-hover:underline">
                {a.headline}
              </div>
              <p className="text-sm text-[var(--color-gray)] leading-[1.5]">{a.dek}</p>
            </Link>
          ))}
        </section>
      )}
    </>
  );
}
