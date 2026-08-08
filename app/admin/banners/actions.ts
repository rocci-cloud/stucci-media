"use server";

import { revalidatePath } from "next/cache";
import {
  createBanner,
  updateBanner,
  deleteBanner,
  setBannerActive,
  type Banner,
  type BannerInput,
  type BannerPlacement,
} from "../../lib/banners";
import { requireAdminSession } from "../../lib/require-admin";
import { logActivity } from "../../lib/activity";

export type BannerActionResult = { success: true; banner: Banner } | { success: false; error: string };
export type DeleteBannerResult = { success: true } | { success: false; error: string };

const UNAUTHORIZED = { success: false as const, error: "You must be signed in as an admin to do that." };

const MAX_NAME_LENGTH = 100;
const PLACEMENTS: BannerPlacement[] = ["HOMEPAGE", "ARTICLE", "CATEGORY"];

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function parseInput(formData: FormData): BannerInput | { error: string } {
  const name = String(formData.get("name") || "").trim() || null;
  const imageUrl = String(formData.get("imageUrl") || "").trim();
  const destinationUrl = String(formData.get("destinationUrl") || "").trim();
  const placement = String(formData.get("placement") || "");
  const isActive = formData.get("isActive") === "true";
  const startDateRaw = String(formData.get("startDate") || "").trim();
  const endDateRaw = String(formData.get("endDate") || "").trim();
  const sortOrderRaw = String(formData.get("sortOrder") || "0").trim();

  if (name && name.length > MAX_NAME_LENGTH) {
    return { error: `Internal name must be ${MAX_NAME_LENGTH} characters or fewer.` };
  }
  if (!imageUrl) return { error: "A banner image is required." };
  if (!destinationUrl) return { error: "A destination URL is required." };
  if (!isValidUrl(destinationUrl)) return { error: "Destination URL must be a valid http(s) URL." };
  if (!PLACEMENTS.includes(placement as BannerPlacement)) return { error: "Choose a valid placement." };

  const startDate = startDateRaw ? new Date(startDateRaw).toISOString() : null;
  const endDate = endDateRaw ? new Date(endDateRaw).toISOString() : null;
  if (startDateRaw && Number.isNaN(new Date(startDateRaw).getTime())) return { error: "Start date is invalid." };
  if (endDateRaw && Number.isNaN(new Date(endDateRaw).getTime())) return { error: "End date is invalid." };
  if (startDate && endDate && startDate > endDate) {
    return { error: "Start date must be before the end date." };
  }

  const sortOrder = Number.parseInt(sortOrderRaw, 10);
  if (!Number.isFinite(sortOrder)) return { error: "Display order must be a number." };

  return {
    name,
    imageUrl,
    destinationUrl,
    placement: placement as BannerPlacement,
    isActive,
    startDate,
    endDate,
    sortOrder,
  };
}

export async function createBannerAction(formData: FormData): Promise<BannerActionResult> {
  const session = await requireAdminSession();
  if (!session) return UNAUTHORIZED;
  const input = parseInput(formData);
  if ("error" in input) return { success: false, error: input.error };

  try {
    const banner = await createBanner(input);
    await logActivity({
      actor: session.user,
      action: "banner.created",
      targetType: "banner",
      targetLabel: banner.name || banner.destinationUrl,
    });
    revalidatePath("/", "layout");
    return { success: true, banner };
  } catch {
    return { success: false, error: "Something went wrong creating the banner." };
  }
}

export async function updateBannerAction(id: string, formData: FormData): Promise<BannerActionResult> {
  const session = await requireAdminSession();
  if (!session) return UNAUTHORIZED;
  const input = parseInput(formData);
  if ("error" in input) return { success: false, error: input.error };

  try {
    const banner = await updateBanner(id, input);
    await logActivity({
      actor: session.user,
      action: "banner.updated",
      targetType: "banner",
      targetLabel: banner.name || banner.destinationUrl,
    });
    revalidatePath("/", "layout");
    return { success: true, banner };
  } catch {
    return { success: false, error: "Something went wrong saving the banner." };
  }
}

export async function toggleBannerActiveAction(
  id: string,
  isActive: boolean
): Promise<BannerActionResult> {
  const session = await requireAdminSession();
  if (!session) return UNAUTHORIZED;

  try {
    const banner = await setBannerActive(id, isActive);
    await logActivity({
      actor: session.user,
      action: isActive ? "banner.activated" : "banner.deactivated",
      targetType: "banner",
      targetLabel: banner.name || banner.destinationUrl,
    });
    revalidatePath("/", "layout");
    return { success: true, banner };
  } catch {
    return { success: false, error: "Something went wrong updating the banner." };
  }
}

export async function deleteBannerAction(id: string, label: string): Promise<DeleteBannerResult> {
  const session = await requireAdminSession();
  if (!session) return UNAUTHORIZED;

  try {
    await deleteBanner(id);
    await logActivity({ actor: session.user, action: "banner.deleted", targetType: "banner", targetLabel: label });
    revalidatePath("/", "layout");
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong deleting the banner." };
  }
}
