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
