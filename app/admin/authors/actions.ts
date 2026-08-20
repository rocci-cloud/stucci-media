"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import {
  createAuthor,
  updateAuthor,
  deleteAuthor,
  type Author,
  type AuthorInput,
} from "../../lib/authors";
import { slugify } from "../../lib/slugify";
import { requireAdminSession } from "../../lib/require-admin";
import { logActivity } from "../../lib/activity";

export type AuthorActionResult =
  | { success: true; author: Author }
  | { success: false; error: string };

export type DeleteAuthorResult = { success: true } | { success: false; error: string };

const UNAUTHORIZED = {
  success: false as const,
  error: "You must be signed in as an admin to do that.",
};

const MAX_NAME = 80;
const MAX_SLUG = 80;
const MAX_TITLE = 80;
const MAX_BIO = 600;
const MAX_URL = 500;

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

function validUrlOrNull(value: string, field: string): string | null | { error: string } {
  if (!value) return null;
  if (value.length > MAX_URL) return { error: `${field} must be ${MAX_URL} characters or fewer.` };
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return { error: `${field} must start with http:// or https://.` };
    }
    return value;
  } catch {
    return { error: `${field} must be a full URL, e.g. https://example.com.` };
  }
}

function parseInput(formData: FormData): AuthorInput | { error: string } {
  const name = String(formData.get("name") || "").trim();
  const rawSlug = String(formData.get("slug") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const bio = String(formData.get("bio") || "").trim();
  const avatarUrl = String(formData.get("avatarUrl") || "").trim();

  if (!name) return { error: "Name is required." };
  if (name.length > MAX_NAME) return { error: `Name must be ${MAX_NAME} characters or fewer.` };
  if (title.length > MAX_TITLE) return { error: `Title must be ${MAX_TITLE} characters or fewer.` };
  if (bio.length > MAX_BIO) return { error: `Bio must be ${MAX_BIO} characters or fewer.` };

  // The slug must match what slugify() produces from the byline on articles,
  // or the profile won't attach to any of them.
  const slug = slugify(rawSlug || name);
  if (!slug) return { error: "Slug must contain at least one letter or number." };
  if (slug.length > MAX_SLUG) return { error: `Slug must be ${MAX_SLUG} characters or fewer.` };

  const links: Record<string, string | null> = {};
  for (const [field, label] of [
    ["websiteUrl", "Website"],
    ["twitterUrl", "X profile"],
    ["facebookUrl", "Facebook profile"],
  ] as const) {
    const parsed = validUrlOrNull(String(formData.get(field) || "").trim(), label);
    if (parsed && typeof parsed === "object") return { error: parsed.error };
    links[field] = parsed;
  }

  return {
    name,
    slug,
    title: title || null,
    bio: bio || null,
    avatarUrl: avatarUrl || null,
    websiteUrl: links.websiteUrl,
    twitterUrl: links.twitterUrl,
    facebookUrl: links.facebookUrl,
  };
}

export async function createAuthorAction(formData: FormData): Promise<AuthorActionResult> {
  const session = await requireAdminSession();
  if (!session) return UNAUTHORIZED;
  const input = parseInput(formData);
  if ("error" in input) return { success: false, error: input.error };

  try {
    const author = await createAuthor(input);
    await logActivity({
      actor: session.user,
      action: "author.created",
      targetType: "author",
      targetLabel: author.name,
    });
    revalidatePath("/", "layout");
    return { success: true, author };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { success: false, error: `A profile for "${input.slug}" already exists.` };
    }
    return { success: false, error: "Something went wrong creating the profile." };
  }
}

export async function updateAuthorAction(
  id: string,
  formData: FormData
): Promise<AuthorActionResult> {
  const session = await requireAdminSession();
  if (!session) return UNAUTHORIZED;
  const input = parseInput(formData);
  if ("error" in input) return { success: false, error: input.error };

  try {
    const author = await updateAuthor(id, input);
    await logActivity({
      actor: session.user,
      action: "author.updated",
      targetType: "author",
      targetLabel: author.name,
    });
    revalidatePath("/", "layout");
    return { success: true, author };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { success: false, error: `A profile for "${input.slug}" already exists.` };
    }
    return { success: false, error: "Something went wrong saving the profile." };
  }
}

export async function deleteAuthorAction(id: string, name: string): Promise<DeleteAuthorResult> {
  const session = await requireAdminSession();
  if (!session) return UNAUTHORIZED;
  try {
    // Deleting a profile doesn't touch any article — the byline stays and the
    // author page keeps working, just without a bio, photo or links.
    await deleteAuthor(id);
    await logActivity({
      actor: session.user,
      action: "author.deleted",
      targetType: "author",
      targetLabel: name,
    });
    revalidatePath("/", "layout");
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong deleting the profile." };
  }
}
