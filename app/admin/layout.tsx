import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "../lib/auth";
import { canAccessAdmin } from "../lib/permissions";
import AdminShell from "./components/AdminShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login?from=/admin");
  }
  // ADMIN, EDITOR, or AUTHOR. Individual sections gate further on top of
  // this (see nav-items.ts and each section's own page/action checks) —
  // this is only the "may you be in here at all" door.
  if (!canAccessAdmin(session.user.role)) {
    redirect("/");
  }

  return <AdminShell>{children}</AdminShell>;
}
