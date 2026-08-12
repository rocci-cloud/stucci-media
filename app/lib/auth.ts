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
//
// BETTER_AUTH_URL turned out to be entirely unset in the live Vercel
// project's Production environment (a Phase 7 setup step that was
// documented but never actually completed) — every login on the real
// site was rejected with no visible cause until that was fixed by hand
// in the Vercel dashboard. Rather than stay fully dependent on that
// env var existing and being typo-free, PRODUCTION_URL below is a
// hardcoded fallback for the one domain that matters in production, so
// this can't regress into the same silent failure from a missing or
// mistyped env var again. BETTER_AUTH_URL still takes priority when
// set (needed for local dev and Preview deployments, where the real
// URL isn't known ahead of time).
const PRODUCTION_URL = "https://stuccimedia.com";

function deriveTrustedOrigins(baseUrl: string | undefined): string[] {
  const origins = new Set<string>();
  for (const candidate of [baseUrl, PRODUCTION_URL]) {
    if (!candidate) continue;
    try {
      const { protocol, hostname } = new URL(candidate);
      const bareHost = hostname.startsWith("www.") ? hostname.slice(4) : hostname;
      origins.add(`${protocol}//${bareHost}`);
      origins.add(`${protocol}//www.${bareHost}`);
    } catch {
      origins.add(candidate);
    }
  }
  return Array.from(origins);
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  secret: process.env.SESSION_SECRET,
  // Server-only (not NEXT_PUBLIC_) so it's read fresh at request time —
  // NEXT_PUBLIC_ vars get statically inlined into the build, which would
  // freeze this to whatever it was at build time. Falls back to the
  // known production URL rather than being undefined if the env var
  // isn't set — see the PRODUCTION_URL comment above.
  baseURL: process.env.BETTER_AUTH_URL || PRODUCTION_URL,
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
