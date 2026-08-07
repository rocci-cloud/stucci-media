import Link from "next/link";
import type { Article } from "../lib/articles";
import type { Category } from "../lib/categories";

export default function TopicRail({
  category,
  articles,
}: {
  category: Category;
  articles: Article[];
}) {
  if (articles.length === 0) return null;

  return (
    <section className="py-6 border-t border-[var(--color-hairline)] first:border-t-0 first:pt-0">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-headline uppercase font-bold text-[19px] sm:text-[21px] border-l-4 border-[var(--color-red)] pl-3 leading-none">
          {category.label}
        </h2>
        <Link
          href={`/category/${category.slug}`}
          className="font-sans text-[11.5px] font-bold uppercase text-[var(--color-red)] hover:underline whitespace-nowrap shrink-0 ml-3"
        >
          More →
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
        {articles.map((a) => (
          <Link key={a.slug} href={`/articles/${a.slug}`} className="block group">
            {a.coverImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={a.coverImageUrl}
                alt={a.headline}
                className="aspect-[4/3] w-full object-cover border border-[var(--color-hairline)] mb-2"
              />
            ) : (
              <div className="aspect-[4/3] bg-[#E5E4E0] border border-[var(--color-hairline)] mb-2" />
            )}
            <div className="font-headline text-[14.5px] sm:text-[15px] font-bold leading-[1.25] group-hover:text-[var(--color-red)]">
              {a.headline}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
