import { prisma } from "./prisma";

export async function getLikeCount(articleId: number): Promise<number> {
  return prisma.like.count({ where: { articleId } });
}

export async function hasUserLiked(articleId: number, userId: string): Promise<boolean> {
  const like = await prisma.like.findUnique({
    where: { userId_articleId: { userId, articleId } },
  });
  return Boolean(like);
}

// Toggles the current user's like on an article and returns the new state
// in one round trip — the unique(userId, articleId) constraint is what
// actually prevents double-likes; this just decides create vs delete.
export async function toggleLike(articleId: number, userId: string): Promise<{ liked: boolean; count: number }> {
  const existing = await prisma.like.findUnique({
    where: { userId_articleId: { userId, articleId } },
  });

  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
  } else {
    await prisma.like.create({ data: { userId, articleId } });
  }

  const count = await prisma.like.count({ where: { articleId } });
  return { liked: !existing, count };
}
