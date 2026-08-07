import { headers } from "next/headers";
import { auth } from "./auth";

/**
 * Full session + role check — the real gate behind middleware's cheap
 * cookie-presence check. Use in server components, server actions, and
 * route handlers that must be ADMIN-only.
 */
export async function requireAdminSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "ADMIN") {
    return null;
  }
  return session;
}
