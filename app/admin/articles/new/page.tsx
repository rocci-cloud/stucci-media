import ArticleForm from "../../ArticleForm";
import { createArticleAction } from "../actions";
import { getCategories } from "../../../lib/categories";

export default async function NewArticlePage() {
  const categories = await getCategories();

  return (
    <div className="max-w-[720px]">
      <h2 className="mb-6 text-lg font-semibold text-[var(--admin-fg)]">New article</h2>
      <ArticleForm categories={categories} action={createArticleAction} />
    </div>
  );
}
