import { redirect } from "next/navigation";
import { getTrashedArticles } from "../../lib/articles";
import { requireStaffSession } from "../../lib/require-admin";
import { canManageAllContent } from "../../lib/permissions";
import TrashClient from "./TrashClient";

export const dynamic = "force-dynamic";

export default async function TrashPage() {
  const session = await requireStaffSession();
  if (!session) redirect("/login?from=/admin/trash");

  // Restoring and purging are publisher powers (see the actions), so an
  // author has nothing to do here — better to say so than show them a
  // list of buttons that all fail.
  const canRestore = canManageAllContent(session.user.role);
  const articles = await getTrashedArticles();

  return <TrashClient articles={articles} canRestore={canRestore} />;
}
