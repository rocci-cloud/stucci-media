import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

export type Subscriber = {
  id: number;
  email: string;
  subscribedAt: string;
  source: string | null;
};

/** Human labels for the capture points, shared by the admin list and CSV. */
export const SUBSCRIBER_SOURCE_LABELS: Record<string, string> = {
  modal: "Newsletter popup",
  article: "Article page",
  "homepage-strip": "Homepage strip",
  sidebar: "Sidebar",
  "subscribe-page": "Subscribe page",
  unknown: "Unknown",
};

export function subscriberSourceLabel(source: string | null): string {
  if (!source) return "Before tracking";
  return SUBSCRIBER_SOURCE_LABELS[source] ?? source;
}

/**
 * Adds an email to the newsletter list.
 *
 * Returns true when a new subscriber was added, false when the email was
 * already on the list — an existing signup is a silent no-op rather than
 * an error, so the public form can show the same confirmation either way
 * instead of leaking who is already subscribed.
 */
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
