/**
 * Form option lists, verbatim from the source site's evaluation form.
 *
 * These live in their own dependency-free module rather than in actions.ts
 * because a `"use server"` file may only export async functions — exporting a
 * plain array from one turns it into a server-action reference on the client,
 * and it arrives as a function rather than an array. That surfaced as
 * `h.map is not a function` during prerender, not as a build-time type error,
 * so it is worth not re-learning.
 */

export const ISSUE_OPTIONS = [
  "Ruts",
  "Potholes",
  "Washouts",
  "Water running down tire tracks",
  "Mud / soft spots",
  "Washboarding",
  "Culvert or drainage problem",
  "Private road / HOA road",
  "Not sure",
] as const;

export const REFERRAL_OPTIONS = [
  "Google search",
  "Google Maps",
  "Facebook",
  "Referral from a friend or neighbor",
  "Referred by another contractor",
  "Saw your truck or equipment",
  "Previous contact",
  "Other",
] as const;
