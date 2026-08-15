"use server";

import { prisma } from "../lib/prisma";
import { requireStaffSession } from "../lib/require-admin";
import { canManageAllContent } from "../lib/permissions";
import type { ArticleStatusValue } from "../lib/articles";

export type CommandArticle = {
  id: number;
  headline: string;
  status: ArticleStatusValue;
};

export type SearchResult =
  | { success: true; articles: CommandArticle[] }
  | { success: false; error: string };

const LIMIT = 6;

/**
 * Backs the command palette's article search. Scoped to what the caller
 * may actually open: an AUTHOR searching only ever sees their own work,
 * so the palette can't become a way to enumerate the newsroom's drafts.
 */
export async function searchArticlesAction(query: string): Promise<SearchResult> {
  const session = await requireStaffSession();
  if (!session) return { success: false, error: "Not authorized." };

  const trimmed = query.trim();
  if (trimmed.length < 2) return { success: true, articles: [] };

  const rows = await prisma.article.findMany({
    where: {
      deletedAt: null,
      ...(canManageAllContent(session.user.role) ? {} : { authorId: session.user.id }),
      OR: [
        { headline: { contains: trimmed, mode: "insensitive" } },
        { slug: { contains: trimmed, mode: "insensitive" } },
      ],
    },
    orderBy: { updatedAt: "desc" },
    take: LIMIT,
    select: { id: true, headline: true, status: true },
  });

  return {
    success: true,
    articles: rows.map((row) => ({
      id: row.id,
      headline: row.headline,
      status: row.status.toLowerCase() as ArticleStatusValue,
    })),
  };
}
