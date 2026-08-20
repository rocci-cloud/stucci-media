import { describe, expect, it } from "vitest";
import {
  canAccessAdmin,
  canManageAllContent,
  canManageSettings,
  canManageUsers,
  canModerateComments,
  canPublish,
  isStaffRole,
} from "../app/lib/permissions";

// Role gating is the highest-consequence pure logic in the codebase: every
// admin page and every mutating server action asks these questions, and a
// wrong answer is a privilege escalation rather than a cosmetic bug.

const ALL_ROLES = ["ADMIN", "EDITOR", "AUTHOR", "USER", null, undefined, "", "admin"] as const;

describe("staff detection", () => {
  it("admits exactly the three staff roles", () => {
    expect(ALL_ROLES.filter(isStaffRole)).toEqual(["ADMIN", "EDITOR", "AUTHOR"]);
  });

  it("is case-sensitive, so a lowercase role never counts as staff", () => {
    expect(isStaffRole("admin")).toBe(false);
  });
});

describe("admin access", () => {
  it.each(["ADMIN", "EDITOR", "AUTHOR"])("%s can reach /admin", (role) => {
    expect(canAccessAdmin(role)).toBe(true);
  });

  it.each([["USER"], [null], [undefined], [""]])("%s cannot reach /admin", (role) => {
    expect(canAccessAdmin(role as string | null | undefined)).toBe(false);
  });
});

describe("publishing", () => {
  it("admins and editors can publish", () => {
    expect(canPublish("ADMIN")).toBe(true);
    expect(canPublish("EDITOR")).toBe(true);
  });

  it("authors cannot publish — they submit for review", () => {
    expect(canPublish("AUTHOR")).toBe(false);
  });

  it("readers and signed-out visitors cannot publish", () => {
    expect(canPublish("USER")).toBe(false);
    expect(canPublish(null)).toBe(false);
  });
});

describe("editing other people's work", () => {
  it("admins and editors can", () => {
    expect(canManageAllContent("ADMIN")).toBe(true);
    expect(canManageAllContent("EDITOR")).toBe(true);
  });

  it("authors cannot — this is what scopes them to their own articles", () => {
    expect(canManageAllContent("AUTHOR")).toBe(false);
  });
});

describe("site configuration and users are admin-only", () => {
  it.each([
    ["settings", canManageSettings],
    ["users", canManageUsers],
  ])("%s", (_name, check) => {
    expect(check("ADMIN")).toBe(true);
    expect(check("EDITOR")).toBe(false);
    expect(check("AUTHOR")).toBe(false);
    expect(check("USER")).toBe(false);
    expect(check(null)).toBe(false);
  });
});

describe("comment moderation", () => {
  it("is open to admins and editors, not authors", () => {
    expect(canModerateComments("ADMIN")).toBe(true);
    expect(canModerateComments("EDITOR")).toBe(true);
    expect(canModerateComments("AUTHOR")).toBe(false);
    expect(canModerateComments("USER")).toBe(false);
  });
});
