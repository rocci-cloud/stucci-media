import { prisma } from "./prisma";

export type MediaAsset = {
  id: string;
  url: string;
  filename: string;
  alt: string | null;
  width: number | null;
  height: number | null;
  sizeBytes: number | null;
  mimeType: string | null;
  folderId: string | null;
  tags: string[];
  uploadedByName: string;
  uploadedByEmail: string;
  createdAt: string;
};

export type MediaFolder = {
  id: string;
  name: string;
  slug: string;
  assetCount: number;
};

type MediaRow = {
  id: string;
  url: string;
  filename: string;
  alt: string | null;
  width: number | null;
  height: number | null;
  sizeBytes: number | null;
  mimeType: string | null;
  folderId: string | null;
  tags: string[];
  uploadedByName: string;
  uploadedByEmail: string;
  createdAt: Date;
};

function mapRow(row: MediaRow): MediaAsset {
  return { ...row, createdAt: row.createdAt.toISOString() };
}

export async function getAllMediaAssets(): Promise<MediaAsset[]> {
  const rows = await prisma.mediaAsset.findMany({ orderBy: { createdAt: "desc" } });
  return rows.map(mapRow);
}

export async function getMediaFolders(): Promise<MediaFolder[]> {
  const rows = await prisma.mediaFolder.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { assets: true } } },
  });
  return rows.map((r) => ({ id: r.id, name: r.name, slug: r.slug, assetCount: r._count.assets }));
}

export async function createMediaFolder(name: string, slug: string): Promise<MediaFolder> {
  const row = await prisma.mediaFolder.create({ data: { name, slug } });
  return { id: row.id, name: row.name, slug: row.slug, assetCount: 0 };
}

/**
 * Deleting a folder never deletes the images inside it — MediaAsset's FK
 * is ON DELETE SET NULL, so its assets simply become unfiled. Losing the
 * files because someone tidied up a folder would be indefensible.
 */
export async function deleteMediaFolder(id: string): Promise<void> {
  await prisma.mediaFolder.delete({ where: { id } });
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
  width?: number | null;
  height?: number | null;
  sizeBytes?: number | null;
  mimeType?: string | null;
  folderId?: string | null;
}): Promise<MediaAsset> {
  const row = await prisma.mediaAsset.upsert({
    where: { url: input.url },
    create: input,
    update: {},
  });
  return mapRow(row);
}

export async function updateMediaAsset(
  id: string,
  input: { alt?: string | null; tags?: string[]; folderId?: string | null; filename?: string }
): Promise<MediaAsset> {
  const row = await prisma.mediaAsset.update({ where: { id }, data: input });
  return mapRow(row);
}

export async function setMediaAssetsFolder(ids: string[], folderId: string | null): Promise<void> {
  await prisma.mediaAsset.updateMany({ where: { id: { in: ids } }, data: { folderId } });
}

export async function getMediaAssetById(id: string): Promise<MediaAsset | undefined> {
  const row = await prisma.mediaAsset.findUnique({ where: { id } });
  return row ? mapRow(row) : undefined;
}

export async function getMediaAssetsByIds(ids: string[]): Promise<MediaAsset[]> {
  const rows = await prisma.mediaAsset.findMany({ where: { id: { in: ids } } });
  return rows.map(mapRow);
}

export async function deleteMediaAssetRecord(id: string): Promise<void> {
  await prisma.mediaAsset.delete({ where: { id } });
}

export async function deleteMediaAssetRecords(ids: string[]): Promise<void> {
  await prisma.mediaAsset.deleteMany({ where: { id: { in: ids } } });
}

// --- Usage tracking ---

export type MediaUsage = { url: string; count: number; articles: { id: number; headline: string }[] };

/**
 * Where each asset is actually used across the site. Every place a URL can
 * be referenced is checked: an article's cover image, its OG image, an
 * inline <img> in its body, a category's share image, and a banner's
 * image.
 *
 * Implemented as a handful of full-column scans in JS rather than N
 * per-asset LIKE queries: the media library is a few hundred rows against
 * a few hundred articles, so one pass over the data is both simpler and
 * far cheaper than a query per asset. If either side grows into the tens
 * of thousands this wants to become a real inverted index instead.
 */
export async function getMediaUsage(): Promise<Map<string, MediaUsage>> {
  const [articles, categories, banners] = await Promise.all([
    prisma.article.findMany({
      where: { deletedAt: null },
      select: { id: true, headline: true, coverImageUrl: true, ogImage: true, body: true },
    }),
    prisma.category.findMany({ select: { shareImage: true } }),
    prisma.banner.findMany({ select: { imageUrl: true } }),
  ]);

  const usage = new Map<string, MediaUsage>();
  const bump = (url: string | null, article?: { id: number; headline: string }) => {
    if (!url) return;
    const entry = usage.get(url) ?? { url, count: 0, articles: [] };
    entry.count += 1;
    if (article && !entry.articles.some((a) => a.id === article.id)) entry.articles.push(article);
    usage.set(url, entry);
  };

  for (const article of articles) {
    const ref = { id: article.id, headline: article.headline };
    bump(article.coverImageUrl, ref);
    bump(article.ogImage, ref);
    for (const match of article.body.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)) {
      bump(match[1], ref);
    }
  }
  for (const category of categories) bump(category.shareImage);
  for (const banner of banners) bump(banner.imageUrl);

  return usage;
}
