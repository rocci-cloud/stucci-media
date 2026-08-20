import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Node environment only: these cover pure logic — permissions, the
    // sanitizer contract, SEO scoring, email templates, HTML splitting.
    // Anything needing a browser or a database is verified separately.
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
