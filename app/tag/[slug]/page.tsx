import { notFound } from "next/navigation";
import type { Metadata } from "next";
import BreakingBar from "../../components/BreakingBar";
import SiteHeader from "../../components/SiteHeader";
import CategoryLead from "../../components/CategoryLead";
import ArticleGrid from "../../components/ArticleGrid";
import Sidebar from "../../components/Sidebar";
import SiteFooter from "../../components/SiteFooter";
import Reveal from "../../components/Reveal";
import { getAllTagsWithCounts, getArticlesByTag, getPublishedArticles } from "../../lib/articles";

type Props = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 60;

// A tag in the URL is the tag itself, lowercased and percent-decoded —
// tags are free text an editor types, so there's no separate slug column to
// look up. Anything with a slash or a space still round-trips because Next
// decodes the segment for us.
function decodeTag(slug: string): string {
  return decodeURIComponent(slug).trim().toLowerCase();
}

function displayTag(tag: string): string {
  return tag.replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tag = decodeTag(slug);
  if (!tag) return {};
  const label = displayTag(tag);
  const description = `Every Stucci Media story tagged ${label} — reporting, investigations, and analysis, newest first.`;

  return {
    title: label,
    description,
    alternates: { canonical: `/tag/${encodeURIComponent(tag)}` },
    openGraph: {
      title: `${label} | Stucci Media`,
      description,
      type: "website",
      images: ["/og-default.png"],
    },
    twitter: {
      card: "summary_large_image",
      title: `${label} | Stucci Media`,
      description,
      images: ["/og-default.png"],
    },
  };
}

export async function generateStaticParams() {
  const tags = await getAllTagsWithCounts();
  return tags.map((t) => ({ slug: encodeURIComponent(t.tag) }));
}

export default async function TagPage({ params }: Props) {
  const { slug } = await params;
  const tag = decodeTag(slug);
  if (!tag) notFound();

  const [articles, allArticles] = await Promise.all([getArticlesByTag(tag), getPublishedArticles()]);
  // A tag nothing is filed under is a 404, not an empty archive page —
  // otherwise any string typed after /tag/ would return a real page.
  if (articles.length === 0) notFound();

  const label = displayTag(tag);
  const leadArticles = articles.slice(0, 4);
  const remainingArticles = articles.slice(4);

  // www, not the apex domain — see the PRODUCTION_URL comment in
  // app/lib/auth.ts.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.stuccimedia.com";
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      {
        "@type": "ListItem",
        position: 2,
        name: label,
        item: `${siteUrl}/tag/${encodeURIComponent(tag)}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <BreakingBar />
      <SiteHeader />
      <main id="main-content">
        <div className="border-b-4 border-[var(--color-navy)] bg-[var(--color-bg-off)]">
          <div className="mx-auto max-w-[1280px] px-5 pt-8 pb-6 sm:pt-10 sm:pb-7">
            <div className="flex items-center gap-2 mb-2">
              <span className="h-[9px] w-[9px] rounded-full bg-[var(--color-red)] shrink-0" />
              <span className="font-headline uppercase font-bold text-[13px] sm:text-[14px] tracking-[0.06em] text-[var(--color-gray)]">
                Topic
              </span>
            </div>
            <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
              <h1 className="font-headline text-[36px] sm:text-[50px] font-bold uppercase leading-[0.96] tracking-[-0.02em]">
                {label}
              </h1>
              <span className="font-sans text-[12.5px] font-bold uppercase tracking-[0.04em] text-[var(--color-gray-light)] mb-1.5">
                {articles.length} {articles.length === 1 ? "Story" : "Stories"}
              </span>
            </div>
            <p className="font-sans text-[var(--color-gray)] text-[15px] sm:text-[16px] leading-[1.5] mt-2.5 max-w-[70ch]">
              Every Stucci Media story tagged {label}, newest first.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-[1280px] px-5 pt-8 sm:pt-10">
          <CategoryLead articles={leadArticles} />
        </div>

        <Reveal>
          <div className="mx-auto max-w-[1280px] px-5 py-8 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-x-10">
            <ArticleGrid articles={remainingArticles} />
            <div className="mt-8 lg:mt-0">
              <Sidebar articles={allArticles} />
            </div>
          </div>
        </Reveal>
      </main>
      <SiteFooter />
    </>
  );
}
