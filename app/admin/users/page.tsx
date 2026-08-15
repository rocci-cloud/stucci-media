import { redirect } from "next/navigation";
import { getStaffUsers, getInvites, countReaders } from "../../lib/users";
import { requireAdminSession } from "../../lib/require-admin";
import UsersClient from "./UsersClient";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const session = await requireAdminSession();
  // Non-admin staff never see this in the nav, but the route is still
  // directly reachable, so it re-checks rather than trusting the menu.
  if (!session) redirect("/admin");

  const [users, invites, readerCount] = await Promise.all([getStaffUsers(), getInvites(), countReaders()]);

  // www, not the apex domain — see the PRODUCTION_URL comment in
  // app/lib/auth.ts.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.stuccimedia.com";

  return (
    <UsersClient
      users={users}
      invites={invites}
      currentUserId={session.user.id}
      registerUrl={`${siteUrl}/register`}
      readerCount={readerCount}
    />
  );
}
