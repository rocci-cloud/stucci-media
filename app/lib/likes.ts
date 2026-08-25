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

/**
 * Likes on a podcast episode.
 *
 * Separate functions rather than a nullable-id union, because the caller
 * always knows which kind of thing it is holding and a mis-typed union
 * here would write a row that fails the database's one-target check at
 * runtime instead of at compile time.
 */
export async function getEpisodeLikeCount(episodeId: string): Promise<number> {
  return prisma.like.count({ where: { podcastEpisodeId: episodeId } });
}

export async function hasUserLikedEpisode(episodeId: string, userId: string): Promise<boolean> {
  const row = await prisma.like.findFirst({
    where: { podcastEpisodeId: episodeId, userId },
    select: { id: true },
  });
  return row !== null;
}

export async function toggleEpisodeLike(
  episodeId: string,
  userId: string
): Promise<{ liked: boolean; count: number }> {
  const existing = await prisma.like.findFirst({
    where: { podcastEpisodeId: episodeId, userId },
    select: { id: true },
  });

  if (existing) await prisma.like.delete({ where: { id: existing.id } });
  else await prisma.like.create({ data: { podcastEpisodeId: episodeId, userId } });

  return { liked: !existing, count: await getEpisodeLikeCount(episodeId) };
}
