"use server";

import { revalidatePath } from "next/cache";
import { del } from "@vercel/blob";
import {
  recordMediaAsset,
  deleteMediaAssetRecord,
  deleteMediaAssetRecords,
  getMediaAssetById,
  getMediaAssetsByIds,
  getAllMediaAssets,
  createMediaFolder,
  deleteMediaFolder,
  updateMediaAsset,
  setMediaAssetsFolder,
  type MediaAsset,
  type MediaFolder,
} from "../../lib/media";
import { requireStaffSession, requireAdminSession } from "../../lib/require-admin";
import { slugify } from "../../lib/slugify";
import { logActivity } from "../../lib/activity";

export type MediaActionResult = { success: true } | { success: false; error: string };
export type RecordMediaResult = { success: true; asset: MediaAsset } | { success: false; error: string };
export type ListMediaResult = { success: true; assets: MediaAsset[] } | { success: false; error: string };
export type FolderResult = { success: true; folder: MediaFolder } | { success: false; error: string };

const UNAUTHORIZED = { success: false as const, error: "You must be signed in as staff to do that." };

const MAX_TAGS = 12;
const MAX_TAG_LENGTH = 32;
const MAX_ALT_LENGTH = 300;

function parseTags(raw: string): string[] {
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const part of raw.split(",")) {
    const tag = part.trim().replace(/^#/, "").toLowerCase().slice(0, MAX_TAG_LENGTH);
    if (tag && !seen.has(tag)) {
      seen.add(tag);
      tags.push(tag);
    }
    if (tags.length >= MAX_TAGS) break;
  }
  return tags;
}

// Fired client-side from the shared upload helper right after a successful
// Vercel Blob upload — this is how the Media Library actually gets
// populated, since Blob's own webhook (onUploadCompleted in
// api/admin/upload) only fires against a real deployed environment, never
// a local dev server. Returns the real DB row (not just a boolean) so a
// caller building an optimistic list entry has the actual id to delete by
// later, instead of a placeholder that wouldn't match any real row.
export async function recordMediaAssetAction(input: {
  url: string;
  filename: string;
  width?: number | null;
  height?: number | null;
  sizeBytes?: number | null;
  mimeType?: string | null;
  folderId?: string | null;
}): Promise<RecordMediaResult> {
  const session = await requireStaffSession();
  if (!session) return UNAUTHORIZED;

  try {
    const asset = await recordMediaAsset({
      url: input.url,
      filename: input.filename,
      width: input.width ?? null,
      height: input.height ?? null,
      sizeBytes: input.sizeBytes ?? null,
      mimeType: input.mimeType ?? null,
      folderId: input.folderId ?? null,
      uploadedByName: session.user.name,
      uploadedByEmail: session.user.email,
    });
    revalidatePath("/admin/media");
    return { success: true, asset };
  } catch {
    // Never surface this to the uploading user — indexing failure
    // shouldn't make a successful image upload look like it failed.
    return { success: false, error: "Failed to index this upload in the media library." };
  }
}

/** Backs the editor's "choose from library" picker. */
export async function listMediaAssetsAction(): Promise<ListMediaResult> {
  const session = await requireStaffSession();
  if (!session) return UNAUTHORIZED;
  try {
    return { success: true, assets: await getAllMediaAssets() };
  } catch {
    return { success: false, error: "Couldn't load the media library." };
  }
}

export async function updateMediaAssetAction(
  id: string,
  input: { alt?: string; tags?: string; folderId?: string | null }
): Promise<MediaActionResult> {
  const session = await requireStaffSession();
  if (!session) return UNAUTHORIZED;

  if (input.alt !== undefined && input.alt.length > MAX_ALT_LENGTH) {
    return { success: false, error: `Alt text must be ${MAX_ALT_LENGTH} characters or fewer.` };
  }

  try {
    await updateMediaAsset(id, {
      ...(input.alt !== undefined ? { alt: input.alt.trim() || null } : {}),
      ...(input.tags !== undefined ? { tags: parseTags(input.tags) } : {}),
      ...(input.folderId !== undefined ? { folderId: input.folderId } : {}),
    });
    revalidatePath("/admin/media");
    return { success: true };
  } catch {
    return { success: false, error: "Couldn't update this asset." };
  }
}

export async function moveMediaAssetsAction(ids: string[], folderId: string | null): Promise<MediaActionResult> {
  const session = await requireStaffSession();
  if (!session) return UNAUTHORIZED;
  if (ids.length === 0) return { success: false, error: "Nothing selected." };

  try {
    await setMediaAssetsFolder(ids, folderId);
    revalidatePath("/admin/media");
    return { success: true };
  } catch {
    return { success: false, error: "Couldn't move those assets." };
  }
}

export async function createMediaFolderAction(name: string): Promise<FolderResult> {
  const session = await requireStaffSession();
  if (!session) return UNAUTHORIZED;

  const trimmed = name.trim();
  if (!trimmed) return { success: false, error: "Give the folder a name." };
  if (trimmed.length > 60) return { success: false, error: "Folder names must be 60 characters or fewer." };

  const slug = slugify(trimmed);
  if (!slug) return { success: false, error: "That name doesn't produce a usable folder id — try letters and numbers." };

  try {
    const folder = await createMediaFolder(trimmed, slug);
    await logActivity({ actor: session.user, action: "media.folder_created", targetType: "media folder", targetLabel: trimmed });
    revalidatePath("/admin/media");
    return { success: true, folder };
  } catch {
    return { success: false, error: "A folder with that name already exists." };
  }
}

export async function deleteMediaFolderAction(id: string): Promise<MediaActionResult> {
  const session = await requireStaffSession();
  if (!session) return UNAUTHORIZED;

  try {
    // The FK is ON DELETE SET NULL — images inside simply become unfiled.
    await deleteMediaFolder(id);
    revalidatePath("/admin/media");
    return { success: true };
  } catch {
    return { success: false, error: "Couldn't delete that folder." };
  }
}

/**
 * Deleting media is ADMIN-only and permanent — it removes the underlying
 * Blob object, not just the index row, so an image still embedded in a
 * published article would 404 on the live site. Authors and editors can
 * upload and organize; only an admin can destroy.
 */
export async function deleteMediaAssetAction(id: string): Promise<MediaActionResult> {
  const session = await requireAdminSession();
  if (!session) return { success: false, error: "Only an admin can delete media." };

  const asset = await getMediaAssetById(id);
  if (!asset) return { success: false, error: "That asset no longer exists." };

  try {
    await del(asset.url).catch(() => {
      // The blob may already be gone (e.g. deleted directly in the Vercel
      // dashboard) — still clean up our index row either way.
    });
    await deleteMediaAssetRecord(id);
    await logActivity({ actor: session.user, action: "media.deleted", targetType: "media", targetLabel: asset.filename });
    revalidatePath("/admin/media");
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong deleting this asset." };
  }
}

export async function bulkDeleteMediaAction(ids: string[]): Promise<MediaActionResult> {
  const session = await requireAdminSession();
  if (!session) return { success: false, error: "Only an admin can delete media." };
  if (ids.length === 0) return { success: false, error: "Nothing selected." };

  const assets = await getMediaAssetsByIds(ids);
  if (assets.length === 0) return { success: false, error: "Those assets no longer exist." };

  try {
    await Promise.all(assets.map((asset) => del(asset.url).catch(() => {})));
    await deleteMediaAssetRecords(assets.map((a) => a.id));
    await logActivity({
      actor: session.user,
      action: "media.deleted",
      targetType: "media",
      targetLabel: `${assets.length} file${assets.length === 1 ? "" : "s"}`,
    });
    revalidatePath("/admin/media");
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong deleting those assets." };
  }
}
