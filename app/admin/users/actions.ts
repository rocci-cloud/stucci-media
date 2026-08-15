"use server";

import { revalidatePath } from "next/cache";
import {
  createInvite,
  revokeInvite,
  setUserRole,
  setUserBanned,
  countAdmins,
  type StaffInvite,
} from "../../lib/users";
import { requireAdminSession } from "../../lib/require-admin";
import { STAFF_ROLES, type AppRole, type StaffRole } from "../../lib/permissions";
import { logActivity } from "../../lib/activity";
import { prisma } from "../../lib/prisma";

export type UserActionResult = { success: true } | { success: false; error: string };
export type InviteResult = { success: true; invite: StaffInvite } | { success: false; error: string };

const FORBIDDEN = { success: false as const, error: "Only an admin can manage users." };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isStaffRole(role: string): role is StaffRole {
  return (STAFF_ROLES as string[]).includes(role);
}

export async function inviteStaffAction(email: string, role: string): Promise<InviteResult> {
  const session = await requireAdminSession();
  if (!session) return FORBIDDEN;

  const trimmed = email.trim().toLowerCase();
  if (!EMAIL_RE.test(trimmed)) return { success: false, error: "That doesn't look like an email address." };
  if (!isStaffRole(role)) return { success: false, error: "Pick a valid role." };

  // If they already have an account, this is a role change, not an invite
  // — silently issuing an invite nobody can accept would look like it
  // worked while doing nothing.
  const existing = await prisma.user.findUnique({ where: { email: trimmed }, select: { id: true } });
  if (existing) {
    return {
      success: false,
      error: "That email already has an account — change their role in the list below instead.",
    };
  }

  try {
    const invite = await createInvite({ email: trimmed, role, invitedBy: session.user.email });
    await logActivity({
      actor: session.user,
      action: "user.invited",
      targetType: "invite",
      targetLabel: `${trimmed} (${role})`,
    });
    revalidatePath("/admin/users");
    return { success: true, invite };
  } catch {
    return { success: false, error: "Couldn't create that invite." };
  }
}

export async function revokeInviteAction(id: string, email: string): Promise<UserActionResult> {
  const session = await requireAdminSession();
  if (!session) return FORBIDDEN;

  try {
    await revokeInvite(id);
    await logActivity({ actor: session.user, action: "user.invite_revoked", targetType: "invite", targetLabel: email });
    revalidatePath("/admin/users");
    return { success: true };
  } catch {
    return { success: false, error: "Couldn't revoke that invite." };
  }
}

export async function setUserRoleAction(userId: string, role: string): Promise<UserActionResult> {
  const session = await requireAdminSession();
  if (!session) return FORBIDDEN;

  if (role !== "USER" && !isStaffRole(role)) return { success: false, error: "Pick a valid role." };

  // Two guards against locking everyone out: an admin can't demote
  // themselves, and the last remaining admin can't be demoted at all.
  if (userId === session.user.id && role !== "ADMIN") {
    return { success: false, error: "You can't change your own role — ask another admin to do it." };
  }
  const target = await prisma.user.findUnique({ where: { id: userId }, select: { role: true, email: true } });
  if (!target) return { success: false, error: "That account no longer exists." };
  if (target.role === "ADMIN" && role !== "ADMIN" && (await countAdmins()) <= 1) {
    return { success: false, error: "That's the only admin left — promote someone else first." };
  }

  try {
    await setUserRole(userId, role as AppRole);
    await logActivity({
      actor: session.user,
      action: "user.role_changed",
      targetType: "user",
      targetLabel: `${target.email} → ${role}`,
    });
    revalidatePath("/admin/users");
    return { success: true };
  } catch {
    return { success: false, error: "Couldn't update that role." };
  }
}

export async function setUserBannedAction(userId: string, banned: boolean): Promise<UserActionResult> {
  const session = await requireAdminSession();
  if (!session) return FORBIDDEN;

  if (userId === session.user.id) {
    return { success: false, error: "You can't suspend your own account." };
  }
  const target = await prisma.user.findUnique({ where: { id: userId }, select: { role: true, email: true } });
  if (!target) return { success: false, error: "That account no longer exists." };
  if (banned && target.role === "ADMIN" && (await countAdmins()) <= 1) {
    return { success: false, error: "That's the only admin left — promote someone else first." };
  }

  try {
    await setUserBanned(userId, banned);
    await logActivity({
      actor: session.user,
      action: banned ? "user.suspended" : "user.reinstated",
      targetType: "user",
      targetLabel: target.email,
    });
    revalidatePath("/admin/users");
    return { success: true };
  } catch {
    return { success: false, error: "Couldn't update that account." };
  }
}
