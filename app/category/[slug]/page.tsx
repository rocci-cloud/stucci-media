import { notFound } from "next/navigation";
import type { Metadata } from "next";
import BreakingBar from "../../components/BreakingBar";
import SiteHeader from "../../components/SiteHeader";
import CategoryLead from "../../components/CategoryLead";
import ArticleGrid from "../../components/ArticleGrid";
import Sidebar from "../../components/Sidebar";
import SiteFooter from "../../components/SiteFooter";
import Reveal from "../../components/Reveal";
import BannerSlot from "../../components/BannerSlot";
import { getCategories, getCategoryBySlug } from "../../lib/categories";
import { getArticlesByCategory, getPublishedArticles } from "../../lib/articles";

type Props = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 60;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return {};

  return {
    title: category.label,
    description: category.description,
    alternates: {
      canonical: `/category/${category.slug}`,
    },
    openGraph: {
      title: `${category.label} | Stucci Media`,
      description: category.description,
      type: "website",
      images: [category.shareImage || "/og-default.png"],
    },
    twitter: {
      card: "summary_large_image",
      title: `${category.label} | Stucci Media`,
      description: category.description,
      images: [category.shareImage || "/og-default.png"],
    },
  };
}

export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map((c) => ({ slug: c.slug }));
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const [categoryArticles, allArticles] = await Promise.all([
    getArticlesByCategory(slug),
    getPublishedArticles(),
  ]);

  // The top 4 stories (most recent first, per getArticlesByCategory) get
  // the CategoryLead treatment — one dominant lead + a tight briefs
  // stack — same as TopicRail on the homepage. Everything after that
  // feeds the dense ArticleGrid wire-list below, so nothing shows twice.
  const leadArticles = categoryArticles.slice(0, 4);
  const remainingArticles = categoryArticles.slice(4);

  // www, not the apex domain — see the PRODUCTION_URL comment in
  // app/lib/auth.ts.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.stuccimedia.com";
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: category.label, item: `${siteUrl}/category/${category.slug}` },
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
      <main>
        <div className="border-b-4 border-[var(--color-navy)] bg-[var(--color-bg-off)]">
          <div className="mx-auto max-w-[1280px] px-5 pt-8 pb-6 sm:pt-10 sm:pb-7">
            <div className="flex items-center gap-2 mb-2">
              <span className="h-[9px] w-[9px] rounded-full bg-[var(--color-red)] shrink-0" />
              <span className="font-headline uppercase font-bold text-[13px] sm:text-[14px] tracking-[0.06em] text-[var(--color-gray)]">
                Section
              </span>
            </div>
            <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
              <h1 className="font-headline text-[36px] sm:text-[50px] font-bold uppercase leading-[0.96] tracking-[-0.02em]">
                {category.label}
              </h1>
              <span className="font-sans text-[12.5px] font-bold uppercase tracking-[0.04em] text-[var(--color-gray-light)] mb-1.5">
                {categoryArticles.length} {categoryArticles.length === 1 ? "Story" : "Stories"}
              </span>
            </div>
            {category.description && (
              <p className="font-sans text-[var(--color-gray)] text-[15px] sm:text-[16px] leading-[1.5] mt-2.5 max-w-[70ch]">
                {category.description}
              </p>
            )}
          </div>
        </div>

        {/* Category pages' fixed banner slot — near the top, directly
            below the section masthead and above the lead/wire content.
            Renders nothing when there's no active banner. */}
        <BannerSlot placement="CATEGORY" className="mx-auto max-w-[1280px] px-5 pt-6" />

        {categoryArticles.length === 0 ? (
          <div className="mx-auto max-w-[1280px] px-5 py-16 text-center font-sans text-[var(--color-gray)]">
            No stories in this category yet — check back soon.
          </div>
        ) : (
          <>
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
          </>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
