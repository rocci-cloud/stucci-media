# Stucci Media

Independent news + podcast site for Rocci Stucci — politics, veterans,
investigations, free speech, and current events. Next.js 16 (App Router) on
Vercel, Neon Postgres, Vercel Blob.

The public site lives under `app/`; the newsroom CMS lives under
`app/admin/`. `CLAUDE.md` is the long-form architecture and history
document — read that before making structural changes.

## Running it locally

```bash
npm install
vercel env pull .env.local   # or write the vars below by hand
npm run dev
```

The app needs a real database to boot: `app/lib/prisma.ts` throws on
startup if `DATABASE_URL` is missing, and `next build` queries Postgres
while collecting page data. There is no fixture/offline mode.

## Tests

```bash
npm test        # once
npm run test:watch
```

Vitest, covering the pure logic where a regression is silent and expensive:
role permissions, the sanitizer contract in both directions, SEO scoring,
mid-article HTML splitting, and the email templates. Anything that needs a
browser or a database is verified by hand against a real environment — see the
notes in `CLAUDE.md`.

## Environment variables

| Variable | Required | What it's for |
|---|---|---|
| `DATABASE_URL` | yes | Neon Postgres (pooled). Injected by the Vercel Neon integration. |
| `DATABASE_URL_UNPOOLED` | yes | Direct connection, used by Prisma for migrations. |
| `SESSION_SECRET` | yes | Better Auth session signing. `openssl rand -base64 32`. |
| `BETTER_AUTH_URL` | yes | This app's own origin, e.g. `http://localhost:3000` or the deployment URL. See the note below. |
| `BLOB_READ_WRITE_TOKEN` | yes for uploads | Vercel Blob. Injected by the Blob integration. |
| `NEXT_PUBLIC_SITE_URL` | no | Canonical public URL. Defaults to `https://www.stuccimedia.com`. |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | no | Web push. Push UI hides itself entirely when unset. |
| `VAPID_PRIVATE_KEY` | no | Web push. |
| `VAPID_SUBJECT` | no | Web push — a `mailto:` address. |
| `RESEND_API_KEY` | no | Email delivery ([resend.com](https://resend.com)). Without it, the welcome email is skipped and the digest's send controls stay disabled. |
| `EMAIL_FROM` | no | Verified sender, e.g. `Stucci Media <news@stuccimedia.com>`. Falls back to Resend's sandbox sender. |
| `ANTHROPIC_API_KEY` | no | Editor AI assist. See "AI assist" below. |
| `OPENAI_API_KEY` | no | Alternative AI provider. |
| `XAI_API_KEY` | no | Alternative AI provider (Grok). |
| `AI_MODEL` | no | Overrides the default model for whichever provider is configured. |

**`BETTER_AUTH_URL` must not be `NEXT_PUBLIC_`.** `NEXT_PUBLIC_` variables
are inlined at build time, which freezes Better Auth's origin check to
whatever it was when the build ran and produces `INVALID_ORIGIN` on every
request once the real URL differs. There is a hardcoded production
fallback in `app/lib/auth.ts` so a missing value can't take login down,
but set it properly anyway — it's also what generates absolute URLs for
email verification and OAuth callbacks.

## First-time database setup

Run in this order:

```bash
npm run db:migrate                                              # base articles/subscribers tables
npm run db:migrate:prisma -- 20260807000000_init_data_foundation
npm run db:migrate:prisma -- 20260807010000_admin_plugin_fields
npm run db:migrate:prisma -- 20260807220000_activity_log
npm run db:migrate:prisma -- 20260808000000_banners
npm run db:migrate:prisma -- 20260808120000_cms_upgrade
npm run db:migrate:prisma -- 20260808180000_nav_main_more
npm run db:migrate:prisma -- 20260812200000_engagement_quick_wins
npm run db:migrate:prisma -- 20260812220000_streaks_and_interests
npm run db:migrate:prisma -- 20260812230000_live_blog_and_push
npm run db:migrate:prisma -- 20260815000000_newsroom_cms
npm run db:seed-categories                                      # the 7 real categories
npm run db:seed-newsroom                                        # optional sample content
```

`db:migrate:prisma` applies a migration's SQL over the Neon **HTTP**
driver and records it in `_prisma_migrations`. That indirection exists
because `prisma migrate deploy` speaks the raw Postgres wire protocol over
TCP, which some environments (including the sandbox this was built in)
can't reach. On Vercel, `prisma migrate deploy` works normally and either
approach is fine.

Because the runner splits statements on `;`, migration SQL must not
contain `DO $$ … $$` blocks — declare constraints inline instead.

## Creating the first admin

There is no seeded admin account, deliberately: a seed script would have
to reimplement Better Auth's internal password hashing, which is version
dependent and not a stable public API.

```bash
# 1. Register normally at /register
# 2. Promote that account:
npm run admin:promote -- you@example.com
```

After that, invite everyone else from **Admin → Users**. An invite creates
a link you send however you like (no mail provider is connected); the
invitee registers with it and lands in the role you picked.

### Roles

| Role | Can do |
|---|---|
| **Admin** | Everything, including users, settings, categories, banners, redirects. |
| **Editor** | Write, edit, and publish anyone's work. Moderate comments. No site settings or user management. |
| **Author** | Write and edit **their own** articles, and submit them for review. Cannot publish. |
| **Reader** | Public account — comments, likes, saved articles. No admin access. |

`app/lib/permissions.ts` is the single source of truth. Every server
action re-checks permission itself: `app/admin/layout.tsx` only gates page
*rendering*, and a Server Action endpoint is independently reachable once
deployed.

## Vercel Blob

Add the Blob integration in the Vercel dashboard's **Storage** tab, which
injects `BLOB_READ_WRITE_TOKEN`.

Uploads go **client-side, straight to Blob** (`@vercel/blob/client`'s
`upload()`), so a large file never passes through a serverless function
and never hits the 4.5 MB request body limit.
`app/api/admin/upload/route.ts` only mints a scoped token after checking
the session — it never receives the file itself. Images are resized to a
2000px longer edge and re-encoded to JPEG in the browser before upload;
audio is uploaded untouched under a separate 300 MB ceiling.

Every upload is indexed into the Media Library from the client
(`app/admin/articles/upload-image.ts`), **not** from Blob's
`onUploadCompleted` webhook — that webhook only fires against a real
deployment, never a local dev server, so relying on it would leave the
library silently empty in development.

`next.config.ts` already allows `*.public.blob.vercel-storage.com` in
`images.remotePatterns`, so a new Blob store needs no config change.

## AI assist

The editor's **AI Assist** tab (headline suggestions, clarity rewrites,
expand/summarize, internal-link suggestions, tone check) posts to
`app/api/admin/ai/route.ts`, which dispatches to whichever provider is
configured — Anthropic, OpenAI, or xAI — in that order.

With no key set it returns a 501 and the panel says AI assist isn't
connected. Nothing is faked and nothing is written into an article
automatically: every result lands in a review panel the writer copies
from.

## The admin, briefly

- **Dashboard** — pipeline stats, 30-day publishing chart, content
  calendar, top performing, pending approvals, activity log.
- **Articles** — search/filter/bulk table, quick Featured + Breaking
  toggles, in-place category editing, duplicate as draft, trash.
- **Editor** — TipTap with slash commands, bubble menu, tables, code
  blocks, callouts, YouTube/X/Vimeo/Spotify/Rumble embeds, drag-drop and
  paste image upload, a media picker, resize/align/caption on images,
  side-by-side live preview, SEO panel with a live score, AI assist,
  autosave, and revision history with diffs.
- **Media** — folders, tags, alt text, bulk move/delete, multi-file
  drag-drop, and real usage counts (which articles use each image).
- **Podcast** — episodes with audio upload, duration auto-detection, show
  notes, transcript, and guest details.
- **Users, Settings, Trash, Categories, Banners, Redirects, Comments.**

Press <kbd>⌘K</kbd> (or <kbd>Ctrl</kbd>+<kbd>K</kbd>) anywhere for the
command palette; <kbd>N</kbd> starts a new article.

### Adding to the editor

The TipTap toolbar and `app/lib/sanitize.ts`'s allowlist are two halves of
one contract. Anything the editor can produce must be listed in the
sanitizer, or the feature will appear to work and then silently vanish on
save. Add both in the same change.

## Deploying

`main` is the deploy branch. `postinstall` runs `prisma generate`, so the
client is always in sync with `prisma/schema.prisma`.
