import { redirect } from "next/navigation";
import { requireStaffSession } from "../../lib/require-admin";
import { canManageSettings } from "../../lib/permissions";
import { getAllPodcastsAdmin } from "../../lib/podcasts";
import PodcastFeedsClient from "./PodcastFeedsClient";

export const dynamic = "force-dynamic";

export default async function PodcastFeedsPage() {
  // Adding a feed publishes a whole new section of the site, so this sits at
  // the same tier as categories and banners rather than with content editing.
  const session = await requireStaffSession();
  if (!canManageSettings(session?.user.role)) redirect("/admin");

  const podcasts = await getAllPodcastsAdmin();
  return <PodcastFeedsClient initialPodcasts={podcasts} />;
}
