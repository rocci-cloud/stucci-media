"use server";

import { revalidatePath } from "next/cache";
import { setCommentApproved, deleteCommentAdmin } from "../../lib/comments";

export type ActionResult = { success: true } | { success: false; error: string };

export async function setCommentApprovedAction(id: string, isApproved: boolean): Promise<ActionResult> {
  try {
    await setCommentApproved(id, isApproved);
    revalidatePath("/", "layout");
    return { success: true };
  } catch {
    return { success: false, error: "Couldn't update that comment." };
  }
}

export async function deleteCommentAction(id: string): Promise<ActionResult> {
  try {
    await deleteCommentAdmin(id);
    revalidatePath("/", "layout");
    return { success: true };
  } catch {
    return { success: false, error: "Couldn't delete that comment." };
  }
}
