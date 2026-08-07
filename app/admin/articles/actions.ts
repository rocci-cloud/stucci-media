"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import {
  createArticle,
  updateArticle,
  deleteArticle,
  toggleArticleFeatured,
  updateArticleCategories,
  bulkSetArticleStatus,
  bulkSetArticleFeatured,
  bulkUpdateArticleCategories,
  bulkDeleteArticles,
  type ArticleInput,
} from "../../lib/articles";
import { getCategories } from "../../lib/categories";
import { bodyInputToHtml } from "../../lib/sanitize";
import { requireAdminSession } from "../../lib/require-admin";

export type ArticleFormState = { error?: string };

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

async function parseInput(formData: FormData): Promise<ArticleInput | { error: string }> {
  const slug = String(formData.get("slug") || "").trim();
  const categorySlugs = formData.getAll("categorySlugs").map(String).filter(Boolean);
  const headline = String(formData.get("headline") || "").trim();
  const dek = String(formData.get("dek") || "").trim();
  const author = String(formData.get("author") || "").trim() || "Rocci Stucci";
  const rawBody = String(formData.get("body") || "").trim();
  const coverImageUrl = String(formData.get("coverImageUrl") || "").trim() || null;
  const status = formData.get("status") === "published" ? "published" : "draft";
  const isFeatured = formData.get("isFeatured") === "true";
  const seoTitle = String(formData.get("seoTitle") || "").trim() || null;
  const seoDescription = String(formData.get("seoDescription") || "").trim() || null;
  const seoKeywords = String(formData.get("seoKeywords") || "").trim() || null;
  const ogImage = String(formData.get("ogImage") || "").trim() || null;
  const canonicalUrl = String(formData.get("canonicalUrl") || "").trim() || null;
  const publishedAt = String(formData.get("publishedAt") || "").trim() || null;

  if (!slug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
    return { error: "Slug must be lowercase letters, numbers, and hyphens only (e.g. my-article-title)." };
  }
  if (categorySlugs.length === 0) {
    return { error: "Choose at least one category." };
  }
  const categories = await getCategories();
  const validSlugs = new Set(categories.map((c) => c.slug));
  if (!categorySlugs.every((s) => validSlugs.has(s))) {
    return { error: "One or more selected categories no longer exist." };
  }
  if (!headline) return { error: "Headline is required." };
  if (!dek) return { error: "Dek is required." };
  if (!rawBody) return { error: "Body is required." };

  const bodyHtml = bodyInputToHtml(rawBody);

  return {
    slug,
    categorySlugs,
    headline,
    dek,
    author,
    bodyHtml,
    coverImageUrl,
    status,
    isFeatured,
    seoTitle,
    seoDescription,
    seoKeywords,
    ogImage,
    canonicalUrl,
    publishedAt,
  };
}

export async function createArticleAction(
  _prevState: ArticleFormState,
  formData: FormData
): Promise<ArticleFormState> {
  if (!(await requireAdminSession())) return { error: "You must be signed in as an admin to do that." };

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
  if (!(await requireAdminSession())) return { error: "You must be signed in as an admin to do that." };

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
  if (!(await requireAdminSession())) redirect("/login?from=/admin/articles");
  await deleteArticle(id);
  revalidatePath("/", "layout");
  redirect("/admin/articles");
}

// --- Row-level / bulk actions from the Articles list — no redirect, so the
// client can update in place (optimistic) and stay on the list. ---

export type ActionResult = { success: true } | { success: false; error: string };

const UNAUTHORIZED: ActionResult = { success: false, error: "You must be signed in as an admin to do that." };

export async function deleteArticleFromListAction(id: number): Promise<ActionResult> {
  if (!(await requireAdminSession())) return UNAUTHORIZED;
  try {
    await deleteArticle(id);
    revalidatePath("/", "layout");
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong deleting the article." };
  }
}

export async function toggleFeaturedAction(id: number, isFeatured: boolean): Promise<ActionResult> {
  if (!(await requireAdminSession())) return UNAUTHORIZED;
  try {
    await toggleArticleFeatured(id, isFeatured);
    revalidatePath("/", "layout");
    return { success: true };
  } catch {
    return { success: false, error: "Couldn't update featured status." };
  }
}

export async function updateArticleCategoriesAction(
  id: number,
  categorySlugs: string[]
): Promise<ActionResult> {
  if (!(await requireAdminSession())) return UNAUTHORIZED;
  if (categorySlugs.length === 0) {
    return { success: false, error: "An article needs at least one category." };
  }
  try {
    await updateArticleCategories(id, categorySlugs);
    revalidatePath("/", "layout");
    return { success: true };
  } catch {
    return { success: false, error: "Couldn't update categories." };
  }
}

export async function bulkSetStatusAction(
  ids: number[],
  status: "draft" | "published"
): Promise<ActionResult> {
  if (!(await requireAdminSession())) return UNAUTHORIZED;
  try {
    await bulkSetArticleStatus(ids, status);
    revalidatePath("/", "layout");
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong updating those articles." };
  }
}

export async function bulkDeleteAction(ids: number[]): Promise<ActionResult> {
  if (!(await requireAdminSession())) return UNAUTHORIZED;
  try {
    await bulkDeleteArticles(ids);
    revalidatePath("/", "layout");
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong deleting those articles." };
  }
}

export async function bulkSetFeaturedAction(ids: number[], isFeatured: boolean): Promise<ActionResult> {
  if (!(await requireAdminSession())) return UNAUTHORIZED;
  try {
    await bulkSetArticleFeatured(ids, isFeatured);
    revalidatePath("/", "layout");
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong updating those articles." };
  }
}

export async function bulkSetCategoriesAction(ids: number[], categorySlugs: string[]): Promise<ActionResult> {
  if (!(await requireAdminSession())) return UNAUTHORIZED;
  if (categorySlugs.length === 0) {
    return { success: false, error: "Choose at least one category." };
  }
  try {
    await bulkUpdateArticleCategories(ids, categorySlugs);
    revalidatePath("/", "layout");
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong updating those categories." };
  }
}
