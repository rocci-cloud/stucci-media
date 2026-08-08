"use server";

import { revalidatePath } from "next/cache";
import { del } from "@vercel/blob";
import { recordMediaAsset, deleteMediaAssetRecord, getMediaAssetById, type MediaAsset } from "../../lib/media";
import { requireAdminSession } from "../../lib/require-admin";

export type MediaActionResult = { success: true } | { success: false; error: string };
export type RecordMediaResult = { success: true; asset: MediaAsset } | { success: false; error: string };

const UNAUTHORIZED = { success: false as const, error: "You must be signed in as an admin to do that." };

// Fired client-side from ImageField.tsx right after a successful Vercel
// Blob upload — this is how the Media Library actually gets populated,
// since Blob's own webhook (onUploadCompleted in api/admin/upload) only
// fires against a real deployed environment, never a local dev server.
// Returns the real DB row (not just a boolean) so a caller building an
// optimistic list entry (see MediaClient.tsx) has the actual id to delete
// by later, instead of a placeholder that wouldn't match any real row.
export async function recordMediaAssetAction(url: string, filename: string): Promise<RecordMediaResult> {
  const session = await requireAdminSession();
  if (!session) return UNAUTHORIZED;

  try {
    const asset = await recordMediaAsset({
      url,
      filename,
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

export async function deleteMediaAssetAction(id: string): Promise<MediaActionResult> {
  const session = await requireAdminSession();
  if (!session) return UNAUTHORIZED;

  const asset = await getMediaAssetById(id);
  if (!asset) return { success: false, error: "That asset no longer exists." };

  try {
    await del(asset.url).catch(() => {
      // The blob may already be gone (e.g. deleted directly in the Vercel
      // dashboard) — still clean up our index row either way.
    });
    await deleteMediaAssetRecord(id);
    revalidatePath("/admin/media");
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong deleting this asset." };
  }
}
