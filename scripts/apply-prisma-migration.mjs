// One-off: applies prisma/migrations/*/migration.sql by hand via the Neon
// HTTP driver, then records it in `_prisma_migrations` so `prisma migrate
// deploy`/`status` see it as already applied.
//
// Why not `prisma migrate deploy`? Prisma Migrate always speaks raw Postgres
// wire protocol (TCP), which this sandbox's network can't reach — only
// HTTPS is proxied out. `@neondatabase/serverless` talks to Neon over
// HTTP/WebSocket instead, which is why it's the driver the rest of this app
// uses. On Vercel (real TCP access) `prisma migrate deploy` will work
// normally for any future migrations.
//
// Run: node --env-file=.env.local scripts/apply-prisma-migration.mjs <migration-folder-name>
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { neon } from "@neondatabase/serverless";

const migrationName = process.argv[2];
if (!migrationName) {
  console.error("Usage: node scripts/apply-prisma-migration.mjs <migration-folder-name>");
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Pull it with `vercel env pull .env.local` or set it manually.");
  process.exit(1);
}

const migrationPath = fileURLToPath(
  new URL(`../prisma/migrations/${migrationName}/migration.sql`, import.meta.url)
);
const migrationSql = readFileSync(migrationPath, "utf8");
const checksum = createHash("sha256").update(migrationSql).digest("hex");
const sql = neon(process.env.DATABASE_URL);

await sql.query(`
  CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id" VARCHAR(36) PRIMARY KEY NOT NULL,
    "checksum" VARCHAR(64) NOT NULL,
    "finished_at" TIMESTAMPTZ,
    "migration_name" VARCHAR(255) NOT NULL,
    "logs" TEXT,
    "rolled_back_at" TIMESTAMPTZ,
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "applied_steps_count" INTEGER NOT NULL DEFAULT 0
  )
`);

const [existing] = await sql.query(
  `SELECT id FROM "_prisma_migrations" WHERE migration_name = $1 AND finished_at IS NOT NULL`,
  [migrationName]
);
if (existing) {
  console.log(`Migration "${migrationName}" is already recorded as applied. Skipping.`);
  process.exit(0);
}

const statements = migrationSql
  .split("\n")
  .filter((line) => !line.trim().startsWith("--"))
  .join("\n")
  .split(";")
  .map((s) => s.trim())
  .filter(Boolean);

for (const statement of statements) {
  await sql.query(statement);
}

const id = crypto.randomUUID();
await sql.query(
  `INSERT INTO "_prisma_migrations"
     (id, checksum, finished_at, migration_name, started_at, applied_steps_count)
   VALUES ($1, $2, now(), $3, now(), $4)`,
  [id, checksum, migrationName, statements.length]
);

console.log(`Migration "${migrationName}" applied: ${statements.length} statement(s).`);
