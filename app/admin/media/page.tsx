import { getAllMediaAssets, getMediaFolders, getMediaUsage } from "../../lib/media";
import { requireStaffSession } from "../../lib/require-admin";
import { canManageSettings } from "../../lib/permissions";
import MediaClient from "./MediaClient";

export const dynamic = "force-dynamic";

export default async function MediaPage() {
  const [assets, folders, usage, session] = await Promise.all([
    getAllMediaAssets(),
    getMediaFolders(),
    getMediaUsage(),
    requireStaffSession(),
  ]);

  // Usage is a Map server-side (cheap lookups while building it) but has
  // to cross the server/client boundary as a plain object.
  const usageByUrl = Object.fromEntries(
    Array.from(usage.entries()).map(([url, entry]) => [url, { count: entry.count, articles: entry.articles }])
  );

  return (
    <MediaClient
      initialAssets={assets}
      initialFolders={folders}
      usageByUrl={usageByUrl}
      canDelete={canManageSettings(session?.user.role)}
    />
  );
}
