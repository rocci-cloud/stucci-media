import { getAllEpisodesAdmin } from "../../lib/podcast";
import { requireStaffSession } from "../../lib/require-admin";
import { canPublish } from "../../lib/permissions";
import PodcastClient from "./PodcastClient";

export const dynamic = "force-dynamic";

export default async function PodcastPage() {
  const [episodes, session] = await Promise.all([getAllEpisodesAdmin(), requireStaffSession()]);
  return <PodcastClient episodes={episodes} canDelete={canPublish(session?.user.role)} />;
}
