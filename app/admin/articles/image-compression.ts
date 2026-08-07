// Client-side resize/compress before handing a file to Vercel Blob —
// without this, a straight-from-camera photo (often 4000px+ wide, several
// MB) becomes the article's actual served cover/OG image, directly hurting
// page load for every visitor. Runs entirely in the browser via Canvas, no
// extra dependency.

const MAX_DIMENSION = 2000; // px, on the longer side — plenty for a full-bleed hero image
const JPEG_QUALITY = 0.85;
const MIN_BYTES_TO_BOTHER = 300 * 1024; // skip re-encoding already-small images

export async function compressImageIfNeeded(file: File): Promise<File> {
  // Animated GIFs lose their animation if redrawn to a canvas — leave them
  // (and non-image files, and small enough files) alone.
  if (file.type === "image/gif" || !file.type.startsWith("image/") || file.size < MIN_BYTES_TO_BOTHER) {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY)
    );
    if (!blob || blob.size >= file.size) return file; // compression didn't help, keep the original

    const newName = file.name.replace(/\.[a-zA-Z0-9]+$/, "") + ".jpg";
    return new File([blob], newName, { type: "image/jpeg" });
  } catch {
    // Canvas/createImageBitmap can fail on corrupt or unusual files —
    // fall back to uploading the original rather than blocking the user.
    return file;
  }
}
