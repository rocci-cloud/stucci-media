import { getAllCommentsAdmin } from "../../lib/comments";
import CommentsClient from "./CommentsClient";

export const dynamic = "force-dynamic";

export default async function CommentsPage() {
  const comments = await getAllCommentsAdmin();

  return <CommentsClient initialComments={comments} />;
}
