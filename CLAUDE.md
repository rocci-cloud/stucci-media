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
