"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import {
  updateSubmissionStatus,
  markSubmissionImported,
  deleteSubmission,
  getSubmissionById,
  type Submission,
  type SubmissionStatus,
} from "../../lib/submissions";
import { importPodcastFromFeed } from "../../lib/podcasts";
import { FeedParseError } from "../../lib/podcast-feed";
import { requireAdminSession } from "../../lib/require-admin";
import { logActivity } from "../../lib/activity";

export type SubmissionResult =
  | { success: true; submission: Submission }
  | { success: false; error: string };

export type ApproveResult =
  | { success: true; submission: Submission; podcastSlug: string; episodeCount: number }
  | { success: false; error: string };

export type SimpleResult = { success: true } | { success: false; error: string };

const UNAUTHORIZED = {
  success: false as const,
  error: "You must be signed in as an admin to do that.",
};

export async function setSubmissionStatusAction(
  id: string,
  status: SubmissionStatus,
  adminNotes?: string | null
): Promise<SubmissionResult> {
  const session = await requireAdminSession();
  if (!session) return UNAUTHORIZED;
  try {
    const submission = await updateSubmissionStatus(id, status, adminNotes);
    await logActivity({
      actor: session.user,
      action: `submission.${status.toLowerCase()}`,
      targetType: "submission",
      targetLabel: submission.showName ?? submission.name,
    });
    revalidatePath("/admin/inbox");
    return { success: true, submission };
  } catch {
    return { success: false, error: "Couldn't update that submission." };
  }
}

/**
 * Turns an accepted pitch into a live show in one step.
 *
 * The feed is imported first and the submission only marked approved once
 * that succeeds — a pitch marked approved whose feed never imported would be
 * the worst of both, looking handled while the show is nowhere on the site.
 */
export async function approveAndImportAction(id: string): Promise<ApproveResult> {
  const session = await requireAdminSession();
  if (!session) return UNAUTHORIZED;

  const submission = await getSubmissionById(id);
  if (!submission) return { success: false, error: "That submission no longer exists." };
  if (!submission.feedUrl) {
    return { success: false, error: "This submission has no RSS feed to import." };
  }
  if (submission.importedPodcastId) {
    return { success: false, error: "This show has already been added." };
  }

  try {
    const { podcast, episodeCount } = await importPodcastFromFeed(submission.feedUrl);
    const updated = await markSubmissionImported(id, podcast.id);
    await logActivity({
      actor: session.user,
      action: "submission.approved_and_imported",
      targetType: "podcast",
      targetLabel: podcast.title,
    });
    revalidatePath("/", "layout");
    return { success: true, submission: updated, podcastSlug: podcast.slug, episodeCount };
  } catch (error) {
    if (error instanceof FeedParseError) {
      return { success: false, error: `Couldn't import the feed — ${error.message}` };
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { success: false, error: "That feed is already on the site as another show." };
    }
    return { success: false, error: "Couldn't import that feed." };
  }
}

export async function deleteSubmissionAction(id: string, label: string): Promise<SimpleResult> {
  const session = await requireAdminSession();
  if (!session) return UNAUTHORIZED;
  try {
    await deleteSubmission(id);
    await logActivity({
      actor: session.user,
      action: "submission.deleted",
      targetType: "submission",
      targetLabel: label,
    });
    revalidatePath("/admin/inbox");
    return { success: true };
  } catch {
    return { success: false, error: "Couldn't delete that submission." };
  }
}
