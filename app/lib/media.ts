import { prisma } from "./prisma";

export type MediaAsset = {
  id: string;
  url: string;
  filename: string;
  uploadedByName: string;
  uploadedByEmail: string;
  createdAt: string;
};

function mapRow(row: {
  id: string;
  url: string;
  filename: string;
  uploadedByName: string;
  uploadedByEmail: string;
  createdAt: Date;
}): MediaAsset {
  return {
    id: row.id,
    url: row.url,
    filename: row.filename,
    uploadedByName: row.uploadedByName,
    uploadedByEmail: row.uploadedByEmail,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getAllMediaAssets(): Promise<MediaAsset[]> {
  const rows = await prisma.mediaAsset.findMany({ orderBy: { createdAt: "desc" } });
  return rows.map(mapRow);
}

// Upsert-by-url: ImageField fires this after every successful upload, but
// the same asset shouldn't get re-indexed if an admin re-selects it (e.g.
// re-uploading the identical file). `url` already carries Vercel Blob's
// random suffix, so a genuine re-upload always gets a fresh row anyway —
// this just guards against a rare duplicate fire.
export async function recordMediaAsset(input: {
  url: string;
  filename: string;
  uploadedByName: string;
  uploadedByEmail: string;
}): Promise<MediaAsset> {
  const row = await prisma.mediaAsset.upsert({
    where: { url: input.url },
    create: input,
    update: {},
  });
  return mapRow(row);
}

export async function getMediaAssetById(id: string): Promise<MediaAsset | undefined> {
  const row = await prisma.mediaAsset.findUnique({ where: { id } });
  return row ? mapRow(row) : undefined;
}

export async function deleteMediaAssetRecord(id: string): Promise<void> {
  await prisma.mediaAsset.delete({ where: { id } });
}
