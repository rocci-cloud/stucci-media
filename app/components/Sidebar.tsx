import Link from "next/link";
import type { Article } from "../lib/articles";
import SubscribeForm from "./SubscribeForm";

export default function Sidebar({
  articles,
  excludeSlug,
}: {
  articles: Article[];
  excludeSlug?: string;
}) {
  const trending = articles.filter((a) => a.slug !== excludeSlug).slice(0, 6);

  return (
    <aside className="flex flex-col gap-7">
      {trending.length > 0 && (
        <div className="bg-[var(--color-bg-off)] border border-[var(--color-hairline)]">
          <div className="bg-[var(--color-black)] text-white font-headline uppercase font-bold text-[15px] tracking-wide px-4 py-2.5">
            Trending Now
          </div>
          <ol className="divide-y divide-[var(--color-hairline)]">
            {trending.map((a, i) => (
              <li key={a.slug}>
                <Link href={`/articles/${a.slug}`} className="flex gap-3 px-4 py-3.5 group">
                  <span className="font-headline text-[26px] font-bold text-[var(--color-red)]/30 leading-none shrink-0 w-[26px]">
                    {i + 1}
                  </span>
                  <span className="font-sans text-[13.5px] font-bold leading-[1.35] group-hover:text-[var(--color-red)]">
                    {a.headline}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="border border-[var(--color-hairline)] px-5 py-6">
        <h3 className="font-headline uppercase font-bold text-[17px] mb-1.5">Get The Real Story</h3>
        <p className="font-sans text-[13px] text-[var(--color-gray)] mb-4">
          Independent reporting, straight to your inbox.
        </p>
        <SubscribeForm compact />
      </div>

      <div className="border border-[var(--color-hairline)] px-5 py-6 bg-[var(--color-black)] text-white">
        <h3 className="font-headline uppercase font-bold text-[17px] mb-1.5">The Rocci Stucci Show</h3>
        <p className="font-sans text-[13px] text-white/70 mb-4">
          New episodes weekly — the stories mainstream media won&apos;t run.
        </p>
        <Link
          href="/category/podcasts"
          className="inline-block bg-[var(--color-red)] hover:bg-[var(--color-red-dark)] text-white text-[11.5px] font-bold uppercase tracking-wide px-4 py-2.5 rounded-sm"
        >
          Listen Now
        </Link>
      </div>
    </aside>
  );
}
