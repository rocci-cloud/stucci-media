# Durango Driveway Grading — Rebuild Discovery

Discovery and planning package for the ground-up rebuild of
[durangodrivewaygrading.com](https://durangodrivewaygrading.com), captured 2026-09-06.

## Start here

**[GAME-PLAN.md](./GAME-PLAN.md)** — the plan. Design direction, architecture, phasing,
and the open questions that need client answers.

## Contents

| Path | What it is |
|---|---|
| `GAME-PLAN.md` | The rebuild plan |
| `content/00-business-facts.md` | Every business fact, positioning line, process step, and form field, quoted from the live site |
| `content/01-page-inventory.md` | All 22 URLs, nav/footer structure, repeated blocks, redirect map |
| `content/02-staging-retrofit.md` | The `staging4` dark retrofit — exact design tokens, copy changes, six issues not to carry forward |
| `assets/README.md` | All 244 media assets triaged into keep / junk, with notes |
| `research/competitive-analysis.md` | Five local competitors + one benchmark, scored |
| `scripts/mirror-source-site.mjs` | Pulls page HTML, media metadata, and all 244 image binaries |

## Getting the binaries

Content was captured through an allowlisted scraping tool; image *files* need one command from a
machine with ordinary internet access (this sandbox's network policy blocks that domain):

```bash
cd discovery/durango-driveway-grading
node scripts/mirror-source-site.mjs
```

Produces `export/media/` (244 originals), `export/media-manifest.json`, `export/pages/` (raw HTML
+ metadata), and `export/pages-index.json`. Idempotent — safe to re-run. It prints a
success/failure summary; **read the summary, not the exit code.**

## Status

- ✅ Content captured — all copy, all pages, all metadata
- ✅ Asset inventory — 244 catalogued, ~150 worth migrating
- ✅ Competitive analysis — 5 local + 1 benchmark
- ✅ Game plan drafted
- ✅ Design direction resolved — tokens read from the `staging4` retrofit's live CSS
- ✅ Staging retrofit analysed (`content/02-staging-retrofit.md`)
- ✅ **Site built** — `sites/durango-driveway-grading`, 29 routes, all static, build + typecheck green
- ⬜ Vercel project — the MCP token can't create projects in this team; create it manually
- ⬜ Image binaries — `npm run fetch:images` from a machine with open egress
- ⬜ Mail env vars (`RESEND_API_KEY`, `CONSULTATION_FROM_EMAIL`) — the form doesn't deliver without them
- ⬜ Client answers to the 12 open questions
