"use server";

import { headers } from "next/headers";
import { auth } from "./auth";
import { prisma } from "./prisma";

// Called directly from client components (AccountMenu, MobileMenu) to
// show a signed-in reader's current streak — kept as its own tiny action
// rather than extending Better Auth's session shape, so this doesn't
// risk touching anything auth-related.
export async function getMyStreakAction(): Promise<number | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { currentStreak: true },
  });
  return user?.currentStreak ?? null;
}
