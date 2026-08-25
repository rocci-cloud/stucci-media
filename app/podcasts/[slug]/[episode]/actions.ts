"use server";

import { headers } from "next/headers";
import { auth } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import { toggleEpisodeLike } from "../../../lib/likes";
import { createEpisodeComment, type CommentNode } from "../../../lib/comments";

async function requireSession() {
  return auth.api.getSession({ headers: await headers() });
}

/**
 * The episode id arrives from the client, so a tampered request could name
 * an episode belonging to a show an editor has deactivated — which is
 * hidden from the public site entirely. Confirm it is reachable before
 * writing anything against it.
 */
async function requireVisibleEpisode(episodeId: string) {
  const episode = await prisma.podcastFeedEpisode.findUnique({
    where: { id: episodeId },
    select: { id: true, podcast: { select: { isActive: true } } },
  });
  return episode?.podcast.isActive ? episode : null;
}

export type LikeActionResult =
  | { success: true; liked: boolean; count: number }
  | { success: false; error: string };

export async function toggleEpisodeLikeAction(episodeId: string): Promise<LikeActionResult> {
  const session = await requireSession();
  if (!session) return { success: false, error: "Sign in to like this episode." };
  if (!(await requireVisibleEpisode(episodeId))) {
    return { success: false, error: "This episode is no longer available." };
  }
  try {
    const result = await toggleEpisodeLike(episodeId, session.user.id);
    return { success: true, ...result };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export type CommentActionResult =
  | { success: true; comment: CommentNode }
  | { success: false; error: string };

const MAX_COMMENT_LENGTH = 2000;
const MIN_COMMENT_LENGTH = 2;

export async function createEpisodeCommentAction(
  episodeId: string,
  content: string,
  parentId: string | null
): Promise<CommentActionResult> {
  const session = await requireSession();
  if (!session) return { success: false, error: "Sign in to join the conversation." };

  const trimmed = content.trim();
  if (trimmed.length < MIN_COMMENT_LENGTH) return { success: false, error: "Comment is too short." };
  if (trimmed.length > MAX_COMMENT_LENGTH) {
    return { success: false, error: `Comments are limited to ${MAX_COMMENT_LENGTH} characters.` };
  }

  if (!(await requireVisibleEpisode(episodeId))) {
    return { success: false, error: "This episode is no longer available." };
  }

  // A reply must belong to the episode being replied on — otherwise a
  // crafted parentId could graft a thread from one episode onto another.
  if (parentId) {
    const parent = await prisma.comment.findUnique({
      where: { id: parentId },
      select: { podcastEpisodeId: true },
    });
    if (!parent || parent.podcastEpisodeId !== episodeId) {
      return { success: false, error: "That comment no longer exists." };
    }
  }

  try {
    const comment = await createEpisodeComment({
      episodeId,
      userId: session.user.id,
      content: trimmed,
      parentId,
    });
    return { success: true, comment };
  } catch {
    return { success: false, error: "Something went wrong posting your comment. Please try again." };
  }
}
