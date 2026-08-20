// Applies every pending migration in prisma/migrations, in order. Runs as
// part of `npm run build`, so a deploy can never ship code whose tables
// don't exist yet — the failure mode this repo hit repeatedly, where a merge
// went out and the Vercel build died on a missing column or table.
//
// Why not `prisma migrate deploy`? Two reasons. It speaks raw Postgres wire
// protocol, which the sandbox this project is developed in can't reach; and
// it refuses to run at all when its recorded history doesn't match the
// migrations folder byte-for-byte, which is exactly the state you end up in
// after applying SQL by hand through the Neon console. This runner is
// forward-only and forgiving about both.
//
// Run manually: node --env-file=.env.local scripts/migrate-deploy.mjs
import { createHash, randomUUID } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("[migrate] DATABASE_URL is not set — cannot apply migrations.");
  process.exit(1);
}

// Same adapter split as app/lib/prisma.ts: Neon's HTTP driver for Neon, plain
// node-postgres for anything else, so this works in CI, on Vercel and against
// a local Postgres without a second code path.
function isNeon(url) {
  try {
    return new URL(url).hostname.endsWith(".neon.tech");
  } catch {
    return true;
  }
}

let run;
let close = async () => {};
if (isNeon(connectionString)) {
  const { neon } = await import("@neondatabase/serverless");
  const sql = neon(connectionString);
  run = (text, params = []) => sql.query(text, params);
} else {
  const { default: pg } = await import("pg");
  const client = new pg.Client({ connectionString });
  await client.connect();
  run = async (text, params = []) => (await client.query(text, params)).rows;
  close = () => client.end();
}

// Postgres error codes for "this object is already there". A migration that
// was applied by hand and never recorded will raise one of these on re-run;
// that means the schema is already correct, not that the deploy should fail.
const ALREADY_EXISTS = new Set([
  "42701", // duplicate_column
  "42P07", // duplicate_table / duplicate relation (index included)
  "42710", // duplicate_object (constraint, type)
  "42P06", // duplicate_schema
  "42723", // duplicate_function
]);

function errorCode(error) {
  return error?.code ?? error?.sourceError?.code ?? error?.cause?.code;
}

const migrationsDir = fileURLToPath(new URL("../prisma/migrations", import.meta.url));

// Migrations at or before this one predate idempotent authoring: they contain
// bare ADD COLUMNs and an ALTER COLUMN ... USING UPPER(status) that throws if
// the column is already the enum type. They must never be replayed against a
// database that already has them. Everything after it is written with IF NOT
// EXISTS throughout and is safe to re-run.
//
// On an existing database missing their records — the state you get after
// applying SQL by hand through the Neon console — they are recorded as
// applied without being executed, which is what `prisma migrate resolve`
// does. On a genuinely empty database they run normally.
const BASELINE_THROUGH = "20260812230000_live_blog_and_push";

async function main() {
  await run(`
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

  const applied = new Set(
    (await run(`SELECT migration_name FROM "_prisma_migrations" WHERE finished_at IS NOT NULL`))
      .map((r) => r.migration_name)
  );

  // Folder names are timestamp-prefixed, so lexical order is apply order.
  const names = readdirSync(migrationsDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();

  // These migrations layer on top of the hand-written base schema from
  // scripts/schema.sql — 20260807000000_init_data_foundation, for one, alters
  // articles.status from text to an enum, so it needs the table to exist
  // already. This runner is for an established database, not for
  // bootstrapping an empty one.
  const [existing] = await run(`SELECT to_regclass('public.articles') IS NOT NULL AS present`);
  const isExistingDatabase = existing?.present === true || existing?.present === "t";

  if (!isExistingDatabase) {
    console.error(
      "[migrate] No `articles` table — this looks like an empty database.\n" +
        "[migrate] Run `npm run db:migrate` first to create the base schema, then re-run this."
    );
    process.exitCode = 1;
    return;
  }

  {
    const legacy = names.filter((n) => n <= BASELINE_THROUGH && !applied.has(n));
    for (const name of legacy) {
      const source = readFileSync(`${migrationsDir}/${name}/migration.sql`, "utf8");
      await run(
        `INSERT INTO "_prisma_migrations"
           (id, checksum, finished_at, migration_name, started_at, applied_steps_count, logs)
         VALUES ($1, $2, now(), $3, now(), 0, $4)`,
        [
          randomUUID(),
          createHash("sha256").update(source).digest("hex"),
          name,
          "Baselined: schema predates this runner and already contains these changes.",
        ]
      );
      applied.add(name);
      console.log(`[migrate] ${name}: baselined (recorded, not executed).`);
    }
  }

  const pending = names.filter((n) => !applied.has(n));
  if (pending.length === 0) {
    console.log(`[migrate] Up to date — ${names.length} migration(s) already applied.`);
    return;
  }
  console.log(`[migrate] ${pending.length} pending of ${names.length}: ${pending.join(", ")}`);

  for (const name of pending) {
    const file = `${migrationsDir}/${name}/migration.sql`;
    const source = readFileSync(file, "utf8");
    const statements = source
      .split("\n")
      .filter((line) => !line.trim().startsWith("--"))
      .join("\n")
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean);

    let ran = 0;
    let skipped = 0;
    for (const statement of statements) {
      try {
        await run(statement);
        ran += 1;
      } catch (error) {
        if (ALREADY_EXISTS.has(errorCode(error))) {
          // Logged rather than swallowed: if a migration was applied by hand
          // this is expected, and if it wasn't, this line is the trail.
          console.log(`[migrate]   already present, skipping: ${statement.slice(0, 70).replace(/\s+/g, " ")}…`);
          skipped += 1;
          continue;
        }
        console.error(`[migrate] FAILED in ${name}:\n${statement}\n`);
        throw error;
      }
    }

    await run(
      `INSERT INTO "_prisma_migrations"
         (id, checksum, finished_at, migration_name, started_at, applied_steps_count)
       VALUES ($1, $2, now(), $3, now(), $4)`,
      [randomUUID(), createHash("sha256").update(source).digest("hex"), name, ran]
    );
    console.log(`[migrate] ${name}: ${ran} applied${skipped ? `, ${skipped} already present` : ""}.`);
  }

  console.log("[migrate] Done.");
}

try {
  await main();
} finally {
  await close();
}
