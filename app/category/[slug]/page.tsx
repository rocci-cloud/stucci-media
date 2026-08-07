import { notFound } from "next/navigation";
import type { Metadata } from "next";
import BreakingBar from "../../components/BreakingBar";
import SiteHeader from "../../components/SiteHeader";
import ArticleGrid from "../../components/ArticleGrid";
import SiteFooter from "../../components/SiteFooter";
import { categories, getCategoryBySlug } from "../../lib/categories";
import { getArticlesByCategory } from "../../lib/articles";

type Props = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 60;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) return {};

  return {
    title: category.label,
    description: category.description,
    openGraph: {
      title: `${category.label} | Stucci Media`,
      description: category.description,
      type: "website",
    },
  };
}

export function generateStaticParams() {
  return categories.map((c) => ({ slug: c.slug }));
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) notFound();

  const categoryArticles = await getArticlesByCategory(slug);

  return (
    <>
      <BreakingBar />
      <SiteHeader />
      <main>
        <div className="mx-auto max-w-[1200px] px-5 pt-8 pb-2">
          <h1 className="font-headline text-[32px] sm:text-[42px] font-black tracking-[-0.01em] mb-2">
            {category.label}
          </h1>
          <p className="font-sans text-[var(--color-gray)] text-[15px] pb-4">{category.description}</p>
        </div>
        <ArticleGrid articles={categoryArticles} title={`${categoryArticles.length} ${categoryArticles.length === 1 ? "Story" : "Stories"}`} />
      </main>
      <SiteFooter />
    </>
  );
}
