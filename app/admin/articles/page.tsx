import { getAllArticlesAdmin } from "../../lib/articles";
import { getCategories } from "../../lib/categories";
import ArticlesClient from "./ArticlesClient";

export const dynamic = "force-dynamic";

export default async function ArticlesPage() {
  const [articles, categories] = await Promise.all([getAllArticlesAdmin(), getCategories()]);

  return <ArticlesClient initialArticles={articles} categories={categories} />;
}
