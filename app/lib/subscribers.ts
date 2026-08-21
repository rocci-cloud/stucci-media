import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

// Re-exported so existing server-side callers keep one import site, while
// the pure logic stays in a Prisma-free module that tests can import.
export {
  SUBSCRIBER_SOURCE_LABELS,
  normalizeSubscriberSource,
  subscriberSourceLabel,
} from "./subscriber-sources";

export type Subscriber = {
  id: number;
  email: string;
  subscribedAt: string;
  source: string | null;
};

export async function addSubscriber(email: string, source?: string | null): Promise<boolean> {
  try {
    await prisma.subscriber.create({ data: { email, source: source ?? null } });
    return true;
  } catch (error) {
    // P2002 = unique constraint violation on `email`, i.e. already subscribed.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return false;
    }
    throw error;
  }
}

export async function getAllSubscribers(): Promise<Subscriber[]> {
  const rows = await prisma.subscriber.findMany({ orderBy: { subscribedAt: "desc" } });
  return rows.map((row) => ({
    id: row.id,
    email: row.email,
    subscribedAt: row.subscribedAt.toISOString(),
    source: row.source,
  }));
}

/** Signups grouped by capture point, most productive first. */
export async function getSubscriberSourceCounts(): Promise<{ source: string | null; count: number }[]> {
  const rows = await prisma.subscriber.groupBy({
    by: ["source"],
    _count: { _all: true },
  });
  return rows
    .map((r) => ({ source: r.source, count: r._count._all }))
    .sort((a, b) => b.count - a.count);
}

/** How many signed up in the last `days` days. */
export async function getRecentSubscriberCount(days: number): Promise<number> {
  const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return prisma.subscriber.count({ where: { subscribedAt: { gte: from } } });
}
