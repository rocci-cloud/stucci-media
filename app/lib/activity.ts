import { prisma } from "./prisma";

export type ActivityEntry = {
  id: string;
  actorName: string;
  action: string;
  targetType: string;
  targetLabel: string;
  createdAt: string;
};

// Fire-and-forget by design: a logging failure should never block or fail
// the actual mutation it's recording. Callers don't (and shouldn't) await
// this for its result.
export async function logActivity(input: {
  actor: { id: string; name: string; email: string };
  action: string;
  targetType: string;
  targetLabel: string;
}): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        actorId: input.actor.id,
        actorName: input.actor.name,
        actorEmail: input.actor.email,
        action: input.action,
        targetType: input.targetType,
        targetLabel: input.targetLabel,
      },
    });
  } catch (err) {
    console.error("Failed to record activity log entry:", err);
  }
}

export async function getRecentActivity(limit = 10): Promise<ActivityEntry[]> {
  const rows = await prisma.activityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map((row) => ({
    id: row.id,
    actorName: row.actorName,
    action: row.action,
    targetType: row.targetType,
    targetLabel: row.targetLabel,
    createdAt: row.createdAt.toISOString(),
  }));
}
