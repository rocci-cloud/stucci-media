@AGENTS.md

# Stucci Media

Independent news site for Rocci Stucci (Hammond, WI) — news analysis, world
coverage, social issues, crime investigation, veterans, and The Rocci Stucci
Show podcast. Tagline: "the stories mainstream media won't run."

Deployed on Vercel, connected to GitHub (`main` is the deploy branch).

## Stack

- Next.js 16 (App Router, React 19, TypeScript)
- Tailwind CSS v4 (`@import "tailwindcss"` + `@theme` in `app/globals.css` —
  no `tailwind.config.js`)
- `@fontsource/source-serif-4` for the headline face
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
  category/[slug]/        all 6 category pages from one route
  search/                 client-side filter over the articles array
  about/ contact/ privacy/
  components/             BreakingBar, SiteHeader, Hero, ArticleGrid,
                          SubscribeStrip, SiteFooter
  lib/articles.ts         Article type + article data + lookup helpers
  lib/categories.ts       Category type + the 6 categories + lookup helper
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

Dense mainstream-news-portal look (Fox News / Daily Mail, not a minimal
blog) as of Phase 5: navy/red/white, bold condensed sans headlines, sticky
nav, ticker, sidebar rails. Still no rounded cards/shadows, still no dark
mode (`color-scheme: light only` — there are `!important` overrides in
`globals.css` guarding against browser dark mode).

Colors (CSS vars on `:root`, used as `text-[var(--color-red)]` etc.):

| Token | Value | Use |
|---|---|---|
| `--color-black` | `#0a2a55` | masthead accent, nav bar, sidebar headers — a navy despite the name (kept the original token so existing utility classes didn't need touching) |
| `--color-text` | `#171717` | body text |
| `--color-gray` | `#55606c` | deks, bylines, metadata |
| `--color-gray-light` | `#8a94a0` | footer, timestamps |
| `--color-hairline` | `#e2e5e9` | light rules and borders |
| `--color-hairline-strong` | `#0a2a55` | heavy section rules (navy) |
| `--color-red` | `#d0021b` | breaking bar, kickers, links, Subscribe button |
| `--color-red-dark` | `#a00115` | red hover state |
| `--color-blue` | `#1c5aa6` | secondary accent, used sparingly |
| `--color-bg` | `#ffffff` | page background |
| `--color-bg-off` | `#f3f4f6` | sidebar/module panel background |

Image placeholders are `#E5E4E0` blocks with a hairline border, shown when
an article has no `coverImageUrl`.

Type:
- Headlines: `font-headline` (Oswald, condensed bold sans — weights
  400/500/600/700 loaded in `layout.tsx`; there's no 900 weight available
  from `@fontsource/oswald`, so `font-black` headings fall back to
  browser-synthesized bold, which is fine visually). Most headlines are
  `uppercase`.
- Body: Georgia / Times New Roman serif, set inline on `<body>` in
  `layout.tsx` — kept serif for article body readability even though
  headlines moved to sans, a deliberate Daily-Mail-style contrast.
  Article body is `text-[17px] sm:text-[19px] leading-[1.75]`.
- UI chrome (nav, bylines, metadata, buttons, forms): `font-sans`, small
  sizes, `uppercase tracking-wide font-bold` for kickers and nav.

**Cascade layering gotcha**: the global `a { color: inherit; text-decoration:
none; }` reset in `globals.css` is wrapped in `@layer base`. If it isn't,
it becomes "unlayered" CSS, which beats every Tailwind utility class
(including `text-white`, `text-[var(--color-red)]`, etc.) regardless of
specificity — this silently broke the nav bar and every red "More" link
during the Phase 5 redesign (white/red text rendered as inherited dark
body text) until traced to this. Any future plain CSS rule targeting an
element Tailwind utilities also style needs the same `@layer base` (or
`components`/`utilities`) wrapping.

Layout: `max-w-[1280px]` for dense pages (home, category, article — up
from `1200px`) with a `[1fr_320px]` two-column grid on `lg:` for the
`Sidebar` (Trending Now + Subscribe + podcast promo), `max-w-[720px]` for
search/about/contact/privacy, `px-5` gutters throughout. Mobile-first —
the nav collapses to a ☰ toggle below `sm`, sidebar stacks below main
content below `lg`.

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
- **Admin auth**: single admin, no user table. `ADMIN_USERNAME` +
  `ADMIN_PASSWORD_HASH` (generate with `npm run admin:hash-password --
  "password"`) gate a login form at `/admin/login`. A signed JWT session
  cookie (`app/lib/session.ts`, via `jose`) is checked by `middleware.ts`
  for every `/admin/*` route. Password hashing (`app/lib/password.ts`,
  Node's `scrypt`) is kept out of `session.ts` deliberately — middleware
  runs on the edge runtime and can't use `node:crypto`.
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

Setup for a fresh environment: add the Neon and Vercel Blob integrations
in the Vercel dashboard's Storage tab (this injects `DATABASE_URL` plus
`BLOB_STORE_ID` — Blob auth is OIDC-based on this SDK version, no static
`BLOB_READ_WRITE_TOKEN` needed), set `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`,
and `SESSION_SECRET`, then run `npm run db:migrate` (and optionally `npm run
db:seed` to load the original placeholder articles) with those env vars
pulled locally via `vercel env pull .env.local`.

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
