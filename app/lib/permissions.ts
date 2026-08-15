// Single source of truth for what each newsroom role may do.
//
// This deliberately lives apart from any Prisma or Better Auth import so
// client components can import the role labels and capability checks
// without dragging a server-only module (and its DATABASE_URL check) into
// the browser bundle — the exact failure Phase 36 hit with banner
// placements. Server-side gating helpers live in lib/require-admin.ts and
// call into these predicates.

export type StaffRole = "ADMIN" | "EDITOR" | "AUTHOR";
export type AppRole = StaffRole | "USER";

export const STAFF_ROLES: StaffRole[] = ["ADMIN", "EDITOR", "AUTHOR"];

export const ROLE_LABELS: Record<AppRole, string> = {
  ADMIN: "Admin",
  EDITOR: "Editor",
  AUTHOR: "Author",
  USER: "Reader",
};

export const ROLE_DESCRIPTIONS: Record<AppRole, string> = {
  ADMIN: "Full access — content, settings, users, everything.",
  EDITOR: "Can write, edit, and publish anyone's work. No settings or user management.",
  AUTHOR: "Can write and edit their own articles, and submit them for review. Can't publish.",
  USER: "Reader account. No admin access.",
};

export function isStaffRole(role: string | null | undefined): role is StaffRole {
  return role === "ADMIN" || role === "EDITOR" || role === "AUTHOR";
}

/** Can reach /admin at all. */
export function canAccessAdmin(role: string | null | undefined): boolean {
  return isStaffRole(role);
}

/** Can move an article to PUBLISHED or ARCHIVED. Authors submit for review instead. */
export function canPublish(role: string | null | undefined): boolean {
  return role === "ADMIN" || role === "EDITOR";
}

/** Can edit/delete content they did not write. */
export function canManageAllContent(role: string | null | undefined): boolean {
  return role === "ADMIN" || role === "EDITOR";
}

/** Site-level configuration: categories, banners, redirects, settings, nav. */
export function canManageSettings(role: string | null | undefined): boolean {
  return role === "ADMIN";
}

/** Invite staff, change roles, remove accounts. */
export function canManageUsers(role: string | null | undefined): boolean {
  return role === "ADMIN";
}

/** Approve, hide, pin, or delete reader comments. */
export function canModerateComments(role: string | null | undefined): boolean {
  return role === "ADMIN" || role === "EDITOR";
}

/**
 * Whether `role` may edit the article authored by `authorId`.
 * Authors are scoped to their own work; an article with no recorded
 * author (everything imported before author tracking existed) is treated
 * as newsroom-owned, so an author can't quietly claim the back catalogue.
 */
export function canEditArticle(
  role: string | null | undefined,
  userId: string,
  articleAuthorId: string | null
): boolean {
  if (canManageAllContent(role)) return true;
  if (role !== "AUTHOR") return false;
  return articleAuthorId !== null && articleAuthorId === userId;
}
