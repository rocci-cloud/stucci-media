import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

/**
 * Neon serves its database over HTTP as well as the Postgres wire
 * protocol, and production here runs in serverless/edge-adjacent
 * environments where only HTTPS is reachable — hence the Neon adapter
 * rather than Prisma's default TCP connector.
 *
 * That adapter only speaks to Neon, though, which used to mean the app
 * couldn't boot against any other Postgres at all: no local database, no
 * CI database, no way to run the site without the production credentials.
 * Picking the adapter from the host fixes that without changing anything
 * about how production connects.
 */
function isNeonUrl(connectionString: string): boolean {
  try {
    return new URL(connectionString).hostname.endsWith(".neon.tech");
  } catch {
    // An unparseable URL is Prisma's problem to report, not ours — assume
    // the production path so the error surfaces from the real driver.
    return true;
  }
}

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Add the Neon Postgres integration in the Vercel dashboard (Storage tab), or set DATABASE_URL in .env.local for local development."
    );
  }

  const adapter = isNeonUrl(connectionString)
    ? new PrismaNeon({ connectionString })
    : new PrismaPg({
        connectionString,
        // Optional pool ceiling, for constrained local Postgres setups that
        // serve only a small number of concurrent connections. Unset in
        // production, where the driver's own default is correct.
        ...(process.env.PRISMA_PG_POOL_MAX ? { max: Number(process.env.PRISMA_PG_POOL_MAX) } : {}),
      });

  return new PrismaClient({ adapter });
}

export const prisma = globalThis.prismaGlobal ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
}
