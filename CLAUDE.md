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
  components/             BreakingBar, SiteHeader, HeroRotator,
                          HeadlineMosaic, CategoryBand, PodcastModule,
                          Sidebar, ArticleGrid, SubscribeStrip/Form,
                          SiteFooter
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
minimum touch targets on every interactive element.

**The public site has two themes as of Phase 60** — a day desk and a night
desk, on `data-desk` on `<html>`, defaulting to the hour in Florida. The
old `color-scheme: light only` and the `prefers-color-scheme: dark`
force-light override are gone. Two rules matter when touching colour now:
never use `.dark` for the public site (that class belongs to the admin's
next-themes provider), and never hardcode `#fff` or `bg-white` for a
surface — use `--color-surface`, which is white by day and a lifted
near-black panel at night.

Colors (CSS vars on `:root`, used as `text-[var(--color-red)]` etc.):

| Token | Value | Use |
|---|---|---|
| Token | Day | Night | Use |
|---|---|---|---|
| `--color-navy` | `#0b1220` | `#141a24` | masthead accent, nav bar, panel headers |
| `--color-text` | `#0a0a0a` | `#f7f5f2` | body text |
| `--color-gray` | `#55606c` | `#a8b0bc` | deks, bylines, metadata |
| `--color-gray-light` | `#5f6a78` | `#8e97a5` | footer, timestamps |
| `--color-hairline` | `#dde1e9` | `#262b34` | light rules and borders |
| `--color-red` | `#c8102e` | `#c8102e` | **fills only** — anything with white text on it |
| `--color-red-ink` | `#c8102e` | `#f04458` | **text only** — red type and small marks |
| `--color-red-dark` | `#9c0c23` | `#9c0c23` | red hover/active state |
| `--color-gold` | `#c4a35a` | `#d4b978` | **Veterans only**; never as text on white (2.4:1) |
| `--color-bg` | `#ffffff` | `#0a0a0a` | page background |
| `--color-bg-off` | `#f7f5f2` | `#15171c` | module/panel background |
| `--color-surface` | `#ffffff` | `#15171c` | cards — use instead of `bg-white` |
| `--color-field-border` | `#b9b9b9` | `#3a424f` | form input borders |

The red split is the one that bites: `--color-red` as text on the night
desk's near-black ground is 3.37:1 and fails AA, but lightening the fill
would break the ~65 places white sits on red. Two tokens, same colour by
day. `text-[var(--color-red-ink)]`, `bg-[var(--color-red)]`.

Layout containers read `--container-max`/`--gutter` through the `.shell`
utility. The default is 1280/20px; the homepage wraps itself in
`.desk-wide` for 1440/14–16px, so widening it cannot reflow any other
page.

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
  `ArticleGrid`, `CategoryLead`, `RelatedArticles`), `variant="list"`
  (thumbnail + headline, `CategoryLead`'s briefs column),
  `variant="ranked"` (numbered, no image, `Sidebar`'s Trending Now).
  **The homepage does not use `ArticleCard` at all** — it is built from
  `PosterCard` (image is the card, copy sits on it). `ArticleCard` owns
  the reading pages: category, article, tag, author.
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

## Phase 8 — done: admin dashboard shell + Categories management

`/admin` went from a single bare articles table to a real dashboard
product: sidebar nav, top bar, stat overview, and a full Categories CRUD
screen with search/sort, optimistic delete, and a slug-conflict safety
check — built on shadcn/ui-pattern components, hand-written rather than
pulled via the `shadcn` CLI.

- **The `shadcn` CLI can't run in this environment** — `ui.shadcn.com`
  (where `shadcn init`/`add` fetch component source and the init preset)
  is blocked by this sandbox's outbound network policy (`registry.npmjs.org`
  is allowed, that domain isn't). Worked around by installing the same
  underlying packages (`class-variance-authority`, `clsx`, `tailwind-merge`,
  `lucide-react`, the individual `@radix-ui/react-*` primitives, `sonner`,
  `tw-animate-css`) directly from npm and hand-writing the component
  wrappers (`Button`, `Input`, `Textarea`, `Label`, `Card`, `Badge`,
  `Table`, `Dialog`, `AlertDialog`, `DropdownMenu`, `Sheet`, `Avatar`,
  `Separator`, `Skeleton`, the `sonner` `Toaster`) matching shadcn's actual
  source patterns. If a future environment *can* reach the registry,
  `npx shadcn@latest add <component>` should still work going forward —
  nothing here locks the project out of the real CLI, it just wasn't
  available for this phase.
- **Scoped to `app/admin/components/ui/` + `app/admin/lib/cn.ts`**,
  deliberately separate from the public site's existing
  `app/components/ui/` primitives (`ArticleCard`, `SectionHeader`, the
  editorial `Badge`) — same directory name, different purpose and API, so
  keeping them in physically separate trees avoids any mixup between "the
  premium news-reader design system" and "the dashboard chrome." A new
  `--admin-*`-prefixed CSS variable set in `globals.css` backs the
  dashboard components (`--admin-primary` is the same brand red, but the
  neutral scale — `--admin-bg`, `--admin-border`, `--admin-fg-muted`,
  etc. — is its own dashboard-appropriate palette, not the public site's
  navy/red/serif editorial tokens).
- **`app/admin/layout.tsx`** now renders `<AdminShell>` (sidebar + top bar
  + `<Toaster />`) around every `/admin/*` page, on top of the existing
  session/role redirect logic — the role check didn't change, just what
  wraps the authorized content. Nav items (Dashboard/Articles/Categories/
  Comments/Settings) live in `app/admin/components/nav-items.ts`, shared
  between the desktop sidebar and the mobile `Sheet`-based drawer so they
  can't drift apart.
- **The articles list moved from `/admin` to `/admin/articles`** —
  `/admin` is now a real Dashboard (stat cards: total/published/draft
  articles, category count, subscriber count, each linking to its
  section; a "recently updated" list). `deleteArticleAction` (used by the
  edit page's delete button, which still redirects after) is now
  redirect-target-`/admin/articles`; a new sibling,
  `deleteArticleFromListAction`, returns a result instead of redirecting
  so the Articles list can delete a row in place.
- **Categories CRUD** (`app/admin/categories/`): `CategoriesClient.tsx`
  holds the table, search, and a sort menu (name/most-articles/newest);
  `CategoryDialog.tsx` is the shared create/edit form (slug
  auto-generates from name via the same `slugify()` — now factored out to
  `app/lib/slugify.ts` — until the slug field is hand-edited, same UX as
  the article editor). `app/lib/categories.ts` gained
  `getCategoriesWithCounts()` (a `prisma.article.groupBy` on
  `categorySlug` joined against the category list — counts are by the
  legacy primary-category column, not the unused `ArticleCategory` join
  table, since that's what the site's nav/category pages actually read)
  and full `createCategory`/`updateCategory`/`deleteCategory`. Renaming a
  category's slug cascades to every article's `categorySlug` in the same
  `$transaction` — otherwise a rename would silently orphan articles
  filed under the old slug (`getCategoryBySlug` would just stop finding
  them). Delete is blocked server-side
  (`app/admin/categories/actions.ts`'s `deleteCategoryAction`) whenever
  `getCategoryArticleCount(slug) > 0`, with the count surfaced in the
  confirmation dialog so it reads as "re-file these first," not a generic
  failure.
- **Optimistic updates**: category and article row deletion both use
  React 19's `useOptimistic` — the row disappears immediately, and if the
  server call fails (e.g. the delete-blocked case), the optimistic state
  automatically reverts to the last committed list and a `sonner` toast
  explains why. Create/edit go through a modal that awaits the server
  action before closing (a spinner + disabled submit is the loading
  state there) rather than optimistic insertion — the temp-ID/replace
  dance needed for a truly optimistic modal-based create wasn't worth it
  for the UX gain over "the dialog closes the moment it's actually done."
- **Comments and Settings are real pages, not stubs disguised as done**:
  `/admin/comments` is an explicit "coming soon" empty state (the
  `Comment`/`Like` tables exist from Phase 7 but have no reader/writer
  code or public UI yet). `/admin/settings` is a working profile editor
  (name, via Better Auth's `authClient.updateUser`) — email and role are
  shown read-only.

## Phase 9 — done: full Articles management (editor, SEO panel, multi-category)

The articles list and editor went from a bare table + plain-textarea form
to a real CMS surface: a Tiptap rich text editor, true multi-category
tagging, a full SEO panel with a live 0–100 score and Google preview, and
list-level quick-edit + bulk actions — all built on the Phase 8 admin
component library.

- **Multi-category articles, for real this time**: `ArticleCategory` (the
  join table added in Phase 7 but never written to) is now populated on
  every create/update, via a `syncArticleCategories()` transaction helper
  in `app/lib/articles.ts` shared by `createArticle`, `updateArticle`, and
  the list's `updateArticleCategories()` quick-edit. `Article.categorySlug`
  (the legacy single-category text column the public site's nav/category
  pages still read) is kept in sync as "first selected category" — so
  multi-select works in the admin without touching the public site's
  category-page logic. `Article`'s TS type gained `categorySlugs: string[]`
  and `categories: string[]` (labels) alongside the existing single-value
  fields.
- **Rich text editor**: Tiptap (`@tiptap/react` + `starter-kit` +
  `extension-link` + `extension-image` + `extension-placeholder`), in
  `app/admin/articles/RichTextEditor.tsx`. Toolbar is deliberately limited
  to exactly what `app/lib/sanitize.ts`'s existing allowlist accepts
  (bold/italic, h2–h4, bullet/numbered lists, blockquote, link, image) —
  no toolbar button produces a tag the sanitizer would strip back out.
  `editor.getHTML()` feeds a hidden `<textarea name="body">` so the rest
  of the save pipeline (`bodyInputToHtml` → `sanitizeArticleHtml`) is
  unchanged from the old plain-textarea editor.
- **Full SEO panel** (`SeoPanel.tsx`): SEO title/description with live
  character counters, focus keywords, canonical URL, a separate OG image
  upload, and a live Google-style result preview. The 0–100 score comes
  from `app/lib/seo-score.ts` — a pure, dependency-free function (title
  length, description length, focus-keyword presence across
  title/description/slug/content, slug quality, image presence, content
  length) shared verbatim between the editor's live panel (client) and
  the articles list's SEO column (server-rendered from stored values) so
  the number can never disagree between the two places it's shown.
- **The editor is one `<form>`, not a wizard** — Content and SEO are tabs
  over the *same* form, and **both tabs stay mounted** (CSS-hidden, not
  conditionally rendered) even when inactive. This was a real bug caught
  before shipping: SEO fields need `name` attributes to submit via
  `FormData`, and if the SEO tab's inputs only existed in the DOM while
  that tab was active, saving from the Content tab would silently submit
  empty SEO values regardless of what was typed earlier. Keeping both
  tabs mounted also means the Tiptap editor's cursor/selection survives
  switching to the SEO tab and back.
- **Featured image vs. OG image are separate uploads** — both go through
  the same Vercel Blob flow as before (`ImageField.tsx`, generalized from
  the old inline upload handler), but are independent fields
  (`coverImageUrl` or `ogImage`) since a social-share crop and the
  in-article/card image don't always want to be the same asset.
- **Published date picker** is a plain `datetime-local` input, not a
  calendar-widget library — styled to match, but no new dependency for
  what's fundamentally "pick a date and time."
- **Articles list**: `Featured` column is an instant-optimistic `Switch`
  (via `useOptimistic`, same pattern as Phase 8's category delete);
  `Categories` column is click-to-edit in place
  (`CategoryQuickEdit.tsx` — a lighter popover than the editor's
  `CategoryMultiSelect`, no "create new category" escape hatch, since a
  list row is the wrong place to launch that flow); status/featured/
  category filters plus search, all client-side over the already-fetched
  list; row checkboxes + a bulk action bar (Publish/Unpublish/Delete)
  that appears the moment anything is selected, also `useOptimistic` so
  a bulk publish/delete reflects in the table instantly.
- **New category creation, in-context**: `CategoryMultiSelect.tsx` (used
  by the editor's sidebar) reuses Phase 8's `CategoryDialog` and
  `createCategoryAction` directly rather than duplicating the create
  form — "New category" in the popover opens the same dialog, and the
  newly created category is immediately selected.
- **Verified against the live Neon DB, not a fixture**: the full flow
  (create with two categories + SEO fields + featured on → appears
  correctly in the list → quick-edit categories → bulk unpublish → row
  delete) was run against production data via Playwright. One real
  published article got swept up in the bulk-unpublish test step and was
  restored via direct SQL immediately after; the test admin account and
  the test article itself were deleted afterward. No article content or
  other site data was affected.

## Phase 10 — done: homepage Featured section

`Hero.tsx` (which just used "most recent published article" as the lead,
regardless of any curation) is replaced by `FeaturedSection.tsx` — the
homepage's first content section now shows only what an editor explicitly
marked Featured via Phase 9's toggle.

- **Query is a straight filter, no cleverness**: `getFeaturedArticles()`
  in `app/lib/articles.ts` is `where: { status: "PUBLISHED", isFeatured:
  true }`, ordered by `publishedAt desc` — same shape as the other public
  read functions.
- **Graceful fallback, honestly labeled**: if nothing is marked Featured
  yet, `FeaturedSection` falls back to the latest published articles
  instead of rendering an empty box — but the section header reads
  "Latest Stories" (not "Featured Stories") and the navy "Featured" pill
  badge is suppressed on the lead story in fallback mode, so a visitor is
  never told something is curated when it isn't. This was verified
  against the live site both ways: with zero featured articles (the
  actual current state) and with three real articles temporarily marked
  featured via direct SQL to confirm the true layout, then reverted.
- **Layout**: large cinematic lead (full-bleed image, gradient scrim,
  overlaid headline — the same treatment the old Hero used, since it
  already worked well) alongside up to 3 secondary cards. A new
  `ArticleCard` variant, `"featured"`, was added for those — a horizontal
  card (image left, content right) showing image, category badge, title,
  excerpt, author, and date, matching this task's explicit per-card
  requirements. The old Hero's rail used `variant="list"`, which only
  showed image + title + date — not enough for this section, hence the
  new variant rather than reusing what was there.
- **No duplicate stories directly below**: whichever articles the section
  ends up showing (curated or fallback) are excluded from the category
  rails and the sidebar's Trending Now list, same exclusion pattern the
  old Hero used for its single lead story, just generalized to a set of
  up to 4 slugs instead of one.

## Phase 11 — done: image re-host fix (post-domain-activation incident)

`scripts/import-wordpress.mjs` (Phase 4) had imported every article's
`coverImageUrl` and inline body `<img>` URLs as direct hotlinks to the
original WordPress install's own media library, not this app's storage.
That quietly worked as long as stuccimedia.com still pointed at the old
WordPress host. Once the domain was repointed at this Next.js app, every
one of those links broke — the app never owned copies of the images.

- **Fix**: `scripts/rehost-images.mjs` — fetches every broken image, uploads
  it to this app's own Vercel Blob store, and rewrites the DB (`cover_image_url`
  and inline `<img src>` in `body`) to point at the new permanent Blob URLs.
  Matches each broken URL against a fresh WordPress export
  (`scripts/data/wordpress-export.xml`, kept locally, not committed — see
  below) by post slug/filename for a verified-correct source, falling back
  to a naive domain swap only when nothing matches. Idempotent: only touches
  rows still referencing the broken host.
- **Delivery mechanism**: run once via `.github/workflows/rehost-images.yml`,
  a manual `workflow_dispatch` Action (Actions tab → "Re-host article images"
  → Run workflow), so it could be triggered from GitHub's web UI with no
  local dev environment needed. Requires two repo secrets (`DATABASE_URL`,
  `BLOB_READ_WRITE_TOKEN`) — the workflow file and script are kept in the
  repo as a reference/reusable tool but the XML export used to seed the
  first run was intentionally **not** committed (real content data, no
  reason to keep it in git history).
- **Result**: 89/89 cover images and 315/315 inline body images fixed, 0
  failures.
- **Lesson**: a green "success" check on this kind of script only means the
  Node process exited 0 — it doesn't mean the work succeeded. The script
  catches per-image errors internally rather than throwing, so the first
  run reported "success" while 100% of uploads had actually failed (an
  invalid `BLOB_READ_WRITE_TOKEN` secret). Always read the job's actual
  logged output/summary counts, not just the run conclusion.

## Phase 12 — done: reader engagement (likes, threaded comments, related articles)

Registered readers (not just admins) can now sign in, like an article, and
leave threaded comments — the `User`/`Like`/`Comment` models Phase 7 added
but never wired up now have a public UI. Every article also ends with a
"You May Also Like" rail instead of just stopping after the body.

- **Reader auth reuses Phase 7's Better Auth setup as-is** — `/login` and
  `/register` were already public and role-agnostic (only `/admin` checks
  `role === "ADMIN"`), so no new auth plumbing was needed; liking/commenting
  just gate on "is there a session" via `auth.api.getSession({ headers:
  await headers() })` in `app/articles/[slug]/actions.ts`'s server actions.
  Both actions return a typed `{ success: false, error }` rather than
  throwing when signed out, so the client components can show an inline
  message instead of a crashed form.
- **Likes**: `app/lib/likes.ts` (`getLikeCount`, `hasUserLiked`,
  `toggleLike` — keyed on Prisma's `@@unique([userId, articleId])`
  compound constraint) backs `LikeButton.tsx`, a client component using
  `useOptimistic` for instant heart-fill + count change on click, reverting
  automatically if the server action fails. Signed-out visitors see a
  "Sign in to like" link in the same slot instead of a dead button.
- **Comments**: `app/lib/comments.ts` builds a nested reply tree
  (`buildTree()`, flat DB rows → `CommentNode[]` via parent-id lookup) for
  `CommentSection.tsx` — a recursive `CommentItem` renders each comment
  plus its replies, with a per-comment "Reply" toggle reusing the same
  `CommentForm` sub-component as the top-level composer. New comments
  auto-approve (`isApproved: true` at creation) — `isApproved` is for
  *post*-moderation (admin taking something down after the fact via
  `/admin/comments`), not a pending queue. Optimistic posting shows the
  new comment immediately at reduced opacity while the server action is
  in flight, keyed with a temp `temp-${Date.now()}` id.
- **Admin moderation**: `/admin/comments` (previously a "coming soon"
  placeholder) now lists every comment across the site
  (`getAllCommentsAdmin()`) with search, an approved/hidden filter, and
  approve-toggle + delete actions — same `useOptimistic` + `sonner`-toast
  pattern as Phase 8/9's other admin tables.
- **Related articles**: `getRelatedArticles()` in `app/lib/articles.ts`
  prefers same-category published articles (most recent first), and backfills
  from the newest published articles sitewide if the category doesn't have
  enough to fill the rail — so it's never sparse even for a lightly-populated
  category. `RelatedArticles.tsx` reuses the existing `ArticleCard`
  `variant="grid"` (no new card design needed) in a responsive grid below
  the article body.
- **`app/articles/[slug]/page.tsx` is now a dynamic route**: it calls
  `auth.api.getSession()` to know whether to show the liked/filled heart or
  the sign-in prompt, which opts the page out of the static/ISR path it
  used before (`revalidate = 60` is still declared but no longer the
  effective caching mechanism for this route specifically — `generateStaticParams`
  still pre-builds the article shell for `generateMetadata`/OG tags, but the
  page body itself now always renders per-request).
- **Verified locally against the live Neon DB**: build + typecheck pass,
  and the article page was fetched directly (signed-out state) to confirm
  the like button's sign-in prompt, the comment section's empty state, and
  the "You May Also Like" rail all render with real data — this was done
  from the sandboxed dev environment (no browser available there), so the
  signed-in interactive flows (posting a comment, liking, nested replies)
  have not been through a live click-through and are worth a manual pass
  after this deploys.

## Phase 13 — done: article data cleanup (categorization, bulk admin tools, SEO backfill)

A full content-quality pass on the 89 WordPress-imported articles, plus new
admin tooling to keep it clean going forward.

- **Category corrections**: content review (headline + dek + body excerpt,
  not just the WordPress-assigned category) found 25 articles filed wrong —
  mostly things the Phase 4 import's best-effort mapping had dumped into the
  `opinion-analysis` catch-all (archaeology/science stories, book reviews,
  human-interest features with no real opinion/analysis angle) plus a few
  filed by surface keyword rather than actual subject (a mass-shooting story
  under opinion-analysis, a fugitive-from-justice story under
  political-news, someone else's podcast content under the site's own
  `podcasts` category). `scripts/data/category-corrections.json` is the
  full 89-article review; `scripts/recategorize-articles.mjs` applies only
  the `changed: true` rows. Already run — 25/25 corrected, 0 failures.
- **`article_categories` join table was silently incomplete for 64 of 89
  articles** — `syncArticleCategories()` (Phase 9) only ever runs from the
  admin editor's save path, so anything inserted directly (the original
  WordPress import, `scripts/seed.mjs`) never got a join-table row, only the
  legacy `category_slug` column. `mapRow()`'s existing fallback
  (`categorySlugs.length > 0 ? categorySlugs : [row.categorySlug]`) meant
  nothing was visibly broken, but the multi-category feature's actual data
  was thin. Backfilled a matching join row (from `category_slug`) for all
  64 — no code change needed, this was a one-time data fix.
- **Bulk category reassignment + bulk Feature/Unfeature**: the articles
  list's bulk action bar (Phase 9: Publish/Unpublish/Delete) gained "Set
  category" (`BulkCategoryPicker.tsx` — a multi-select popover mirroring
  the existing per-row `CategoryQuickEdit`, with an explicit "Apply to
  selected" rather than close-to-apply, since a bulk action needs a clearer
  confirm point than a one-row quick-edit) and "Feature"/"Unfeature",
  backed by new `bulkUpdateArticleCategories`/`bulkSetArticleFeatured` in
  `app/lib/articles.ts`. Re-filing or featuring articles in bulk no longer
  requires opening each one individually.
- **SEO fields backfilled for all 89 articles**: every article had null
  `seoTitle`/`seoDescription`/`seoKeywords` (the SEO panel's fallback logic
  meant the admin's SEO score column still showed a number, but a low one —
  no focus keyword, no dedicated title/description independent of the
  headline/dek). `scripts/data/seo-backfill.json` holds generated values
  calibrated against `app/lib/seo-score.ts`'s actual scoring rules (title
  ≤60 chars, description ~120–160 chars, a focus keyword appearing in at
  least 3 of {title, description, slug, body}) rather than generic filler —
  `scripts/backfill-seo.mjs` applies it. Verified post-run: scores across
  all 89 articles now range 90–100 (average 99), up from a near-zero
  baseline.
- **Featured curation**: 0 articles were marked Featured before this pass
  (Phase 10's `FeaturedSection` was silently running in fallback "Latest
  Stories" mode). Hand-picked 4 diverse, high-impact recent articles
  (political, world, crime, veterans) and set `isFeatured`, so the homepage
  now shows real editorial curation with the "Featured" badge instead of
  the honest-but-generic fallback.
- **New bulk-action UI verified end-to-end in a real browser**, not just
  code-reviewed: a temporary Playwright install (`playwright-core` against
  the sandbox's pre-installed Chromium) plus a throwaway admin test account
  and throwaway draft articles were used to click through the actual
  bulk-category and bulk-feature flows against the live dev server and
  confirm both the DB and the UI updated correctly. The test account,
  test articles, and Playwright scratch install were all removed afterward
  — nothing test-related was left in the repo or the database.

## Phase 14 — done: production hardening pass (admin + engagement system)

A systematic audit-and-fix pass across the whole admin panel and the
Phase 12 engagement features, aimed at closing real production gaps rather
than cosmetic polish.

- **Server action authorization, the headline fix**: `app/admin/layout.tsx`'s
  session/role check only runs when a page renders — it does NOT gate a
  direct POST to a Server Action's endpoint, which is independently
  reachable once deployed (the action ID is visible in the client bundle).
  Every mutating action in `admin/articles/actions.ts`,
  `admin/categories/actions.ts`, and `admin/comments/actions.ts` now calls
  the existing `requireAdminSession()` helper (previously only used by the
  upload/CSV-export API routes) before doing anything. Also hardened the
  public engagement actions (`app/articles/[slug]/actions.ts`): wrapped in
  try/catch instead of letting DB errors throw unhandled, verify the
  target article is published before allowing a like/comment, and verify a
  reply's `parentId` actually belongs to the article being commented on.
- **Loading and error states**: the app had zero `loading.tsx`/`error.tsx`
  files anywhere despite an unused `Skeleton` primitive already sitting in
  the admin component library — every async page showed a frozen blank
  screen on navigation or DB failure. Added shaped-to-match skeletons for
  every admin data page and the public article/category pages, plus
  `admin/error.tsx` and a public `app/error.tsx` in the site's visual
  language, both with a "Try again" reset button.
- **Mobile admin audit**: verified in an actual 375px-wide browser
  (throwaway admin account) rather than guessed. Most of the admin was
  already solid (nav drawer, dashboard, categories, comments, the article
  editor). Two real breakages fixed: the articles list's bulk action bar
  (6+ buttons in one unwrapped row) now stacks its label and scrolls its
  buttons instead of overflowing, and the table's title column was wide
  enough to push the Status badge and actions menu off-screen — narrowed
  it below `sm:` and moved the date into a secondary line under the
  headline so Status stays visible without horizontal scrolling.
- **SEO score accuracy**: fixed a real bug where a stray leading comma in
  `seoKeywords` silently produced an empty focus keyword. Added two new
  advisory checks — image alt-text coverage and keyword-stuffing density —
  deliberately WITHOUT folding them into the 100-point score, since doing
  so would have retroactively changed the number for every one of the 89
  articles just hand-scored in Phase 13.
- **Image upload optimization**: `ImageField.tsx` previously uploaded
  whatever the browser file picker returned, untouched — a straight-from-
  camera photo would become the actual served cover/OG image with zero
  optimization. `image-compression.ts` now resizes to a 2000px longer-side
  cap and re-encodes to JPEG (quality 0.85) via Canvas before upload,
  skipping animated GIFs and already-small files. Verified directly in a
  browser: a synthetic 4000×3000 12.18MB test image compressed to
  2000×1500 at 61.7KB (99.5% reduction). Also added client-side file-type
  validation matching the server's allowlist.
- **Form validation**: neither the article nor category admin forms had
  any server-side length bound — added explicit max lengths (checked
  against every existing row first; nothing in the live DB violated the
  new caps) plus format checks for `canonicalUrl` (must be a real URL) and
  category `color` (must be a hex value). Mirrored the same caps as
  `maxLength` client-side so a user hits the limit while typing, not only
  on a rejected submit. The public comment form got the same treatment —
  `maxLength`, a live counter near the limit, and the submit button now
  disables on a too-short (post-trim) comment.
- **Activity logging**: new `ActivityLog` model
  (`prisma/migrations/20260807220000_activity_log`) plus
  `app/lib/activity.ts`, wired into every admin mutation — article
  create/update/delete (single + bulk), featured/category changes,
  category CRUD, comment moderation. Each entry snapshots the actor's
  name/email at write time rather than only storing a user-id foreign key,
  so it still reads sensibly if an account is later renamed or removed.
  Surfaced on the dashboard as a "Recent activity" panel alongside
  "Recently updated". Toast coverage was already solid everywhere
  (checked, no gaps found) — this adds the persistent record toasts alone
  don't provide.
- **Verification throughout**: every fix in this phase that touched
  user-facing behavior was checked in a real browser against the live dev
  server and live Neon DB — a temporary Playwright install against the
  sandbox's pre-installed Chromium, throwaway admin accounts, and
  throwaway test articles/images, all created fresh and fully cleaned up
  (deleted test users, test articles, test activity-log rows) after each
  check. Nothing test-related was left behind in the repo or the database.

## Phase 15 — done: cinematic full-bleed hero (FeaturedSection rearchitecture)

The homepage's above-the-fold `FeaturedSection` — previously a contained,
rounded, shadowed card floating inside the page's `max-w-[1280px]`
container, with the 3 secondary stories squeezed into a skinny `1fr`
sidebar column — was rebuilt into a true edge-to-edge magazine-cover hero
with a proper tight editorial secondary system. Structure/layout only —
no color, font, or animation changes; every class still references the
site's existing design tokens.

- **True full-bleed hero**: `FeaturedSection` is no longer wrapped in
  `page.tsx`'s `max-w-[1280px] px-5` container — it renders its own
  full-width `<section>`, so the hero image spans the entire viewport on
  every breakpoint (previously it only bled edge-to-edge on mobile via a
  `-mx-5` hack; desktop always showed a rounded, shadowed, inset card).
  The secondary editorial band below re-applies the `max-w-[1280px]`
  constraint internally so it still lines up with the rest of the page.
- **Cinematic, viewport-relative height**: `h-[85svh]` on mobile (using
  `svh` specifically — small-viewport-height — to avoid the classic
  mobile Safari `100vh`-includes-the-address-bar bug), scaling down
  through `sm:h-[72vh]` to a fixed `lg:h-[640px]` on desktop, each with a
  `min-h`/`max-h` clamp so it never collapses too short or grows
  absurdly tall on unusual viewport sizes.
- **Tight editorial secondary system, not three skinny side cards**: the
  old `ArticleCard` `variant="featured"` (a horizontal thumbnail-left
  card in a bordered/shadowed box, stacked vertically in a squeezed `1fr`
  column) is gone — secondary stories are now inlined directly in
  `FeaturedSection` as flush, chrome-free, image-top cards separated by
  hairline/navy divider rules (`sm:border-t-2 sm:border-[var(--color-navy)]`
  + vertical `sm:border-l` between items), laid out as a proper 3-column
  row on `sm:` and up. On mobile, the same cards become a horizontal
  snap-scroll rail (`overflow-x-auto snap-x snap-mandatory`, each card
  `w-[68%]` so the next card visibly peeks at the edge as a scroll
  affordance) instead of a vertical stack — new `.scrollbar-none` utility
  added to `globals.css` (`@layer utilities`) to hide the scrollbar
  without disabling scroll/snap.
- **Spacing tightened**: `page.tsx`'s `pt-6` before the section is gone
  (the hero now touches the header directly, zero gap, for true
  full-bleed cinematic weight) and the "Featured Stories" kicker/heading
  padding was reduced (`pt-4 pb-3` vs. the old `mb-5 sm:mb-6`).
- **Type scale increased for magazine-cover weight**: the lead headline
  grew from `27px/38px/44px` (mobile/sm/lg) to `32px/46px/58px` — still
  `font-headline` (Oswald), no font change, just a bolder hierarchy
  decision — and is now the page's actual `<h1>` (previously an `<h3>`,
  and the homepage had no `<h1>` at all before this — a correctness
  improvement, not just visual).
- **Verified in a real production build** (`next build && next start`,
  not just dev) via Playwright screenshots at mobile (390px), tablet
  (834px), and desktop (1600px) — confirmed the full-bleed edge-to-edge
  hero, the 3-column editorial grid on desktop, and the horizontal
  snap-scroll rail on mobile (including the partial-card scroll
  affordance) all render as intended. Article cover images themselves
  didn't load in this sandbox (no general internet egress to the Vercel
  Blob CDN, a known/documented environment limitation — see Phase 11) but
  the layout structure, gradient scrim, and text overlay all verified
  correctly against the placeholder.

## Phase 16 — done: high-density post-hero editorial system

Below the Phase 15 hero, the homepage's 7 stacked `TopicRail` category
modules previously each rendered 4 uniform-weight `variant="grid"` cards
with no internal hierarchy — combined with each rail's own padding plus
`SectionHeader`'s margin repeated 7 times, this was the source of the
"generic blog feed" / "large empty white bands" complaint. Structure and
spacing only — no color, font, or animation changes.

- **Every `TopicRail` now has a lead + briefs hierarchy** instead of 4
  equal cards: one `variant="grid"` lead story (full image/dek/byline
  treatment) alongside up to 3 secondary stories reusing the existing,
  previously-unused-in-the-content-stream `ArticleCard` `variant="list"`
  (small thumbnail + tight headline + date, no card chrome), grouped in a
  single bordered/shadowed panel. Desktop is a `grid-cols-[1.4fr_1fr]`
  split; mobile stacks the lead above the tight list. No new markup was
  invented — both variants already existed in `ArticleCard.tsx`.
- **`SectionHeader` gained an opt-in `compact` prop** (smaller kicker
  text, tighter `mb-2.5 sm:mb-3` vs. the default `mb-4 sm:mb-5`) used only
  by `TopicRail` — `RelatedArticles.tsx` and `ArticleGrid.tsx` (article
  page's "You May Also Like", category pages) keep the original spacing
  unchanged, since those are standalone-page contexts where the old
  looser rhythm still reads correctly, not a repeated-7-times homepage
  stack.
- **Padding/margin trimmed at every level that compounded down the
  stack**: each `TopicRail`'s own `py-6 sm:py-7` dropped to `py-4 sm:py-5`;
  a hairline `border-t` (skipped on `alternate` rails, which already read
  as a distinct block via `bg-[var(--color-bg-off)]`) replaces the old
  `gap-1` flex spacing between rails for a crisper module boundary without
  adding whitespace; `page.tsx`'s wrapping `py-2` was removed entirely;
  `Sidebar.tsx`'s panel-to-panel `gap-7` tightened to `gap-5` and its two
  promo boxes' `py-6` internal padding tightened to `py-5`.
- **Verified in a real production build** (`next build && next start`) via
  Playwright full-page screenshots at mobile (390px) and desktop (1440px)
  — confirmed the lead/briefs hierarchy renders correctly in every rail,
  alternating-background rails still read as distinct modules, and the
  sidebar's tightened panel spacing holds up alongside the denser main
  column. Article cover images didn't load in this sandbox (same
  documented CDN-egress limitation as Phase 15/11) but layout structure
  verified correctly against the placeholder blocks.

## Phase 17 — done: tight, integrated masthead + nav

`SiteHeader.tsx`'s two bands — a generously padded white logo band
(`pt-5 pb-4`, 28px/40px logo) and a separately-proportioned navy nav band
— read as loosely related layers sitting on top of `BreakingBar`, with a
lot of dead white space around the wordmark. Compressed into a tight,
high-authority masthead. Structure and spacing only — no color, font
family, or animation changes.

- **Logo band height cut roughly in half**: `pt-5 pb-4` → `py-2 sm:py-2.5`,
  logo size trimmed `28px/40px` → `22px/30px` with `leading-none` so the
  wordmark no longer carries extra line-height air above/below it. The
  "Live · Florida" date block shrank to match (`text-xs` → `text-[11px]`).
- **Nav band tightened to match**: the mobile hamburger and the desktop
  Subscribe button's vertical margin (`my-1.5`/`sm:my-2.5`, the tallest
  elements in the row and what was setting the band's real height) cut to
  `my-1`/`sm:my-1.5` — every other element in the row was already pinned
  to the 44px `min-h-11` floor, so this margin was the actual excess.
- **Category nav gained real structure instead of a flat link list**:
  hairline `border-l border-l-white/10` dividers between items (skipped
  before the first) turn the 7 links into a segmented menu module — a
  legitimate way to add visual hierarchy/intentionality without touching
  color or type, per this task's constraints. Link padding trimmed
  `px-3.5` → `px-3` and text `12.5px` → `12px` to fit the tighter band.
  The active/hover state now targets `border-b-*` explicitly (previously
  the shorthand `border-[var(--color-red)]` colored all four sides,
  which would have also tinted the new left dividers red — had to split
  it into a side-specific utility once dividers were introduced).
- **`BreakingBar`**: `py-2.5` → `py-2` — its `min-h-11` was already the
  effective floor (a real `<Link>` ticker item lives inside, so the
  44px touch-target minimum can't drop further), this just trims the
  padding actually available to shrink.
- **`MobileMenu.tsx`'s drawer got the same treatment** for consistency
  with the now-tighter collapsed header: its own logo band `pt-5 pb-4` →
  `pt-3 pb-3`, the search field's `py-4` → `py-3`, each nav row
  `min-h-14` (56px) → `min-h-12` (48px, still comfortably above the 44px
  touch-target floor), and the bottom Subscribe padding `py-5` → `py-4`.
- **Verified in a real production build** (`next build && next start`)
  via Playwright screenshots at mobile (390px) and desktop (1440px), plus
  the mobile drawer opened — confirmed the header now reads as one
  compact, integrated unit sitting directly above the full-bleed hero
  with no gap or competing whitespace, the desktop nav's divider-segmented
  links, and the drawer's tightened rhythm. Article cover images/hero
  photo didn't load in this sandbox (same documented CDN-egress
  limitation as prior phases).

## Phase 18 — done: distinct editorial-desk modules below the hero

Every homepage module below the hero — Latest, all 7 categories — used
the same Phase 16 lead+briefs `TopicRail` template with only the title
text changing. Real news homepages don't do this: an opinion column
section, a podcast shelf, and a breaking-news wire all look structurally
different from each other, not just differently labeled. Three new
components replace `TopicRail` for the desks where a different content
type calls for a different arrangement; standard categories (Political,
World, Social Issues, Crime & Investigation, Veterans) keep `TopicRail`
unchanged. Structure and spacing only — no color, typography, or
animation changes.

- **`LatestModule.tsx`** — a new top-of-stream desk (didn't exist before
  this phase) showing the newest articles sitewide, any category, ahead
  of the category modules. Deliberately the *opposite* arrangement of
  `TopicRail`: no dominant lead image, just a dense equal-weight grid of
  `ArticleCard` `variant="list"` items (small thumbnail, tight headline,
  date) — recency over hierarchy. Uses a `gap-px` + hairline-background
  grid technique (each cell white, the 1px gap shows through as a
  divider) instead of hand-computing per-cell border classes across three
  responsive column counts.
- **`OpinionModule.tsx`** (replaces `TopicRail` for `opinion-analysis`
  only) — opinion pieces are argument-driven, not photo-driven, so this
  drops imagery entirely: a dense two-column wall of `ArticleCard`
  `variant="ranked"` (the imageless numbered variant, previously only
  used in `Sidebar`'s Trending Now) reused here for its first appearance
  in the main content stream. Same `gap-px` divider-grid technique as
  `LatestModule`.
- **`PodcastShelf.tsx`** (replaces `TopicRail` for `podcasts` only) — the
  site's only audio-episode content, browsed like a shelf rather than
  read top-to-bottom. Horizontal `overflow-x-auto snap-x snap-mandatory`
  scroll of fixed-width (`220px`/`240px`) `variant="grid"` tiles — reuses
  the snap-scroll technique `FeaturedSection` (Phase 15) established for
  its secondary rail, rather than inventing a new scroll pattern. The
  only vertically-non-stacking module on the page, on both mobile and
  desktop.
- **`page.tsx` routes each category to the right module** by slug
  (`opinion-analysis` → `OpinionModule`, `podcasts` → `PodcastShelf`,
  everything else → `TopicRail`) instead of one uniform `.map()`.
  `TopicRail`'s alternating `bg-off` background is now indexed by a
  counter incremented only for actual `TopicRail` renders
  (`topicRailIndex`), not by position in the full category list — so the
  alternating rhythm stays clean between same-type modules instead of
  skipping a beat whenever a specialty module sits between two rails.
  `LatestModule`'s 6 items are excluded from `railItems` via the same
  slug-exclusion pattern `FeaturedSection` already used, so nothing shows
  twice.
- **Verified in a real production build** (`next build && next start`)
  via Playwright full-page screenshots at mobile (390px) and desktop
  (1440px), plus a targeted mobile crop scrolled to the Podcasts shelf —
  confirmed all three new module types render with visibly distinct
  arrangements (wire grid, headline-only column wall, horizontal shelf)
  next to the unchanged `TopicRail` desks, and the podcast shelf's
  partial-card peek/snap-scroll works on a real mobile viewport. Article
  cover images didn't load in this sandbox (same documented CDN-egress
  limitation as prior phases) but every layout structure verified
  correctly against the placeholder blocks.

## Phase 19 — done: mobile made intentionally denser than desktop

Every density pass through Phase 18 tightened spacing at both breakpoints
together (`py-4 sm:py-5` etc.) — mobile was always slightly tighter than
desktop by a fixed margin, never restructured on its own terms. This
phase goes back through the same components and widens the gap
specifically on mobile (`sm:`-preserved, base-class-only edits) so the
phone experience reads as its own deliberate composition, not a scaled
copy. Structure and spacing only — no color, typography, or animation
changes.

- **Header/chrome, mobile-only**: `SiteHeader`'s white logo band
  `py-2` → `py-1.5`, logo `22px` → `20px`; the nav row's hamburger/
  Subscribe vertical margin `my-1` → `my-0.5` (both keep their `sm:`
  values from Phase 17 unchanged). `BreakingBar` was already floored by
  its `min-h-11` touch target and couldn't tighten further without
  violating this project's 44px touch-target rule, so it's untouched.
- **Hero, mobile-only**: `FeaturedSection`'s bottom text-overlay padding
  `px-5 pb-6` → `px-4 pb-5`; the "Also Making Headlines" kicker's
  `pt-4 pb-3` → `pt-3 pb-2.5`; the secondary cards' image crop
  `aspect-[4/3]` → `aspect-[3/2]` (shorter/wider) and their row gap
  `gap-4` → `gap-3` — frees more of the first screen for the hero image
  itself and tightens the band beneath it, without touching any `sm:`+
  value (desktop hero is pixel-identical to Phase 15/17).
- **Content modules, mobile-only**: `TopicRail`/`OpinionModule`/
  `PodcastShelf`/`LatestModule`'s section padding `py-4` → `py-3`;
  `TopicRail`'s internal lead/briefs gap `gap-4` → `gap-3`;
  `PodcastShelf`'s tiles `220px` → `200px` with `gap-4` → `gap-3` (more
  of the next tile peeks at the edge, reinforcing the shelf's scroll
  affordance); `SectionHeader`'s `compact` kicker margin `mb-2.5` →
  `mb-2`. `Sidebar`'s panel-to-panel gap and promo-box padding both
  gained a `sm:`-preserved mobile-only reduction too, since on mobile the
  sidebar renders below all category modules (single-column layout) and
  benefits from the same tightened rhythm.
- **`ArticleCard` itself, mobile-only** (affects every module that uses
  it, homepage and category/article pages alike): the `grid` variant's
  image `aspect-[16/9]` → `aspect-[2/1]` (a shorter crop specifically on
  phones — this is what shrinks `TopicRail`'s lead-story image and
  `PodcastShelf`'s tiles without touching the desktop crop) and its text
  padding `p-4` → `p-3.5`; the `list` and `ranked` variants' vertical
  padding `py-3.5` → `py-3`. The 44px `min-h-11` touch target is
  untouched on every variant — padding shrank, the tappable floor didn't,
  so density gains don't cost touch-friendliness.
- **`SubscribeStrip`/`SiteFooter`, mobile-only**: closing-section padding
  (`py-12` → `py-9` on `SubscribeStrip`; `py-12` → `py-9` on `SiteFooter`,
  its column gap `gap-y-10` → `gap-y-8`) tightened to match, so the
  density doesn't visibly stop at the last category module.
- **Verified in a real production build** (`next build && next start`)
  via Playwright at a 390×844 mobile viewport (both a first-screen,
  no-scroll shot and a full-page shot) and a 1440px desktop shot for
  comparison — confirmed the hero now dominates the entire mobile first
  screen beneath a genuinely minimal chrome band, every module's tightened
  rhythm holds without crowding text, the podcast shelf's peek/snap-scroll
  still works at the narrower tile width, and the desktop layout is
  pixel-identical to before this phase (every change here was `sm:`-
  preserved or base-class-only). Article cover images didn't load in this
  sandbox (same documented CDN-egress limitation as prior phases) but
  every layout structure verified correctly against the placeholder
  blocks.

## Phase 20 — done: tight editorial footer

`SiteFooter` was a stock four-column theme footer: Brand, a 7-item
vertical "Sections" list, a 4-item vertical "Company" list, and a
"Stay Informed" column that duplicated `SubscribeStrip`'s newsletter
pitch immediately above it. On mobile, four full-height stacked columns
(each with its own header) made for a very long scroll with several
big blocks of same-weight vertical link lists. Rebuilt into two columns
with a denser nav pattern. Structure and spacing only — no color,
typography, or animation changes.

- **Four columns → two**: Brand+social+subscribe on the left, a single
  Navigation column on the right holding two small labeled groups
  (Sections, Company) — down from three separately-labeled columns.
  The old dedicated "Stay Informed" column is gone; its one real job
  (a subscribe pathway) now lives as a compact button next to the
  social icon in the Brand column, since the full pitch (headline,
  benefit list, email form) already exists one component up in
  `SubscribeStrip` — the footer doesn't need to repeat it.
- **Vertical link lists → flat wrapped nav rows**: `Sections`' 7
  categories and `Company`'s 4 pages were each `<ul>`s with one
  `min-h-11` link per line (11 stacked 44px rows total). Both are now
  `flex flex-wrap` rows — links share a line where they fit, so 7
  categories collapse to ~2 lines instead of 7, each link still keeping
  its own `min-h-11` touch target via `inline-flex items-center` (the
  44px floor comes from `min-height`, not padding, so it applies even
  when several links share a row). This is the main density win, on
  both mobile and desktop.
- **Deliberate transition from the last content module**: the footer's
  `mt-4` top margin — a small unstyled gap of the page's white
  background between `SubscribeStrip`'s bottom hairline border and the
  footer's navy start — is gone. The navy plane now begins immediately
  where `SubscribeStrip` ends, on every page that renders `SiteFooter`
  (home, category, article, search, about, contact, login/register,
  privacy), not just the homepage.
- **Bottom legal bar tightened to match**: `py-5` → `py-3.5 sm:py-4`.
- **Verified in a real production build** (`next build && next start`)
  via Playwright, scrolled to the bottom of the homepage at mobile
  (390px) and desktop (1440px) — confirmed the two-column layout, the
  wrapped nav rows collapsing the old 11-row link list into ~4 dense
  lines, the direct touch against `SubscribeStrip` above with no gap,
  and the tightened legal bar, at both breakpoints.

## Phase 21 — done: premium editorial type system

Every structural pass through Phase 20 reused the same handful of type
sizes/tracking values (`tracking-[-0.005em]` on nearly every headline,
`tracking-wide` on nearly every kicker) — visual hierarchy came entirely
from layout, not from the type itself. This phase tunes size, weight,
line-height, and letter-spacing at every tier so the hierarchy reads
even with the layout held constant. Typography only — no color, no
layout/structure changes, no animation. `font-headline` (Oswald) stays
the display/UI face and the Georgia body serif is untouched; every
change below is size/leading/tracking within the existing two-font
system.

- **Display tier (hero `<h1>`, `FeaturedSection`)**: `32/46/58px` →
  `36/52/66px`, `leading-[1.02]` → `leading-[0.96]`,
  `tracking-[-0.015em]` → `tracking-[-0.02em]` — a genuinely bigger,
  tighter, more magazine-cover headline instead of a scaled-up card
  title. The hero dek gained a touch of size/leading (`15/17px` →
  `15.5/18px`, `leading-[1.5]`→`[1.55]`) for readability at the new
  contrast level, and the byline row got `tracking-[0.01em]` so it
  reads as a deliberately quieter UI tier under the display headline,
  not just smaller text.
- **Section-label tier (`SectionHeader`)**: non-compact `19/21px` →
  `20/23px` with `tracking-[-0.005em]` → `tracking-[-0.015em]`; the
  `panel` variant (Trending Now, "Also Developing") went from
  `tracking-wide`'s default value to an explicit tuned
  `tracking-[0.03em]`. Tighter tracking at a slightly larger size reads
  as "authoritative label," not "slightly-bold paragraph text."
  `FeaturedSection`'s own "Also Making Headlines" kicker (a bespoke
  label, not `SectionHeader`) got the same treatment:
  `tracking-[0.02em]` → `[0.06em]` for a sharper, more spaced-out
  section-divider feel appropriate to its all-caps kicker role.
- **Card-title tier (`ArticleCard`, all three variants)**: every
  variant's headline gained tighter `tracking-[-0.01em]` (previously
  `-0.005em` or untracked) and tighter `leading` (`1.25`→`1.15` on
  `grid`, `1.3`→`1.2` on `list`); the `grid` variant's title also grew
  `16/17px` → `17/18px` for more presence as the module's lead story.
  Metadata rows (byline/date/dek) picked up small `tracking-[0.01em]`–
  `[0.04em]` values instead of being untracked, so the metadata tier
  reads as a distinct, deliberately-labeled register under the
  headline rather than an afterthought.
- **Page `<h1>` tier, unified sitewide**: category, search, about,
  contact, and privacy pages all shared one `text-[32px] sm:
  text-[42px] tracking-[-0.005em]` pattern — bumped together to
  `text-[34px] sm:text-[46px] leading-[0.98] tracking-[-0.015em]` so
  every non-article, non-hero page title reads at the same authoritative
  weight. The article page's own `<h1>` (which needs to fit much longer
  real headlines, so keeps its own smaller size) got the matching
  `leading-[0.98] tracking-[-0.015em]` treatment: `28/38px` → `31/42px`.
  `error.tsx`'s heading and `MobileMenu`'s wordmark/nav-link tracking
  were tuned to match the same tightened-tracking language.
  `SubscribeStrip`'s and `SiteFooter`'s brand-adjacent headings
  (newsletter CTA `h2`, footer wordmark, `Sidebar`'s two promo-box
  titles) all picked up the same tighter tracking + slightly larger
  size pattern for consistency across every "this is a heading" moment
  on the site.
- **Article body (`prose`)**: `prose-headings` gained
  `tracking-[-0.01em] leading-[1.1]` (previously only `tracking-[-0.005em]`,
  no explicit leading — relied on the browser default), `prose-h2` grew
  `24px` → `25px`, and `prose-blockquote` gained `leading-[1.3]` so a
  pull-quote doesn't run loose at its larger `22px` size. The actual
  body paragraph size/leading (`17/19px`, `leading-[1.75]`) is
  untouched — it was already well-tuned for long-form serif readability
  in Phase 4, and "highly readable body text" meant leaving it alone,
  not changing it for its own sake.
- **`Badge`**: `11px tracking-wide` → `10.5px tracking-[0.05em]` — a
  hair smaller with deliberately wider, tuned tracking reads as a
  sharper kicker/tag than the previous generic `tracking-wide` utility.
- **Verified in a real production build** (`next build && next start`)
  via Playwright full-page screenshots of the homepage (mobile 390px,
  desktop 1440px) and an article page (mobile + desktop) — confirmed
  the hero headline now reads with genuine magazine-cover weight at
  both breakpoints, section labels and card titles are visibly tighter
  and sharper without hurting legibility, the article `<h1>`/prose
  hierarchy holds up on a real long-form piece, and mobile headlines
  carry authority rather than reading like scaled-down desktop text.
  Article cover images didn't load in this sandbox (same documented
  CDN-egress limitation as prior phases) but every typographic change
  verified correctly against the placeholder blocks.

## Phase 22 — done: color depth, surfaces, and contrast system

Every prior phase built structure and type on top of the same three
tokens doing double duty as both "brand color" and "surface treatment":
`--color-bg-off` was nearly indistinguishable from white
(`#f7f8fa`), navy/red panels were flat solid fills, and shadows were
subtle enough to read as barely-there. This phase deepens the shared
surface tokens and adds intentional depth (gradients, stronger shadows)
at high-leverage spots, so richness cascades sitewide through the
existing component system rather than needing per-component rewrites.
Color/surface/contrast only — no layout, typography, or animation
changes; the brand palette itself (navy `#0a1628`, red `#c8102e`,
black, white) is unchanged, only how it's *used*.

- **Two shared tokens deepened in `globals.css`, cascading everywhere**:
  `--color-bg-off` (alternating `TopicRail`s, `LatestModule`, admin-
  adjacent panels) `#f7f8fa` → `#eef1f6` — now a genuinely cooler,
  navy-tinted surface instead of a shade barely different from white.
  `--color-hairline` (every card border, divider, and the `gap-px`
  hairline-grid technique in `LatestModule`/`OpinionModule`) `#e5e7eb`
  → `#dde1e9` — sharper card edges without touching any text color.
- **Shadow scale deepened in the same `@theme` block**: `--shadow-card`,
  `--shadow-card-hover`, and `--shadow-pop` all gained more spread and
  opacity (e.g. `shadow-card-hover`'s blur `28px`→`40px`, opacity
  `0.14`→`0.18`). Every card sitewide (`ArticleCard`'s `grid` variant,
  `TopicRail`'s briefs panel, `Sidebar`'s panels, `LatestModule`/
  `OpinionModule`'s hairline-grid panels, `SubscribeStrip`'s form card)
  now reads as genuinely lifted off its surface instead of barely
  separated — a single token change with sitewide reach, deliberately
  chosen over editing each component's own shadow class.
- **Navy surfaces gained gradient depth instead of flat fills**:
  `SiteHeader`'s sticky nav bar, `SiteFooter`'s main panel, and
  `Sidebar`'s "The Rocci Stucci Show" promo box all went from solid
  `bg-[var(--color-navy)]` to `bg-gradient-to-b` (or `-br`)
  `from-[var(--color-navy)] to-[var(--color-navy-dark)]` — `--color-
  navy-dark` already existed (used by the footer's bottom legal bar
  since Phase 5/6) and is now reused rather than adding a new token,
  giving these three navy panels atmospheric depth instead of a flat
  poster-color fill.
- **Red gained the same treatment where it's a large fill**:
  `BreakingBar`'s background went from solid `bg-[var(--color-red)]` to
  `bg-gradient-to-r from-[var(--color-red)] to-[var(--color-red-dark)]`
  — badges and small CTAs (already small enough to read as flat, sharp
  accent color) are untouched, this only applies where red covers a
  large surface.
- **`SubscribeStrip`'s inline gradient deepened**: the navy/red radial
  wash behind the newsletter panel went from `rgba(10,22,40,0.06)`/
  `rgba(200,16,46,0.03)` to `0.1`/`0.05` — more atmospheric without
  approaching a contrast problem, since the section's actual text sits
  on solid white/near-white, not on the gradient itself.
- **`FeaturedSection`'s hero scrim deepened**: `from-black/95 via-
  black/45 to-black/10` → `from-black/97 via-black/55 to-black/5` —
  stronger falloff gives the overlaid white headline/dek more contrast
  against the image (directly serving "do not reduce contrast on
  text" — this increases it) while leaving more of the image visible
  and untinted near the top.
- **`LatestModule` gained its own `bg-[var(--color-bg-off)]`** (the
  homepage's first post-hero module) so it doesn't read as a second
  plain-white block sitting directly against `FeaturedSection`'s dark
  hero — it's structurally isolated in its own container (not part of
  the `TopicRail`/`OpinionModule`/`PodcastShelf` flex stack), so this
  was safe to make a permanent tint rather than an alternating one.
  **`OpinionModule` and `PodcastShelf` deliberately did NOT get the
  same treatment**: they sit between `TopicRail`'s alternating rails in
  the same unbroken flex column, and giving both a permanent tint would
  have put three `bg-off` `rounded-card` blocks back-to-back (World
  News → Opinion → Podcasts) with no border between them — since
  adjacent same-tint rounded blocks touch with zero gap in this flex
  stack, their independent corner-rounding would visibly collide at the
  seam. Caught and reverted before shipping rather than risking a
  layout artifact to get a color change.
- **Verified in a real production build** (`next build && next start`)
  via Playwright full-page screenshots of the homepage at mobile
  (390px) and desktop (1440px) — confirmed the deepened `bg-off`/
  hairline tokens read as genuinely richer surfaces (not just a barely-
  perceptible tint), the gradient panels (nav, footer, sidebar promo,
  breaking bar) show visible depth without looking like a color change,
  the hero's stronger scrim keeps headline text sharply legible, and
  mobile carries the identical depth treatment (same tokens, no
  breakpoint-gated color logic). Article cover images didn't load in
  this sandbox (same documented CDN-egress limitation as prior phases)
  but every surface/contrast change verified correctly against the
  placeholder blocks.

## Phase 23 — done: premium component refinement (cards, badges, meta, headers)

Structure (Phases 15-20), typography (21), and color/surfaces (22) were
all tuned at the module/page level. This phase goes one level down —
the shared primitives themselves (`ArticleCard`'s three variants,
`Badge`, `SectionHeader`) — refining internal proportions, the badge
system, and meta-information treatment so every card/badge/header feels
individually crafted rather than a default theme component reused at
scale. Component design only — no page-structure, type-system, or
color-palette changes; every value here works within the existing
tokens from Phases 21/22.

- **`Badge` rebuilt for real hierarchy**: the `text` variant (the quiet
  category kicker above most headlines) gained a small `4px` dot marker
  before the label — graphic presence without the weight of a filled
  pill, so it reads as deliberately quieter than the solid tags. The
  `red`/`navy` solid variants (BREAKING, FEATURED, LIVE) grew
  `10.5px`→`11px` text and `px-2 py-[3px] rounded-[3px]` →
  `px-2.5 py-1 rounded-[4px]` — a real tag now, not a faint label. This
  required restructuring `VARIANT_CLASSES` so text size lives per-
  variant instead of one shared base size, and the dot only renders
  conditionally for `variant="text"`.
- **`ArticleCard` `grid` variant** (the flagship story card): padding
  `p-3.5 sm:p-4` → `p-4 sm:p-5` and internal margins loosened a touch
  (badge/title/dek/meta-divider spacing all gained ~0.5 units) so the
  card breathes without undoing the section-level density from Phase
  16-19. The image gained a `relative` wrapper with a `pointer-events-
  none` bottom gradient overlay (`from-black/15 to-transparent`) — a
  static, non-animated finishing touch that makes the image-to-text
  transition feel considered instead of an abrupt crop. The meta row
  (author/date/read-time) went fully uppercase-tracked with muted
  `hairline-strong/30` dot separators replacing plain "·" characters —
  reads as a precise editorial byline register instead of an
  afterthought caption line.
- **`ArticleCard` `list` variant**: thumbnail `84×64px` → `88×60px`
  (a touch wider/shorter, closer to the site's dominant 16:9 image
  language) and gained a subtle `ring-1 ring-black/5` for polish beyond
  its existing shadow; gap widened slightly to match.
- **`ArticleCard` `ranked` variant** (Sidebar's Trending Now,
  `OpinionModule`'s headline wall): the numeral and headline are now
  separated by a full-height `border-r`/`pl-3` rule instead of a plain
  gap — required switching the flex container to default `stretch`
  alignment (both spans get `flex items-center` internally) so the
  rule's height tracks the taller sibling (a wrapped 2-3 line headline)
  instead of just the numeral's own line height, which would have left
  a short, oddly-cropped-looking divider. Numeral opacity `/25` → `/30`
  for a touch more presence.
- **`SectionHeader` strengthened for authority**: the `underline`
  variant's rule grew `border-l-4` → `border-l-[5px]` with matching
  `pl-3.5`; the `panel` variant (Trending Now, "Also Developing") gained
  the same red left-rule language (`border-l-4 border-red`) it never
  had before, unifying both header types under one visual accent system
  instead of two unrelated treatments, plus `py-2.5`→`py-3` for more
  presence.
- **Article page byline row** got the matching uppercase-tracked
  date/read-time treatment (author stays mixed-case — "By Rocci Stucci"
  reads as a name, not a data field) with the same muted dot separators
  as `ArticleCard`'s meta row, for sitewide consistency.
- **Real bug caught and fixed while verifying**: the article page's
  "← Back to Home" link and the category `Badge` directly below it were
  both `inline-flex`, so with no text node between them in JSX they
  rendered on the same line ("← Back to Home• VETERANS", visually
  cramped) — invisible before this phase because the plain-text badge
  had less visual weight, but the new dot marker made the crowding
  obvious in a screenshot. Fixed by changing the link to `flex w-fit`
  (block-level, so the next element wraps below it) — a display-property
  fix, not a markup/structure change.
- **Verified in a real production build** (`next build && next start`)
  via Playwright screenshots of the homepage (desktop 1440px, mobile
  390px) and an article page (desktop, before and after the byline-
  crowding fix) — confirmed the badge dot markers, thicker section-
  header rules, refined card meta rows, and the full-height ranked-list
  divider all render correctly, and mobile cards carry the same refined
  proportions rather than looking like shrunk desktop cards. Article
  cover images didn't load in this sandbox (same documented CDN-egress
  limitation as prior phases) but every component change verified
  correctly against the placeholder blocks.

## Phase 24 — done: cinematic imagery and overlay system

Every image on the site — hero, story cards, article cover — used plain
`object-cover` with no shared photographic treatment, and a flat single-
color `#E5E4E0` box stood in for missing images everywhere. This phase
adds two shared, reusable image treatments and applies deepened overlay
work at the highest-impact spots, so photography reads as a deliberate,
cinematic part of the brand rather than raw uploads dropped into cards.
Imagery/overlay only — no layout structure, typography, color-palette,
or animation changes (aspect-ratio unification below is cropping/
consistency work, not a structural change).

- **Two new shared utilities in `globals.css`** (`@layer utilities`),
  used by every real image and every "no image" placeholder sitewide:
  `.img-cinematic` (`filter: contrast(1.04) saturate(1.06)`) — a
  deliberately subtle photo treatment, not a color-token change, so
  every photo across the site reads as considered editorial photography
  rather than an unfiltered upload. `.img-placeholder` (a soft diagonal
  two-tone gradient, `#ece9e4` → `#d9d6cf`) replaces the flat
  `bg-[#E5E4E0]` fill everywhere an article has no cover image, so even
  an empty-image state looks designed rather than a broken gray box.
- **Hero gained a cinematic vignette**, layered *under* the existing
  text-legibility scrim (`FeaturedSection`): a radial gradient
  (`transparent` at 45% → `rgba(0,0,0,0.22)` at the edges) darkens the
  frame's corners so the eye settles on the subject and headline instead
  of drifting to the edges — a classic cinematic-photography technique,
  purely an overlay addition, no crop/size change to the hero itself.
- **Clear hierarchy between hero and supporting images, via treatment
  intensity, not layout**: the hero keeps its full-height, two-layer
  scrim (vignette + legibility gradient) since text sits directly on
  top of it; every supporting/story image (secondary hero cards,
  `ArticleCard`'s `grid` variant, the article page's cover image) gets
  only a small bottom-edge gradient (`h-8`–`h-12`, `black/12`–`/18` to
  transparent) as a finishing touch — present but far more restrained,
  so the hero unambiguously reads as the dominant image on the page.
  `ArticleCard`'s existing bottom overlay deepened slightly
  (`black/15` → `/18`) to match this new shared language.
- **Aspect-ratio consistency**: `FeaturedSection`'s secondary-story
  images were the one image spot still on a bespoke `aspect-[3/2] sm:
  aspect-[4/3]` ratio, unrelated to the rest of the site. Unified to
  the same `aspect-[2/1] sm:aspect-[16/9]` every other story-card image
  already uses (`ArticleCard`'s `grid` variant, `PodcastShelf` tiles) —
  one consistent widescreen cropping language sitewide instead of two.
- **Article page cover image**: gained the same `relative` wrapper +
  bottom-gradient + `img-cinematic`/`img-placeholder` treatment as every
  card image, for full-site consistency — previously the one major image
  spot with no overlay treatment at all.
- **Mobile gets the identical treatment**: none of the new gradient/
  filter/placeholder classes are breakpoint-gated, so the vignette,
  hero scrim, card overlays, and placeholder gradient all render
  identically on a 390px viewport as on desktop — no separate "mobile
  image" logic to drift out of sync.
- **Verified in a real production build** (`next build && next start`)
  via Playwright at desktop (1440px) and mobile (390px): confirmed via
  `getComputedStyle` that `.img-cinematic`'s `filter: contrast(1.04)
  saturate(1.06)` is actually applied (30 image elements sitewide
  carried the class in one homepage render) and that the new overlay
  divs render with correct gradient values. Actual photo content
  couldn't be visually judged in this sandbox (same documented no-
  general-internet-egress limitation as every prior phase — live
  articles all have real `coverImageUrl`s already set, so the
  `.img-placeholder` path specifically wasn't visible in a screenshot
  either, only confirmed structurally/via computed styles) — worth a
  quick visual pass once deployed to a real environment with image
  access.

## Phase 25 — done: cinematic motion and micro-interaction system

Every prior phase explicitly deferred animation ("structure/color/type/
imagery only, no animations yet"). This phase adds the first real motion
across the site — restrained, editorial, and applied through a few
high-leverage shared mechanisms rather than bespoke per-component
effects, so it stays coherent instead of turning into a grab-bag of
one-off transitions. Motion/micro-interactions only — no layout,
typography, color, or component-structure changes.

- **One `@theme` override elevates every existing transition sitewide**:
  `--default-transition-duration` (150ms → 240ms) and `--default-
  transition-timing-function` (→ `cubic-bezier(0.16, 1, 0.3, 1)`, an
  "expo-out" curve common on high-end sites) back every bare
  `transition`/`transition-colors`/`transition-shadow` utility that
  doesn't specify its own `duration-*`/`ease-*`. Nav links, footer
  links, form inputs, badges-with-hover-states — dozens of already-
  existing hover transitions across the codebase all picked up the
  slower, more "expensive"-feeling curve with zero per-component edits,
  the same high-leverage-token pattern used for shadows/colors in
  Phases 22-23. Verified via `getComputedStyle` that a nav link's
  `transitionDuration`/`transitionTimingFunction` actually reflect the
  new values.
- **Hero gets a real cinematic entrance** (`FeaturedSection`, CSS-only —
  no client component/JS needed since it's a one-time on-mount
  animation): the image settles in from a slight zoom-out
  (`heroImageReveal`, `scale(1.06)→scale(1)` + fade, 1.1s), and the
  headline/dek/byline block rises in a beat later (`heroTextReveal`,
  `translateY(16px)→0` + fade, 0.9s, `0.25s` delay) — a layered reveal
  instead of everything appearing at once. Both use `both` fill-mode so
  there's no flash-of-final-state before they start and no snap-back
  after.
- **`ArticleCard`'s `grid` variant gets a refined hover language**:
  the whole card now lifts (`hover:-translate-y-[3px]`) alongside its
  existing shadow deepening (now both riding the bare `transition`
  utility, so they share the new premium timing), the cover image zooms
  subtly (`group-hover:scale-[1.05]`, 600ms, clipped by the card's
  existing `overflow-hidden`), and a press gives tactile feedback
  (`active:scale-[0.99]`). The `list` variant's thumbnail got the same
  zoom treatment (required wrapping it in its own `overflow-hidden` div
  so the ring/shadow don't scale along with the image). The `ranked`
  variant's numeral now deepens color on hover
  (`text-red/30 → text-red/60`) as a secondary hover cue alongside the
  existing headline color change.
- **New `Reveal.tsx` client component**: a thin `IntersectionObserver` +
  CSS-transition wrapper, used once per homepage module (`LatestModule`,
  each `TopicRail`/`OpinionModule`/`PodcastShelf`, `Sidebar`,
  `SubscribeStrip`) — deliberately one reveal per *module*, not per
  card, so scrolling the page doesn't turn into a cascading confetti of
  individual card entrances. Built specifically to avoid a real
  reliability trap: content renders fully visible by default in the
  initial SSR/client paint (this is a news site — nothing should ever
  depend on JS running to become visible), and the hidden-then-reveal
  state only "arms" for a given module once its first
  `IntersectionObserver` callback confirms it's NOT already in the
  viewport at mount — so anything above the fold at load never enters a
  hidden state at all, and there's no flash for the content a visitor
  sees first. Verified this behavior directly: the hero/first-screen
  content measured `opacity: 1` within 200ms of load, and every
  below-fold module correctly transitioned to `opacity: 1` once
  scrolled into view.
- **Button feedback**: every primary red CTA sitewide (`SubscribeForm`'s
  submit — which covers the homepage strip, sidebar, and footer forms
  in one shared component — plus `SiteHeader`, `MobileMenu`, `Sidebar`'s
  "Listen Now", `SiteFooter`, the comment-submit button, contact/login
  submit buttons, and `error.tsx`'s "Try again") gained
  `active:scale-[0.97]` tactile press feedback, riding the same bare
  `transition` utility so it inherits the premium timing. `LikeButton`'s
  heart icon gets a small `scale-110` pop when toggled to the liked
  state, on top of its existing fill-color change.
- **Search overlay's inner panel** gained a quick, understated
  scale+fade entrance (`overlayPop`, `scale(0.97)→1` + `translateY(4px)
  →0`, 0.25s) instead of just appearing — the backdrop's existing
  `fadein` is untouched.
- **`prefers-reduced-motion` needed no new work**: the existing global
  rule in `globals.css` (`* { animation: none !important; transition:
  none !important; }`) already blankets every animation/transition
  added in this phase, old and new alike.
- **Mobile gets the identical treatment** — none of the new motion is
  breakpoint-gated; the same transitions, hero entrance, and reveal
  behavior apply at every viewport size. Touch devices don't have a
  `:hover` state to trigger the card lift/zoom, but the `active:scale`
  press feedback (which touch does trigger) covers the tactile side on
  phones.
- **Verified in a real production build** (`next build && next start`)
  via Playwright: confirmed via `getComputedStyle` that the new
  `@theme` transition defaults are actually applied to existing nav
  links; that hovering a story card produces a measurable box-shadow
  deepening (`0.1`/`6px` blur → `0.18`/`40px` blur), a `-3px` Y
  `translate` (Tailwind v4 emits transforms as native `translate`/
  `scale` CSS properties, not the `transform` shorthand — the initial
  check against `transform` read `none` and looked like a bug until
  re-checked against the actual properties Tailwind v4 sets), and a
  `~1.05` image `scale`; that `Reveal`'s above-the-fold content is
  visible immediately and below-fold modules all reach `opacity: 1`
  after scrolling through the full page. Article cover images
  themselves still didn't load in this sandbox (same documented
  CDN-egress limitation as prior phases).

## Phase 26 — done: premium article template rebuild

The article page had already picked up individual refinements through
Phases 21-25 (tighter `<h1>` tracking, the cinematic image filter/
overlay, motion on its buttons) but was still structurally the original
Phase 1 template: headline-above-image in the normal reading column,
byline as a plain text row, related stories as an unstyled heading +
grid blended into the page background. This phase rebuilds the template
itself around the same full-bleed cinematic hero language the homepage
established, so clicking into an article doesn't feel like a downgrade
from the homepage that led there.

- **Full-bleed cinematic article hero**, structurally identical in
  technique to `FeaturedSection`'s homepage hero — image (or
  `img-placeholder` fallback, so layout never shifts based on whether a
  photo exists) + radial vignette + linear scrim, with category badge,
  `<h1>`, the article's `dek` (previously never shown on the article
  page itself — only used in metadata/card previews), and a byline row
  with an avatar-initial circle, all reused verbatim from
  `FeaturedSection`'s pattern for one consistent "hero" visual language
  sitewide. Sized down from the homepage's 85svh/58-66px headline to a
  52svh/48px cap — the homepage hero is still unambiguously the site's
  largest, most dominant image; this establishes a clear three-tier
  size hierarchy (homepage hero > article hero > card images) instead
  of two article-page images (the old inline cover photo and the
  homepage hero) competing at similar scale. The hero's text block
  reuses the `heroTextReveal` keyframe from Phase 25's motion system.
- **"Back to Home" became a floating chip** over the top-left of the
  hero image (`bg-black/40 backdrop-blur-sm`) instead of a plain text
  link above the headline — saves vertical space and reads as a
  deliberate UI element sitting on the photo, not a leftover breadcrumb.
- **Byline/meta moved into the hero overlay** and gained the homepage's
  exact treatment (avatar-initials circle, bold name, uppercase-tracked
  date/read-time, opacity-muted dot separators) — replacing the old
  plain-text `By Author · Date · ReadTime` row that sat between the
  headline and the image.
- **Reading column simplified**: with headline/badge/byline now in the
  hero, `<article>` starts directly with the prose body — tighter
  relationship between "the image you just saw" and "the story you're
  about to read," per this task's explicit goal, instead of the image
  sitting as a separate block after the headline.
- **`RelatedArticles` redesigned into a tinted "Keep Reading" panel**
  (`bg-[var(--color-bg-off)] rounded-card` — the same differentiated-
  surface treatment `LatestModule` established on the homepage) instead
  of a plain heading blended into the white page background at the
  point where a reader has just finished and is deciding whether to
  leave. Retitled from the generic "You May Also Like" to "Keep
  Reading" — reads as an editorial next-step, not an e-commerce
  recommendation widget.
- **Like button became an action bar**: `bg-off` panel with "Enjoyed
  this story?" beside the button, instead of a bare button floating
  under a hairline rule — reads as a deliberate engagement prompt.
- **Restrained motion applied consistently**: `RelatedArticles` and
  `CommentSection` are now each wrapped in Phase 25's `Reveal`
  component, matching the homepage's one-reveal-per-module pattern;
  `CommentSection`'s heading tracking tightened (`-0.005em` →
  `-0.015em`) to match the sitewide page-heading convention from Phase
  21.
- **`loading.tsx` rebuilt to match**: a full-width hero-shaped skeleton
  block up top (same height/breakpoints as the real hero) instead of
  skeleton rows for a headline that no longer renders in that position.
- **Verified in a real production build** (`next build && next start`)
  via Playwright at desktop (1200px) and mobile (390px), with targeted
  crops of the hero, the "Enjoyed this story?" action bar, and the
  "Keep Reading" panel — confirmed the hero renders with correct
  badge/headline/dek/byline layering and legible white-on-photo text,
  the floating back-button chip, the tinted related-articles panel, and
  that mobile carries the identical hierarchy (hero dominates, body
  copy starts immediately after, comfortably readable). Article cover
  images didn't load in this sandbox (same documented CDN-egress
  limitation as prior phases) but every layout/component change
  verified correctly against the placeholder gradient.

## Phase 27 — done: premium category/archive template rebuild

Category pages were the last template still on the Phase 7-era layout:
a plain `<h1>` + description block, then every story (including the
most recent one) dropped into one uniform 3-column grid of full
`ArticleCard` `grid`-variant cards — a flat archive, not an edited
section. Rebuilt around the same lead+briefs and dense-wire patterns
the homepage and article template already established, so browsing a
category feels continuous with the rest of the site instead of like
falling back to a generic listing page.

- **Category header gained real weight**: a small red-dot "Section"
  kicker above the `<h1>` (matching the dot-kicker language `Featured
  Section`'s "Also Making Headlines" label uses), the title itself
  bumped to `36/50px` with tighter `leading-[0.96] tracking-[-0.02em]`
  (previously `34/46px` at the shared-but-less-aggressive page-h1
  tracking), a story-count readout (`"18 Stories"`) inline with the
  title, and the whole band now sits on a `bg-[var(--color-bg-off)]`
  panel instead of plain white — reads as a distinct section masthead,
  not a caption above a list.
- **New `CategoryLead.tsx`**: the top 4 stories (most recent first) get
  TopicRail's exact lead+briefs treatment — one dominant `grid`-variant
  card plus a tight bordered stack of 3 `list`-variant briefs — reused
  verbatim rather than inventing a category-specific pattern. This is
  the "intentional featured story treatment" this phase's goal called
  for, built from an existing proven component instead of a new one.
- **`ArticleGrid.tsx` rebuilt into a dense wire list** for everything
  after the lead: the same `gap-px` hairline-background grid of
  `list`-variant items `LatestModule` established on the homepage,
  replacing the old 3-column grid of big photo cards. A category with
  dozens of stories now reads as a browsable wire instead of an
  endless scroll of equal-weight image cards — directly the "denser,
  more editorial" layout this phase asked for. Retitled from the
  generic `"N Stories"` (that job moved to the header's story-count
  readout) to `"More Stories"`.
- **No duplicate stories**: `page.tsx` slices `categoryArticles` once —
  `[0,4)` for `CategoryLead`, `[4,)` for `ArticleGrid` — the same
  slug-exclusion-by-slicing pattern used everywhere else on the site
  that has a lead+rest split.
- **Empty states differentiated**: a category with zero stories shows
  one clear message in place of the whole lead+grid+sidebar layout; a
  category with 1-4 stories (lead-only, nothing left for the wire list)
  shows `ArticleGrid`'s own "no more stories" message rather than
  displaying an empty grid shell.
- **Motion applied consistently**: the `ArticleGrid` + `Sidebar` row is
  wrapped in Phase 25's `Reveal` component, matching the one-reveal-
  per-module pattern used on the homepage and article page; the header
  and `CategoryLead` (both typically above the fold) are left
  unwrapped, same as the homepage's own hero not being Reveal-wrapped.
- **`loading.tsx` rebuilt to match** the new three-part structure
  (header skeleton → lead+briefs skeleton → wire-list+sidebar skeleton)
  instead of skeleton rows shaped for the old flat grid.
- **Verified in a real production build** (`next build && next start`)
  via Playwright full-page screenshots at desktop (1440px) and mobile
  (390px) on a real category with 18 stories — confirmed the section
  kicker/title/count header, the lead+briefs block, and the dense
  wire-list all render correctly and that mobile is dense and browsable
  with no wasted space. Article cover images didn't load in this
  sandbox (same documented CDN-egress limitation as prior phases) but
  every layout/component change verified correctly against the
  placeholder blocks.

## Phase 28 — done: dedicated premium Subscribe / membership page

The site's only subscribe experience was a compact inline strip
(`SubscribeStrip`, anchored at `/#subscribe`) and a sidebar box — both
functional, but neither gave the newsletter a real front door. New
`/subscribe` route: a full landing page built from the same design
language as the homepage/article/category rebuilds, using the site's
actual (free, email-only) subscribe mechanism — no fabricated paid
tiers or billing UI, since there's no payment infrastructure in this
codebase to back one. The "membership"/"plan" framing the task asked
for is applied to that real free product rather than inventing a fake
paid flow that would silently do nothing.

- **Cinematic header**: full-width navy-gradient band (`from-navy to-
  navy-dark`, matching `SiteHeader`/`SiteFooter`'s established gradient
  treatment) with a subtle red radial glow, a "Membership · Free"
  badge, a homepage-hero-scale headline (`38/56/64px`), a direct-tone
  value-prop subhead, and a CTA that anchor-scrolls to the join card
  below (`scroll-mt-20` on the target section, consistent with the
  site's sticky-nav-aware anchor pattern).
- **"What You Get" benefit grid**: 4 cards (Breaking News First, Deep
  Investigations, Zero Corporate Spin, Built By Florida For Everyone),
  each a `rounded-card`/`shadow-card` panel with a `lucide-react` icon
  in a tinted red circle — same card language as every other panel
  sitewide, first use of icon-in-circle treatment on the public site.
- **"Why it matters" pull-quote band**: a `bg-off` panel with a
  large `border-l-4` red-rule statement, reusing the article page's
  blockquote visual language for a direct, high-authority editorial
  statement rather than soft "join our community" copy.
- **Single "Free Access" plan card**: a navy-gradient header (Membership
  badge + plan name + price line) atop a white body with a checkmark
  "what's included" list (same check-bullet pattern `SubscribeStrip`
  established) and the real, working `SubscribeForm` (`stacked`
  variant) — the page's one actual conversion point. Deliberately only
  one form on the page (the hero and FAQ don't duplicate it) since
  `SubscribeForm`'s non-compact variant uses a static `id="email-input"`
  — a second instance on the same page would've been a real duplicate-ID
  bug, not just a style nit.
- **FAQ section**: 4 direct, no-corporate-hedging Q&As (Is this really
  free? / How often will I hear from you? / Do you sell my email? / Can
  I unsubscribe anytime?) in a plain `dl`, no accordion/JS — matches the
  task's "without clutter" instruction and keeps the page fully
  functional with zero client-side state beyond the form itself.
- **Restrained motion applied consistently**: hero text uses the
  `heroTextReveal` keyframe from Phase 25; every section below it is
  wrapped in `Reveal`, one per section — same pattern as every other
  premium template.
- **Sitewide Subscribe CTAs repointed**: `SiteHeader`'s nav button,
  `MobileMenu`'s drawer button, and `SiteFooter`'s link all changed
  from `#subscribe`/`/#subscribe` anchors to `/subscribe` — the new
  page is now the primary conversion destination reached from anywhere
  on the site. `SiteHeader`'s button changed from a plain `<a>` to
  `next/link`'s `Link` for consistency with the rest of its nav.
  `SubscribeStrip` (the homepage's inline strip) and `Sidebar`'s compact
  box were deliberately left as-is — both already have their own
  working inline forms and remain useful low-friction conversion points
  in their own contexts.
- **Verified in a real production build** (`next build && next start`)
  via Playwright at desktop (1200px) and mobile (390px). One real
  finding during verification: a `fullPage` screenshot taken immediately
  on load showed a large blank gap where the "why it matters" panel,
  plan card, and FAQ should be — investigated via `getComputedStyle`
  (confirmed `opacity: 1` on those sections after a normal page load)
  and a second screenshot taken after scrolling through the page in
  steps (matching how a real visitor scrolls) showed every section
  rendering correctly. This was a `fullPage`-capture-vs-
  `IntersectionObserver` timing artifact in the screenshot tooling
  itself, not a site bug — consistent with the reveal-on-scroll
  behavior `Reveal` was built for in Phase 25.

## Phase 29 — done: Subscribe page design refinement

A follow-up design pass on Phase 28's `/subscribe` page, aimed
specifically at the things that read as "template" rather than
"cinematic": the hero was padding-driven instead of height-driven, every
section used the same generous spacing as the very first draft, and the
plan section had only one card with nothing to compare it against.
Design/structure only — same components, same tokens, same copy voice.

- **Hero became genuinely height-driven, not padding-driven**: `flex
  min-h-[440px] h-[56svh] sm:h-[54vh] sm:max-h-[540px] items-center
  justify-center` replaces the old `py-16 sm:py-24` block — the same
  technique the homepage/article heroes use (a tall band with centered
  content) rather than "text with some padding around it." Gained a
  second layered overlay: a radial vignette
  (`transparent_40%→rgba(0,0,0,0.35)_100%`) under the existing red glow,
  matching the vignette+scrim layering `FeaturedSection` and the article
  hero both use, for real cinematic depth instead of a flat gradient
  fill.
- **Section rhythm tightened sitewide on the page**: every section's
  `py-14 sm:py-16` (and the plan section's `py-16 sm:py-20`) dropped to
  `py-10 sm:py-12`(–`14`) — brings the page in line with the density
  standard the rest of the site established, rather than reading as a
  separately-paced "marketing page."
- **Plan section rebuilt into a real two-card comparison**: "Free
  Access" (active, dominant — navy-gradient header, red checkmarks, the
  real working `SubscribeForm`) sits beside a new "Founding Supporter"
  card (`border-dashed`, `bg-off`, muted gray checkmarks, a "Coming
  Soon" badge) at an asymmetric `1.15fr/1fr` width split — the same
  dominant-plus-secondary proportion `TopicRail`/`CategoryLead` use
  elsewhere, rather than two equal-weight boxes. The second card is
  **informational only** — a static "Not Yet Available" pill, not a
  button — since there's no billing infrastructure in this codebase to
  back a real founding-tier purchase; a clickable button that silently
  did nothing would have been worse than no second card at all. This is
  what gives the page real plan-selection hierarchy while staying
  honest about what's actually available today.
- **Verified in a real production build** (`next build && next start`)
  via Playwright at desktop (1200px) and mobile (390px), this time
  scrolling through the page in incremental steps before each
  screenshot (learned from Phase 28's `fullPage`-vs-`IntersectionObserver`
  timing artifact) — confirmed the taller vignetted hero, the tightened
  section spacing, and the two-card plan comparison (including the
  dashed/muted "Coming Soon" card reading as clearly secondary to Free
  Access) all render correctly, and that mobile stacks both plan cards
  with strong vertical rhythm and no wasted space.

## Phase 30 — done: premium Contact page rebuild

Contact was the last simple utility page still on the Phase 1 layout —
a bare `<h1>` + one-line dek + a plain-bordered form, no distinct way to
reach the team beyond scrolling to the form's Email field. Design and
structure only — the form itself is still presentation-only (see below,
unchanged from before this phase).

- **Header gained the same kicker treatment** as the category/subscribe
  pages (small red dot + uppercase tracked label, "Get In Touch") above
  the existing shared page-`<h1>` pattern — consistent hierarchy
  language instead of a bare title.
- **Direct email now has its own prominent, tappable element**: a
  `mailto:rocci@stuccimedia.com` card (icon-in-circle + label + large
  bold email text, `rounded-card`/`shadow-card`/hover-lift, `min-h-11`)
  sitting between the header and the form — previously the email only
  existed as a form field's placeholder context, not a real standalone
  contact method. A "— Or Send A Message —" divider separates it from
  the form so both paths (direct email vs. form) read as distinct,
  deliberate options rather than one blurring into the other.
- **Form fields refined to match the sitewide input language**:
  `focus:border-[var(--color-navy)]` + `transition-colors` added to
  match `SubscribeForm`/`AuthForm`/`SearchClient`'s already-established
  focus treatment (previously this form had no focus state at all);
  labels tightened from `tracking-wide` to the sitewide `tracking-
  [0.04em]` convention; every field/button confirmed at the `min-h-11`
  touch-target floor.
- **Supporting line updated** to explicitly name media inquiries
  alongside tips/corrections/questions, per this task's requirement.
- **Density tightened**: `pt-10 pb-20` → `pt-8 sm:pt-10 pb-16 sm:pb-20`.
- **Form submission is unchanged and still presentation-only** — the
  `<form>` has no `action`/handler, same as before this phase (the
  pre-existing code comment noting "wired to real email delivery in a
  later phase" is preserved verbatim). This phase was scoped to design/
  structure; wiring real form-to-email delivery would need a mail
  provider decision this task didn't ask for, so it wasn't added
  silently.
- **Verified in a real production build** (`next build && next start`)
  via Playwright at desktop (900px) and mobile (390px) — confirmed the
  kicker/header hierarchy, the prominent clickable email card, the
  refined form fields, and that mobile keeps both the email card and
  every form field comfortably tappable with tight, clean spacing.

## Phase 31 — done: sitewide SEO upgrade

A technical/on-page SEO pass across the whole site. The headline finding:
Phase 9 built a full per-article SEO panel (`seoTitle`, `seoDescription`,
`seoKeywords`, `ogImage`, `canonicalUrl`) and Phase 13 hand-backfilled
all 89 articles with scores averaging 99/100 — but the article page's
actual `generateMetadata()` never read any of those fields. The data
existed, scored well, and did nothing. No `robots.txt` or sitemap
existed at all, and there was zero structured data anywhere on the
site. No design/layout changes in this phase — purely metadata,
structured data, and two new route files.

- **Article page `generateMetadata()` now actually uses the SEO panel's
  fields**: `seoTitle`/`seoDescription`/`ogImage`/`canonicalUrl` are
  preferred over the raw `headline`/`dek`/`coverImageUrl`, falling back
  to those for the rare article without them set. Verified directly:
  an article's rendered `<title>` now differs from its on-page `<h1>`
  text specifically because the hand-tuned `seoTitle` is the one
  actually rendering.
- **Real bug fixed**: `openGraph.publishedTime` was set to
  `article.date` — the human-formatted display string ("July 10,
  2026"), not valid ISO 8601, which OpenGraph's spec requires. Switched
  to `article.publishedAt` (the raw ISO timestamp already on the
  `Article` type, previously unused for this purpose).
- **`alternates.canonical` added** to every page with a `metadata`
  export: homepage (in the root layout), article pages (respecting a
  per-article custom `canonicalUrl` override, falling back to the
  article's own URL), category pages, about, contact, subscribe,
  privacy, search, login, register.
- **`app/robots.ts` and `app/sitemap.ts`** (neither existed before):
  robots.txt disallows only `/admin/` and `/api/` (the genuinely
  private/functional paths) and points to the sitemap; the sitemap is
  fully dynamic — every published article, every category, and the
  handful of static pages, pulled live from the same `getPublishedArticles
  `/`getCategories` functions the rest of the site uses, so it can
  never drift out of sync with what's actually live. Verified the
  generated sitemap contains 101 URLs (89 articles + 7 categories + 5
  static pages) matching the live DB.
- **`noindex` added to non-editorial pages** (`search`, `login`,
  `register`) via `robots: { index: false, follow: true }` — query-
  string search results are inherently thin/duplicate content, and
  auth pages have no content worth ranking; `follow: true` keeps link
  equity flowing rather than dead-ending crawlers. Each still has its
  own real `alternates.canonical` pointing at itself (not just
  inheriting the homepage's), since canonical/robots are independent
  signals even though `noindex` makes the canonical moot for these
  specific pages.
- **Structured data (JSON-LD) added, none existed before**:
  `NewsMediaOrganization` schema sitewide (root `layout.tsx`, present
  on every page); `NewsArticle` schema (headline, description, image,
  `datePublished`/`dateModified` from the real `publishedAt`, author,
  publisher) plus `BreadcrumbList` (Home → Category → Article) on every
  article page; `BreadcrumbList` (Home → Category) on every category
  page. Verified via a real rendered page that all three schema types
  parse correctly as JSON and carry real data, not placeholders.
- **Heading hierarchy and alt-text audited, not changed**: every
  template already has exactly one `<h1>` (verified via a live DOM
  query on the homepage, an article page, and a category page — each
  returned `h1s: 1`), and every real content `<img>` sitewide already
  uses a dynamic, descriptive `alt` (the article/card headline) rather
  than empty or generic text — both were already correct from Phase 4
  (rich body rendering) and Phase 9 (Tiptap editor) onward, so nothing
  needed to change here; confirmed rather than assumed.
- **Scoped out, noted rather than silently done**: migrating `<img>` to
  `next/image` sitewide (a real performance lever, but a much larger
  architectural change — remote-pattern config, layout implications
  across every image consumer — than this pass's "clean, modern SEO
  practices" scope implied) and wiring the Contact form to real email
  delivery (a backend/provider decision, not an SEO one). Both are
  reasonable follow-ups, not silently attempted here.
- **Verified in a real production build** (`next build && next start`):
  `/robots.txt` and `/sitemap.xml` both registered as real routes and
  returned correct live content via `curl`; a live article page's
  rendered `<head>` was checked directly (canonical, title/description
  sourced from the SEO fields, `og:image` resolving to the real hosted
  Blob URL, exactly one `<h1>`, and all three JSON-LD `@type`s present)
  as were the homepage, a category page, the search page, and the
  login page (confirming `noindex` renders correctly where expected and
  not where it shouldn't).

## Phase 32 — done: visible Sign In / Register entry points in site chrome

`/login` and `/register` existed and worked (Better Auth, Phase 7) but
were reachable only by typing the URL directly — no link to either
appeared anywhere in the site's normal navigation, only "Subscribe"
(the unrelated newsletter opt-in). A real user hit this directly: they
had an account to register but had to know the URL.

- **Desktop header** (`SiteHeader.tsx`): a `User` icon linking to
  `/login` (added first, as a narrower fix) plus a small text "Register"
  link next to it, both left of the existing red Subscribe button, both
  `sm:` and up only (mirrors the existing nav's desktop/mobile split).
- **Mobile drawer** (`MobileMenu.tsx`): below the existing full-width red
  Subscribe button, a single "Sign In / Register" line (two links
  separated by a `/`) rather than two separate rows, so the drawer's
  footer doesn't grow taller than it needs to for two closely-related,
  low-frequency actions.
- **Verified in a real production build** (`next build && next start`)
  via Playwright screenshots of the desktop header (confirming the
  Search/Sign In/Register/Subscribe cluster renders correctly) and the
  opened mobile drawer (confirming the stacked Subscribe button +
  Sign In / Register line). Home page images didn't load in this sandbox
  (same documented CDN-egress limitation as Phase 11/15/16) — layout-only
  concern, unaffected by that.

## Phase 33 — done: NewsArticle/Organization structured-data correctness pass

Phase 31 already added `NewsArticle`/`BreadcrumbList` JSON-LD to article
pages and a sitewide organization schema — this phase audited that
existing markup against Google's actual structured-data requirements and
fixed two real correctness gaps rather than re-adding what already
worked. No new templates needed: `app/articles/[slug]/page.tsx` is still
the only route that renders an article, so it was the only place
`NewsArticle` schema could live.

- **Real bug fixed: `dateModified` was hardcoded to the same value as
  `datePublished`** — every article's structured data claimed it had
  never been edited since publish, which is false for any article
  touched after its initial publish (recategorized, SEO-backfilled,
  etc. — see Phases 13/14). `Article.updatedAt` (Prisma's `@updatedAt`
  column, already tracked in the DB, just never surfaced past
  `articles.ts`) was added to the `Article` TS type and `mapRow()`, and
  the schema's `dateModified` now reads the real last-edit timestamp.
  Verified against a live article: `datePublished` (2026-07-10, its
  original publish date) and `dateModified` (2026-08-07, its last
  actual edit) now correctly differ.
- **Real bug fixed: `mainEntityOfPage` ignored the per-article
  `canonicalUrl` override** — `generateMetadata()`'s `alternates.canonical`
  already preferred a custom `canonicalUrl` when an editor sets one via
  the SEO panel, but the structured data's `mainEntityOfPage.@id` always
  used the raw slug URL regardless, which would have put two different
  "this page's real URL" signals in front of Google for any article
  using that override. `mainEntityOfPage` now resolves through the same
  `article.canonicalUrl || <slug URL>` fallback. No live article
  currently sets a custom `canonicalUrl` (confirmed via a live DB
  query), so this doesn't change today's rendered output — it closes a
  latent inconsistency for the next time an editor uses that field.
- **`publisher.name` confirmed exactly `"Stucci Media"`** (schema-valid
  string, not nested unnecessarily) with a `publisher.logo` `ImageObject`
  pointing at `/og-default.png` — the only existing raster brand image
  in the codebase (1200×630 PNG, well above Google's 112×112 minimum).
  No dedicated square logo asset exists in `public/` (the wordmark is
  CSS/font text, not an image — see `SiteHeader.tsx`), and Google's
  Organization-logo guidance explicitly requires a raster format (no
  SVG), so generating a new logo image was out of scope for a
  structured-data-correctness pass — reusing the existing valid PNG was
  the honest choice over fabricating a new brand asset unreviewed.
- **Organization schema's `@type` widened to `["Organization",
  "NewsMediaOrganization"]`** (was `NewsMediaOrganization` alone) —
  both are valid on one JSON-LD object; this satisfies a literal
  `"Organization"` type check while keeping the news-specific subtype
  Google's news features prefer. `sameAs` still lists only the one real,
  verifiable social profile already linked elsewhere on the site
  (`SiteFooter`'s Facebook icon) — no other social profiles exist in
  the codebase to add, and fabricating one would make the schema
  factually wrong rather than more complete.
- **Verified in a real production build** (`next build && next start`)
  via a headless-browser DOM read (not raw HTML/curl, which only shows
  the pre-hydration streaming shell) of a live article page and a
  category page: confirmed all three script tags
  (`Organization`+`NewsMediaOrganization`, `NewsArticle`,
  `BreadcrumbList`) parse as valid JSON, every required `NewsArticle`
  field (`headline`, `description`, `image`, `datePublished`,
  `dateModified`, `author`, `publisher`, `mainEntityOfPage`) is present
  and matches the visibly rendered headline/dek/image/byline/date on
  the same page, and category pages correctly carry only
  `Organization`/`BreadcrumbList` (no `NewsArticle`, since a category
  page isn't an article). No design, layout, or performance changes —
  this was a data-correctness pass on existing `<script type=
  "application/ld+json">` tags only.

## Phase 34 — done: meta title/description upgrade (homepage + categories + contact)

A follow-up content pass on top of Phase 31 (technical SEO plumbing) and
Phase 33 (schema correctness) — this phase is the actual copywriting:
tightening the homepage's title/description to the brand's exact wording
and upgrading the 7 category descriptions, which were originally
one-liners under 65 characters (well short of a real meta description)
that also double as the visible on-page dek under each category `<h1>`.

- **Homepage title changed to the exact brand format**: `"Stucci Media —
  Independent News That Matters"` → `"Stucci Media | Independent News
  That Matters"` (pipe, brand-first — matches the exact title every
  other page's `%s | Stucci Media` template already produces, so the
  homepage's one hardcoded `default` title now reads consistently with
  every generated one).
- **Homepage description rewritten** to name the actual coverage areas
  (politics, world events, crime, veterans, social issues, free speech)
  instead of the previous generic "news, analysis, and podcasts" line —
  155 characters, in the sweet spot for a full, un-truncated SERP
  snippet. Since `layout.tsx`'s `description` constant also backs the
  sitewide `Organization` schema's `description` field, this one change
  updates both the `<meta name="description">` tag and the JSON-LD in
  the same place — verified the rendered Organization schema picked up
  the new copy automatically.
- **All 7 category descriptions rewritten**, ~104–145 characters each
  (up from the original ~43–61-character one-liners) — real, distinct
  meta descriptions per category rather than a sentence fragment, still
  in the site's direct/no-corporate-spin voice and free of keyword
  stuffing. These aren't just `<meta>` copy: `category.description` is
  the same string rendered as the visible dek paragraph under each
  category page's `<h1>` (`app/category/[slug]/page.tsx`), so the
  richer copy is a real on-page content improvement, not just an
  invisible SEO tag — confirmed the meta description and the visible
  page text stay identical by construction, one field.
  `scripts/seed-categories.mjs` (the documented source of truth for
  category seed data) was updated to match and re-run against the live
  DB via `node --env-file=.env.local scripts/seed-categories.mjs` — safe
  to re-run, upserts by slug.
- **Verified brand-name correctness sitewide**: queried the live DB for
  "Rocci Stucci Media" (the incorrect variant) across every article's
  headline/dek/`seoTitle`/`seoDescription` and found zero matches — the
  brand name was already correct everywhere from prior phases, confirmed
  rather than assumed for this pass.
- **Article title format confirmed already correct, no code change
  needed**: `generateMetadata()` sets `title: article.seoTitle ||
  article.headline` as a plain string, which flows through the root
  layout's `"%s | Stucci Media"` template automatically — verified
  against a live article that the rendered `<title>` is exactly
  `"{headline} | Stucci Media"` with no double-branding (confirmed none
  of the 89 articles' stored `seoTitle` values already contain "Stucci
  Media", which would have produced a duplicate suffix).
- **Contact page gained an explicit `openGraph` block** (title +
  description + image) — it previously had none, silently inheriting
  the homepage's OG tags from the root layout on share, which would have
  shown the wrong title/description if the page were ever shared
  directly.
- **NewsArticle and Organization schema themselves were not re-touched**
  in this phase — Phase 33 already fixed their correctness (real
  `dateModified`, `mainEntityOfPage` matching canonical, `publisher.name`
  exactly `"Stucci Media"`, `Organization`+`NewsMediaOrganization`
  `@type`) and this phase's DB verification confirmed nothing had
  regressed since.
- **Verified in a real production build** (`next build && next start`):
  fetched the homepage, a category page, the contact page, the about
  page, and a live article directly and confirmed every rendered
  `<title>` and `<meta name="description">` matches this phase's exact
  copy, with no double-branding or truncation issues.

## Phase 35 — done: "Our Network" sister-site links in the footer

`SiteFooter.tsx`'s right column (Sections, Company — see Phase 20's
two-column rebuild) gained a third small labeled group linking to the
two sister sites under the same ownership, Stucci Marketing Group and
Stucci Apparel.

- **Reuses the exact Sections/Company block pattern** — same `h4`
  label style (`10.5px` uppercase, `white/50`), same link size/color/
  hover-transition — rather than a bordered "sponsor" box, a different
  background tint, or anything else that would read as a paid ad
  placement sitting in the footer. This was the explicit goal: it
  should feel like a natural continuation of the footer's own nav, not
  an inserted promotion.
- **A small `ArrowUpRight` icon** (lucide-react, already the site's
  icon library — see `SiteHeader.tsx`) sits after each link instead of
  a fabricated sister-site logo — there's no real logo asset for either
  external brand in this codebase, and inventing one un-reviewed would
  have been worse than a clean, understated external-link affordance
  that still signals "this leaves the site" without adding visual
  clutter.
- **Both links are real external URLs** (`https://stuccimarketing.com`,
  `https://stucciapparel.com`) with `target="_blank"` +
  `rel="noopener noreferrer"`, matching how the existing Facebook social
  icon link is handled.
- **Mobile unaffected structurally** — this is the third group in the
  same already-mobile-first-stacking right column, so it wraps/stacks
  exactly like Sections and Company do at every breakpoint; no new
  responsive logic was needed.
- **Verified in a real production build** (`next build && next start`)
  via Playwright screenshots of the footer at desktop (1440px) and
  mobile (390px) — confirmed the new "Our Network" group sits cleanly
  below Company with identical typography/spacing rhythm, the arrow
  icons render without crowding the link text, and mobile stays fully
  readable with normal touch targets.

## Phase 36 — done: Banner Management system

A lightweight promotional-banner manager, fully admin-controlled — new
`Banner` model/table, a full `/admin/banners` CRUD screen, and 3 fixed
public-site placement slots. Deliberately not an ad server: no bidding,
no impression/click tracking, no external ad-network integration — just
upload an image, set a link, and choose where/when it shows.

- **Data model**: `Banner` (`prisma/schema.prisma`, migration
  `20260808000000_banners`) — `imageUrl`, `destinationUrl`, `placement`
  (a closed `BannerPlacement` enum: `HOMEPAGE`/`ARTICLE`/`CATEGORY`,
  matching the 3 real frontend slots one-for-one so an admin can't
  invent a placement nothing on the site renders), `isActive`, optional
  `startDate`/`endDate`, `sortOrder`, plus `name` (internal-only,
  optional) for organization. `app/lib/banners.ts` holds the CRUD plus
  the one query the public site actually uses,
  `getActiveBanners(placement)` — active, within its optional date
  window (`OR`ed null-or-in-range on both bounds independently), ordered
  by `sortOrder` then `createdAt`.
- **Real bug caught and fixed before shipping**: `BannerDialog.tsx` (a
  `"use client"` component) originally did a *value* import of
  `BANNER_PLACEMENT_LABELS` from `lib/banners.ts` — which also imports
  the Prisma client at module scope. A value import (unlike `import
  type`) pulls the whole module into the client bundle, so Prisma's
  `DATABASE_URL` check ran in the browser and threw
  `DATABASE_URL is not set` on every admin page load, since the browser
  obviously has no access to that server env var. Fixed by splitting the
  placement enum/labels into their own dependency-free
  `app/lib/banner-placements.ts` that both the server module and client
  components import from — `lib/banners.ts` still re-exports both for
  server-side callers, but client components now import the label map
  directly from the Prisma-free file. Caught via a live browser console
  check during verification, not by code review alone — worth remembering
  for any future shared lib that mixes a Prisma import with constants a
  client component might want.
- **Admin screen** (`app/admin/banners/`): follows the exact Phase 8/9
  patterns rather than inventing new ones — `BannersClient.tsx` (table +
  placement filter + `useOptimistic` active-toggle and delete, same shape
  as the Categories/Articles list screens), `BannerDialog.tsx` (create/
  edit form reusing `ImageField` verbatim from the article editor for
  the image upload, plus a placement `Select`, `datetime-local` start/
  end date inputs matching the article editor's published-date picker,
  and a `sortOrder` number field), `actions.ts` (server actions gated by
  the existing `requireAdminSession()` + `logActivity()` pattern every
  other admin mutation uses). Added "Banners" to
  `admin/components/nav-items.ts` between Categories and Comments.
- **Frontend slot component** (`app/components/BannerSlot.tsx`): an
  async server component that queries `getActiveBanners(placement)` and
  returns `null` — zero DOM output, not just an empty styled box — when
  there's nothing active for that slot, so an inactive/expired campaign
  never leaves a blank placeholder in the layout. Multiple active
  banners in one slot are simply stacked in the admin's `sortOrder`,
  each its own card — no rotation widget/timer, matching this feature's
  explicit "no complex ad server" scope. Each banner gets a small
  "Advertisement" label above it (muted, matches the site's existing
  metadata-text styling) for honest sponsored-content disclosure, and
  the whole card is `rounded-card`/`shadow-card` with a hover-shadow
  lift, the same elevated-card language as `ArticleCard`. Internal
  destinations (`/...`) navigate via `next/link`; anything else opens in
  a new tab (`rel="noopener noreferrer sponsored"`), matching how
  `SiteFooter`'s external network links are already handled.
- **3 fixed placements wired into their real pages**: `page.tsx` gets a
  `HOMEPAGE` slot between `LatestModule` and the category-rail stack
  (genuinely mid-content, not just "somewhere on the homepage");
  `category/[slug]/page.tsx` gets a `CATEGORY` slot directly below the
  section masthead, above `CategoryLead`; `articles/[slug]/page.tsx`
  gets an `ARTICLE` slot spliced into the actual prose body, not just
  appended after it.
- **Real mid-article splitting, not an approximation**: the article
  page's body is raw sanitized HTML rendered via
  `dangerouslySetInnerHTML`, so "mid-article" needed an actual split of
  that HTML string, not just a slot placed after the whole block. New
  `app/lib/split-html-midpoint.ts` is a small hand-rolled depth-tracking
  tag scanner (no new dependency, no real HTML parser) — deliberately
  sized to `sanitize.ts`'s existing small fixed tag allowlist (`p`,
  `h2-h4`, `ul`/`ol`/`li`, `blockquote`, `img`, `hr`, plus inline `b`/
  `strong`/`i`/`em`/`a`/`br`), tracking nesting depth so it only
  considers *top-level* block boundaries (never splits inside a `<ul>`
  or mid-paragraph) and correctly treats void tags (`img`/`br`/`hr`) as
  atomic. Picks the boundary closest to the string's midpoint; articles
  with fewer than 2 top-level blocks render as one uninterrupted body
  with no mid-article banner, since there's no real "middle" to split at.
  Verified directly: splitting a synthetic mixed-tag-type document
  (paragraphs, a heading, a list, inline bold/links, an inline `<img>`)
  produced two valid HTML fragments whose concatenation exactly
  reconstructed the original string, split at a real block boundary.
- **Verified end-to-end against the live Neon DB and a real production
  build** (`next build && next start`), not just code-reviewed: inserted
  4 real test banner rows (3 active across all 3 placements, 1 inactive)
  directly, confirmed via Playwright that all 3 public slots render the
  correct banner and the inactive one renders nothing anywhere, then
  created a throwaway admin account (registered via the real `/register`
  flow, promoted via `promote-admin.mjs`, same pattern as every prior
  phase's admin verification) and drove the actual `/admin/banners` UI
  through edit → active-toggle → delete, confirming each round-tripped
  correctly against the DB and the optimistic UI matched the server
  result. The one step not exercised through the browser was a fresh
  image upload itself — this sandbox has no `BLOB_READ_WRITE_TOKEN` set
  (an environment limitation, not a code issue), so `ImageField`'s
  upload call fails here the same way it would for any admin form; the
  component is reused byte-for-byte from the article editor's
  already-shipped, already-verified upload path, so this wasn't a new
  risk. The test admin account, its sessions (cascade-deleted with the
  user), all 4 test banner rows, and their activity-log entries were all
  removed afterward — nothing test-related was left in the database.

## Phase 37 — done: full CMS control pass (nav, tags, scheduling, preview, media library, redirects)

A broad admin-control upgrade covering everything short of a developer
that was still missing: real nav management, scheduled publishing that
actually hides content until its date, a genuine draft preview, tags, a
media library, and simple redirects. The article editor's image upload/
insert, meta title/description, share image, and slug editing already
existed from Phases 9/13/31 and weren't rebuilt — this phase closed the
remaining real gaps.

- **The site's main nav is no longer a hardcoded list** —
  `SiteHeader.tsx`'s `NAV_LINKS` array and `MobileMenu.tsx`'s duplicate
  copy (both manually kept in sync with the category table since Phase 1,
  per the old CLAUDE.md warning under "Categories") are gone. `Category`
  gained `showInNav`/`navOrder`/`shareImage`; `getNavCategories()`
  (`lib/categories.ts`) is the one query the nav now reads from
  everywhere. **Real architecture change to make this possible**:
  `SiteHeader.tsx` became an async server component that fetches nav
  categories and renders a new `SiteHeaderClient.tsx` (the old client
  logic, unchanged) with them as a prop — every existing `<SiteHeader
  />` call site across the whole site needed zero changes. `MobileMenu`
  and `SiteFooter` (which already fetched categories for its Sections
  list) both take/use the same nav-filtered set now, so a category
  hidden from nav is consistently hidden everywhere, not just the top bar.
  **Real regression caught before shipping**: all 7 existing categories
  would have defaulted to `navOrder: 0`, silently reordering the nav
  alphabetically instead of the original curated order — fixed by
  backfilling explicit `navOrder` values (0–6, matching the old hardcoded
  array exactly) via `scripts/seed-categories.mjs`, verified against a
  live homepage fetch that nav order was byte-identical to before this
  phase.
- **Scheduled publishing now actually works**: `status: PUBLISHED` alone
  used to make an article live immediately regardless of its
  `publishedAt` date. Every public read in `lib/articles.ts`
  (`getPublishedArticles`, `getFeaturedArticles`, `getArticleBySlug`,
  `getRelatedArticles`, `getArticlesByCategory` — and by extension
  `sitemap.ts`/`search`, which both call `getPublishedArticles`) now
  filters through a shared `publishedWhere()` helper requiring
  `publishedAt <= now`. A derived (not stored) `Article.isScheduled`
  flag drives a "Scheduled — hidden until {date}" notice in the editor
  and a `Scheduled` badge in the admin articles list. Verified live: set
  a real article's `publishedAt` a month out, confirmed the public URL
  immediately started rendering the site's actual 404 page while the
  admin/preview views still showed it fine, then reverted.
- **Real draft/scheduled preview**: `/preview/articles/[id]`
  (deliberately outside `/admin` so it renders the real public site
  chrome — `BreakingBar`/`SiteHeader`/`SiteFooter` — instead of the
  dashboard shell), gated by `requireAdminSession()` directly since it's
  not covered by `admin/layout.tsx`'s protection. Reuses the real
  article hero/prose markup so it's a faithful preview, with a "Draft
  preview — not visible to the public" banner and a link back to the
  editor. `ArticleEditor`'s Publish card gained a Preview button
  (disabled for a not-yet-created article, since there's no id to
  preview).
- **Tags**: `Article.tags` (native Postgres `text[]`, no join table —
  this is lightweight and editorial-only, categories already own real
  taxonomy). Admin enters comma-separated tags with or without `#`;
  `admin/articles/actions.ts`'s `parseTags()` normalizes, dedupes, and
  caps at 15. Rendered as clickable `#tag` chips at the end of the
  article body (both the real article page and the preview), linking to
  `/search?q=tag` — `SearchClient.tsx`'s filter was extended to match
  tags, not just headline/dek/category, so clicking one actually
  surfaces results.
- **Media Library** (`/admin/media`): new `MediaAsset` table, indexed
  automatically — `ImageField.tsx` (the one upload component already
  shared by article covers, OG images, category share images, and
  banners) fires a small fire-and-forget `recordMediaAssetAction()` call
  right after every successful Vercel Blob upload. This is deliberately
  client-side, not Blob's own `onUploadCompleted` webhook (already
  wired in `api/admin/upload/route.ts` but a no-op) — that webhook only
  fires against a real deployed environment, never a local dev server,
  so it would have made the library silently empty in this sandbox and
  unreliable to test. The library page itself also has its own direct
  upload button for adding an image with no specific field in mind.
  Delete removes both the Blob object (`@vercel/blob`'s `del()`) and the
  index row — a real deletion of the library's own file, not just
  hiding a link to it.
- **Redirects** (`/admin/redirects`): new `Redirect` model
  (`fromPath`/`toPath`/`statusCode`/`isActive`), resolved by a new
  catch-all `app/[...path]/page.tsx` — Next.js only reaches a catch-all
  after every real static and dynamic route has already failed to
  match, which is exactly the right moment to check for a configured
  redirect, and (unlike `proxy.ts`'s edge middleware) a normal server
  component can actually reach Postgres. **Deliberately only offers
  307/308 status codes, not the full 301/302/307/308 set** — Next.js's
  App Router `redirect()`/`permanentRedirect()` can only ever produce
  those two real behaviors under the hood; offering 301/302 in the admin
  UI would have been a label lying about the actual HTTP response.
  Verified live: created a redirect from a fake old path to a real
  article, confirmed `curl` followed it with a real `308` and the
  correct `Location`, and confirmed a genuinely nonexistent path still
  cleanly 404s.
- **Basic post performance**: `incrementArticleViewCount()` fires
  fire-and-forget from the real article page on every view (never
  awaited, so a slow write can't delay rendering) — `Article.viewCount`
  existed since Phase 7 but was never actually incremented anywhere
  until now. The admin articles list gained a right-aligned Views
  column. Verified live: view count incremented by exactly 1 per page
  fetch.
- **Verified end-to-end against the live Neon DB and a real production
  build**, not just code-reviewed: a throwaway admin account (registered
  via the real `/api/auth/sign-up/email` endpoint directly — the
  Playwright-driven `/register` UI flow itself was unreliable in this
  sandbox for unrelated reasons, a Chromium chunk-loading flakiness
  confirmed unrelated to this phase's code by checking the same signup
  succeeded instantly via a raw `curl` POST) drove the real
  `/admin/categories`, `/admin/media`, `/admin/redirects`, and article
  editor UIs via injected session cookies. Every mutation (category nav
  fields, a real redirect, article tags/scheduling) was verified against
  the live DB and, where relevant, the live public site's actual
  rendered output — then fully reverted: the test redirect deleted, the
  test admin and its cascade-deleted sessions removed, its activity-log
  entries cleared, and the one real article touched during testing
  (`veteran-owned-roofing-company-georgia-tom-and-jerrys`) restored to
  its exact original `publishedAt`/`tags`.

## Phase 38 — done: capped main nav + "More" dropdown

Phase 37 made the nav admin-controlled but still rendered every
`showInNav` category as one flat row — fine at 7 categories, but nothing
stopped it from growing unbounded and crowding the top bar as more
categories get added. This phase caps the primary menu and gives
overflow categories a real home.

- **`Category.showInNav` (boolean) replaced with `navPlacement`**
  (`MAIN` / `MORE` / `HIDDEN` enum) — a category now has three real
  states instead of just in/out. `navOrder` is meaningful within its own
  placement group, not globally.
- **Nav structure is now: Featured, up to 5 MAIN categories, More** —
  "Featured" is a hardcoded first entry linking to `/` (the homepage's
  curated `FeaturedSection`), not a real `Category` row — there's no
  "Featured" content type to file articles under, so inventing a fake
  category for it would have been wrong. `getMainNavCategories()`/
  `getMoreNavCategories()` (`lib/categories.ts`) are the two queries the
  nav reads; `getFooterNavCategories()` (MAIN + MORE, excluding HIDDEN)
  backs `SiteFooter`'s Sections list, since the footer is a full sitemap
  and isn't space-constrained the way the top bar is.
- **Live categories re-placed to match this task's exact requested
  order**: MAIN = Political News, Crime & Investigation, Veterans, World
  News, Opinion & Analysis (in that order); MORE = Podcasts, Social
  Issues. Applied via `scripts/seed-categories.mjs` (updated to write
  `nav_placement`/`nav_order` instead of the now-removed `show_in_nav`)
  and verified live.
- **New "More" dropdown** (`SiteHeaderClient.tsx`'s `MoreNavDropdown`) —
  a small hand-rolled dropdown (click-to-open, click-outside-to-close,
  Escape-to-close), not a new dependency, styled to match the navy nav
  bar exactly (same hover/active-link language as the rest of the bar,
  same `overlayPop` entrance keyframe the search overlay already uses).
  Highlights active (red) when the current page is any MORE category, so
  a visitor on `/category/podcasts` sees "More" lit up the same way a
  MAIN item would.
- **Mobile drawer mirrors the exact same hierarchy**: Featured, the MAIN
  categories, then a quiet uppercase "More" label, then the MORE
  categories — no dropdown needed on mobile (vertical space isn't the
  constraint there), just the same order or place as desktop.
- **`SiteHeader.tsx` now fetches both groups** and passes them to
  `SiteHeaderClient`/`MobileMenu` as two props (`mainCategories`/
  `moreCategories`) instead of one flat list — every existing
  `<SiteHeader />` call site across the site still needed zero changes,
  same server-wrapper pattern Phase 37 established.
- **Admin UX for staying under the cap**: `CategoryDialog.tsx`'s old
  "Show in main nav" toggle became a real "Nav placement" select (Main
  menu / More dropdown / Hidden from nav). When Main menu is selected
  and 5 categories are already there, a soft advisory notice suggests
  "More dropdown" instead — not a hard block (an admin can still
  deliberately go to 6+ if they choose), just a nudge against the top
  bar silently getting crowded as categories are added. The categories
  list's Nav column now shows `Main #N` / `More #N` / `Hidden` instead of
  a single order number.
- **Verified end-to-end** against the live Neon DB and a real production
  build: confirmed the desktop nav renders exactly the requested 7 items
  in the requested order (Featured highlighted active on `/`), the More
  dropdown opens showing Podcasts/Social Issues, the mobile drawer shows
  the identical hierarchy, and the admin "New category" dialog's
  main-menu-cap warning appears correctly once 5 MAIN categories already
  exist. A throwaway admin account used for the admin-UI checks was
  removed afterward.

## Phase 39 — done: new default share image

`public/og-default.png` (the sitewide fallback `og:image` — homepage,
category pages without their own share image, articles without a set OG
image, and Contact) replaced with a new branded 1200×630 card (torn
American flag background, "Stucci Media / Independent Media That
Matters"), supplied directly by Rocci and cropped from a 1280×720 source
via `sharp` (`cover` fit, top/bottom trimmed slightly — the wordmark and
tagline both stay fully visible at the new crop). No code changes needed
— every page that references `/og-default.png` already pulls from this
one file, so the swap took effect everywhere at once.

- **Real root cause found for a live bug report**: Rocci reported
  Facebook's link preview for the homepage showing a generic gray box
  and the title "Home" instead of the real branded card. The homepage's
  actual `openGraph`/`twitter` metadata (`app/layout.tsx`) was already
  correct — verified directly, title/description/image all set
  properly, and `og-default.png` was already a real branded image before
  this phase, not a placeholder. The mismatch was diagnosed as Facebook's
  own link-preview cache: Facebook scrapes a URL once and holds onto
  that result indefinitely regardless of later code/content changes,
  so a stale scrape (e.g. from before proper metadata existed) keeps
  showing until someone forces a re-scrape. Fix given to Rocci: Facebook
  Sharing Debugger (developers.facebook.com/tools/debug/) → paste the
  URL → "Scrape Again" — not a code fix, since there was nothing wrong
  in the code to fix.

## Phase 40 — done: first live banners — Stucci Apparel cross-promotion

The Banner Management system (Phase 36) had no real banners in it yet.
Added the first two, promoting stucciapparel.com from both the homepage
and article ("blog") slots, using two product graphics supplied directly.

- **Source images were square (1024×1024) product shots**, but the
  homepage banner slot renders at a wide 3:1/4:1 ratio
  (`BannerSlot`/`BannerCard`) — a plain `object-cover` crop of a square
  image into that ratio would have cut off most of the shirt graphic.
  Composited instead (`sharp`, one-time, not a build step): a blurred,
  darkened, full-bleed copy of the same photo as the background, with
  the uncropped square product shot centered on top — a standard
  "letterboxed poster" technique, so the whole design stays visible with
  no jarring flat-color bars on the sides. Output at 1600×400 (`public/
  banners/`).
- **Stored as static files in `public/banners/`, not Vercel Blob** — the
  Banner model's `imageUrl` is just a string, and these are fixed
  campaign assets checked into the repo (same pattern as
  `public/og-default.png`), not admin-uploaded-and-editable images; no
  `BLOB_READ_WRITE_TOKEN` round-trip needed for something this static.
- **`scripts/add-apparel-banners.mjs`** (new, follows the project's
  established one-off-data-script convention) inserts/upserts 4 rows —
  each of the two images gets its own row per placement (`HOMEPAGE` and
  `ARTICLE`), `isActive: true`, `destinationUrl:
  https://stucciapparel.com`, `sortOrder` 0/1 within each placement so
  "Fell Hard, Got Up Harder" shows first. Upserts by the
  (`image_url`, `placement`) pair — not `image_url` alone — so the same
  image can have independent rows across placements instead of being
  limited to just one. All 4 rows are fully manageable from
  `/admin/banners` like any admin-created banner (edit, deactivate,
  delete, re-order, move to a different placement) — nothing about them
  is special-cased outside this one seed script.
- **Verified in a real production build** (`next build && next start`)
  via Playwright at desktop (1440px/1000px) and mobile (390px): confirmed
  both banners render stacked in the correct order on both the homepage
  and a live article page, each with the "Advertisement" disclosure
  label and the site's standard `rounded-card`/`shadow-card` treatment,
  and confirmed via the rendered HTML that both link to
  `https://stucciapparel.com` with `target="_blank"` and
  `rel="noopener noreferrer sponsored"`.

## Phase 41 — done: Stucci Marketing Group banner

A third cross-promotion banner, for Stucci Marketing Group
(stuccimarketing.com), added the same way as Phase 40's two Stucci
Apparel banners — `scripts/add-marketing-group-banner.mjs` (same
upsert-by-`(image_url, placement)` pattern), `sortOrder: 2` in both the
`HOMEPAGE` and `ARTICLE` placements so it sits after the two Apparel
banners rather than displacing them. Source logo image was already
close to a wide banner shape (1648×624, not square like the Apparel
photos), and its background was already near-black, so the same
blurred-extension-to-1600×400 compositing technique (`sharp`) produced
an almost seamless result — no visible seam between the real logo and
its extended backdrop. Verified in a real production build that all 3
banners now render together on the homepage in the correct order, and
that the new one links to `https://stuccimarketing.com`.

## Phase 42 — done: banner spacing fix + broken-image report investigated

Rocci reported the two Stucci Apparel banners appearing as broken
images on the live site right after Phase 40 merged, plus feedback that
multiple banners in one slot ("stacked") needed real spacing between
them.

- **Broken-image report investigated, no code bug found**: re-verified
  from scratch — `public/banners/*.png` are present on `main`, are
  valid non-corrupt PNGs (checked via `sharp` metadata, not just `file`),
  and their filenames match the `image_url` values in the live `banners`
  table exactly. A local `next build && next start` served all 3 banner
  images with real `200`/`image/png` responses and rendered correctly
  end-to-end. Everything code/data-side is confirmed correct; the most
  likely explanation for what Rocci saw is Vercel's build/deploy for
  that merge not having finished yet (or a CDN cache not having
  propagated) at the moment he checked, immediately after merging — not
  something fixable in this repo. Worth a re-check on his end; if it
  recurs after a deploy has clearly finished, that would point to an
  actual Vercel-side issue instead.
- **Real fix: spacing between multiple banners in one slot** —
  `BannerSlot.tsx`'s gap between stacked banner cards went from `gap-4`
  (16px, reads as one continuous ad block once 2-3 banners are active in
  the same placement) to `gap-10 sm:gap-14` (40px/56px) — enough that
  multiple ads in the homepage or article slot now read as separate
  placements encountered while reading, not a stacked wall. No limit was
  added on how many banners can be active per slot — that's still an
  editorial choice from `/admin/banners`, this only changed the spacing
  between them.
- **Verified in a real production build** via Playwright: confirmed all
  3 currently-active homepage banners render with clear visual
  separation between each, and re-confirmed (via direct `curl` against
  the local production server) that every banner image serves
  correctly, ruling out a code-side cause for the broken-image report.

## Phase 43 — done: image loading/priority audit (quick win from a full-site improvement pass)

A cross-cutting audit (architecture, frontend engineering, accessibility,
UX craft, visual design) requested against the live site turned up one
safe, mechanical, sitewide-reach fix worth shipping immediately rather
than only reporting — the rest of the audit's findings (a contrast issue
on `--color-gray-light`, missing visible breadcrumbs despite Phase 33's
breadcrumb schema, tags funneling into the noindexed `/search` page, a
partially-implemented ARIA menu pattern on the "More" nav dropdown, and
the still-open next/image migration first scoped out in Phase 31) were
left as a prioritized report for Rocci to schedule rather than
implemented unprompted.

- **Every real `<img>` across the site was loading eagerly regardless of
  scroll position** — `loading="lazy"` is opt-in, not a browser default.
  On the homepage alone (`LatestModule` + up to 7 category modules) that
  meant dozens of full-size card images fetched on first paint whether
  or not a visitor ever scrolled to them. Added `loading="lazy"
  decoding="async"` to every non-hero image: `ArticleCard`'s `grid` and
  `list` variants (covers every card sitewide — `TopicRail`,
  `LatestModule`, `OpinionModule`, `PodcastShelf`, `Sidebar`,
  `RelatedArticles` all render through this one primitive),
  `FeaturedSection`'s secondary "Also Making Headlines" rail, and
  `BannerSlot`.
- **The flip side**: the homepage hero's lead image
  (`FeaturedSection`) and the article page's own hero image are each
  their page's actual LCP (Largest Contentful Paint) element — those
  need to load as early and aggressively as possible, the opposite of
  the fix above. Added `fetchPriority="high"` to both (the homepage
  hero's *secondary* rail images stayed on the lazy-load path — only
  the true lead image is LCP-critical).
- **The rest of the audit is a report, not code**: delivered as an
  artifact covering what's already correct (the site clears the "not
  flat" bar most such reviews exist to catch — real depth, a real
  signature moment, a disciplined motion hierarchy from Phases 15/22/25)
  and what's genuinely still open, prioritized, with an explicit note
  that `high-end-visual-design`'s literal directives (OLED-black
  grounds, a different mandated font pair, glass-morphism nested cards)
  were deliberately not applied as a mandate — doing so would discard
  42 phases of intentional navy/red/Oswald/Georgia brand identity work
  in favor of a generic template look, the opposite of what this
  project has spent most of its life building. Its underlying
  principles (real depth, a signature moment, disciplined motion) were
  used as a diagnostic lens instead, and the site already has them.
- **One methodology note worth recording**: `web-design-guidelines`'s
  mandated live fetch of the Vercel web-interface-guidelines source
  succeeded (no network error) but returned that tool's own usage
  description rather than the actual rule list — so this pass could not
  verify against the literal current ruleset, and said so plainly in
  the report rather than silently falling back to a remembered
  checklist.

## Phase 44 — done: `--color-gray-light` contrast fix

The top finding from Phase 43's audit, actioned: `--color-gray-light`
(`#8a94a0` on white) measured roughly 2.6:1 — well under WCAG AA's
4.5:1 floor for normal text. This one token backs every small metadata
label sitewide (article dates, read-time, byline dot separators —
`ArticleCard`, `FeaturedSection`, `TopicRail`, `Sidebar`, the footer),
so it was a real, widely-repeated failure rather than a one-off.

- **Darkened to `#6b7684`** (~4.6:1 on white, passes AA) — a single
  token edit in `globals.css`, same high-leverage pattern Phase 22 used
  for shadows/surfaces. No component code changed.
- **Verified in a real production build** (`next build && next start`)
  — homepage renders correctly with the updated token; the visual shift
  is subtle (a touch darker gray on dates/read-time/byline dividers)
  rather than a palette change, as intended.

## Phase 45 — done: next/image on the two highest-traffic image spots

The second-highest finding from Phase 43's audit, started: every image
sitewide was (and mostly still is) a raw `<img>` — no AVIF/WebP
negotiation, no responsive `srcset`. Rather than a big-bang sitewide
swap, converted the two spots that matter most first — the homepage
hero and every grid-variant story card — and left the rest (list/ranked
`ArticleCard` thumbnails, banners, the article page's own hero) for a
follow-up pass, so this could ship reviewable and low-risk.

- **`next.config.ts` gained `images.remotePatterns`** for
  `*.public.blob.vercel-storage.com` — the wildcard covers Vercel Blob's
  per-project store subdomain without hardcoding this project's specific
  store id.
- **`FeaturedSection`'s lead hero image and `ArticleCard`'s `grid`
  variant** (the two most-viewed image slots on the site — every
  homepage visit, every category rail, `LatestModule`, `TopicRail`,
  `OpinionModule`, `RelatedArticles` all render through the `grid`
  variant) now use `next/image` with `fill` + `sizes`, replacing the
  manual `loading`/`fetchPriority` attributes Phase 43 had hand-added —
  `next/image`'s own `priority`/lazy-by-default behavior supersedes
  those. The image wrapper's `aspect-[2/1] sm:aspect-[16/9]` classes
  moved from the `<img>` itself onto its container `div`, since `fill`
  needs a sized positioned parent rather than sizing the image element
  directly.
- **Real gotcha hit and fixed during verification, not a code bug**: a
  first `next build` appeared to still emit raw, unoptimized `<img
  src="https://...">` tags with no `/_next/image` URL, even after the
  `Image` component edits and a successful rebuild — traced to
  Turbopack's incremental `.next/cache` serving a stale compiled output
  across the rebuild rather than picking up the new source. A full `rm
  -rf .next && npm run build` produced the correct
  `srcSet="/_next/image?url=...&w=...&q=75 ..."` output. Worth
  remembering for any future case where a rebuild's rendered output
  doesn't reflect a source change that's confirmed present in the file
  — check for a stale Turbopack cache before assuming the edit didn't
  take.
- **Verified in a real production build** (`next build && next start`,
  full cache clear): confirmed the homepage's live DB images render
  with real `/_next/image` `srcSet`s across all 8 device-width
  breakpoints, and that the optimizer endpoint itself returns a real
  `200 image/jpeg` when fetched directly against a live Vercel Blob
  source image — not just present in the markup, actually serving.
- **Deliberately left for a follow-up**: `ArticleCard`'s `list`/`ranked`
  thumbnails, `BannerSlot`, and the article page's own hero image are
  still raw `<img>` with Phase 43's manual `loading`/`fetchPriority`
  attributes — real, working, just not yet on `next/image`. Scoped out
  here to keep this change reviewable rather than one large sitewide
  diff.

## Phase 46 — done: next/image everywhere else (follow-up)

Finished what Phase 45 scoped out: every remaining real `<img>` on the
public site now goes through `next/image`. `ArticleCard`'s `ranked`
variant never had an image to begin with, so this covers the two that
did.

- **`ArticleCard`'s `list` variant** (the 88×60px thumbnail used in
  `TopicRail`'s briefs column, `Sidebar`, `RelatedArticles`) — the
  wrapper `div` already had the fixed `w-[88px] h-[60px]` size `fill`
  needs, so this was just adding `relative` to it and `sizes="88px"`.
- **`FeaturedSection`'s secondary "Also Making Headlines" rail** — same
  pattern as Phase 45's `ArticleCard` grid conversion: aspect-ratio
  classes moved from the `<img>` onto its wrapper `div`.
- **`BannerSlot`** — needed an actual new wrapper `div` (the old markup
  put the aspect-ratio classes directly on the `<img>`, with no sized
  parent) since banner images are a mix of local `public/banners/*.png`
  campaign assets and admin-uploaded Vercel Blob URLs; `next/image`
  handles both without extra config — local paths need no
  `remotePatterns` entry, only remote hosts do.
- **The article page's own hero image** — same `fill` + `priority`
  treatment as `FeaturedSection`'s homepage hero, since it's equally
  the article page's LCP element.
- **`app/preview/articles/[id]/page.tsx` was deliberately left alone**
  — it mirrors the article hero's markup but is an admin-only,
  low-traffic preview route, outside what this pass scoped to touch.
- **Verified in a real production build** (`rm -rf .next && npm run
  build && npm run start`, matching Phase 45's lesson about Turbopack's
  incremental cache going stale across a rebuild): confirmed real
  `/_next/image?url=...` URLs render for the homepage's `list`-variant
  briefs (38 instances), the article page's hero and its "Keep Reading"
  related-article images, and both a local-file banner
  (`/banners/stucci-apparel-fell-hard.png`) and a remote Blob banner —
  all resolving through the optimizer, not just present as markup.

## Phase 47 — done: fix admin login redirect loop

Rocci reported that logging in to `/admin` would appear to work and
then immediately bounce back to the login screen, blocking all admin
access. Reproduced locally against the live Neon DB with a real browser
(Playwright + a throwaway admin account) rather than guessed at.

- **Root cause, `AuthForm.tsx`'s post-sign-in redirect**: after a
  successful `authClient.signIn.email()`, the form did `router.push
  (redirectTo); router.refresh()` — a client-side transition. Next.js's
  client router can serve a cached RSC payload for the destination
  route from before the new session cookie existed, so `/admin`'s
  layout re-render doesn't reliably see the just-created session on the
  very next navigation. Fixed by replacing the client-side push/refresh
  with `window.location.href = redirectTo` — a full navigation
  guarantees the next request is a fresh one carrying the new cookie.
  Applied the same fix to `AdminTopbar`'s sign-out (the mirror-image
  case: a stale pre-sign-out payload could just as easily linger).
- **`AuthForm.tsx`'s submit handler had no try/catch** — if the sign-in
  fetch itself threw (network blip, a rejected cross-origin request)
  rather than returning `{ error }`, nothing caught it: no error
  message shown, and the submit button could get stuck on "Signing
  in…" forever. Now wrapped, with a plain "couldn't reach the server"
  message on that path.
- **Hardened `auth.ts` against a domain-mismatch class of bug that
  produces the exact same symptom**: Better Auth rejects any request
  whose `Origin` doesn't match `baseURL` (or an explicit
  `trustedOrigins` entry) with a 403 — which, depending on how the
  origin mismatch happens, can look like nothing happened rather than a
  visible error. The most common real-world way to hit this: a Vercel
  project serving both an apex domain and a `www` subdomain (or a
  stale preview URL left in `BETTER_AUTH_URL` after a domain change),
  so a visitor's actual host doesn't byte-for-byte match the configured
  `baseURL`. Added `trustedOrigins`, derived from `BETTER_AUTH_URL` to
  include both the apex and `www` form of whatever host is configured
  — closes that gap without needing to know which form Vercel's env
  var is actually set to today.
- **Verified against the live Neon DB with a real browser**, not just
  reasoned about: a throwaway admin account, driven through the actual
  `/login` page (submit → land on `/admin` dashboard, confirmed by
  page heading), sign-out (confirmed session cookie actually cleared —
  re-visiting `/admin` correctly bounced to `/login?from=%2Fadmin`
  afterward, not just a UI redirect). Test account, its sessions, and
  its activity-log rows were all removed afterward.
- **Checked the rest of the site for the same client-side-redirect-
  after-mutation pattern** (the "no other little breaks" ask) — the
  only other `router.push`/`router.refresh` call sites are the mobile
  menu and search overlay's search-navigation, which don't depend on
  session state and aren't at risk of this class of bug. No other
  instances found.

## Phase 48 — done: the real root cause — BETTER_AUTH_URL was never set in production

Phase 47's fixes were real bugs worth fixing, but not the actual cause
of Rocci's report — after that shipped, he still couldn't log in on the
live site. Walked him through the Vercel dashboard directly:
`BETTER_AUTH_URL` did not exist as an environment variable at all, in
any environment. This was a Phase 7 setup step the original CLAUDE.md
documented as required ("set... `BETTER_AUTH_URL`... pull them locally
via `vercel env pull`") but that step was apparently never actually
completed against the real Vercel project — every login on the live
site had been silently rejected since Phase 7, and nothing in this
project's extensive verification history ever caught it because every
prior phase's "verified in a real browser" testing ran against a local
dev server hitting the same production database, never against the
actual deployed Vercel URL.

- **He added the variable and redeployed — still broken**, which is
  the interesting part. Reproduced the exact failure mode locally: with
  `BETTER_AUTH_URL` unset and a real browser request carrying
  `Origin: https://stuccimedia.com`, Better Auth's cookie changes
  character entirely — `baseURL` being undefined means Better Auth
  doesn't know the app is served over HTTPS, so it sets a plain
  `better-auth.session_token` cookie without the `Secure` flag or the
  `__Secure-` name prefix, instead of the `__Secure-`-prefixed cookie a
  real HTTPS production site needs. Once `baseURL` is set correctly,
  the cookie is `__Secure-better-auth.session_token` with `Secure` —
  confirmed directly by comparing the two `Set-Cookie` responses side
  by side. So the missing env var was breaking auth two ways, not one:
  the origin check (Phase 47's `trustedOrigins` fix) and the cookie's
  own security attributes (this phase).
- **Stopped depending on the env var being present or typo-free at
  all**: `auth.ts` now hardcodes `PRODUCTION_URL =
  "https://stuccimedia.com"` as a fallback — `baseURL` becomes
  `process.env.BETTER_AUTH_URL || PRODUCTION_URL` (never undefined in
  production regardless of Vercel config), and
  `deriveTrustedOrigins()` always includes the apex+www form of
  `PRODUCTION_URL` in addition to whatever `BETTER_AUTH_URL` resolves
  to. `BETTER_AUTH_URL` still takes priority when set (still needed for
  local dev and Preview deployments, where the real URL isn't the
  production domain), so nothing about non-production environments
  changed — only production stopped being a single missing env var away
  from a silent, sitewide auth outage.
- **Verified the fix directly reproduces and then resolves the exact
  failure**: with `BETTER_AUTH_URL` removed from the environment
  entirely and a curl request carrying `Origin: https://stuccimedia.com`
  (matching what a real browser on the live site sends), sign-up/sign-in
  now succeed with a correctly `Secure`-flagged, `__Secure-`-prefixed
  cookie, and a follow-up request to `/admin` with that cookie returns
  the real Dashboard — against the live production Neon database, not a
  fixture. Test account, its sessions, and its activity-log rows were
  removed afterward.
- **The actual environment variable is still worth having set
  correctly in Vercel** (this phase doesn't make it pointless) — it's
  what lets Better Auth generate correct absolute URLs elsewhere (email
  verification links, OAuth callback URLs if those are ever added), the
  code fallback only covers what login itself needs.

## Phase 49 — done: canonical-domain redirect (the real, actual root cause)

Phase 48 fixed a real bug and Rocci confirmed his logins now succeed —
Neon showed fresh ADMIN-role sessions being created on every attempt —
but `/admin` still bounced him out. Walked him through checking his
browser's address bar before and after logging in: `stuccimedia.com/
login` going in, `www.stuccimedia.com/` coming back out. `www.
stuccimedia.com` and `stuccimedia.com` are both independently live on
Vercel with no redirect tying them together, and a session cookie is
only ever visible to the exact host it was set on — so a login that
happens on the apex domain and somehow lands back on `www` afterward
finds no cookie at all, indistinguishable from never having logged in.
This is the actual root cause the last two phases' real, verified fixes
were downstream of — the app already assumed one canonical domain
(`metadataBase` in `app/layout.tsx`, `PRODUCTION_URL` in
`app/lib/auth.ts`) but nothing enforced it.

- **`proxy.ts` now canonicalizes every request to the apex domain**:
  any request arriving on `www.stuccimedia.com` gets a `308` to the
  same path on `stuccimedia.com`, before anything else runs — including
  `/api/auth/*`, so the sign-in/sign-up endpoints themselves can never
  be reached on the wrong host either. This required broadening
  `proxy.ts`'s matcher from `/admin/:path*` to effectively every route
  (excluding `_next/static`, `_next/image`, `favicon.ico`) — the
  existing admin session-cookie check still only applies when
  `pathname.startsWith("/admin")`, unchanged in behavior, just now
  living alongside the host check in one middleware pass instead of
  being the only thing it does.
- **Also closes a duplicate-content SEO gap**, not just the auth bug —
  before this, both domains served the same live content with no
  canonical relationship between them, contradicting the canonical
  URLs Phase 31 already assumed sitewide.
- **Verified directly**, not just reasoned about: a request with `Host:
  www.stuccimedia.com` to `/login`, `/`, and `/admin` all now come back
  as a real `308` to the exact same path on the apex host; normal apex
  requests (home, a category page, `/admin` signed-out, `robots.txt`,
  `sitemap.xml`) are all unaffected; and a full sign-up → promote →
  sign-in → `/admin` round trip against the live Neon database still
  returns the real Dashboard afterward. Also confirmed the specific
  failure mode directly: a valid session cookie presented with `Host:
  www.stuccimedia.com` now gets redirected to the apex `/admin` (where
  Vercel/the browser would actually have the matching cookie) instead
  of ever rendering a www version that couldn't see it. Test account,
  its sessions, and its activity-log rows were removed afterward.

## Phase 50 — done: hotfix — Phase 49 had the canonical domain backwards

Phase 49 shipped, and within minutes Rocci hit `Safari can't open the
page because too many redirects occurred` on the apex domain — a real
outage, worse than the original bug. Root cause: Vercel's own domain
configuration already redirects the apex domain to `www` at the
platform edge, ahead of `proxy.ts` ever running. Phase 49's redirect
went the opposite direction (www → apex), so the two redirects fought
each other in an infinite loop: Vercel sends apex → www, `proxy.ts`
sends www → apex, forever. This is also the real explanation for the
www landing Phase 49 was built to fix in the first place — www was the
site's actual canonical domain all along, not apex.

- **Removed the in-app host redirect entirely** — `proxy.ts` is back to
  only its original job (the admin session-cookie check), since Vercel
  already handles the apex→www redirect at the platform level and
  doesn't need an in-app duplicate.
- **Fixed the actual direction of the mistake**: every hardcoded
  `https://stuccimedia.com` fallback in the codebase — `PRODUCTION_URL`
  in `app/lib/auth.ts`, and the `siteUrl` fallback in `app/layout.tsx`,
  `app/robots.ts`, `app/sitemap.ts`, the article and category pages'
  JSON-LD URL building, and the admin article editor's preview-link
  builder — now points at `https://www.stuccimedia.com` instead. This
  is the fix that actually resolves the original report: `auth.ts`'s
  trusted-origin fallback now matches the domain sign-in actually
  happens on.
- **Verified fast, under real time pressure, but still against the
  live systems, not just re-reasoned about**: confirmed via `Host:
  www.stuccimedia.com` and plain requests that neither host produces a
  redirect loop or any redirect at all now, then ran the full sign-up →
  promote → sign-in → `/admin` round trip against the live Neon
  database with `Origin: https://www.stuccimedia.com` (the domain this
  phase now treats as canonical) and confirmed it returns the real
  Dashboard. Test account, its sessions, and its activity-log rows were
  removed afterward.
- **Lesson for next time**: verify which domain a Vercel project
  actually treats as canonical (Vercel dashboard → Domains → look for
  which one is marked primary / which one has "Redirect to" pointing at
  the other) before writing any code that assumes a direction — this
  phase inferred it after the fact, from a live outage, instead of
  checking it up front.

## Phase 51 — done: the real, actual, final root cause — login had nowhere admin-specific to send him

After Phase 50 shipped, a direct query against the live database during
Rocci's next attempt settled it for good: two brand-new valid ADMIN
sessions were created within 90 seconds of each other, tied to his real
account — the backend has been working correctly since Phase 48. The
entire remaining mystery was client-side UX, not auth.

`SiteHeaderClient.tsx`'s and `MobileMenu.tsx`'s "Sign In" links are
plain `<Link href="/login">`, with no `?from=` — reasonable, since the
header can't know in advance whether a visitor wants the admin panel or
is just a reader. `login/page.tsx` correctly falls back to `redirectTo
= "/"` when there's no `from` param. So a successful sign-in from the
header correctly, deliberately, by-design lands on the homepage — and
the homepage's `SiteHeaderClient` has never been session-aware (no
`useSession()` call anywhere in it), so it looks identical whether
signed in or not. Every single "it goes back to the homepage/login
screen and does nothing" report across this whole investigation was, in
the end, exactly that: a correct, silent redirect to a page that gives
zero indication anything happened.

- **`AuthForm.tsx`'s success path now checks the signed-in user's
  role**: if `mode === "login"` and `redirectTo` is still the bare
  default (`"/"` — meaning nothing more specific was requested, e.g. a
  bounce from a protected page) and the account that just signed in has
  `role === "ADMIN"`, the destination becomes `/admin` instead. An
  explicit `?from=` target (a reader bounced off a protected action, a
  direct link to `/login?from=/admin`) is left untouched — this only
  changes the ambiguous "just clicked Sign In from the header" case.
  Regular reader sign-ins are completely unaffected, since their role
  is never `ADMIN`.
- **Verified against a real click on the actual header icon**, not just
  reasoned about: Playwright clicked the same `a[href="/login"]` link
  Rocci uses, signed in as a throwaway admin account, and landed
  directly on the real Dashboard (confirmed by page heading) instead of
  the homepage. Test account, its sessions, and its activity-log rows
  removed afterward.
- **What's still honestly a gap, noted rather than silently left**: the
  public site's header still shows zero indication of being signed in
  for a *reader* account (no avatar, no "My Account," nothing) — this
  phase's fix specifically targets the admin case since that's what
  broke, but a logged-in reader clicking "Sign In" again would see the
  same login form with no obvious sign they're already authenticated.
  Worth a follow-up if that becomes a real complaint, not addressed
  here to keep this fix narrowly scoped under time pressure.

## Phase 52 — done: session-aware header (the gap Phase 51 flagged)

The one honest gap Phase 51 left open, closed: the public header never
checked session state at all, for *any* account — signed in or not,
"Sign In" / "Register" looked identical. New `AccountMenu.tsx` fixes
this for the desktop header, and `MobileMenu.tsx` gained the matching
signed-in state for the drawer.

- **`AccountMenu.tsx`**: replaces the desktop header's bare Sign In
  icon + Register link once a session exists (any role, not just
  admin) with a red avatar-initials button. Its dropdown shows the
  signed-in name/email, a "Dashboard" link (only when `role ===
  "ADMIN"`), and "Sign Out" — same click-outside/Escape-close pattern
  the existing `MoreNavDropdown` already established, no new
  dependency. Reserves the same footprint during `useSession()`'s
  `isPending` state so the header doesn't visibly jump once the
  session check resolves.
- **`MobileMenu.tsx`**'s bottom Sign In / Register row now branches the
  same way: signed-in shows the avatar, name, a "Dashboard →" link for
  admins, and a Sign Out button in place of the old two links.
- **Sign-out is a hard navigation** (`window.location.href = "/"`)
  after `authClient.signOut()`, same reasoning as `AdminTopbar`'s
  existing sign-out — guarantees the next request sees the now-cleared
  cookie instead of a cached signed-in payload.
- **Verified against the live Neon database with a real browser**: a
  throwaway reader account showed the avatar + name/email + Sign Out
  with no Dashboard link; promoting that same account to ADMIN and
  re-testing showed the Dashboard link appear, on both the desktop
  dropdown and the mobile drawer. Test account, its sessions, and
  activity-log rows were removed afterward.

## Phase 53 — done: Tier 1 reader-engagement quick wins

A competitive analysis of NYT, Washington Post, Axios, The Athletic, and
Semafor's retention mechanics (delivered as an artifact — see the
"Retention Playbook" report) turned into a build plan. This phase ships
the first, cheapest tier: five features layered on the existing
article/comment/account system, none of them requiring new
infrastructure.

- **"Bottom Line" box**: `Article.bulletPoints` (native `text[]`, same
  pattern as `tags`) — an editor-authored 2–4 bullet "why this matters"
  summary, entered one point per line in a new **Engagement** tab in
  the article editor (alongside the existing Content/SEO tabs — same
  "both tabs stay mounted" pattern Phase 9 established). Renders as a
  red-rule callout at the very top of the reading column, above the
  prose. Empty means no box, not auto-generated from body content.
- **"What They're Not Telling You" box**: four new nullable `Article`
  columns (`comparisonTitle`/`Body`/`SourceLabel`/`SourceUrl`) — an
  optional callout contrasting mainstream coverage against the
  article's own angle, with a link to the coverage being referenced.
  Renders as a solid navy panel directly below the Bottom Line box —
  this is arguably a sharper fit for Stucci than Semafor's original
  "Room for Disagreement" (which argues with itself for even-handedness)
  since it's a direct expression of the site's actual "stories
  mainstream media won't run" premise, not a hedge.
- **Exclusive badge**: `Article.isExclusive` boolean, toggled in the
  Publish sidebar next to the existing Featured switch — distinct from
  `isFeatured` (a homepage-curation choice) since a story can be a
  scoop without currently being featured, or vice versa. Shows as a
  navy "EXCLUSIVE" `Badge` next to the category badge in the article
  hero, and as an absolute-positioned badge over the cover image on
  `ArticleCard`'s `grid` variant.
- **Reading List**: new `SavedArticle` model (`user_id`+`article_id`
  unique constraint, cascades both directions — same shape as `Like`,
  kept as its own model rather than overloading `Like` with a type flag
  since the two mean different things). `lib/saved-articles.ts`
  (`hasUserSaved`/`toggleSaved`) backs a new `SaveButton.tsx` (mirrors
  `LikeButton.tsx`'s optimistic-toggle pattern exactly) next to the
  existing Like button in the article page's "Enjoyed this story?" bar.
  New `/saved` page (session-gated, redirects to `/login?from=/saved`)
  lists saved articles as `ArticleCard` grid tiles with a remove
  button; `getSavedArticlesForUser()` in `lib/articles.ts` reuses the
  existing `mapRow`/category-label-lookup machinery rather than
  duplicating it. Linked from `AccountMenu.tsx`'s dropdown and
  `MobileMenu.tsx`'s signed-in row (both built in Phase 52), for every
  signed-in account, not just admins.
- **Editor's Picks**: `Comment.isPinned` boolean — an admin-only pin,
  independent of `isApproved` (pinning doesn't bypass moderation).
  `getApprovedCommentsForArticle()`'s tree-building now sorts pinned
  top-level comments first via a stable sort (replies stay chronological
  under whichever parent they belong to either way — pinning only
  reorders roots). Scoped down from the original plan's "sort by likes"
  once it turned out comments have no like/upvote mechanism at all yet
  — Editor's Pick ended up closer to NYT's actual model (editor-curated)
  than a vote-sorted one anyway, so this wasn't a compromise. Admin
  `/admin/comments` gained a pin-toggle icon button (same
  optimistic-update + `sonner`-toast pattern as the existing
  approve/hide switch); pinned comments show an "Editor's Pick" badge
  in both the admin table and the public comment thread.
- **Migration applied by hand** (`20260812200000_engagement_quick_wins`,
  via `scripts/apply-prisma-migration.mjs` per the project's standing
  TCP-vs-HTTPS constraint): 6 new `articles` columns, 1 new `comments`
  column, 1 new `saved_articles` table.
- **Verified end-to-end against the live Neon database with a real
  browser**, not just code-reviewed: a throwaway admin account drove
  the actual `/admin/articles/new` editor's new Engagement tab
  (bullet points, comparison box, Exclusive toggle all confirmed
  persisted to the DB with the exact values entered), the published
  article's public page (Bottom Line box, navy comparison callout,
  Exclusive badge in the hero, Save button toggling to "Saved"), the
  `/saved` page (showing the saved article with its Exclusive badge and
  a working remove button), and the full comment-pin round trip
  (posted a real comment, pinned it from `/admin/comments`, confirmed
  the "Editor's Pick" badge appeared on the public article page). Test
  article, test admin account, and all associated comments/saves/
  sessions/activity-log rows were removed afterward — confirmed via a
  direct query that nothing orphaned was left behind.
- **Deliberately left for the next tier**: the report's Tier 2 (daily
  news quiz, personalized homepage rail, reading streaks, browser-TTS
  narration) and Tier 3 (push alerts, live blog format, personalized
  weekly digest) items are unstarted — this phase scoped to exactly the
  five Tier 1 items from the report, nothing more.

## Phase 54 — done: Tier 2 reader-engagement features

The second tier from the Retention Playbook report — four features,
same "build on what already exists, no new infrastructure" discipline
as Phase 53.

- **Reading streaks**: `User.currentStreak`/`lastActiveDate` — updated
  fire-and-forget on every signed-in article view (`lib/streaks.ts`),
  compared by calendar day (UTC), not exact elapsed time: a same-day
  revisit is a no-op, a visit exactly one day after the last one
  extends the streak, any bigger gap resets it to 1 (the visit that
  breaks a streak is day one of a new one, not zero). Shown as a small
  flame + day-count in `AccountMenu`'s dropdown and `MobileMenu`'s
  signed-in row once it reaches 2 days — fetched via a dedicated
  `getMyStreakAction()` server action rather than extending Better
  Auth's session shape, to avoid touching anything auth-related.
- **Personalized "Recommended For You" rail**: new `CategoryInterest`
  model (`userId`+`categorySlug`, incremented fire-and-forget on every
  signed-in article view, same fire-and-forget pattern as the streak
  update) backs `getPersonalizedArticles()` in `lib/articles.ts` —
  most-recent published articles across whichever categories a reader
  has actually read the most. No explicit "pick your topics" onboarding
  step; personalization is inferred purely from real reading history,
  simpler than a preference picker and matches how the report described
  Washington Post's version ("gets smarter about you the more you use
  it"). Renders via new `PersonalizedRail.tsx` (same lead+briefs visual
  language as `TopicRail`) between `LatestModule` and the category-rail
  stack, only for a signed-in reader with at least one category of real
  history — a brand-new reader or signed-out visitor never sees a
  generic module pretending to be personalized. The homepage now checks
  session state (`auth.api.getSession()`), which opts it out of the
  static/ISR path the same way the article page already was in Phase
  12 — an accepted, already-precedented tradeoff, not a new one.
- **"Listen To This Article"**: `ListenButton.tsx` uses the browser's
  native `SpeechSynthesis` API — zero backend, zero cost, gets most of
  the value of NYT/WaPo's studio-narrated audio for none of the
  production cost. Renders `null` on browsers without support instead
  of a broken button. Placed above the "Bottom Line" box at the top of
  every article.
- **The Daily Brief** (`/daily-brief`): a 5-question daily quiz —
  "which of these is a real Stucci Media headline" — where every
  option, correct and decoy alike, is a real headline this site
  actually published. Deliberately not LLM-generated or fabricated:
  inventing fake headlines for a news site's own game was ruled out
  outright, so `lib/daily-quiz.ts` instead uses a small seeded PRNG
  (Lehmer/Park-Miller, hashed from today's UTC date string) to
  deterministically pick 5 "correct" articles and 3 real decoy
  headlines per question from the rest of the catalog — every reader
  gets the identical quiz on a given day, which is what makes a shared
  "I got 4/5 today" score mean anything. Fully client-scored, no DB
  writes — a `DailyBriefQuiz.tsx` client component with a final score
  screen and a "Copy Your Score" share button. Linked from
  `SiteFooter`'s Company column. Shows an honest "not enough stories
  yet" state below a minimum article-count threshold rather than a
  thin/repetitive quiz.
- **Migration applied by hand**
  (`20260812220000_streaks_and_interests`): 2 new `users` columns, 1
  new `category_interests` table.
- **Verified end-to-end against the live Neon database with a real
  browser**: a throwaway reader account read two `opinion-analysis`
  articles, then the homepage showed a real "Recommended For You" rail
  built from that exact history; the streak was verified by directly
  setting `last_active_date` to yesterday, visiting an article today,
  and confirming the dropdown showed "2-day streak"; the Daily Brief
  quiz was played through all 5 questions in a real browser to a final
  score screen. Test account and its sessions/category-interest rows
  were removed afterward — confirmed via a direct query that nothing
  orphaned was left behind.
- **Deliberately left for Tier 3**: push alerts, the live blog format,
  and a personalized weekly digest email are unstarted.

## Phase 55 — done: Tier 3 reader-engagement features

The third and final tier from the Retention Playbook report. Unlike Tier
1/2, two of these three features needed real infrastructure this codebase
didn't have — a browser push subscription system and an email-sending
provider — so scope was confirmed with Rocci first: build push alerts for
real (verified structurally; true end-to-end delivery to a device isn't
testable in this sandbox), build the live blog format in full (no new
infra needed), and build the weekly digest's content/personalization logic
plus an admin preview, but leave actual sending disconnected until an
email provider is chosen.

- **Live blog format**: `Article.isLiveBlog` (toggled in the Publish
  sidebar, next to Featured/Exclusive) plus a new `LiveBlogEntry` model —
  timestamped, editor-authored updates, deliberately its own append-only
  table rather than reusing `Comment` or stuffing entries into `body`.
  `LiveBlogPanel.tsx` is a new tab in the article editor (`ArticleEditor.tsx`,
  only shown once the article has been saved — an entry needs a real
  article id to attach to) for posting/deleting updates, with its own
  optimistic-add/revert-on-fail pattern. The public article page
  (`articles/[slug]/page.tsx`) renders a pulsing "LIVE" badge in the hero
  next to the category badge, plus a new `LiveBlogTimeline.tsx` panel
  (newest update first, navy header, red pulsing dot) above the normal
  prose body — the article's `body` field still renders underneath as
  intro/context, so this is additive, not a replacement content model.
  `ArticleCard`'s `grid` variant also gained a small "LIVE" badge (top-
  right of the image) so a live-blog story stands out in homepage/category
  listings, not just on its own page. Since the article page already opts
  out of the static/ISR path (session-aware, Phase 12), every visit reads
  live-blog entries fresh — no separate real-time/websocket layer needed
  for "live."
- **Push alerts**: new `PushSubscription` model (endpoint/p256dh/auth —
  exactly the Push API's subscription shape, stored verbatim) plus
  `lib/push.ts` (`web-push` package) for sending. `public/sw.js` is a
  minimal service worker whose only job is showing a notification on a
  push event and focusing/opening the article on click — no offline
  caching strategy, since the site doesn't need one. A new header bell
  (`PushOptIn.tsx`, desktop) and drawer row (`PushOptInRow.tsx`, mobile)
  share one state machine (`usePushSubscription.ts`) for subscribe/
  unsubscribe, both rendering nothing at all on unsupported browsers or
  when VAPID isn't configured — no dead UI promising a feature the
  environment can't deliver. Subscribing works signed-out (a browser-level
  opt-in, not an account feature, same as most news sites' push prompts)
  and is tied to the session when one exists. **Trigger**: publishing an
  article (a genuine draft → published transition, not every re-save of
  an already-published article, and never for a still-scheduled article)
  fires a fire-and-forget `sendPushToAllSubscribers()` from
  `admin/articles/actions.ts` — a stale subscription that a push service
  reports as gone (404/410) is deleted so it stops being retried forever.
  Every function in `lib/push.ts` degrades to a safe no-op when
  `VAPID_PRIVATE_KEY`/`NEXT_PUBLIC_VAPID_PUBLIC_KEY`/`VAPID_SUBJECT` aren't
  set, so a missing env var can never break publishing an article — these
  three need to be added to Vercel before push actually delivers in
  production (a keypair was generated for this phase via `web-push`'s
  `generateVAPIDKeys()`; see the deploy notes below).
- **Weekly digest — content and admin preview, sending intentionally not
  wired up**: `lib/digest.ts`'s `getWeeklyDigestForUser()` reuses Phase
  54's `CategoryInterest` data (same "infer from real reading history, no
  onboarding picker" approach the personalized rail already established)
  to pick this week's published articles in a reader's top categories,
  topped up with this week's sitewide top-viewed picks if their own
  categories don't have enough — same never-sparse pattern
  `getRelatedArticles` already uses. New `/admin/digest` (added to the
  admin nav as "Weekly Digest") renders an email-shaped preview
  (`DigestPreview.tsx`) with a picker for "General" vs. any real reader
  who has reading history, and a clearly-labeled amber notice that email
  sending isn't connected yet — no email provider is configured in this
  project. This exists so the digest's actual content/personalization
  logic can be reviewed now, with the send mechanism (Resend, SendGrid, a
  cron trigger) left as a deliberate follow-up decision rather than
  guessed at.
- **Verified end-to-end against the live Neon database with a real
  browser**: a throwaway admin account drove the real `/admin/articles/new`
  editor — toggled Live Blog on, published, posted two timestamped
  updates from the new Live Blog tab — then confirmed the public article
  page rendered the pulsing LIVE badge and both updates newest-first in
  the Live Updates panel. The header's push bell was confirmed visible
  and clickable; full subscribe-to-delivery couldn't be verified in this
  sandbox specifically because headless Chromium refuses the Push API in
  its default (incognito-like) context ("Chrome currently does not
  support the Push API in incognito mode") — a known Chromium limitation,
  not application code, confirmed via the browser's own console error.
  The service worker itself was confirmed reachable (`/sw.js` → real
  `200`). `/admin/digest` was confirmed rendering real personalized
  content for the test reader (who had read the test article) and falling
  back to the general "most-read this week" view. Test article (with its
  2 live blog entries), test admin account, its sessions, and its
  category-interest row were all removed afterward — confirmed via a
  direct query that nothing orphaned was left behind (0 leftover users,
  0 leftover articles, push_subscriptions/live_blog_entries both back to
  their pre-test counts).
- **To actually go live on Vercel**: add `NEXT_PUBLIC_VAPID_PUBLIC_KEY`,
  `VAPID_PRIVATE_KEY`, and `VAPID_SUBJECT` (a `mailto:` address) as
  production env vars — the keypair used for local verification in this
  phase should be rotated for production rather than reused. Push
  delivery to a real device can only be confirmed once deployed; this
  sandbox has no path to a real push endpoint to test against.

## Phase 56 — done: production newsroom CMS (roles, editor, media library, podcast)

The largest single pass since Phase 7. `/admin` went from "a good
single-operator dashboard" to a real multi-author newsroom tool: a proper
editorial pipeline with roles, a TipTap editor with slash commands and
native image handling, a media library with folders and usage tracking, a
podcast manager, and the WordPress-parity extras (trash, duplicate,
revisions, export, command palette, dark mode).

- **Roles are real now** (`app/lib/permissions.ts` is the single source of
  truth): `Role` gained `EDITOR` and `AUTHOR` alongside `ADMIN`/`USER`.
  Admin does everything; Editor writes/publishes anyone's work and
  moderates comments but can't touch settings or users; Author writes and
  edits **only their own** articles and submits them for review rather
  than publishing. `requireStaffSession`/`requirePublisherSession`/
  `requireModeratorSession` join the existing `requireAdminSession` in
  `lib/require-admin.ts`. **Real gap closed while building this**: opening
  `/admin` to non-admins meant every admin-only *page* (categories,
  banners, redirects, subscribers, digest) was suddenly reachable by URL
  for an editor or author — the old `admin/layout.tsx` ADMIN check had
  been doing that gating implicitly. Each of those pages now re-checks for
  itself, matching what Phase 14 already established for server actions.
- **Editorial pipeline**: `ArticleStatus` gained `IN_REVIEW` and
  `ARCHIVED`. `SCHEDULED` is deliberately still *derived* (PUBLISHED with
  a future `publishedAt`) rather than stored — nothing runs on a timer, so
  a story going live can't fail. `updateArticle`'s date handling was fixed
  as part of this: previously any non-published status nulled
  `publishedAt`, so pulling a live story back to review or archiving it
  silently destroyed its original publication date.
- **Soft delete everywhere**: `Article.deletedAt` plus a `/admin/trash`
  screen with restore and a genuinely irreversible purge. Every public and
  admin read filters `deletedAt: null`; only the trash screen sees past it.
  Nothing in the CMS hard-deletes an article on a first click any more.
- **The editor was rebuilt** (`RichTextEditor.tsx` plus
  `articles/editor/`): slash commands (a `@tiptap/suggestion` extension
  bridged to a portalled React menu), a bubble menu over selections,
  tables, code blocks, four callout tones, and embeds for YouTube/X/Vimeo/
  Spotify/SoundCloud/Rumble. Images now upload natively — drag-drop onto
  the canvas, paste from the clipboard, or pick from the media library —
  with drag-to-resize, alignment, and captions via a custom `figureImage`
  node.
  - **The caption is a node *attribute*, not ProseMirror content.** As
    editable content the node's schema competes with the `<img>` child
    during HTML parsing, which breaks round-tripping the plain `<img>`
    tags already sitting in the imported WordPress articles. As an
    attribute, a bare `<img>` and a full `<figure>` both parse cleanly.
  - **Image width is stored as a percentage, not pixels** — a pixel width
    authored on a wide desktop would overflow on a phone.
  - **`lib/sanitize.ts` and the toolbar are two halves of one contract.**
    The allowlist was extended in the same change (tables, `figure`/
    `figcaption`, `pre`/`code`, callout divs, `u`/`s`, iframes restricted
    to an explicit host allowlist, and a bounded style allowlist for
    `text-align`/`width`). Anything the editor can emit that isn't listed
    there works in the editor and silently vanishes on save — verified
    both directions with a real round-trip test, including that scripts,
    `javascript:` hrefs, event handlers, off-allowlist iframe hosts, and
    arbitrary classes/styles are still stripped.
- **Autosave writes revision checkpoints only — never the article row.**
  `ArticleRevision` snapshots headline/dek/body on every save and on a
  debounced autosave; the History tab diffs any revision against the
  current article (an exact LCS line diff computed server-side, ~50 lines,
  no dependency) and can restore one — snapshotting the current state
  first, so restore is itself undoable. A background write that could
  publish half a sentence would be indefensible in a newsroom, hence the
  split.
- **Media library** gained folders, tags, alt text, dimensions/size,
  bulk move and delete, multi-file drag-drop onto the page, and **real
  usage counts** — which articles use each image, computed by scanning
  cover images, OG images, inline `<img>` tags in bodies, category share
  images, and banners. Deleting media is ADMIN-only and permanent (it
  removes the Blob object, not just the index row); deleting a *folder*
  never deletes its images, they become unfiled.
- **One upload path for everything** (`articles/upload-image.ts`):
  validate → compress → client-upload straight to Blob → index in the
  library. `ImageField`, the editor's inline insert, and the media page
  all go through it, so none of them can drift on validation or
  compression. `api/admin/upload` now also accepts audio under a separate
  300MB ceiling (images stay at 10MB), selected via `clientPayload` and
  still validated server-side against the matching allowlist.
- **Podcast manager**: `PodcastEpisode` with audio upload (duration
  auto-detected in the browser before upload), show notes through the same
  rich editor, transcript, guest details, and episode/season numbers.
  Reuses `article_status` rather than inventing a near-identical enum.
- **Users & invites**: `/admin/users` with role changes, suspend/reinstate,
  and an invite flow. An invite is a pre-authorized role keyed by email —
  it does **not** create the account; the invitee registers through the
  normal public flow and the role is applied afterwards, so Better Auth
  stays the only thing that ever hashes a password (same reasoning as
  Phase 7's `admin:promote`). No email is sent (no mail provider is
  connected) — the admin gets a link to pass along, and the UI says so
  plainly rather than implying an email went out. Two guards prevent
  lockout: an admin can't change their own role, and the last admin can't
  be demoted or suspended.
- **Settings** became real: a flat `SiteSetting` key/value table (adding a
  setting needs no migration, and an unwritten key falls back to its
  code-defined default, so an empty table is a valid working state)
  backing SEO defaults, social accounts, newsletter placeholders, and five
  feature flags that actually gate their features — the breaking bar,
  comments, likes, push opt-in, and the Daily Brief all check them.
- **`Article.isBreaking`** now drives `BreakingBar`, which previously just
  showed the four most recent stories. When nothing is marked breaking it
  falls back to the latest — and relabels itself "Latest", so the bar
  never claims "Breaking" about something no editor flagged.
- **Dashboard rebuilt**: pipeline stats, a 30-day publishing chart
  (Recharts), a month-grid content calendar showing scheduled stories,
  top-performing articles, pending approvals, and quick actions.
  **"Views this week" is deliberately null, rendered as "All time"** —
  `viewCount` is a lifetime counter with no daily time series behind it,
  so a weekly figure would be fabricated. The chart shows publishing
  volume, which the data genuinely knows.
- **Command palette (`cmdk`)** on ⌘K with live server-side article search
  (scoped to what the caller may actually open, so an author can't
  enumerate the newsroom's drafts), plus `N` for a new article. **Dark
  mode** for the admin only, via `next-themes`.
  - **Real bug caught here**: the dark tokens were first scoped to
    `.dark .admin-root`, which would have left every Radix portal — each
    dialog, dropdown, popover, select, sheet, and the toaster, all
    rendered at `document.body` — on the light palette in dark mode. The
    tokens moved to a bare `.dark`. The public site can't be affected
    because `ThemeProvider` is mounted only by `AdminShell`; the one
    remaining path (a client-side nav out of the admin keeping the same
    document) is closed by making the two "Back to site" links plain
    `<a>` full navigations.
- **WordPress-parity extras**: duplicate as draft (which deliberately
  drops view counts, featured/breaking flags, the publish date, and the
  canonical URL — inheriting a canonical would tell Google the copy *is*
  the original), Markdown and standalone-HTML export, and the existing
  audit log now covering every new mutation.
- **Migration `20260815000000_newsroom_cms`** applied by hand per the
  project's standing TCP-vs-HTTPS constraint. Note the runner splits SQL
  on `;`, so `DO $$ … $$` guard blocks get torn in half — constraints are
  declared inline instead. Verified the file splits into 28 well-formed
  statements with no dollar-quoting.
- **`scripts/seed-newsroom.mjs`** (`npm run db:seed-newsroom`) seeds
  sample articles across every pipeline state including a genuinely
  scheduled one, two podcast episodes, and media folders. Every slug is
  prefixed `sample-` so it's trivial to find and remove.
- **README rewritten** from the untouched `create-next-app` boilerplate
  into a real setup guide: env vars, migration order, first-admin
  bootstrap, the role table, Blob setup, and AI assist configuration.
- **Verification, and its honest limits**: this session had **no
  `.env.local` and no database access**, unlike every prior phase. So:
  TypeScript and the production compile pass clean, the migration's
  statement splitting was verified mechanically, and the pure logic was
  covered by real round-trip tests (39 assertions: the sanitizer contract
  in both directions, embed URL normalization, the revision diff, duration
  parse/format, and Markdown/HTML export). **What was NOT done — and was
  done in every prior phase — is a browser click-through against the live
  Neon database.** The migration has not been applied anywhere, and no
  admin screen in this phase has been loaded in a real browser. That pass
  is still owed before this is trusted in production.

## Note on phase numbering

Several changes merged between Phase 56 and Phase 57 were never written up
here: the site-audit fixes and migrations-on-deploy (#66), podcast RSS
import (#67), submissions plus a working contact form (#68), retiring the
hand-entry episode manager (#69), and the `authors`, `search_index` and
`article_views` migrations. The code is on `main` and the migrations are
applied; only the write-ups are missing. The numbering below continues from
56 rather than trying to reconstruct them after the fact.

## Phase 57 — done: "The Illusion of Freedom" feature + two fixes it surfaced

A commissioned long-form feature, plus two real bugs the work exposed.

- **The article** (`illusion-of-freedom-cancel-culture-economic-dependence`,
  2,414 words, Featured + Exclusive, Opinion & Analysis) argues that
  American freedom is better measured by the cost of using a right than by
  the existence of the right, built entirely from primary sources across
  both the speech side (Freedom House, the Cato/Fraser Human Freedom Index,
  Cato/YouGov self-censorship polling, FIRE's Scholars Under Fire database,
  Pew) and the economic side (NY Fed household debt, Bankrate emergency
  savings, KFF employer premiums, EPI's productivity-pay gap, Harvard JCHS
  renter cost burden, the FTC's abandoned noncompete rule). Two editorial
  choices worth keeping: it leans on FIRE's own left/right split of
  targeting incidents (632 vs 573) so it can't be read as one-party
  grievance, and it argues explicitly that "dependence" and not "slavery"
  is the accurate word, on the grounds that the looser term hands critics
  an easy exit.
- **Shipped as a script, not a DB row**: that session had no
  `DATABASE_URL`, so the article ships as
  `scripts/data/illusion-of-freedom-{article.json,body.html}` plus
  `scripts/publish-illusion-of-freedom.mjs` and a `workflow_dispatch`
  action, the same delivery pattern as Phase 11's image re-host. The script
  re-hosts the three generated images into this app's own Blob store rather
  than hotlinking the generation CDN (Phase 11's lesson, applied up front),
  indexes them in the Media Library, and upserts the article and its
  `article_categories` join row. Run once: 3/3 images, article id 102.
- **`computeSeoScore()` returns 100/100** on the stored values. Verified by
  compiling `app/lib/seo-score.ts` and running it, not by eyeballing the
  rules; the body was also confirmed to round-trip through
  `sanitizeArticleHtml()` with an identical tag sequence and identical
  visible text.
- **Fix: internal links were being `nofollow`ed** (`app/lib/sanitize.ts`).
  `simpleTransform` applied `rel="noopener noreferrer nofollow"` plus
  `target="_blank"` to *every* anchor regardless of destination, so every
  internal link any editor had ever written threw away internal link equity
  and opened in a new tab. The transform now branches on the destination.
  **The first version of that fix preserved any author-set `rel`, which
  silently let 11 outbound citations escape `nofollow` entirely** — caught
  by running the transform over a real article body, not by reading it. The
  outbound guarantee is now unconditional: outbound `rel` is the union of
  the author's tokens and the required ones, so `sponsored` survives without
  lowering the floor.
- **Fix: the publish script's update path never set `published_at`** —
  caught by the Vercel agent review, which posted *after* the PR had been
  merged because it was merged while that check was still in flight. Since
  every public read goes through `publishedWhere()` (which requires
  `published_at <= now`), a re-run would have marked the article PUBLISHED
  and left it invisible. Uses `coalesce(published_at, now())` so a re-run
  can't reset the original publication date either. **The lesson is the
  merge, not the bug: don't merge past an in-flight review.**

## Phase 58 — done: real analytics (`/admin/analytics`)

What existed was a hit counter, not analytics. `Article.viewCount` and the
`article_views` day series answered "how many times was this article
rendered"; nothing tracked the homepage, category pages or `/subscribe`,
nothing measured time on page, unique visitors, referrers, devices or
countries, and the counter incremented on **every render**, so crawlers and
link-preview scrapers were counted as readers. The pre-existing counter is
deliberately kept: it is the only history for anything published before
this, and the Dashboard still reads it.

- **`page_views`** (migration `20260821210000_page_views`, applies
  automatically on deploy via `scripts/migrate-deploy.mjs`): one row per
  view sitewide, with session, visitor, referrer, UTM, device, browser, OS,
  country, and the article when the page has one.
- **Cookieless visitor counting.** `visitor_hash` is
  `SESSION_SECRET + IP + user agent + UTC date`, so somebody is
  identifiable for one day and then not at all. No consent banner, no IP
  stored. The honest cost, printed in the UI rather than hidden: a visitor
  on two days counts on both, so a multi-day "visitors" figure is the sum
  of daily uniques.
- **Two writes per view.** The page records the view on arrival and gets an
  id back, then reports duration and scroll depth by `sendBeacon` when the
  tab is hidden or closed. **Duration counts visible time only**, so a
  backgrounded tab isn't reported as a long read. A reader who closes
  abruptly never reports back, which is why `duration_ms` is nullable and
  every average excludes nulls instead of counting them as a zero-second
  read; the dashboard prints the live coverage percentage next to the
  average.
- **Bots dropped before anything is written**, and the legacy counter now
  applies the same filter, so it stops inflating. Existing lifetime totals
  are left as they are rather than rewritten.
- **The collector is public, so nothing it receives is trusted**: client
  input is range-checked, and device/country/visitor identity are derived
  server-side from headers, never read from the body. A same-origin check
  filters drive-by writes — that is **not** rate limiting and doesn't claim
  to be; real rate limiting needs a shared counter store this project
  doesn't have. `NODE_ENV`/`*.vercel.app` are allowed through so tracking
  doesn't silently do nothing outside production.
- **The dashboard**: live "reading now" (deliberately first — it's what the
  page gets opened for), six metrics with period-over-period deltas,
  traffic over time, sources and referring sites, per-article views with
  average read time and read-through rate, top pages sitewide, category
  performance, and device/browser/OS/country breakdowns. Range lives in the
  URL so a view is shareable and survives a refresh.
- **Charts follow the dataviz guidance**: one shared axis rather than a dual
  axis, colour assigned to the entity rather than to rank, legend always
  present. The two-series palette was run through the palette validator in
  both modes rather than eyeballed (worst adjacent CVD ΔE 19.0 light / 21.4
  dark, both over the 8 floor); the first dark-mode blue failed the
  lightness band and was re-stepped. Ranked breakdowns are deliberately
  HTML rows, not bar charts, so long labels can't collide and every value
  is directly labelled. Chart colours live in `--admin-chart-1/2` — don't
  substitute a hue without re-running the validator.
- **Not verified**: no live database or browser in that session, so the
  collector has never recorded a real view and the dashboard has not been
  seen with real data. The Vercel preview build did succeed, which proves
  the migration applies cleanly against a real database.
- **Open**: `page_views` has no retention policy. It grows one row per view
  forever and will eventually want pruning or rollups.

## Phase 59 — done: sitewide email capture

Articles — the pages readers actually arrive on from search and social —
had **no capture point at all**. The only forms were the homepage strip,
the sidebar and the `/subscribe` page.

- **`SubscribeForm` had hardcoded DOM ids** (`email-input` /
  `email-input-compact`), which Phase 28 had already flagged as a
  duplicate-id hazard. With a modal and an in-article form now on the same
  page as the sidebar form, that became real, so ids come from `useId()`.
- **`NewsletterModal.tsx`**: navy-gradient panel with the site's red radial
  glow, using the existing `overlayPop`/`fadein` keyframes. Deliberately
  the opposite of the usual interstitial — it fires at **45 seconds or 45%
  scrolled**, never on arrival; is suppressed 60 days after a dismissal and
  **permanently after a signup**; and never appears on `/admin`,
  `/preview`, `/subscribe`, `/login`, `/register` or `/saved`. Proper
  dialog behaviour: focus moved in and restored on close, Escape closes,
  body scroll locked. A blocked `localStorage` is treated as suppressed
  rather than risking a modal on every page load with no way to stop it.
  **The signup-suppression case was a real bug caught before shipping**: a
  subscriber never presses dismiss, so without recording the signup the
  modal would have reappeared on their very next page.
- **`ArticleSubscribeCta.tsx`** sits after the like/save bar and before
  "Keep Reading" — the moment the reader has finished and is deciding what
  to do next.
- **`Subscriber.source`** (migration `20260821220000_subscriber_source`)
  records which capture point earned each signup. Nullable, because rows
  that predate the column genuinely have no answer and backfilling a guess
  would be worse than an honest blank. The value is a hidden form field and
  therefore client-controlled, so it is **allowlisted** in
  `subscribe-actions.ts` rather than stored as-is.
- **`/admin/subscribers`** already existed with a working CSV export
  (Phase 3) and was not rebuilt. It gained total / last-7 / last-30 /
  capture-point stat cards, a "where signups came from" breakdown, and a
  Source column; the CSV gained a `source` column.

## Phase 60 — done: night desk theme + high-density homepage

A design-lead brief: outcompete CNN/Fox/NYT homepage density without
becoming a clone of any of them, add a broadcast motion language, and give
the site a night desk. Scoped deliberately to the homepage and the shared
token layer — article, category, subscribe and account templates are
untouched apart from inheriting the tokens.

- **Day/night desk** on `data-desk` on `<html>`, resolved by an inline
  pre-paint script (`app/lib/desk.ts`, mounted in `layout.tsx`). Night runs
  18:00–05:59 Florida time; an explicit toggle beats the clock and is
  remembered in `localStorage`.
  - **Resolved on the client, and that is a correctness requirement, not a
    preference.** The homepage is ISR-cached (`revalidate = 60`) and served
    from Vercel's edge, so HTML rendered at 5:59pm is handed to readers well
    into the evening. Any server-side decision would be cached and wrong.
  - **`data-desk`, never `.dark`.** The admin owns `.dark` via next-themes
    (see the Radix-portal note in `globals.css`). Sharing it would mean a
    reader's night mode repainting the dashboard and an admin's dark mode
    leaking onto the public site. The init script also returns early on
    `/admin` — otherwise a light dashboard would get a night `color-scheme`
    and therefore dark scrollbars and dark native form controls.
  - The Phase 22-era `color-scheme: light only` and the
    `prefers-color-scheme: dark` force-light override are **removed**. That
    override existed to defend against OS dark mode; with both desks now
    defined as real token sets it had nothing left to defend and would only
    have fought the reader's own choice.
  - **Every pair was measured, not eyeballed** — the floor is 4.5:1 for
    text, 3:1 for rules. That is what produced the `--color-red` /
    `--color-red-ink` split documented in the Design system table above,
    and what set the night greys and the gold's night value.
  - **40 hardcoded `bg-white` surfaces across 27 files** moved to
    `--color-surface`, and five components' hardcoded `#B9B9B9` field
    borders moved to `--color-field-border`. **Real bug caught mid-change**:
    the same pass rewrote nine *alpha-modified* whites (`bg-white/5`,
    `bg-white/35` — hover states and the hero's slide pips, all sitting on
    dark grounds) which would have turned invisible on the night desk.
    Reverted; alpha-modified white on a scrim is not a surface.
- **`.shell` container** reads `--container-max`/`--gutter` so the homepage
  can run 1440/14–16px via a `.desk-wide` wrapper while every other page
  keeps 1280/20px. The alternative — editing ten page files — would have
  widened the article reading measure as a side effect.
- **`HeroRotator`**: two to three curated stories, 8s crossfade under a
  lower-third wipe. Every slide is mounted from first paint inside a
  fixed-height frame, so a rotation cannot shift the page; only slide 0 gets
  `priority` (marking all three makes them compete for the same early
  bandwidth). The active slide's headline renders as `<h1>` and the others
  as `<p>`, so the count stays exactly one — Phase 31 verified that
  invariant and it still holds. `prefers-reduced-motion` disables rotation
  entirely, not just the transition: an 8-second content swap is exactly the
  unrequested movement that preference is about.
- **`PosterCard`** (`components/ui/`) is the new density primitive — image
  as the block, copy on it, four sizes sharing one scrim recipe.
  `ArticleCard` is unchanged and still owns the reading pages; the homepage
  is the only surface using posters.
- **`HeadlineMosaic`** (1 lead ≈60% + 2 stacked ≈40%, then a 4-up rail) and
  **`CategoryBand`** (1 lead + 3 compact, with a section label that sticks
  within its own band). Veterans is the one section with its own accent —
  gold, on the band rule and the kicker, nowhere else.
- **Masthead**: a live Florida clock and the desk toggle. The date shown
  there was previously `new Date()` inside a client component — the
  server's day, formatted in the *visitor's* timezone. `LiveClock` owns
  both date and time in the newsroom's zone and renders nothing until it
  has mounted, since a clock is the textbook hydration mismatch.
- **Motion**: `deskCrossfade`, `lowerThirdWipe`, `livePip` and a `.ken-burns`
  hover push (3% over 6s). The existing global `prefers-reduced-motion`
  rule already blankets all of it.
- **Homepage structure** is now hero → mosaic → personalized rail →
  podcasts → category bands → dense wire → promo/banner → subscribe.
  `Sidebar` is gone *from the homepage* (still used by category, article,
  tag and author pages) — the brief's structure is full-width bands, and a
  320px rail fights that.
- **Verification, and its limits.** 200 tests pass (11 new, covering the
  desk rules — including running the real inline script text in a `vm`
  against a fake document, so the script and the module cannot silently
  drift apart). `globals.css` compiles through Tailwind v4 with zero
  warnings, asserted against 14 structural checks. **A real silent failure
  was caught this way**: `text-[clamp(2.5rem,6vw,5.5rem)]` on the hero
  headline generated no CSS at all — Tailwind v4 could not infer the type
  through the commas — so the headline would have fallen back to inherited
  size. Fixed with the explicit `text-[length:...]` hint and re-verified.
  **What was NOT done**: no `next build`, and no browser. This session had
  no database and Prisma's engine download is blocked by the sandbox's
  egress policy, so the client cannot be generated and the app cannot be
  compiled or rendered here. A preview deploy is the first time this
  renders — check the night desk at both hours, the hero rotation, and the
  bands at 390px before merging.
- **Now unreferenced**, left in place rather than deleted so the diff stays
  reviewable: `FeaturedSection`, `TopicRail`, `OpinionModule`. The homepage
  was their only call site. Worth removing in a follow-up once the new
  layout is accepted.
- **Deliberately not done, and why**: article body type stays Georgia serif.
  The brief asked for Archivo at 18–20px, but that reverses a decision this
  file has documented since Phase 5, affects a template outside this pass,
  and deserves a side-by-side at real reading length rather than a silent
  flip.

## Phase 61 — done: homepage density pass, and removing what it superseded

Feedback on Phase 60's homepage was specific: too much white under the
hero, an equal-card row that felt small, and sections not reaching the
1440 grid. Each had one concrete cause rather than a general looseness.

- **Two rows never joined the 1440 grid.** `PodcastModule` still carried
  `mx-auto max-w-[1280px] px-5` and `SubscribeStrip` capped its content at
  `max-w-[1080px]` — both predating the `.shell` container. At 1440 that
  left 64px and 164px of dead space down each side of those rows while
  every band around them ran to the edge. Both are `.shell` now, so the
  only unused side space on any homepage row at ≥1280 is the 16px gutter.
- **The equal-card row was `LatestModule`** — `lg:grid-cols-3` of
  `ArticleCard variant="list"`, an 88×60px thumbnail. Replaced with the
  mosaic already sitting under the hero; `HeadlineMosaic` took a
  `title`/`id` prop so one component serves both slots.
  `PersonalizedRail` moved from `ArticleCard` to `PosterCard` in the same
  pass — it was the last homepage row still rendering white cards.
- **Hero is 70svh mobile / 85vh desktop**, with its caption foot and slide
  pips tightened; every homepage section's vertical rhythm came down
  roughly 30%.
- **Poster frames are 16:9 and 3:2 only.** The lead was `4:5` on mobile
  and `16:10` at `sm`, which put a portrait crop and a third ratio into a
  page that is otherwise entirely widescreen.
- **Four components deleted**, unreferenced once the homepage was rebuilt:
  `FeaturedSection` (Phase 10/15), `TopicRail` (Phase 5/16),
  `OpinionModule` (Phase 18), `LatestModule` (Phase 18). Each was checked
  for real imports first — every remaining mention was a code comment, and
  those eight comments were rewritten to name what actually exists rather
  than left pointing at deleted files. `SectionHeader` (5 users), its
  `compact` prop, and all three `ArticleCard` variants survive on the
  reading pages, so nothing was orphaned by the removal.
- **Verified**: 209 tests pass, no new type errors, the compiled CSS was
  asserted to emit `70svh`/`85vh`/`3:2` and to no longer contain `4:5` or
  `16:10`, and the live production HTML was checked against all twelve
  markers after deploy. Still unresolved: a white band below the hero
  appears in this environment's browser-pane screenshots, but that pane's
  JS console returns nothing and the sandbox is blocked from reaching the
  preview host, so it could not be measured either way. Worth a real
  look — if it is real, suspect the sticky nav's containing block inside
  the `desk-wide` wrapper rather than spacing.

## Phase 62 — done: news-structure card system and article template

Two passes against one brief: adopt a mainstream news site's *structure*
while keeping Stucci's brand entirely. No borrowed colours, logo, fonts or
branding — Oswald, Archivo, crimson and navy are untouched throughout.

**The card system** (`StoryCard`, `LeadPackage`, `SectionLabel`) replaced
the poster system on the homepage and every listing page. One flat stack —
16:9 image, crimson kicker, headline, `Category · timeAgo · readTime` — at
three sizes plus a text-only variant. Deliberately flat where `ArticleCard`
is rounded and elevated: a river wants its photos on a grid, and card chrome
is what stops a page of them reading as one page. `ArticleCard` still owns
the account pages and the admin-adjacent surfaces.

**The article template** dropped its full-bleed hero. The headline now sits
on the page background at full contrast with the photo under the byline,
rather than white-on-photo over a scrim. Order is eyebrow → h1 → dek →
byline → share → image → body, in a 720px column with a 320px rail.

- `app/lib/time-ago.ts` backs every meta row. Relative under a week, a short
  date past it, and the year only when it differs — "14d ago" is worse than
  a date. Timezone-explicit so a story does not appear a day older in
  California.
- **Prev/next and the rail cost no extra queries.** Both derive from the
  published list the article page already fetches for its sidebar. The
  On Air box is a static link for the same reason — a second query on the
  highest-traffic template to fill a box saying "we have a show" is not
  worth it.
- **`ShareRow` reads its URL from the browser**, not from a server-built
  absolute URL: this page is ISR-cached, so a baked-in host would ship in
  the cached HTML and every share would carry whichever host rendered it.
  lucide 1.x has dropped its brand icons, so both social marks are inline
  paths rather than a dependency that no longer ships them.
- **Drop cap is `float` + `::first-letter`, not `initial-letter`**, which
  still has partial support and fails silently. Scoped to the opening body
  half only — the body splits around a mid-article banner and the second
  half must not start with a capital.
- **Real bug caught mid-change**: `CategoryLead` went from lead-plus-three
  to a single card, and the tag and author pages both sliced `(0,4)`/`(4)`
  against it. Left alone, three stories would have silently vanished from
  every tag and author page. Corrected to `(0,1)`/`(1)`.
- **Three fields are type-only**: `kicker`, `imageCaption`, `imageCredit`.
  No columns behind them, so kickers fall back to the category label and the
  caption block does not render. One migration plus three editor inputs
  makes all three real — deliberately a follow-up rather than shipping
  columns nothing can set.
- **Preserved**: slugs, SEO/OG metadata, NewsArticle and BreadcrumbList
  schema, auth, analytics and the bot filter, live blog, Bottom Line,
  the comparison box, tags, like/save, comments, and the mid-article banner
  slot. Exactly one `<h1>` per template still holds.
- **Verified**: 215 tests (6 new for `timeAgo`), no new type errors, CSS
  compiles clean, and the live homepage and category pages were checked
  against their markers after deploy. Two assertion false alarms are worth
  remembering — arbitrary Tailwind classes are escaped in the compiled
  output (`\[minmax\(0\,720px\)_320px\]`), so a naive `includes()` check
  reports a failure that is not there.

## Phase 63 — done: even category grids on the homepage

The homepage category bands ran a lead-plus-three split (58/42, one tall
card beside a short stack). Replaced with an even three-column grid of six.

- **`CategoryGrid` + `CategoryCard`** replace `CategoryBand`. Six cards fill
  two clean rows at three columns where the asymmetric split left a ragged
  bottom edge; with fewer than six the cards keep their column width rather
  than stretching one across the row.
- **Three columns start at 1100px, not Tailwind's 1024 `lg`.** At 1024 a
  third column squeezes each card under ~320px, which is where the
  three-line headline clamp starts wrapping badly. `min-[1100px]:` is an
  arbitrary breakpoint; it was checked in the compiled output, since a
  Tailwind class that fails to generate fails silently.
- **`CategoryCard` carries no kicker and no category chip** — the band
  header already names the section, and repeating it on six cards under
  that header is noise. Meta is read time and comments only.
- **Comment counts are one `groupBy`, not one count per card**
  (`getCommentCountsForArticles`). ~30 cards render on the homepage; the
  per-article `getCommentCount` would have been ~30 round trips to fill a
  meta row. Articles with no approved comments are absent from the map, so
  the row shows read time alone rather than a zero.
  - That query's return type is generated, and this file already cannot
    resolve Prisma types where `prisma generate` has not run, so the rows
    are annotated explicitly. Without that the new code added two
    implicit-any errors on top of the existing baseline; the branch is back
    to exactly the baseline count.
- **No WATCH pill.** There is no video flag on an article, so only LISTEN
  renders, keyed off the podcasts section. A WATCH label would have marked
  stories as video that are not.
- Scoped strictly to the bands: hero, nav, ticker, mosaic, listing pages and
  the article template are untouched.

## Phase 64 — done: the homepage listen desk, rebuilt as a media module

`PodcastModule` was a featured episode, a text-only episode list, and the
whole show catalogue as a cloud of outline pills. Eleven shows carried less
visual weight than one episode, and a paragraph of feed description under
the lead was where most of the empty height came from.

Three blocks now: a featured episode that uses the full row, a grid of show
posters, and an episode grid with the same anatomy as the article cards
above it. Scoped to this module — hero, nav, ticker, article cards, category
grids and the article page are untouched.

- **`ShowCard`** — cover art is the card, sized for a horizontal shelf
  (~142/164px) rather than a grid. At four across a 1440 container these
  were ~340px squares, which gave eleven shows more vertical space than the
  entire episode grid below them. Native `snap-x` scroll, no carousel
  library — keyboard, trackpad and touch behaviour come free, and the
  negative gutter margin lets the row bleed to the container edge while
  still scrolling past it.
- **`EpisodeCard`** — the audio twin of `CategoryCard`: 16:9, crimson show
  kicker, three-line title clamp, clock + duration · date.
- **`getLatestEpisodeDateByShow()`** is one `groupBy`, not a query per show.
  Deliberately **not** `Podcast.lastFetchedAt`, which records when the feed
  was last polled — a dormant show still gets refreshed hourly, so that
  field would label it new. A show with no episodes is absent from the map
  and its card falls back to the episode count.
- **WATCH vs LISTEN comes from the enclosure MIME type** (`audioType`
  starting `video/`), the only honest video signal in feed data.
- **No LIVE pill.** Nothing in the podcast data says a show is live. NEW is
  derived from a real publish date; LIVE would have been decoration that is
  always wrong.
- **Episode art falls back to show art**, never an empty dark box — feeds
  omit per-episode images far more often than show covers.
- Artwork still goes through `FeedImage` (the optimizer bypass for arbitrary
  publisher hosts — see its own note). The 8px artwork radius is the one
  place this module departs from the site's square-corner card language,
  because podcast cover art is authored as a rounded tile everywhere else a
  listener sees it.

## Phase 65 — done: one grid rule for every homepage article block

The homepage had drifted into three different column counts under the hero:
the mosaic ran a 60/40 medium lead plus a four-up rail, the personalized
rail ran 58/42, and only the category bands were three across. Nothing lined
up down the page.

- **`app/lib/article-grid.ts` exports one `ARTICLE_GRID` string** and every
  article block on the homepage uses it: `HeadlineMosaic` (both instances),
  `PersonalizedRail`, `CategoryGrid`. Retyping the classes per module is
  exactly how the drift happened; a shared constant means a new module
  cannot quietly invent a fourth arrangement.
- **Breakpoints are explicit pixels, not `sm`/`lg`.** `sm` is 640, which put
  a second column on a large phone; `lg` is 1024, which squeezes a third
  column under ~320px, right where the three-line headline clamp wraps
  badly. `min-[700px]` and `min-[1100px]` instead.
- **`HeadlineMosaic` and `PersonalizedRail` now render `CategoryCard`**, so
  every card under the hero is the same object. `LeadPackage` keeps its
  58/42 — it is the hero package, deliberately excluded.
- **Related follow-ups are derived, never invented.** Up to two per card
  from the same section, taken only from stories the page has not already
  placed, and each follow-up is claimed so it cannot appear under two cards.
  A card with no genuine sibling left renders no list at all.
  - Ordering matters here: `overflowItems` must be added to `used` before
    the derivation runs, or a story could appear as both a card and a
    follow-up under a different card.
  - The card is one `<a>`, so the follow-up list sits outside that anchor —
    nested links are invalid HTML and browsers recover from them
    unpredictably.
- Still no WATCH pill on article cards: there is no video flag on an
  article. That is the fourth field now waiting on one migration, alongside
  `kicker`, `imageCaption` and `imageCredit`.

## Phase 66 — done: a motion module

Motion had accumulated in three places: keyframes in `globals.css`, an
inline observer in `Reveal`, and per-component copies of the rotate /
pause-on-hover / reduced-motion logic. `app/components/motion/` is now the
one place it lives.

Exports: `usePrefersReducedMotion`, `useHeroCrossfade`, `CardEnter`, and the
class constants `imageKenBurns`, `livePipPulse`, `stickySectionLabel`,
`heroCrossfadeSlide`.

- **The 800ms ceiling is a test, not a convention** (`tests/motion.test.ts`).
  It parses the compiled stagger delays and the transition duration and
  asserts the last card in a grid still lands inside 800ms. Two documented
  exceptions: the hover-held Ken Burns push, and the looping live pip, which
  is a state indicator rather than a transition.
  - Two stragglers were over the ceiling and were brought down:
    `heroTextReveal` at 0.9s on the subscribe and feature-article pages, and
    the hero's 900ms crossfade.
- **`CardEnter` wraps the grid, not the card.** Per-card animation would
  turn thirty server components into client components to animate an
  opacity, shipping their markup twice; and one observer per grid keeps a
  long page at a handful of observers instead of hundreds. The stagger is
  CSS `nth-child` delays, capped at the 6th child so a long grid does not
  accumulate a visible wait.
- **It fires once.** Scrolling back up does not replay it. Content is
  visible by default and only arms if the observer confirms the grid is
  off-screen at mount, so anything above the fold never enters a hidden
  state — the same rule `Reveal` established, kept deliberately.
- **`usePrefersReducedMotion` subscribes rather than reading once.** The
  preference can change while a page is open; a value captured at mount
  goes stale. It starts `false` so the server and first client paint agree.
- **`HeroRotator` was refactored onto `useHeroCrossfade`**, removing its
  private copy of the same logic. Worth knowing: that component is not on
  the homepage — the Fox-structure pass replaced the rotating hero with the
  static `LeadPackage`. The hook and the component are coherent and ready if
  a rotating hero comes back; nothing forces rotation onto the current hero.
- Wired into `BreakingBar` (pip), `StoryCard` and `CategoryCard` (Ken
  Burns), `CategoryGrid` (sticky label + card entrance).

