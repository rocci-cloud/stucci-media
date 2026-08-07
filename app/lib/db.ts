import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not set. Add the Neon Postgres integration in the Vercel dashboard (Storage tab), or set DATABASE_URL in .env.local for local development."
  );
}

export const sql = neon(process.env.DATABASE_URL);
