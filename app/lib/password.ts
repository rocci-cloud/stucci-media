import { scryptSync, timingSafeEqual } from "node:crypto";

// node:crypto is not edge-safe — only import this from Node.js runtime
// code (the admin login server action), never from middleware.ts.

export function verifyPassword(password: string): boolean {
  const configured = process.env.ADMIN_PASSWORD_HASH;
  if (!configured) {
    throw new Error("ADMIN_PASSWORD_HASH is not set. Generate one with scripts/hash-password.mjs.");
  }
  const [salt, storedHash] = configured.split(":");
  if (!salt || !storedHash) return false;

  const derived = scryptSync(password, salt, 64);
  const stored = Buffer.from(storedHash, "hex");
  if (derived.length !== stored.length) return false;
  return timingSafeEqual(derived, stored);
}
