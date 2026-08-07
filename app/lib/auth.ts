import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";
import { prisma } from "./prisma";

if (!process.env.SESSION_SECRET) {
  throw new Error(
    "SESSION_SECRET is not set. Add it in the Vercel project's environment variables (used as Better Auth's session-signing secret)."
  );
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  secret: process.env.SESSION_SECRET,
  // Server-only (not NEXT_PUBLIC_) so it's read fresh at request time —
  // NEXT_PUBLIC_ vars get statically inlined into the build, which would
  // freeze this to whatever it was at build time.
  baseURL: process.env.BETTER_AUTH_URL,
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
