@AGENTS.md

# Stucci Media

Independent news site for Rocci Stucci (Florida) — news analysis, world
coverage, social issues, crime investigation, veterans, and The Rocci Stucci
Show podcast. Tagline: "the stories mainstream media won't run."

Deployed on Vercel, connected to GitHub (`main` is the deploy branch).

## Stack

- Next.js 16 (App Router, React 19, TypeScript)
- Tailwind CSS v4 (`@import "tailwindcss"` + `@theme` in `app/globals.css` —
  no `tailwind.config.js`)
- `@fontsource/oswald` for the headline face
- Neon Postgres for content, Vercel Blob for images, `/admin` for editing —
  see Phase 2 below

**Why Next.js and not a site builder:** per-article social share previews.
`generateMetadata()` in `app/articles/[slug]/page.tsx` runs on the server
before any crawler sees the page, so Facebook/X/iMessage bots get the real
headline and dek per article. Client-rendered SPA builders (Base44, Lovable)
couldn't do this — every share showed the same generic site card. Keep
article and category pages server-rendered.

## Structure

```
app/
  layout.tsx              root metadata (metadataBase, title template), fonts
  page.tsx                homepage: BreakingBar → Hero → ArticleGrid → Subscribe
  globals.css             design tokens + Tailwind import
  articles/[slug]/        article template + generateMetadata + generateStaticParams
  category/[slug]/        all 7 category pages from one route
  search/                 client-side filter over the articles array
  about/ contact/ privacy/
  admin/                  article editor + subscriber list (see Phase 2/3)
  components/             BreakingBar, SiteHeader, Hero, TopicRail, Sidebar,
                          ArticleGrid, SubscribeStrip/Form, SiteFooter
  components/ui/          ArticleCard, SectionHeader, Badge — shared
                          primitives, see Design system below
  lib/articles.ts         Article type + DB reads/writes + lookup helpers
  lib/categories.ts       Category type + the 7 categories + lookup helper
```

`app/lib/articles.ts` is the single data source — every component is written
against the `Article` type, reading/writing Postgres underneath.

`Article`: `id`, `slug`, `categorySlug`, `category`, `headline`, `dek`,
`author`, `date`, `readTime`, `bodyHtml` (sanitized HTML, rendered via
`dangerouslySetInnerHTML` with `@tailwindcss/typography` prose styling —
see `app/lib/sanitize.ts`), `coverImageUrl`, `status`.

Categories (slug → label): `political-news`, `world-news`,
`opinion-analysis`, `podcasts`, `social-issues`, `crime-investigation`,
`veterans`. The nav in `SiteHeader.tsx` and the list in `lib/categories.ts`
must stay in sync.

## Design system

Premium independent-media look as of Phase 6 (Free Press / Semafor / Axios
polish, Stucci's navy/red/white identity underneath): soft card shadows +
radius, a real spacing/radius/shadow scale, mobile-first throughout, 44px
minimum touch targets on every interactive element. No dark mode
(`color-scheme: light only` — there are `!important` overrides in
`globals.css` guarding against browser dark mode).

Colors (CSS vars on `:root`, used as `text-[var(--color-red)]` etc.):

| Token | Value | Use |
|---|---|---|
| `--color-navy` | `#0a1628` | masthead accent, nav bar, sidebar/card panel headers |
| `--color-text` | `#14181f` | body text |
| `--color-gray` | `#55606c` | deks, bylines, metadata |
| `--color-gray-light` | `#8a94a0` | footer, timestamps |
| `--color-hairline` | `#e5e7eb` | light rules and borders |
| `--color-hairline-strong` | `#0a1628` | heavy section rules (navy) |
| `--color-red` | `#c8102e` | breaking bar, kickers, links, Subscribe button |
| `--color-red-dark` | `#9c0c23` | red hover/active state |
| `--color-blue` | `#1c5aa6` | secondary accent, used sparingly |
| `--color-bg` | `#ffffff` | page background |
| `--color-bg-off` | `#f7f8fa` | sidebar/module panel background |

Radius/shadow scale lives in `@theme` in `globals.css` (Tailwind v4's
`--radius-*`/`--shadow-*` theme namespace generates real utilities from
these — `rounded-control`, `rounded-card`, `shadow-card`,
`shadow-card-hover`, `shadow-pop`). Use these instead of ad hoc
`rounded-[Npx]`/arbitrary shadow values so the whole site's depth reads
as one system. Cards (`ArticleCard`'s `grid` variant, Hero's "Also
Developing" panel, `Sidebar` panels) are `rounded-card` + `shadow-card`,
brightening to `shadow-card-hover` on hover; form controls and buttons
are `rounded-control`.

Image placeholders are `#E5E4E0` blocks, shown when an article has no
`coverImageUrl`.

Type:
- Headlines: `font-headline` (Oswald, condensed bold sans — weights
  400/500/600/700 loaded in `layout.tsx`; there's no 900 weight available
  from `@fontsource/oswald`, so `font-black` headings fall back to
  browser-synthesized bold, which is fine visually). Most headlines are
  `uppercase`.
- Body: Georgia / Times New Roman serif, set inline on `<body>` in
  `layout.tsx` — kept serif for article body readability even though
  headlines moved to sans, a deliberate bold-headline/serif-body contrast.
  Article body is `text-[17px] sm:text-[19px] leading-[1.75]`.
- UI chrome (nav, bylines, metadata, buttons, forms): `font-sans`, small
  sizes, `uppercase tracking-wide font-bold` for kickers and nav.

**Reusable primitives** (`app/components/ui/`): every article-preview,
section-heading, and kicker-label treatment on the site should go through
these rather than reimplementing markup inline — that's what keeps the
whole site visually consistent instead of drifting page to page.
- `ArticleCard` — `variant="grid"` (the shadowed/rounded card used in
  `ArticleGrid` and `TopicRail`), `variant="list"` (thumbnail + headline,
  Hero's "Also Developing" rail), `variant="ranked"` (numbered, no image,
  `Sidebar`'s Trending Now).
- `SectionHeader` — `variant="underline"` (kicker + red rule + optional
  "More →" link, above grids/rails) or `variant="panel"` (solid navy bar,
  atop sidebar/rail panels).
- `Badge` — `variant="text"` (plain colored-uppercase category kicker,
  the common case), `"red"`/`"navy"` (solid pill tags — BREAKING, LIVE).

**Cascade layering gotcha**: the global `a { color: inherit; text-decoration:
none; }` reset in `globals.css` is wrapped in `@layer base`. If it isn't,
it becomes "unlayered" CSS, which beats every Tailwind utility class
(including `text-white`, `text-[var(--color-red)]`, etc.) regardless of
specificity — this silently broke the nav bar and every red "More" link
during the Phase 5 redesign (white/red text rendered as inherited dark
body text) until traced to this. Any future plain CSS rule targeting an
element Tailwind utilities also style needs the same `@layer base` (or
`components`/`utilities`) wrapping.

**Comment-inside-`@theme` gotcha**: a CSS comment whose *text* contains the
literal two-character sequence `*/` (not intended as the comment's close)
closes the comment early, and the leftover text becomes real CSS —
`Unclosed block` errors follow. Hit during Phase 6 with a comment reading
`--radius-*/--shadow-*`. Watch for this in any comment mentioning multiple
`--foo-*`-style wildcard token names next to each other.

Layout: `max-w-[1280px]` for dense pages (home, category, article) with a
`[1fr_320px]` two-column grid on `lg:` for the `Sidebar` (Trending Now +
Subscribe + podcast promo), `max-w-[720px]`/`max-w-[560px]` for
search/about/contact/privacy, `px-5` gutters throughout. Mobile-first
throughout — every component's unprefixed (base) classes are the mobile
layout, `sm:`/`lg:` are enhancements on top, never the reverse. The nav
collapses to a ☰ toggle below `sm`; the sidebar stacks below main content
below `lg`. Every tappable element (nav links, buttons, card links, form
inputs) carries `min-h-11` (44px) for touch targets, even where the
visual content is shorter.

## Phase 1 — done

Homepage, article template with per-article OG/Twitter metadata, all 6
category pages, search, About/Contact/Privacy, deployed.

## Phase 2 — done: the article editor

Rocci can write, edit, and publish articles from `/admin` without touching
code or running a deploy.

- **Database**: Neon Postgres, one `articles` table (`scripts/schema.sql`).
  `app/lib/db.ts` opens the connection via `@neondatabase/serverless` using
  `DATABASE_URL`. `app/lib/articles.ts` now reads/writes the DB instead of
  exporting a hardcoded array — the `Article` type gained `id`, `status`,
  and `coverImageUrl`, but every existing component still works against it
  unchanged. `category` (label) and `readTime` are computed at read time
  rather than stored.
- **Admin auth** *(superseded by Phase 7's multi-user Better Auth system —
  kept here for history)*: single admin, no user table. `ADMIN_USERNAME` +
  `ADMIN_PASSWORD_HASH` gated a login form at `/admin/login` behind a
  hand-rolled JWT session cookie.
- **Editor UI**: `/admin` lists all articles (draft + published); `/admin/
  articles/new` and `/admin/articles/[id]/edit` share `ArticleForm.tsx`.
  Server actions in `app/admin/articles/actions.ts` validate and write,
  then `revalidatePath("/", "layout")` so the change is live immediately.
- **Image upload**: Vercel Blob. `ArticleForm.tsx` uploads client-side via
  `@vercel/blob/client`'s `upload()`, authorized by `app/api/admin/upload/
  route.ts` (checks the admin session before minting a token). The
  resulting URL fills `coverImageUrl` and replaces the `/og-default.png`
  fallback in `generateMetadata()` and the `#E5E4E0` placeholder blocks
  when set.
- **Revalidation**: article/category/home pages use `generateStaticParams`
  + `revalidate = 60` as a fallback, but the real trigger is the
  `revalidatePath` call after every admin write.

Setup for a fresh environment: see Phase 7 below for the current
(Prisma + Better Auth) setup steps — this section describes the original
Phase 2 bootstrap and is kept for history only.

## Phase 3 — done: subscriber list + CSV export

The `SubscribeStrip.tsx` form now writes to a real `subscribers` table
(`scripts/schema.sql`, `app/lib/subscribers.ts`) via a public server action
(`app/lib/subscribe-actions.ts`) — validates the email, dedupes on conflict,
and swaps the form for a confirmation message on success. No auth needed
since it's a public opt-in form.

`/admin/subscribers` lists everyone who's signed up (protected by the same
`/admin/*` middleware as the article editor) with an "Export CSV" button
hitting `app/api/admin/subscribers/export/route.ts` — that route isn't
covered by `middleware.ts`'s matcher, so it re-checks the session cookie
itself before streaming the CSV.

## Phase 4 — done: real content, rich body rendering

The site now runs on Rocci's actual articles instead of placeholders.

- **WordPress import**: `scripts/import-wordpress.mjs` takes a WXR export
  (`Tools → Export` from wp-admin) and loads it into Postgres. Run once via
  `node --env-file=.env.local scripts/import-wordpress.mjs <path-to-export.xml>`.
  It filters out the "JNews" theme's Lorem-ipsum demo filler posts (matched
  by content fingerprint, not category — WP category assignment on this
  site is inconsistent), maps WordPress categories onto the 7 site
  categories via a best-effort priority list (falls back to
  `opinion-analysis`, the catch-all bucket for the dominant "Current Events
  & News Analysis" WP category), and replaces the Phase 2 placeholder
  articles (matched by slug). Featured images resolve via the WXR
  attachment graph (`_thumbnail_id` → attachment `wp:post_id`), falling
  back to the first `<img>` in the post body. It's idempotent — re-running
  it against the same export upserts by slug rather than duplicating.
  Since WP category tagging was inconsistent, some articles may have
  landed in the wrong category — that's expected, re-file from `/admin`
  as needed.
- **Rich body rendering**: `Article.bodyHtml` replaced the old
  paragraph-array `body` field. WordPress content has real headings, bold,
  links, and inline images that a plain-paragraph model couldn't represent.
  `app/lib/sanitize.ts` sanitizes HTML (`sanitize-html`, tag/attribute
  allowlist) both for the WordPress import and for `ArticleForm.tsx`'s
  body textarea — `bodyInputToHtml()` auto-wraps plain paragraph text
  (blank line between paragraphs, the old authoring convention) in `<p>`
  tags if no HTML is detected, or sanitizes as-is if it is. The article
  page renders it with `@tailwindcss/typography`'s `prose` classes,
  themed to match the site (serif headline font on headings, red links,
  bordered images) rather than the plugin's defaults.

## Phase 5 — done: mainstream-portal redesign

The minimal single-column newspaper layout read as "a blog" rather than a
news network — Rocci wanted it to compete visually with Fox News / Daily
Mail. This was a structural + brand overhaul, not just a color swap. See
the Design system section above for the new palette/type.

- **New components**: `Sidebar.tsx` (Trending Now — recency-based, no
  view-count tracking yet — plus a compact Subscribe box and a podcast
  promo box; used on home/category/article pages), `TopicRail.tsx` (one
  per-category module: 4-across thumbnail grid + "More →" link, stacked
  down the homepage for every category), `BreakingTicker.tsx` (client
  component that rotates through the latest few headlines every 5s,
  rendered inside the now-async `BreakingBar.tsx` which fetches real
  articles instead of showing one hardcoded line).
- **SiteHeader**: sticky navy nav bar, bold two-tone wordmark
  (`Stucci`+red `Media`), red masthead accent line.
- **SiteFooter**: expanded from one thin line to a full navy multi-column
  footer (sections, company links, follow).
- **Homepage**: `Hero.tsx`'s "Also Developing" rail gained thumbnails; the
  page is now a `[1fr_320px]` grid — main column stacks a `TopicRail` per
  category, `Sidebar` alongside.
- **Category/article pages**: same `[1fr_320px]` + `Sidebar` treatment.
  `ArticleGrid.tsx` lost its own outer container (parent pages provide it
  now, since it needs to share width with the sidebar column).
- **Fonts**: `@fontsource/source-serif-4` swapped for `@fontsource/oswald`
  (condensed bold sans, only goes up to weight 700 — see the Design
  system note on `font-black` fallback). Article body stayed serif
  (Georgia, inline on `<body>`) for a deliberate bold-sans-headline /
  serif-body contrast.
- **`SubscribeForm.tsx`**: extracted from `SubscribeStrip.tsx` so the
  same server-action-backed form could be reused compact in the sidebar
  (`compact` prop) without duplicating the `useActionState` wiring.

## Phase 6 — done: premium design system pass

Phase 5 nailed the mainstream-portal *structure* but Rocci wanted the
finish to read as premium editorial (Free Press/Semafor/Axios), not a
flat tabloid grid — softer depth, real component reuse, disciplined
mobile-first/touch-target hygiene. See the Design system section above
for the token/component details; this section is the "what changed."

- Exact navy/red/white/light-gray palette per Rocci's spec, replacing
  Phase 5's approximated Fox-News colors. `--color-black` renamed to
  `--color-navy` sitewide (it was always navy, not black — the old name
  was a carried-over hack from Phase 5, not worth perpetuating once every
  usage needed touching anyway).
- New `app/components/ui/` primitives (`ArticleCard`, `SectionHeader`,
  `Badge`) replace duplicated inline card/heading markup that had drifted
  slightly across `ArticleGrid`, `TopicRail`, `Hero`, and `Sidebar`.
- Cards gained `rounded-card` + `shadow-card` (brightening to
  `shadow-card-hover` on hover) — the flat/bordered Phase 5 treatment now
  reads as "premium," not "cheap."
- Touch-target pass: every button/link/input across the public site
  (including `SubscribeForm`, `SiteHeader`'s hamburger/search/subscribe,
  `contact/page.tsx`'s form) got `min-h-11`.

## Phase 7 — done: Prisma data foundation + multi-user auth (Better Auth)

The site moved from a single-hardcoded-admin JWT cookie to a real data
model: registered users with roles, categories as DB rows instead of a
hardcoded array, and comments/likes tables ready for a future public
engagement UI.

- **Prisma**: `prisma/schema.prisma` is now the schema source of truth,
  layered on top of the same Neon Postgres database (`DATABASE_URL`) —
  the pre-existing `articles`/`subscribers` tables were extended in place
  via `@@map`/`@map`, not recreated, so no data migration was needed.
  `app/lib/prisma.ts` exports a singleton `PrismaClient` built with
  `@prisma/adapter-neon` (the Neon HTTP/WebSocket driver, not raw TCP) —
  required because this app runs in serverless/edge-adjacent environments
  (and this sandboxed dev container) where the Postgres wire protocol's
  raw TCP isn't reachable, only HTTPS is. **Prisma is pinned to the 6.x
  line** (not 7.x, despite 7 being current on npm) — Prisma 7 requires a
  `prisma.config.ts` + driver-adapter-only setup that's a bigger, riskier
  migration than this phase needed; 6.19.3 still supports the simple
  `datasource { url = env(...) }` schema form.
- **Migrations can't use `prisma migrate` in this environment** for the
  same TCP-vs-HTTPS reason — `prisma migrate deploy` always speaks raw
  Postgres wire protocol. Migrations are hand-written SQL under
  `prisma/migrations/<name>/migration.sql` (matching what `prisma migrate
  dev` would generate) applied via `scripts/apply-prisma-migration.mjs`,
  which runs the SQL through the same Neon HTTP driver the app uses and
  records it in `_prisma_migrations` so Prisma's own tooling still sees
  correct migration history. On Vercel (real TCP access) `prisma migrate
  deploy` would work normally for any future migration — either approach
  is fine going forward, whichever the environment permits.
- **Auth**: [Better Auth](https://better-auth.com) (`app/lib/auth.ts`),
  backed by Prisma via `better-auth/adapters/prisma`, with the built-in
  `admin` plugin for the `ADMIN`/`USER` role system (`adminRoles:
  ["ADMIN"]`). Email+password only for now. `app/api/auth/[...all]/
  route.ts` mounts every Better Auth endpoint; `app/lib/auth-client.ts`
  exports the React client (`useSession`, `signIn`, `signUp`, `signOut`).
  **`baseURL` must come from a server-only env var (`BETTER_AUTH_URL`),
  never `NEXT_PUBLIC_*`** — `NEXT_PUBLIC_` vars get statically inlined
  into the build output, which silently freezes Better Auth's origin
  check to whatever it was at build time and throws `INVALID_ORIGIN` on
  every request once the app's real URL differs (found by testing the
  actual login flow, not just the build).
- **User model gained fields beyond the original ask**: Better Auth's
  `admin` plugin expects `banned`/`banReason`/`banExpires` on `User` and
  `impersonatedBy` on `Session` (ban/impersonation are part of the plugin,
  not optional) — omitting them fails user creation with `Unknown
  argument "banned"`. Discovered at runtime via an actual sign-up request,
  not from the schema alone; a second migration
  (`20260807010000_admin_plugin_fields`) added them.
- **Route protection, two layers**: `proxy.ts` (Next.js 16 renamed
  `middleware.ts` → `proxy.ts`/`export function proxy` — the old
  convention is deprecated but still works with a build-time warning)
  does a cheap edge-safe check via `better-auth/cookies`'s
  `getSessionCookie()` — cookie presence only, no DB call, since the edge
  runtime here can't reach Postgres. `app/admin/layout.tsx` does the real
  check (`auth.api.getSession()` + `role === "ADMIN"`) and is what
  actually enforces the role — a signed-in non-admin gets redirected to
  `/`, a signed-out visitor to `/login`.
- **Login/register UI**: `/login` and `/register` (`app/login/AuthForm.tsx`,
  shared by both) match the site's form conventions (same field/button
  treatment as `contact/page.tsx`). Public — any visitor can register;
  only role determines `/admin` access, not registration itself.
- **Categories moved into the database**: `app/lib/categories.ts` now
  reads a `Category` table (`getCategories()`, `getCategoryBySlug()`)
  instead of exporting a hardcoded array — both became `async`, so every
  caller (`SiteFooter`, homepage, category pages, the admin article form)
  was updated to `await` them. The admin `ArticleForm` (a client
  component) can't call an async server function directly, so its parent
  server pages (`admin/articles/new`, `admin/articles/[id]/edit`) fetch
  categories and pass them down as a prop instead.
  `scripts/seed-categories.mjs` upserts-by-slug the real 7 categories the
  site uses today (same list the old hardcoded array had) — re-running it
  is safe and won't duplicate rows. `Article.categorySlug` stays a plain
  text column (not a foreign key) deliberately, same as before — it's
  legacy/primary-category-only for the existing single-category site UI;
  the new `ArticleCategory` join table exists for future multi-category
  tagging without disturbing that.
- **`Article.status` became a real Postgres enum** (`article_status`:
  `DRAFT`/`PUBLISHED`, uppercase) instead of a lowercase-checked text
  column — `app/lib/articles.ts` still exposes `"draft"`/`"published"`
  (lowercase) as the public TypeScript type so `ArticleForm.tsx` and
  `admin/articles/actions.ts` needed zero changes; the enum mapping is
  internal to `articles.ts`. `scripts/seed.mjs` and
  `scripts/import-wordpress.mjs` insert the enum directly via raw SQL, so
  their literal `'published'` values had to become `'PUBLISHED'`.
- **Admin bootstrapping, by design, doesn't reimplement Better Auth's
  password hashing**: register a normal account at `/register`, then run
  `npm run admin:promote -- you@example.com` (`scripts/promote-admin.mjs`)
  to flip that user's role to `ADMIN` via a direct SQL update. This avoids
  a seed script needing to replicate Better Auth's internal hash format
  (version-dependent, not a stable public API).
- **New models not yet wired to any UI**: `Like` (unique on
  `userId`+`articleId`) and `Comment` (self-referential `parentId` for
  threaded replies, `isApproved` for moderation) exist in the schema and
  migration but have no reader/writer code or public-facing UI yet —
  scoped for a future phase.

Setup for a fresh environment: add the Neon and Vercel Blob integrations
in the Vercel dashboard's Storage tab (injects `DATABASE_URL`,
`DATABASE_URL_UNPOOLED`, `BLOB_STORE_ID`), set `SESSION_SECRET`
(`openssl rand -base64 32`) and `BETTER_AUTH_URL` (this app's own URL —
e.g. the Vercel deployment URL, or `http://localhost:3000` in dev), pull
them locally via `vercel env pull .env.local`, then: `npm run db:migrate`
(base `articles`/`subscribers` tables) → `npm run db:migrate:prisma --
20260807000000_init_data_foundation` and `-- 20260807010000_admin_plugin_fields`
(everything else) → `npm run db:seed-categories` (the 7 real categories)
→ optionally `npm run db:seed` (placeholder articles). On Vercel, npm's
`postinstall` runs `prisma generate` automatically so the client is
always in sync with `prisma/schema.prisma`.
