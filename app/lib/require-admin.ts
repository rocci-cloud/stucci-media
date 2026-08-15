import { headers } from "next/headers";
import { auth } from "./auth";
import {
  canAccessAdmin,
  canManageSettings,
  canManageUsers,
  canModerateComments,
  canPublish,
  type AppRole,
} from "./permissions";

export type StaffSession = {
  user: { id: string; name: string; email: string; role: AppRole };
};

async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

/**
 * Full session + role check — the real gate behind middleware's cheap
 * cookie-presence check. Use in server components, server actions, and
 * route handlers that must be ADMIN-only (users, settings, categories,
 * banners, redirects).
 */
export async function requireAdminSession() {
  const session = await getSession();
  if (!session || session.user.role !== "ADMIN") {
    return null;
  }
  return session;
}

/**
 * Anyone who may reach /admin at all: ADMIN, EDITOR, or AUTHOR. Actions
 * gated on this must still check what the role may do with the specific
 * record (see permissions.ts's canEditArticle/canPublish).
 */
export async function requireStaffSession() {
  const session = await getSession();
  if (!session || !canAccessAdmin(session.user.role)) {
    return null;
  }
  return session;
}

/** ADMIN or EDITOR — may publish, archive, and manage others' content. */
export async function requirePublisherSession() {
  const session = await getSession();
  if (!session || !canPublish(session.user.role)) {
    return null;
  }
  return session;
}

/** ADMIN or EDITOR — may moderate reader comments. */
export async function requireModeratorSession() {
  const session = await getSession();
  if (!session || !canModerateComments(session.user.role)) {
    return null;
  }
  return session;
}

export { canAccessAdmin, canManageSettings, canManageUsers, canModerateComments, canPublish };
