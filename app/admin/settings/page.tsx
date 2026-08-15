import { getSiteSettings } from "../../lib/settings";
import { requireStaffSession } from "../../lib/require-admin";
import { canManageSettings } from "../../lib/permissions";
import SettingsClient from "./SettingsClient";
import SiteSettingsForm from "./SiteSettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await requireStaffSession();
  const isAdmin = canManageSettings(session?.user.role);

  // Every staff member gets their own profile section; only an admin gets
  // the site-wide half, so an editor opening Settings still has something
  // useful rather than a permission wall.
  const settings = isAdmin ? await getSiteSettings() : null;

  return (
    <div className="flex max-w-xl flex-col gap-5">
      <SettingsClient />
      {settings && <SiteSettingsForm initial={settings} />}
    </div>
  );
}
