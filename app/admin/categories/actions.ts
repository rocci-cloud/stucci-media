"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryArticleCount,
  type Category,
  type CategoryInput,
} from "../../lib/categories";
import { slugify } from "../../lib/slugify";
import { requireAdminSession } from "../../lib/require-admin";

export type CategoryActionResult =
  | { success: true; category: Category }
  | { success: false; error: string };

export type DeleteCategoryResult = { success: true } | { success: false; error: string };

const UNAUTHORIZED = { success: false as const, error: "You must be signed in as an admin to do that." };

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

function parseInput(formData: FormData): CategoryInput | { error: string } {
  const name = String(formData.get("name") || "").trim();
  const rawSlug = String(formData.get("slug") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const color = String(formData.get("color") || "").trim() || null;

  if (!name) return { error: "Name is required." };

  const slug = slugify(rawSlug || name);
  if (!slug) {
    return { error: "Slug must contain at least one letter or number." };
  }

  return { name, slug, description, color };
}

export async function createCategoryAction(formData: FormData): Promise<CategoryActionResult> {
  if (!(await requireAdminSession())) return UNAUTHORIZED;
  const input = parseInput(formData);
  if ("error" in input) return { success: false, error: input.error };

  try {
    const category = await createCategory(input);
    revalidatePath("/", "layout");
    return { success: true, category };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { success: false, error: `Slug "${input.slug}" is already in use.` };
    }
    return { success: false, error: "Something went wrong creating the category." };
  }
}

export async function updateCategoryAction(
  id: string,
  formData: FormData
): Promise<CategoryActionResult> {
  if (!(await requireAdminSession())) return UNAUTHORIZED;
  const input = parseInput(formData);
  if ("error" in input) return { success: false, error: input.error };

  try {
    const category = await updateCategory(id, input);
    revalidatePath("/", "layout");
    return { success: true, category };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { success: false, error: `Slug "${input.slug}" is already in use.` };
    }
    return { success: false, error: "Something went wrong saving the category." };
  }
}

export async function deleteCategoryAction(id: string, slug: string): Promise<DeleteCategoryResult> {
  if (!(await requireAdminSession())) return UNAUTHORIZED;
  const articleCount = await getCategoryArticleCount(slug);
  if (articleCount > 0) {
    return {
      success: false,
      error: `Can't delete — ${articleCount} article${articleCount === 1 ? "" : "s"} still filed under this category. Re-file them first.`,
    };
  }

  try {
    await deleteCategory(id);
    revalidatePath("/", "layout");
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong deleting the category." };
  }
}
