import EpisodeEditor from "../EpisodeEditor";
import { createEpisodeAction } from "../actions";
import { requireStaffSession } from "../../../lib/require-admin";
import { canPublish } from "../../../lib/permissions";

export default async function NewEpisodePage() {
  const session = await requireStaffSession();

  return (
    <div className="max-w-[1100px]">
      <h2 className="mb-6 text-lg font-semibold text-[var(--admin-fg)]">New episode</h2>
      <EpisodeEditor action={createEpisodeAction} canPublish={canPublish(session?.user.role)} />
    </div>
  );
}
