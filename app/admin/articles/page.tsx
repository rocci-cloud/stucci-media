import { getAllArticlesAdmin } from "../../lib/articles";
import ArticlesClient from "./ArticlesClient";

export const dynamic = "force-dynamic";

export default async function ArticlesPage() {
  const articles = await getAllArticlesAdmin();

  return <ArticlesClient initialArticles={articles} />;
}
