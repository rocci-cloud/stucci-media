"use server";

import { revalidatePath } from "next/cache";
import { setCommentApproved, deleteCommentAdmin } from "../../lib/comments";
import { requireAdminSession } from "../../lib/require-admin";

export type ActionResult = { success: true } | { success: false; error: string };

const UNAUTHORIZED: ActionResult = { success: false, error: "You must be signed in as an admin to do that." };

export async function setCommentApprovedAction(id: string, isApproved: boolean): Promise<ActionResult> {
  if (!(await requireAdminSession())) return UNAUTHORIZED;
  try {
    await setCommentApproved(id, isApproved);
    revalidatePath("/", "layout");
    return { success: true };
  } catch {
    return { success: false, error: "Couldn't update that comment." };
  }
}

export async function deleteCommentAction(id: string): Promise<ActionResult> {
  if (!(await requireAdminSession())) return UNAUTHORIZED;
  try {
    await deleteCommentAdmin(id);
    revalidatePath("/", "layout");
    return { success: true };
  } catch {
    return { success: false, error: "Couldn't delete that comment." };
  }
}
