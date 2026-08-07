import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

// Neon's HTTP/WebSocket driver adapter, not the default TCP connector —
// this app runs in serverless/edge-adjacent environments (and a sandboxed
// dev container) where raw Postgres TCP isn't reachable, only HTTPS is.
declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

function createPrismaClient() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not set. Add the Neon Postgres integration in the Vercel dashboard (Storage tab), or set DATABASE_URL in .env.local for local development."
    );
  }
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

export const prisma = globalThis.prismaGlobal ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
}
