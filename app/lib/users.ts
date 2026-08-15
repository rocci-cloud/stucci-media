import { randomBytes } from "node:crypto";
import { prisma } from "./prisma";
import type { Role } from "@prisma/client";
import type { AppRole, StaffRole } from "./permissions";

export type StaffUser = {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  banned: boolean;
  createdAt: string;
  articleCount: number;
};

export type StaffInvite = {
  id: string;
  email: string;
  role: AppRole;
  token: string;
  invitedBy: string;
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
  isExpired: boolean;
};

const INVITE_TTL_DAYS = 14;

export async function getStaffUsers(): Promise<StaffUser[]> {
  const rows = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "EDITOR", "AUTHOR"] } },
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { articles: true } } },
  });
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    role: r.role as AppRole,
    banned: Boolean(r.banned),
    createdAt: r.createdAt.toISOString(),
    articleCount: r._count.articles,
  }));
}

export async function countReaders(): Promise<number> {
  return prisma.user.count({ where: { role: "USER" } });
}

export async function setUserRole(userId: string, role: AppRole): Promise<void> {
  await prisma.user.update({ where: { id: userId }, data: { role: role as Role } });
}

export async function setUserBanned(userId: string, banned: boolean): Promise<void> {
  await prisma.user.update({ where: { id: userId }, data: { banned } });
}

export async function countAdmins(): Promise<number> {
  return prisma.user.count({ where: { role: "ADMIN", banned: { not: true } } });
}

// --- Invites ---

function mapInvite(row: {
  id: string;
  email: string;
  role: Role;
  token: string;
  invitedBy: string;
  expiresAt: Date;
  acceptedAt: Date | null;
  createdAt: Date;
}): StaffInvite {
  return {
    id: row.id,
    email: row.email,
    role: row.role as AppRole,
    token: row.token,
    invitedBy: row.invitedBy,
    expiresAt: row.expiresAt.toISOString(),
    acceptedAt: row.acceptedAt ? row.acceptedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    isExpired: row.acceptedAt === null && row.expiresAt < new Date(),
  };
}

export async function getInvites(): Promise<StaffInvite[]> {
  const rows = await prisma.invite.findMany({ orderBy: { createdAt: "desc" } });
  return rows.map(mapInvite);
}

/**
 * Creates (or re-issues) an invite for an email address. Re-inviting the
 * same address rotates the token and pushes the expiry out rather than
 * failing on the unique constraint — "invite them again" is a normal
 * thing to want when the first link went stale.
 */
export async function createInvite(input: {
  email: string;
  role: StaffRole;
  invitedBy: string;
}): Promise<StaffInvite> {
  const token = randomBytes(24).toString("base64url");
  const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);
  const row = await prisma.invite.upsert({
    where: { email: input.email },
    create: { email: input.email, role: input.role as Role, token, invitedBy: input.invitedBy, expiresAt },
    update: { role: input.role as Role, token, invitedBy: input.invitedBy, expiresAt, acceptedAt: null },
  });
  return mapInvite(row);
}

export async function revokeInvite(id: string): Promise<void> {
  await prisma.invite.delete({ where: { id } });
}

/**
 * Applies a pending invite to a freshly registered account. Called after
 * sign-up rather than during it: Better Auth owns account creation and
 * password hashing end to end, so the invite only ever grants the role
 * afterwards. A missing, expired, or already-accepted invite is a silent
 * no-op — the account still exists, just as a plain reader.
 */
export async function applyInviteForEmail(email: string, userId: string): Promise<AppRole | null> {
  const invite = await prisma.invite.findUnique({ where: { email } });
  if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) return null;

  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { role: invite.role } }),
    prisma.invite.update({ where: { id: invite.id }, data: { acceptedAt: new Date() } }),
  ]);
  return invite.role as AppRole;
}

export async function getInviteByToken(token: string): Promise<StaffInvite | undefined> {
  const row = await prisma.invite.findUnique({ where: { token } });
  return row ? mapInvite(row) : undefined;
}
