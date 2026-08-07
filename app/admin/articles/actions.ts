"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { createArticle, updateArticle, deleteArticle, type ArticleInput } from "../../lib/articles";
import { getCategories } from "../../lib/categories";
import { bodyInputToHtml } from "../../lib/sanitize";

export type ArticleFormState = { error?: string };

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

async function parseInput(formData: FormData): Promise<ArticleInput | { error: string }> {
  const slug = String(formData.get("slug") || "").trim();
  const categorySlug = String(formData.get("categorySlug") || "");
  const headline = String(formData.get("headline") || "").trim();
  const dek = String(formData.get("dek") || "").trim();
  const author = String(formData.get("author") || "").trim() || "Rocci Stucci";
  const rawBody = String(formData.get("body") || "").trim();
  const coverImageUrl = String(formData.get("coverImageUrl") || "").trim() || null;
  const status = formData.get("status") === "published" ? "published" : "draft";

  if (!slug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
    return { error: "Slug must be lowercase letters, numbers, and hyphens only (e.g. my-article-title)." };
  }
  const categories = await getCategories();
  if (!categories.some((c) => c.slug === categorySlug)) {
    return { error: "Choose a valid category." };
  }
  if (!headline) return { error: "Headline is required." };
  if (!dek) return { error: "Dek is required." };
  if (!rawBody) return { error: "Body is required." };

  const bodyHtml = bodyInputToHtml(rawBody);

  return { slug, categorySlug, headline, dek, author, bodyHtml, coverImageUrl, status };
}

export async function createArticleAction(
  _prevState: ArticleFormState,
  formData: FormData
): Promise<ArticleFormState> {
  const input = await parseInput(formData);
  if ("error" in input) return input;

  try {
    await createArticle(input);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { error: `Slug "${input.slug}" is already in use.` };
    }
    return { error: "Something went wrong saving the article." };
  }

  revalidatePath("/", "layout");
  redirect("/admin/articles");
}

export async function updateArticleAction(
  id: number,
  _prevState: ArticleFormState,
  formData: FormData
): Promise<ArticleFormState> {
  const input = await parseInput(formData);
  if ("error" in input) return input;

  try {
    await updateArticle(id, input);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { error: `Slug "${input.slug}" is already in use.` };
    }
    return { error: "Something went wrong saving the article." };
  }

  revalidatePath("/", "layout");
  redirect("/admin/articles");
}

export async function deleteArticleAction(id: number) {
  await deleteArticle(id);
  revalidatePath("/", "layout");
  redirect("/admin/articles");
}

// Row-level delete from the articles list — no redirect, so the client can
// remove the row in place (optimistic) and stay on the list.
export type DeleteArticleResult = { success: true } | { success: false; error: string };

export async function deleteArticleFromListAction(id: number): Promise<DeleteArticleResult> {
  try {
    await deleteArticle(id);
    revalidatePath("/", "layout");
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong deleting the article." };
  }
}
