import { prisma } from "./prisma";

function toUtcDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Fire-and-forget from a signed-in page view (see articles/[slug]/page.tsx)
// — updates the reader's streak by calendar day (UTC), not exact elapsed
// time. A same-day revisit is a no-op; a visit exactly one calendar day
// after the last one extends the streak; any bigger gap resets it to 1 —
// the visit that breaks a streak is day one of a new one, not zero.
export async function recordVisit(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { currentStreak: true, lastActiveDate: true },
  });
  if (!user) return;

  const today = toUtcDateOnly(new Date());
  const lastDay = user.lastActiveDate ? toUtcDateOnly(user.lastActiveDate) : null;
  if (lastDay === today) return;

  const yesterday = toUtcDateOnly(new Date(Date.now() - 24 * 60 * 60 * 1000));
  const nextStreak = lastDay === yesterday ? user.currentStreak + 1 : 1;

  await prisma.user.update({
    where: { id: userId },
    data: { currentStreak: nextStreak, lastActiveDate: new Date() },
  });
}
