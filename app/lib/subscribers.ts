import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

export type Subscriber = {
  id: number;
  email: string;
  subscribedAt: string;
};

/**
 * Adds an email to the newsletter list.
 *
 * Returns true when a new subscriber was added, false when the email was
 * already on the list — an existing signup is a silent no-op rather than
 * an error, so the public form can show the same confirmation either way
 * instead of leaking who is already subscribed.
 */
export async function addSubscriber(email: string): Promise<boolean> {
  try {
    await prisma.subscriber.create({ data: { email } });
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
  }));
}
