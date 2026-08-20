"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import {
  importPodcastFromFeed,
  refreshPodcast,
  setPodcastActive,
  updatePodcastPresentation,
  deletePodcast,
  type Podcast,
} from "../../lib/podcasts";
import { FeedParseError } from "../../lib/podcast-feed";
import { slugify } from "../../lib/slugify";
import { requireAdminSession } from "../../lib/require-admin";
import { logActivity } from "../../lib/activity";

export type PodcastActionResult =
  | { success: true; podcast: Podcast; episodeCount: number }
  | { success: false; error: string };

export type SimpleResult = { success: true } | { success: false; error: string };

const UNAUTHORIZED = {
  success: false as const,
  error: "You must be signed in as an admin to do that.",
};

/**
 * A feed URL points at a third-party server, so every failure mode here is
 * something an operator can hit by pasting the wrong thing: a 404, a
 * timeout, an HTML page, a feed that's already been added. FeedParseError
 * already carries a message written for a person, so it's passed through
 * rather than replaced with something generic.
 */
function describeFailure(error: unknown, fallback: string): string {
  if (error instanceof FeedParseError) return error.message;
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return "That feed has already been added.";
  }
  return fallback;
}

export async function addPodcastFeedAction(formData: FormData): Promise<PodcastActionResult> {
  const session = await requireAdminSession();
  if (!session) return UNAUTHORIZED;

  const feedUrl = String(formData.get("feedUrl") || "").trim();
  if (!feedUrl) return { success: false, error: "Paste the podcast's RSS feed URL." };

  try {
    const { podcast, episodeCount } = await importPodcastFromFeed(feedUrl);
    await logActivity({
      actor: session.user,
      action: "podcast.imported",
      targetType: "podcast",
      targetLabel: podcast.title,
    });
    revalidatePath("/", "layout");
    return { success: true, podcast, episodeCount };
  } catch (error) {
    return { success: false, error: describeFailure(error, "Couldn't import that feed.") };
  }
}

export async function refreshPodcastAction(id: string): Promise<PodcastActionResult> {
  const session = await requireAdminSession();
  if (!session) return UNAUTHORIZED;

  try {
    const { podcast, episodeCount } = await refreshPodcast(id);
    await logActivity({
      actor: session.user,
      action: "podcast.refreshed",
      targetType: "podcast",
      targetLabel: `${podcast.title} (${episodeCount} episodes)`,
    });
    revalidatePath("/", "layout");
    return { success: true, podcast, episodeCount };
  } catch (error) {
    // refreshPodcast has already recorded the failure on the row, so the
    // list will show why it went stale even if this toast is missed.
    return { success: false, error: describeFailure(error, "Couldn't refresh that feed.") };
  }
}

export async function setPodcastActiveAction(id: string, isActive: boolean): Promise<SimpleResult> {
  const session = await requireAdminSession();
  if (!session) return UNAUTHORIZED;
  try {
    await setPodcastActive(id, isActive);
    await logActivity({
      actor: session.user,
      action: isActive ? "podcast.activated" : "podcast.deactivated",
      targetType: "podcast",
      targetLabel: id,
    });
    revalidatePath("/", "layout");
    return { success: true };
  } catch {
    return { success: false, error: "Couldn't change that show's visibility." };
  }
}

export async function updatePodcastAction(id: string, formData: FormData): Promise<SimpleResult> {
  const session = await requireAdminSession();
  if (!session) return UNAUTHORIZED;

  const slug = slugify(String(formData.get("slug") || "").trim());
  const sortOrderRaw = String(formData.get("sortOrder") || "0").trim();
  const sortOrder = Number.parseInt(sortOrderRaw, 10);

  if (!slug) return { success: false, error: "Slug must contain at least one letter or number." };
  if (slug.length > 80) return { success: false, error: "Slug must be 80 characters or fewer." };
  if (!Number.isFinite(sortOrder)) return { success: false, error: "Order must be a number." };

  try {
    await updatePodcastPresentation(id, { slug, sortOrder });
    await logActivity({
      actor: session.user,
      action: "podcast.updated",
      targetType: "podcast",
      targetLabel: slug,
    });
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { success: false, error: `The slug "${slug}" is already in use by another show.` };
    }
    return { success: false, error: "Couldn't save that show." };
  }
}

export async function deletePodcastAction(id: string, title: string): Promise<SimpleResult> {
  const session = await requireAdminSession();
  if (!session) return UNAUTHORIZED;
  try {
    await deletePodcast(id);
    await logActivity({
      actor: session.user,
      action: "podcast.deleted",
      targetType: "podcast",
      targetLabel: title,
    });
    revalidatePath("/", "layout");
    return { success: true };
  } catch {
    return { success: false, error: "Couldn't delete that show." };
  }
}
