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
import { logActivity } from "../../lib/activity";

export type CategoryActionResult =
  | { success: true; category: Category }
  | { success: false; error: string };

export type DeleteCategoryResult = { success: true } | { success: false; error: string };

const UNAUTHORIZED = { success: false as const, error: "You must be signed in as an admin to do that." };

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

const MAX_NAME_LENGTH = 60;
const MAX_SLUG_LENGTH = 80;
const MAX_DESCRIPTION_LENGTH = 300;
const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

function parseInput(formData: FormData): CategoryInput | { error: string } {
  const name = String(formData.get("name") || "").trim();
  const rawSlug = String(formData.get("slug") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const color = String(formData.get("color") || "").trim() || null;
  const showInNav = formData.get("showInNav") === "true";
  const navOrderRaw = String(formData.get("navOrder") || "0").trim();
  const shareImage = String(formData.get("shareImage") || "").trim() || null;

  if (!name) return { error: "Name is required." };
  if (name.length > MAX_NAME_LENGTH) return { error: `Name must be ${MAX_NAME_LENGTH} characters or fewer.` };
  if (description.length > MAX_DESCRIPTION_LENGTH) {
    return { error: `Description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer.` };
  }
  if (color && !HEX_COLOR_RE.test(color)) {
    return { error: "Color must be a hex value like #c8102e." };
  }

  const navOrder = Number.parseInt(navOrderRaw, 10);
  if (!Number.isFinite(navOrder)) return { error: "Nav order must be a number." };

  const slug = slugify(rawSlug || name);
  if (!slug) {
    return { error: "Slug must contain at least one letter or number." };
  }
  if (slug.length > MAX_SLUG_LENGTH) return { error: `Slug must be ${MAX_SLUG_LENGTH} characters or fewer.` };

  return { name, slug, description, color, showInNav, navOrder, shareImage };
}

export async function createCategoryAction(formData: FormData): Promise<CategoryActionResult> {
  const session = await requireAdminSession();
  if (!session) return UNAUTHORIZED;
  const input = parseInput(formData);
  if ("error" in input) return { success: false, error: input.error };

  try {
    const category = await createCategory(input);
    await logActivity({ actor: session.user, action: "category.created", targetType: "category", targetLabel: category.label });
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
  const session = await requireAdminSession();
  if (!session) return UNAUTHORIZED;
  const input = parseInput(formData);
  if ("error" in input) return { success: false, error: input.error };

  try {
    const category = await updateCategory(id, input);
    await logActivity({ actor: session.user, action: "category.updated", targetType: "category", targetLabel: category.label });
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
  const session = await requireAdminSession();
  if (!session) return UNAUTHORIZED;
  const articleCount = await getCategoryArticleCount(slug);
  if (articleCount > 0) {
    return {
      success: false,
      error: `Can't delete — ${articleCount} article${articleCount === 1 ? "" : "s"} still filed under this category. Re-file them first.`,
    };
  }

  try {
    await deleteCategory(id);
    await logActivity({ actor: session.user, action: "category.deleted", targetType: "category", targetLabel: slug });
    revalidatePath("/", "layout");
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong deleting the category." };
  }
}
