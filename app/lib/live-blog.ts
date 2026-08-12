import { prisma } from "./prisma";

export type LiveBlogEntry = {
  id: string;
  headline: string | null;
  bodyHtml: string;
  createdAt: string;
};

function mapEntry(row: { id: string; headline: string | null; body: string; createdAt: Date }): LiveBlogEntry {
  return { id: row.id, headline: row.headline, bodyHtml: row.body, createdAt: row.createdAt.toISOString() };
}

// Newest first, matching every real news site's live-blog convention
// (most recent update at the top, readers scroll down into the past).
export async function getLiveBlogEntries(articleId: number): Promise<LiveBlogEntry[]> {
  const rows = await prisma.liveBlogEntry.findMany({
    where: { articleId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(mapEntry);
}

export async function addLiveBlogEntry(
  articleId: number,
  input: { headline: string | null; bodyHtml: string }
): Promise<LiveBlogEntry> {
  const row = await prisma.liveBlogEntry.create({
    data: { articleId, headline: input.headline, body: input.bodyHtml },
  });
  return mapEntry(row);
}

export async function deleteLiveBlogEntry(id: string): Promise<void> {
  await prisma.liveBlogEntry.delete({ where: { id } });
}

export async function getLiveBlogEntryPreview(id: string): Promise<string | null> {
  const row = await prisma.liveBlogEntry.findUnique({ where: { id }, select: { headline: true, body: true } });
  if (!row) return null;
  return row.headline || row.body.replace(/<[^>]+>/g, " ").trim().slice(0, 60);
}
