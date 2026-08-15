import { notFound } from "next/navigation";
import EpisodeEditor from "../../EpisodeEditor";
import { updateEpisodeAction } from "../../actions";
import { getEpisodeById } from "../../../../lib/podcast";
import { requireStaffSession } from "../../../../lib/require-admin";
import { canPublish } from "../../../../lib/permissions";

type Props = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

export default async function EditEpisodePage({ params }: Props) {
  const { id } = await params;
  const [episode, session] = await Promise.all([getEpisodeById(id), requireStaffSession()]);
  if (!episode) notFound();

  const boundUpdate = updateEpisodeAction.bind(null, episode.id);

  return (
    <div className="max-w-[1100px]">
      <h2 className="mb-6 text-lg font-semibold text-[var(--admin-fg)]">Edit episode</h2>
      <EpisodeEditor episode={episode} action={boundUpdate} canPublish={canPublish(session?.user.role)} />
    </div>
  );
}
