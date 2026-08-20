import { redirect } from "next/navigation";
import { requireStaffSession } from "../../lib/require-admin";
import { canManageSettings } from "../../lib/permissions";
import { getSubmissions } from "../../lib/submissions";
import InboxClient from "./InboxClient";

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  // Submissions carry people's contact details, so this is admin-only.
  const session = await requireStaffSession();
  if (!canManageSettings(session?.user.role)) redirect("/admin");

  const submissions = await getSubmissions();
  return <InboxClient initial={submissions} />;
}
