"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import {
  createEpisode,
  updateEpisode,
  deleteEpisode,
  parseDuration,
  type PodcastEpisodeInput,
} from "../../lib/podcast";
import { requireStaffSession, requirePublisherSession } from "../../lib/require-admin";
import { canPublish } from "../../lib/permissions";
import { sanitizeArticleHtml, bodyInputToHtml } from "../../lib/sanitize";
import { logActivity } from "../../lib/activity";
import type { ArticleStatusValue } from "../../lib/articles";

export type EpisodeFormState = { error?: string };
export type EpisodeActionResult = { success: true } | { success: false; error: string };

const MAX = {
  title: 200,
  slug: 100,
  subtitle: 300,
  guestName: 120,
  guestBio: 600,
  transcript: 200_000,
} as const;

const STATUS_VALUES: ArticleStatusValue[] = ["draft", "in_review", "published", "archived"];

function parseStatus(raw: FormDataEntryValue | null): ArticleStatusValue {
  const value = String(raw ?? "");
  return (STATUS_VALUES as string[]).includes(value) ? (value as ArticleStatusValue) : "draft";
}

function parseOptionalInt(raw: FormDataEntryValue | null): number | null {
  const value = String(raw ?? "").trim();
  if (!value) return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
}

function parseInput(formData: FormData): PodcastEpisodeInput | { error: string } {
  const slug = String(formData.get("slug") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const subtitle = String(formData.get("subtitle") || "").trim() || null;
  const audioUrl = String(formData.get("audioUrl") || "").trim() || null;
  const coverImageUrl = String(formData.get("coverImageUrl") || "").trim() || null;
  const guestName = String(formData.get("guestName") || "").trim() || null;
  const guestBio = String(formData.get("guestBio") || "").trim() || null;
  const rawShowNotes = String(formData.get("showNotes") || "").trim();
  const rawTranscript = String(formData.get("transcript") || "").trim();
  const durationRaw = String(formData.get("duration") || "").trim();

  if (!slug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
    return { error: "Slug must be lowercase letters, numbers, and hyphens only." };
  }
  if (slug.length > MAX.slug) return { error: `Slug must be ${MAX.slug} characters or fewer.` };
  if (!title) return { error: "Title is required." };
  if (title.length > MAX.title) return { error: `Title must be ${MAX.title} characters or fewer.` };
  if (subtitle && subtitle.length > MAX.subtitle) {
    return { error: `Subtitle must be ${MAX.subtitle} characters or fewer.` };
  }
  if (guestName && guestName.length > MAX.guestName) {
    return { error: `Guest name must be ${MAX.guestName} characters or fewer.` };
  }
  if (guestBio && guestBio.length > MAX.guestBio) {
    return { error: `Guest bio must be ${MAX.guestBio} characters or fewer.` };
  }
  if (audioUrl && !/^https?:\/\/.+/i.test(audioUrl)) {
    return { error: "Audio URL must start with http:// or https://." };
  }
  if (rawTranscript.length > MAX.transcript) {
    return { error: "That transcript is too long to store — trim it or link to a hosted copy." };
  }

  const durationSeconds = durationRaw ? parseDuration(durationRaw) : null;
  if (durationRaw && durationSeconds === null) {
    return { error: 'Duration should look like "48:10" or "1:04:32".' };
  }

  return {
    slug,
    title,
    subtitle,
    episodeNumber: parseOptionalInt(formData.get("episodeNumber")),
    seasonNumber: parseOptionalInt(formData.get("seasonNumber")),
    audioUrl,
    durationSeconds,
    coverImageUrl,
    // Show notes come from the same rich editor articles use, so they get
    // the same sanitizer. The transcript is plain text from a textarea and
    // is wrapped into paragraphs by the same helper the old article body
    // textarea used.
    showNotes: rawShowNotes ? sanitizeArticleHtml(rawShowNotes) : "",
    transcript: rawTranscript ? bodyInputToHtml(rawTranscript) : "",
    guestName,
    guestBio,
    status: parseStatus(formData.get("status")),
    publishedAt: String(formData.get("publishedAt") || "").trim() || null,
  };
}

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function createEpisodeAction(
  _prev: EpisodeFormState,
  formData: FormData
): Promise<EpisodeFormState> {
  const session = await requireStaffSession();
  if (!session) return { error: "You must be signed in as staff to do that." };

  const input = parseInput(formData);
  if ("error" in input) return input;
  if (!canPublish(session.user.role) && (input.status === "published" || input.status === "archived")) {
    return { error: "Authors can't publish — save it as In Review and an editor will take it from there." };
  }

  try {
    await createEpisode(input);
  } catch (error) {
    if (isUniqueConstraintError(error)) return { error: `Slug "${input.slug}" is already in use.` };
    return { error: "Something went wrong saving the episode." };
  }

  await logActivity({
    actor: session.user,
    action: "episode.created",
    targetType: "podcast episode",
    targetLabel: input.title,
  });
  revalidatePath("/", "layout");
  redirect("/admin/podcast");
}

export async function updateEpisodeAction(
  id: string,
  _prev: EpisodeFormState,
  formData: FormData
): Promise<EpisodeFormState> {
  const session = await requireStaffSession();
  if (!session) return { error: "You must be signed in as staff to do that." };

  const input = parseInput(formData);
  if ("error" in input) return input;
  if (!canPublish(session.user.role) && (input.status === "published" || input.status === "archived")) {
    return { error: "Authors can't publish — save it as In Review and an editor will take it from there." };
  }

  try {
    await updateEpisode(id, input);
  } catch (error) {
    if (isUniqueConstraintError(error)) return { error: `Slug "${input.slug}" is already in use.` };
    return { error: "Something went wrong saving the episode." };
  }

  await logActivity({
    actor: session.user,
    action: "episode.updated",
    targetType: "podcast episode",
    targetLabel: input.title,
  });
  revalidatePath("/", "layout");
  redirect("/admin/podcast");
}

export async function deleteEpisodeAction(id: string, title: string): Promise<EpisodeActionResult> {
  const session = await requirePublisherSession();
  if (!session) return { success: false, error: "Only an editor or admin can delete an episode." };

  try {
    await deleteEpisode(id);
    await logActivity({
      actor: session.user,
      action: "episode.deleted",
      targetType: "podcast episode",
      targetLabel: title,
    });
    revalidatePath("/", "layout");
    return { success: true };
  } catch {
    return { success: false, error: "Couldn't delete that episode." };
  }
}
