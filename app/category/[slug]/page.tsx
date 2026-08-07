import { notFound } from "next/navigation";
import type { Metadata } from "next";
import BreakingBar from "../../components/BreakingBar";
import SiteHeader from "../../components/SiteHeader";
import ArticleGrid from "../../components/ArticleGrid";
import Sidebar from "../../components/Sidebar";
import SiteFooter from "../../components/SiteFooter";
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
    openGraph: {
      title: `${category.label} | Stucci Media`,
      description: category.description,
      type: "website",
      images: ["/og-default.png"],
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

  return (
    <>
      <BreakingBar />
      <SiteHeader />
      <main>
        <div className="mx-auto max-w-[1280px] px-5 pt-8 pb-4 border-b-4 border-[var(--color-navy)]">
          <h1 className="font-headline text-[32px] sm:text-[42px] font-bold uppercase tracking-[-0.005em] mb-2">
            {category.label}
          </h1>
          <p className="font-sans text-[var(--color-gray)] text-[15px] pb-2">{category.description}</p>
        </div>

        <div className="mx-auto max-w-[1280px] px-5 py-8 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-x-10">
          <ArticleGrid
            articles={categoryArticles}
            title={`${categoryArticles.length} ${categoryArticles.length === 1 ? "Story" : "Stories"}`}
          />
          <div className="mt-8 lg:mt-0">
            <Sidebar articles={allArticles} />
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
