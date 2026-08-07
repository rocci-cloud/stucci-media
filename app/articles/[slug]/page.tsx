import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import { articles, getArticleBySlug } from "../../lib/articles";

type Props = {
  params: Promise<{ slug: string }>;
};

// --- THIS is the fix for the Base44/Lovable social-share bug ---
// This function runs on the SERVER, per article, before the page
// is ever sent to a browser or a crawler. Facebook/Twitter/iMessage
// bots read exactly what this returns — the real headline, the real
// dek, and (once real photos exist) the real cover image. That's why
// this had to be a Next.js/SSR app and not a client-rendered SPA.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return {};

  return {
    title: article.headline,
    description: article.dek,
    openGraph: {
      title: article.headline,
      description: article.dek,
      type: "article",
      publishedTime: article.date,
      authors: [article.author],
      // Swapped for the real per-article cover image in Phase 2
      images: ["/og-default.png"],
    },
    twitter: {
      card: "summary_large_image",
      title: article.headline,
      description: article.dek,
      images: ["/og-default.png"],
    },
  };
}

export function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) notFound();

  return (
    <>
      <SiteHeader />
      <main className="max-w-[720px] mx-auto px-5 pt-8 pb-18">
        <Link
          href="/"
          className="font-sans text-[13px] text-[var(--color-gray)] hover:text-[var(--color-text)] hover:underline mb-6 inline-block"
        >
          ← Back to Home
        </Link>
        <span className="font-sans block text-xs font-bold uppercase tracking-wide text-[var(--color-red)] mb-3">
          {article.category}
        </span>
        <h1 className="font-headline text-[27px] sm:text-[36px] font-bold leading-[1.12] tracking-[-0.01em] mb-4">
          {article.headline}
        </h1>
        <div className="font-sans flex flex-wrap gap-4 py-3.5 border-y border-[var(--color-hairline)] mb-7 text-[13px] text-[var(--color-gray)]">
          <span>
            By <b className="text-[var(--color-text)]">{article.author}</b>
          </span>
          <span>{article.date}</span>
          <span>{article.readTime}</span>
        </div>
        <div className="w-full aspect-video bg-[#E5E4E0] border border-[var(--color-hairline)] mb-7" />
        <article className="text-[17px] sm:text-[19px] leading-[1.75]">
          {article.body.map((paragraph, i) => (
            <p key={i} className="mb-5">
              {paragraph}
            </p>
          ))}
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
