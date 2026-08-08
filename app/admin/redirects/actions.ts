"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import {
  createRedirect,
  updateRedirect,
  deleteRedirect,
  normalizePath,
  type Redirect,
} from "../../lib/redirects";
import { requireAdminSession } from "../../lib/require-admin";
import { logActivity } from "../../lib/activity";

export type RedirectActionResult = { success: true; redirect: Redirect } | { success: false; error: string };
export type DeleteRedirectResult = { success: true } | { success: false; error: string };

const UNAUTHORIZED = { success: false as const, error: "You must be signed in as an admin to do that." };
// Matches the two real redirect behaviors Next.js's App Router can
// actually produce — see RedirectDialog.tsx's comment on why 301/302
// aren't offered.
const VALID_STATUS_CODES = new Set([307, 308]);
const MAX_PATH_LENGTH = 500;

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

function parseInput(formData: FormData): { fromPath: string; toPath: string; statusCode: number; isActive: boolean } | { error: string } {
  const fromPath = normalizePath(String(formData.get("fromPath") || ""));
  const toPathRaw = String(formData.get("toPath") || "").trim();
  const statusCode = Number.parseInt(String(formData.get("statusCode") || "308"), 10);
  const isActive = formData.get("isActive") === "true";

  if (fromPath === "/") return { error: "Can't redirect the homepage itself." };
  if (fromPath.length > MAX_PATH_LENGTH) return { error: `From-path must be ${MAX_PATH_LENGTH} characters or fewer.` };
  if (!toPathRaw) return { error: "Destination is required." };
  if (toPathRaw.length > MAX_PATH_LENGTH) return { error: `Destination must be ${MAX_PATH_LENGTH} characters or fewer.` };
  const isExternal = /^https?:\/\//i.test(toPathRaw);
  const toPath = isExternal ? toPathRaw : normalizePath(toPathRaw);
  if (!isExternal && toPath === fromPath) return { error: "Destination can't be the same as the source path." };
  if (!VALID_STATUS_CODES.has(statusCode)) return { error: "Choose a valid redirect status code." };

  return { fromPath, toPath, statusCode, isActive };
}

export async function createRedirectAction(formData: FormData): Promise<RedirectActionResult> {
  const session = await requireAdminSession();
  if (!session) return UNAUTHORIZED;
  const input = parseInput(formData);
  if ("error" in input) return { success: false, error: input.error };

  try {
    const redirect = await createRedirect(input);
    await logActivity({
      actor: session.user,
      action: "redirect.created",
      targetType: "redirect",
      targetLabel: `${redirect.fromPath} → ${redirect.toPath}`,
    });
    revalidatePath("/", "layout");
    return { success: true, redirect };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { success: false, error: `A redirect from "${input.fromPath}" already exists.` };
    }
    return { success: false, error: "Something went wrong creating the redirect." };
  }
}

export async function updateRedirectAction(id: string, formData: FormData): Promise<RedirectActionResult> {
  const session = await requireAdminSession();
  if (!session) return UNAUTHORIZED;
  const input = parseInput(formData);
  if ("error" in input) return { success: false, error: input.error };

  try {
    const redirect = await updateRedirect(id, input);
    await logActivity({
      actor: session.user,
      action: "redirect.updated",
      targetType: "redirect",
      targetLabel: `${redirect.fromPath} → ${redirect.toPath}`,
    });
    revalidatePath("/", "layout");
    return { success: true, redirect };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { success: false, error: `A redirect from "${input.fromPath}" already exists.` };
    }
    return { success: false, error: "Something went wrong saving the redirect." };
  }
}

export async function deleteRedirectAction(id: string, label: string): Promise<DeleteRedirectResult> {
  const session = await requireAdminSession();
  if (!session) return UNAUTHORIZED;

  try {
    await deleteRedirect(id);
    await logActivity({ actor: session.user, action: "redirect.deleted", targetType: "redirect", targetLabel: label });
    revalidatePath("/", "layout");
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong deleting the redirect." };
  }
}
