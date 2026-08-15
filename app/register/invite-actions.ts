"use server";

import { headers } from "next/headers";
import { auth } from "../lib/auth";
import { applyInviteForEmail, getInviteByToken } from "../lib/users";
import { ROLE_LABELS, type AppRole } from "../lib/permissions";

export type AcceptInviteResult = { applied: false } | { applied: true; role: AppRole; label: string };

/**
 * Applies a staff invite to the account that just registered.
 *
 * Called after sign-up rather than during it, so Better Auth remains the
 * only thing that ever creates an account or hashes a password. The token
 * is only trusted to the extent that its email matches the session that
 * just signed in — a leaked link can't grant a role to some other account
 * that happens to be signed in on the same browser.
 *
 * Every failure path is a silent no-op: the account still exists as a
 * plain reader, which is a safe outcome, and telling a stranger why a
 * token was rejected would leak which emails have invites.
 */
export async function acceptInviteAction(token: string): Promise<AcceptInviteResult> {
  if (!token) return { applied: false };

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { applied: false };

  const invite = await getInviteByToken(token);
  if (!invite) return { applied: false };
  if (invite.email.toLowerCase() !== session.user.email.toLowerCase()) return { applied: false };

  const role = await applyInviteForEmail(invite.email, session.user.id);
  if (!role) return { applied: false };

  return { applied: true, role, label: ROLE_LABELS[role] };
}
