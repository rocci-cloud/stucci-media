import ArticleForm from "../../ArticleForm";
import { createArticleAction } from "../actions";

export default function NewArticlePage() {
  return (
    <main className="max-w-[720px] mx-auto px-5 py-10">
      <h1 className="font-headline text-[28px] font-black mb-6">New Article</h1>
      <ArticleForm action={createArticleAction} />
    </main>
  );
}
