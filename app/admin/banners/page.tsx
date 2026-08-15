import { redirect } from "next/navigation";
import { requireAdminSession } from "../../lib/require-admin";
import { getAllBannersAdmin } from "../../lib/banners";
import BannersClient from "./BannersClient";

export const dynamic = "force-dynamic";

export default async function BannersPage() {
  // Admin-only. The /admin layout now admits editors and authors
  // too, so this section re-checks rather than relying on it.
  if (!(await requireAdminSession())) redirect("/admin");

  const banners = await getAllBannersAdmin();

  return <BannersClient initialBanners={banners} />;
}
