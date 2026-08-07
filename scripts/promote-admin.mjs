// Grants ADMIN role to an existing user by email. Register a normal account
// at /register first (this creates the user + password via Better Auth's
// real sign-up flow), then run this once to promote it — avoids needing to
// reimplement Better Auth's password hashing in a seed script.
// Run: node --env-file=.env.local scripts/promote-admin.mjs you@example.com
import { neon } from "@neondatabase/serverless";

const email = process.argv[2];
if (!email) {
  console.error("Usage: node scripts/promote-admin.mjs <email>");
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Pull it with `vercel env pull .env.local` or set it manually.");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

const rows = await sql`
  update users set role = 'ADMIN' where email = ${email}
  returning id, email, name
`;

if (rows.length === 0) {
  console.error(`No user found with email "${email}". Register at /register first.`);
  process.exit(1);
}

console.log(`Promoted ${rows[0].email} (${rows[0].name}) to ADMIN.`);
