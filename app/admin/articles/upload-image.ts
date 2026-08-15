"use client";

import { upload } from "@vercel/blob/client";
import { compressImageIfNeeded } from "./image-compression";
import { recordMediaAssetAction } from "../media/actions";

export const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
]);

// Matches the server's onBeforeGenerateToken limit in api/admin/upload.
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export type UploadedImage = {
  url: string;
  filename: string;
  width: number | null;
  height: number | null;
  sizeBytes: number;
  mimeType: string;
};

export class ImageUploadError extends Error {}

/**
 * Reads an image's intrinsic size without a network round trip. Best
 * effort: a decode failure yields nulls rather than failing the upload,
 * since dimensions are metadata for the media library, not a requirement
 * for the image to work.
 */
async function readDimensions(file: File): Promise<{ width: number | null; height: number | null }> {
  if (typeof createImageBitmap !== "function") return { width: null, height: null };
  try {
    const bitmap = await createImageBitmap(file);
    const size = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return size;
  } catch {
    return { width: null, height: null };
  }
}

/**
 * The one path every image in the admin takes to storage: validate →
 * compress → client-upload straight to Vercel Blob (so a large file never
 * hits the 4.5MB serverless function body limit) → index in the media
 * library.
 *
 * The media-library indexing call is deliberately awaited here (unlike the
 * old fire-and-forget version) so a caller that wants the resulting asset
 * id — the editor's image node, which needs it to offer "reuse this
 * image" later — can have it. Indexing failure is swallowed: a successful
 * upload must never be reported as a failure just because the library
 * row didn't get written.
 */
export async function uploadImage(
  file: File,
  options: { folderId?: string | null; onProgress?: (percent: number) => void } = {}
): Promise<UploadedImage> {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new ImageUploadError("Unsupported file type — use JPEG, PNG, WebP, AVIF, or GIF.");
  }

  const optimized = await compressImageIfNeeded(file);
  if (optimized.size > MAX_UPLOAD_BYTES) {
    throw new ImageUploadError("That image is too large even after compression — try a smaller file (max 10MB).");
  }

  const dimensions = await readDimensions(optimized);

  const blob = await upload(optimized.name, optimized, {
    access: "public",
    handleUploadUrl: "/api/admin/upload",
    onUploadProgress: options.onProgress
      ? ({ percentage }) => options.onProgress?.(Math.round(percentage))
      : undefined,
  });

  const result: UploadedImage = {
    url: blob.url,
    filename: optimized.name,
    width: dimensions.width,
    height: dimensions.height,
    sizeBytes: optimized.size,
    mimeType: optimized.type,
  };

  await recordMediaAssetAction({
    url: result.url,
    filename: result.filename,
    width: result.width,
    height: result.height,
    sizeBytes: result.sizeBytes,
    mimeType: result.mimeType,
    folderId: options.folderId ?? null,
  }).catch(() => {});

  return result;
}

/** Suggests alt text from a filename: "veterans-rally-tampa.jpg" → "Veterans rally tampa". */
export function suggestAltText(filename: string): string {
  const base = filename.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ");
  const words = base
    .replace(/\b[a-z0-9]{8,}\b/gi, "") // drop Blob's random suffix and other hash-like noise
    .replace(/\s+/g, " ")
    .trim();
  if (!words) return "";
  return words.charAt(0).toUpperCase() + words.slice(1);
}
