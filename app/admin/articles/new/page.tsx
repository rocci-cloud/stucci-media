import ArticleForm from "../../ArticleForm";
import { createArticleAction } from "../actions";
import { getCategories } from "../../../lib/categories";

export default async function NewArticlePage() {
  const categories = await getCategories();

  return (
    <main className="max-w-[720px] mx-auto px-5 py-10">
      <h1 className="font-headline text-[28px] font-black mb-6">New Article</h1>
      <ArticleForm categories={categories} action={createArticleAction} />
    </main>
  );
}
