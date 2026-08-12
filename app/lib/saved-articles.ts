import { prisma } from "./prisma";

export async function hasUserSaved(articleId: number, userId: string): Promise<boolean> {
  const saved = await prisma.savedArticle.findUnique({
    where: { userId_articleId: { userId, articleId } },
  });
  return Boolean(saved);
}

// Toggles the current user's save on an article — same create/delete-by-
// unique-constraint shape as toggleLike in likes.ts.
export async function toggleSaved(articleId: number, userId: string): Promise<{ saved: boolean }> {
  const existing = await prisma.savedArticle.findUnique({
    where: { userId_articleId: { userId, articleId } },
  });

  if (existing) {
    await prisma.savedArticle.delete({ where: { id: existing.id } });
  } else {
    await prisma.savedArticle.create({ data: { userId, articleId } });
  }

  return { saved: !existing };
}
