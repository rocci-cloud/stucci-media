import { redirect } from "next/navigation";
import { requireStaffSession } from "../../lib/require-admin";
import { canManageSettings } from "../../lib/permissions";
import { getBylinesWithCounts } from "../../lib/authors";
import AuthorsClient from "./AuthorsClient";

export const dynamic = "force-dynamic";

export default async function AuthorsPage() {
  // Author profiles are site-level configuration, same tier as categories —
  // the layout's staff check isn't enough on its own, so re-check here.
  const session = await requireStaffSession();
  if (!canManageSettings(session?.user.role)) redirect("/admin");

  const bylines = await getBylinesWithCounts();
  return <AuthorsClient initialBylines={bylines} />;
}
