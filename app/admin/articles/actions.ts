"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createArticle, updateArticle, deleteArticle, type ArticleInput } from "../../lib/articles";
import { categories } from "../../lib/categories";

export type ArticleFormState = { error?: string };

function parseInput(formData: FormData): ArticleInput | { error: string } {
  const slug = String(formData.get("slug") || "").trim();
  const categorySlug = String(formData.get("categorySlug") || "");
  const headline = String(formData.get("headline") || "").trim();
  const dek = String(formData.get("dek") || "").trim();
  const author = String(formData.get("author") || "").trim() || "Rocci Stucci";
  const body = String(formData.get("body") || "").trim();
  const coverImageUrl = String(formData.get("coverImageUrl") || "").trim() || null;
  const status = formData.get("status") === "published" ? "published" : "draft";

  if (!slug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
    return { error: "Slug must be lowercase letters, numbers, and hyphens only (e.g. my-article-title)." };
  }
  if (!categories.some((c) => c.slug === categorySlug)) {
    return { error: "Choose a valid category." };
  }
  if (!headline) return { error: "Headline is required." };
  if (!dek) return { error: "Dek is required." };
  if (!body) return { error: "Body is required." };

  return { slug, categorySlug, headline, dek, author, body, coverImageUrl, status };
}

export async function createArticleAction(
  _prevState: ArticleFormState,
  formData: FormData
): Promise<ArticleFormState> {
  const input = parseInput(formData);
  if ("error" in input) return input;

  try {
    await createArticle(input);
  } catch (error) {
    if (error instanceof Error && /duplicate key/i.test(error.message)) {
      return { error: `Slug "${input.slug}" is already in use.` };
    }
    return { error: "Something went wrong saving the article." };
  }

  revalidatePath("/", "layout");
  redirect("/admin");
}

export async function updateArticleAction(
  id: number,
  _prevState: ArticleFormState,
  formData: FormData
): Promise<ArticleFormState> {
  const input = parseInput(formData);
  if ("error" in input) return input;

  try {
    await updateArticle(id, input);
  } catch (error) {
    if (error instanceof Error && /duplicate key/i.test(error.message)) {
      return { error: `Slug "${input.slug}" is already in use.` };
    }
    return { error: "Something went wrong saving the article." };
  }

  revalidatePath("/", "layout");
  redirect("/admin");
}

export async function deleteArticleAction(id: number) {
  await deleteArticle(id);
  revalidatePath("/", "layout");
  redirect("/admin");
}
