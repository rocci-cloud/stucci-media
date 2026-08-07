// Generates an ADMIN_PASSWORD_HASH value for the admin login.
// Run: node scripts/hash-password.mjs "your-password"
import { scryptSync, randomBytes } from "node:crypto";

const password = process.argv[2];
if (!password) {
  console.error("Usage: node scripts/hash-password.mjs <password>");
  process.exit(1);
}

const salt = randomBytes(16).toString("hex");
const hash = scryptSync(password, salt, 64).toString("hex");

console.log("Add this to your Vercel project's environment variables as ADMIN_PASSWORD_HASH:\n");
console.log(`${salt}:${hash}`);
