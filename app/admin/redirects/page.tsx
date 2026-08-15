import { redirect } from "next/navigation";
import { requireAdminSession } from "../../lib/require-admin";
import { getAllRedirects } from "../../lib/redirects";
import RedirectsClient from "./RedirectsClient";

export const dynamic = "force-dynamic";

export default async function RedirectsPage() {
  // Admin-only. The /admin layout now admits editors and authors
  // too, so this section re-checks rather than relying on it.
  if (!(await requireAdminSession())) redirect("/admin");

  const redirects = await getAllRedirects();

  return <RedirectsClient initialRedirects={redirects} />;
}
