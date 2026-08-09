import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";
import { prisma } from "./prisma";

if (!process.env.SESSION_SECRET) {
  throw new Error(
    "SESSION_SECRET is not set. Add it in the Vercel project's environment variables (used as Better Auth's session-signing secret)."
  );
}

// Better Auth rejects any request whose Origin header isn't baseURL (or
// listed in trustedOrigins) with a silent-looking 403 — the sign-in
// fetch just fails client-side with no obvious cause. The most common
// real-world way to hit this: Vercel serves a project on both its apex
// domain and a www subdomain (or an old preview URL lingers in
// BETTER_AUTH_URL after a domain change), so a visitor lands on a host
// that doesn't byte-for-byte match whatever's in the env var. Trusting
// both the apex and www form of the configured host closes that gap
// without needing to know which one is actually misconfigured.
function deriveTrustedOrigins(baseUrl: string | undefined): string[] {
  if (!baseUrl) return [];
  try {
    const { protocol, hostname } = new URL(baseUrl);
    const bareHost = hostname.startsWith("www.") ? hostname.slice(4) : hostname;
    return [`${protocol}//${bareHost}`, `${protocol}//www.${bareHost}`];
  } catch {
    return [baseUrl];
  }
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  secret: process.env.SESSION_SECRET,
  // Server-only (not NEXT_PUBLIC_) so it's read fresh at request time —
  // NEXT_PUBLIC_ vars get statically inlined into the build, which would
  // freeze this to whatever it was at build time.
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: deriveTrustedOrigins(process.env.BETTER_AUTH_URL),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 min — avoids a DB round trip on every request while
      // still re-validating (role changes, revocation) frequently enough.
    },
  },
  plugins: [
    admin({
      defaultRole: "USER",
      adminRoles: ["ADMIN"],
    }),
  ],
});

export type Session = typeof auth.$Infer.Session;
