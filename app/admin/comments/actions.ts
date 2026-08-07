"use server";

import { revalidatePath } from "next/cache";
import { setCommentApproved, deleteCommentAdmin, getCommentPreview } from "../../lib/comments";
import { requireAdminSession } from "../../lib/require-admin";
import { logActivity } from "../../lib/activity";

export type ActionResult = { success: true } | { success: false; error: string };

const UNAUTHORIZED: ActionResult = { success: false, error: "You must be signed in as an admin to do that." };

export async function setCommentApprovedAction(id: string, isApproved: boolean): Promise<ActionResult> {
  const session = await requireAdminSession();
  if (!session) return UNAUTHORIZED;
  try {
    await setCommentApproved(id, isApproved);
    const preview = await getCommentPreview(id);
    await logActivity({
      actor: session.user,
      action: isApproved ? "comment.approved" : "comment.hidden",
      targetType: "comment",
      targetLabel: preview ?? id,
    });
    revalidatePath("/", "layout");
    return { success: true };
  } catch {
    return { success: false, error: "Couldn't update that comment." };
  }
}

export async function deleteCommentAction(id: string): Promise<ActionResult> {
  const session = await requireAdminSession();
  if (!session) return UNAUTHORIZED;
  try {
    const preview = await getCommentPreview(id);
    await deleteCommentAdmin(id);
    await logActivity({
      actor: session.user,
      action: "comment.deleted",
      targetType: "comment",
      targetLabel: preview ?? id,
    });
    revalidatePath("/", "layout");
    return { success: true };
  } catch {
    return { success: false, error: "Couldn't delete that comment." };
  }
}
