import { redirect } from "next/navigation";
import { requireModeratorSession } from "../../lib/require-admin";
import { getAllCommentsAdmin } from "../../lib/comments";
import CommentsClient from "./CommentsClient";

export const dynamic = "force-dynamic";

export default async function CommentsPage() {
  // Editors moderate comments too — authors do not.
  if (!(await requireModeratorSession())) redirect("/admin");

  const comments = await getAllCommentsAdmin();

  return <CommentsClient initialComments={comments} />;
}
